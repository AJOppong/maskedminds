"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    description?: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    gradient?: string;
}

export default function StatCard({
    label,
    value,
    icon: Icon,
    description,
    trend,
    trendValue,
    gradient = "from-primary/20 to-primary/5",
}: StatCardProps) {
    const trendColor =
        trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-muted-foreground";

    return (
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group">
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                    {trendValue && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full bg-border/50 ${trendColor}`}>
                            {trend === "up" ? "↑" : trend === "down" ? "↓" : ""} {trendValue}
                        </span>
                    )}
                </div>

                <div>
                    <p className="text-3xl font-bold text-foreground tracking-tight">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                    <p className="text-sm font-medium text-foreground/80 mt-1">{label}</p>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
