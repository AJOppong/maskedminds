"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import BarChart from "@/components/admin/BarChart";
import { SECTIONS } from "@/lib/constants";
import { TrendingUp, Clock, Layers, BarChart2 } from "lucide-react";

interface AnalyticsData {
    dailyActivity: Array<{ date: string; count: number }>;
    weeklyActivity: Array<{ week: string; count: number }>;
    topTopics: Array<{ topic: string; category: string; messages: number }>;
    peakHours: Array<{ hour: number; count: number }>;
    discussionsByCategory: Array<{ category: string; count: number }>;
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch("/api/admin/analytics", {
                    headers: { Authorization: `Bearer ${session?.access_token}` },
                });
                if (res.ok) setData(await res.json());
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const categoryLabel = (id: string) =>
        SECTIONS.find(s => s.id === id)?.title ?? id;

    const formatDay = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    const activityChartData = activeTab === "daily"
        ? (data?.dailyActivity ?? []).slice(-14).map(d => ({ label: formatDay(d.date), value: d.count }))
        : (data?.weeklyActivity ?? []).map(d => ({ label: d.week, value: d.count }));

    const peakChartData = (data?.peakHours ?? []).map(h => ({
        label: h.hour % 6 === 0 ? `${h.hour}:00` : "",
        value: h.count,
    }));

    const maxPeakHour = data?.peakHours.reduce((best, h) => h.count > best.count ? h : best, { hour: 0, count: 0 });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Platform traffic and engagement metrics</p>
            </div>

            {/* Traffic Chart */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <h2 className="text-base font-semibold text-foreground">Platform Traffic</h2>
                    </div>
                    <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
                        <button
                            onClick={() => setActiveTab("daily")}
                            className={`px-3 py-1.5 transition-colors ${activeTab === "daily" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                        >
                            Daily
                        </button>
                        <button
                            onClick={() => setActiveTab("weekly")}
                            className={`px-3 py-1.5 transition-colors border-l border-border ${activeTab === "weekly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                        >
                            Weekly
                        </button>
                    </div>
                </div>
                <BarChart
                    data={activityChartData}
                    height={180}
                    color="var(--primary)"
                />
                <p className="text-xs text-muted-foreground">
                    {activeTab === "daily" ? "Messages per day (last 14 days)" : "Messages per week (last 8 weeks)"}
                </p>
            </div>

            {/* Peak Hours + Category split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Peak Hours */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-accent" />
                        <h2 className="text-base font-semibold text-foreground">Peak Usage Hours</h2>
                    </div>
                    <BarChart
                        data={peakChartData}
                        height={120}
                        color="var(--accent)"
                    />
                    {maxPeakHour && maxPeakHour.count > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Peak activity at <span className="text-accent font-semibold">{maxPeakHour.hour}:00 UTC</span>
                            {" "}({maxPeakHour.count} messages)
                        </p>
                    )}
                </div>

                {/* Discussions by Category */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <h2 className="text-base font-semibold text-foreground">Discussions by Category</h2>
                    </div>
                    <div className="space-y-2">
                        {(data?.discussionsByCategory ?? []).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
                        ) : (
                            (data?.discussionsByCategory ?? []).map(c => {
                                const max = Math.max(...(data?.discussionsByCategory.map(d => d.count) ?? [1]));
                                const pct = (c.count / max) * 100;
                                return (
                                    <div key={c.category} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-foreground/80 truncate max-w-[180px]">{categoryLabel(c.category)}</span>
                                            <span className="text-muted-foreground font-mono">{c.count}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all duration-700"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Most Active Topics */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" />
                    <h2 className="text-base font-semibold text-foreground">Most Active Topics</h2>
                </div>
                {(data?.topTopics ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No activity data available</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="pb-2 text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider">#</th>
                                    <th className="pb-2 text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider">Topic</th>
                                    <th className="pb-2 text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider">Category</th>
                                    <th className="pb-2 text-right text-xs text-muted-foreground font-semibold uppercase tracking-wider">Messages</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.topTopics.map((t, i) => (
                                    <tr key={i} className="border-b border-border last:border-0">
                                        <td className="py-3 text-muted-foreground font-mono text-xs">#{i + 1}</td>
                                        <td className="py-3 font-medium max-w-[200px] truncate">{t.topic}</td>
                                        <td className="py-3 text-xs text-muted-foreground">{categoryLabel(t.category)}</td>
                                        <td className="py-3 text-right font-bold text-primary">{t.messages}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
