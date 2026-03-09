"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminTable from "@/components/admin/AdminTable";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Lock, EyeOff } from "lucide-react";

interface Report {
    chatId: string;
    topic: string;
    reportCount: number;
    latestReport: string;
    status: string;
    reason: string;
    [key: string]: unknown;
}

type ToastState = { type: "success" | "error"; message: string } | null;

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<ToastState>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/admin/reports", {
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            const data = await res.json();
            setReports(data.reports ?? []);
        } catch {
            showToast("error", "Failed to load reports");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchReports(); 

        const channel = supabase.channel('admin_reports_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
                fetchReports();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchReports]);

    const doAction = async (chatId: string, action: string) => {
        setActionLoading(`${chatId}-${action}`);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/admin/reports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ chatId, action }),
            });
            const data = await res.json();
            if (data.success) {
                showToast("success", data.message);
                fetchReports();
            } else {
                showToast("error", data.error ?? "Action failed");
            }
        } catch {
            showToast("error", "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    const pendingReports = reports.filter(r => r.status === "pending");
    const resolvedReports = reports.filter(r => r.status !== "pending");

    const columns = [
        {
            key: "chatId",
            label: "Discussion ID",
            render: (row: Report) => (
                <span className="font-mono text-xs text-muted-foreground">{row.chatId.substring(0, 8)}…</span>
            ),
        },
        {
            key: "topic",
            label: "Topic",
            render: (row: Report) => (
                <p className="max-w-xs truncate font-medium">{row.topic}</p>
            ),
        },
        {
            key: "reportCount",
            label: "Reports",
            render: (row: Report) => (
                <span className={`font-bold text-sm ${row.reportCount >= 3 ? "text-red-400" : row.reportCount >= 2 ? "text-amber-400" : "text-foreground"}`}>
                    {row.reportCount}
                </span>
            ),
        },
        {
            key: "reason",
            label: "Reason",
            render: (row: Report) => (
                <span className="text-xs text-muted-foreground truncate max-w-xs block">{row.reason}</span>
            ),
        },
        {
            key: "latestReport",
            label: "Reported",
            render: (row: Report) => (
                <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(row.latestReport), { addSuffix: true })}
                </span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (row: Report) => {
                const styles: Record<string, string> = {
                    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    ignored: "bg-secondary text-muted-foreground border-border",
                };
                return (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${styles[row.status] ?? styles.pending}`}>
                        {row.status}
                    </span>
                );
            },
        },
    ];

    const actions = [
        {
            label: "Remove",
            variant: "danger" as const,
            icon: <Trash2 />,
            disabled: (row: Report) => row.status !== "pending" || actionLoading === `${row.chatId}-remove`,
            onClick: (row: Report) => {
                if (window.confirm(`Remove "${row.topic}"? This will permanently delete the discussion.`)) {
                    doAction(row.chatId, "remove");
                }
            },
        },
        {
            label: "Lock",
            variant: "warning" as const,
            icon: <Lock />,
            disabled: (row: Report) => row.status !== "pending" || actionLoading === `${row.chatId}-lock`,
            onClick: (row: Report) => doAction(row.chatId, "lock"),
        },
        {
            label: "Ignore",
            variant: "default" as const,
            icon: <EyeOff />,
            disabled: (row: Report) => row.status !== "pending" || actionLoading === `${row.chatId}-ignore`,
            onClick: (row: Report) => doAction(row.chatId, "ignore"),
        },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-xl border
                    ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                    {toast.type === "success" ? "✓" : "✗"} {toast.message}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Reports</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {pendingReports.length} pending · {resolvedReports.length} resolved
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {pendingReports.length > 0 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            {pendingReports.length} pending
                        </span>
                    )}
                    <button
                        onClick={fetchReports}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Pending */}
            <div className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Pending Review</h2>
                <AdminTable
                    columns={columns}
                    data={pendingReports}
                    actions={actions}
                    keyField="chatId"
                    isLoading={isLoading}
                    emptyMessage="No pending reports 🎉"
                />
            </div>

            {/* Resolved */}
            {resolvedReports.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-base font-semibold text-muted-foreground">Resolved</h2>
                    <AdminTable
                        columns={columns}
                        data={resolvedReports}
                        keyField="chatId"
                        isLoading={false}
                        emptyMessage="No resolved reports"
                    />
                </div>
            )}
        </div>
    );
}
