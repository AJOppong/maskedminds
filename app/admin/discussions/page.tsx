"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminTable from "@/components/admin/AdminTable";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Lock, Flag, Unlock } from "lucide-react";
import { SECTIONS } from "@/lib/constants";

interface Discussion {
    id: string;
    title: string;
    category: string;
    createdAt: string;
    replies: number;
    locked: boolean;
    flagged: boolean;
    flagReason?: string;
    [key: string]: unknown;
}

type ToastState = { type: "success" | "error"; message: string } | null;

export default function AdminDiscussionsPage() {
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<ToastState>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchDiscussions = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/admin/discussions", {
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            const data = await res.json();
            setDiscussions(data.discussions ?? []);
            setTotal(data.total ?? 0);
        } catch {
            showToast("error", "Failed to load discussions");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchDiscussions(); 
        
        // Realtime Subscription
        const channel = supabase.channel('admin_discussions_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
                fetchDiscussions();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchDiscussions]);

    const doAction = async (chatId: string, action: string, extra?: Record<string, string>) => {
        setActionLoading(`${chatId}-${action}`);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/admin/discussions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ chatId, action, ...extra }),
            });
            const data = await res.json();
            if (data.success) {
                showToast("success", data.message);
                fetchDiscussions();
            } else {
                showToast("error", data.error ?? "Action failed");
            }
        } catch {
            showToast("error", "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    const categoryLabel = (id: string) =>
        SECTIONS.find(s => s.id === id)?.title ?? id;

    const columns = [
        {
            key: "title",
            label: "Discussion",
            render: (row: Discussion) => (
                <div className="max-w-xs">
                    <p className="font-medium text-foreground truncate">{row.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {row.locked && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20">Locked</span>
                        )}
                        {row.flagged && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20">Flagged</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "category",
            label: "Category",
            render: (row: Discussion) => (
                <span className="text-xs text-muted-foreground">{categoryLabel(row.category)}</span>
            ),
        },
        {
            key: "createdAt",
            label: "Created",
            render: (row: Discussion) => (
                <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                </span>
            ),
        },
        {
            key: "replies",
            label: "Replies",
            render: (row: Discussion) => (
                <span className="font-mono text-sm">{row.replies}</span>
            ),
        },
    ];

    const actions = [
        {
            label: "Delete",
            variant: "danger" as const,
            icon: <Trash2 />,
            disabled: (row: Discussion) => actionLoading === `${row.id}-delete`,
            onClick: (row: Discussion) => {
                if (window.confirm(`Delete "${row.title}"? This cannot be undone.`)) {
                    doAction(row.id, "delete");
                }
            },
        },
        {
            label: "Lock",
            variant: "warning" as const,
            icon: <Lock />,
            disabled: (row: Discussion) => row.locked || actionLoading === `${row.id}-lock`,
            onClick: (row: Discussion) => doAction(row.id, "lock"),
        },
        {
            label: "Flag",
            variant: "default" as const,
            icon: <Flag />,
            disabled: (row: Discussion) => row.flagged || actionLoading === `${row.id}-flag`,
            onClick: (row: Discussion) => doAction(row.id, "flag"),
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-xl border transition-all
                    ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                    {toast.type === "success" ? "✓" : "✗"} {toast.message}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Discussions</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{total} total threads</p>
                </div>
                <button
                    onClick={fetchDiscussions}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-colors"
                >
                    Refresh
                </button>
            </div>

            <AdminTable
                columns={columns}
                data={discussions}
                actions={actions}
                keyField="id"
                isLoading={isLoading}
                emptyMessage="No discussions found"
            />
        </div>
    );
}
