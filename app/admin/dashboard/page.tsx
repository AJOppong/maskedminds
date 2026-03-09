"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import StatCard from "@/components/admin/StatCard";
import AdminTable from "@/components/admin/AdminTable";
import { Users, MessageSquare, Flag, Activity, Clock, Wifi } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Stats {
    totalUsers: number;
    onlineUsers: number;
    discussionsToday: number;
    totalDiscussions: number;
    pendingReports: number;
    activeUsers: Array<{
        sessionId: string;
        joinedTime: string;
        lastActive: string;
        device: string;
    }>;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch("/api/admin/stats", {
                    headers: { Authorization: `Bearer ${session?.access_token}` },
                });
                if (!res.ok) throw new Error("Failed to load stats");
                const data = await res.json();
                setStats(data);
            } catch (err) {
                setError("Failed to load dashboard data.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000); // regular 30s fallback refresh

        // Realtime Subscription
        const channel = supabase.channel('admin_dashboard_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
                fetchStats();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
                fetchStats();
            })
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, []);

    const activeUserColumns = [
        { key: "sessionId", label: "Session ID" },
        {
            key: "joinedTime",
            label: "Joined",
            render: (row: Stats["activeUsers"][0]) => (
                <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(row.joinedTime), { addSuffix: true })}
                </span>
            ),
        },
        {
            key: "lastActive",
            label: "Last Active",
            render: (row: Stats["activeUsers"][0]) => (
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(row.lastActive), { addSuffix: true })}
                    </span>
                </div>
            ),
        },
        { key: "device", label: "Device" },
    ];

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Platform health overview</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">Live</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    label="Total Registered Users"
                    value={isLoading ? "—" : (stats?.totalUsers ?? 0)}
                    icon={Users}
                    description="All-time signups"
                    gradient="from-primary/20 to-primary/5"
                />
                <StatCard
                    label="Currently Online"
                    value={isLoading ? "—" : (stats?.onlineUsers ?? 0)}
                    icon={Wifi}
                    description="Active in last 30 min"
                    gradient="from-emerald-500/20 to-emerald-500/5"
                />
                <StatCard
                    label="Discussions Today"
                    value={isLoading ? "—" : (stats?.discussionsToday ?? 0)}
                    icon={Activity}
                    description="New chats created today"
                    gradient="from-accent/20 to-accent/5"
                />
                <StatCard
                    label="Total Discussions"
                    value={isLoading ? "—" : (stats?.totalDiscussions ?? 0)}
                    icon={MessageSquare}
                    description="All active threads"
                    gradient="from-blue-500/20 to-blue-500/5"
                />
                <StatCard
                    label="Reports Pending"
                    value={isLoading ? "—" : (stats?.pendingReports ?? 0)}
                    icon={Flag}
                    description="Awaiting review"
                    gradient={stats && stats.pendingReports > 0 ? "from-red-500/20 to-red-500/5" : "from-muted/20 to-muted/5"}
                />
                <StatCard
                    label="Active Topics"
                    value={isLoading ? "—" : (stats?.activeUsers.length ?? 0)}
                    icon={Clock}
                    description="Tracked active sessions"
                    gradient="from-purple-500/20 to-purple-500/5"
                />
            </div>

            {/* Active Users Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Active Users</h2>
                    <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary">
                        {stats?.activeUsers.length ?? 0} sessions
                    </span>
                </div>
                <AdminTable
                    columns={activeUserColumns}
                    data={stats?.activeUsers ?? []}
                    keyField="sessionId"
                    isLoading={isLoading}
                    emptyMessage="No active sessions in the last 30 minutes"
                />
            </div>
        </div>
    );
}
