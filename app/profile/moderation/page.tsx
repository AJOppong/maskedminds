"use client";

import { Button } from "@/components/ui/button";
import {
    DoorOpen,
    ShieldCheck,
    AlertTriangle,
    Flag,
    CheckCircle2,
    Info,
    History
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const MOCK_FLAGS_RECEIVED = [
    // Empty for now to show "Clear" state, but can be populated
];

const MOCK_REPORTS_MADE = [
    {
        id: "1",
        user: "ToxicPlayer12",
        reason: "Harassment",
        date: "2026-01-20T10:30:00Z",
        status: "Resolved",
        action: "Warning Issued"
    },
    {
        id: "2",
        user: "ScamBot99",
        reason: "Fraud / Scam",
        date: "2026-01-25T14:15:00Z",
        status: "Pending",
        action: "Under Review"
    }
];

export default function ModerationHistoryPage() {
    const { user } = useAuth();

    if (!user) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Normal': return 'text-green-500';
            case 'Warning': return 'text-yellow-500';
            case 'Suspended': return 'text-destructive';
            case 'Banned': return 'text-destructive font-black';
            default: return 'text-muted-foreground';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Normal': return <ShieldCheck className="w-8 h-8 text-green-500" />;
            case 'Warning': return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
            default: return <AlertTriangle className="w-8 h-8 text-destructive" />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border p-4 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <Link href="/profile">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <DoorOpen className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="font-bold text-lg">Moderation History</h1>
            </header>

            <main className="max-w-2xl mx-auto p-6 space-y-10">
                {/* Account Standing */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                        <ShieldCheck className="w-5 h-5" />
                        <h2>Current Standing</h2>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
                        <div className="space-y-1 text-center sm:text-left">
                            <h3 className={cn("text-2xl font-bold", getStatusColor(user.status))}>{user.status}</h3>
                            <p className="text-sm text-muted-foreground">
                                {user.status === 'Normal' && "Your account is in good standing."}
                                {user.status === 'Warning' && "You have active flags. Please follow the community rules."}
                                {user.status === 'Suspended' && "Your account is temporarily restricted."}
                                {user.status === 'Banned' && "Your account is permanently restricted."}
                            </p>
                        </div>
                        <div className={cn("p-4 rounded-full", user.status === 'Normal' ? "bg-green-500/10" : "bg-destructive/10")}>
                            {getStatusIcon(user.status)}
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-primary">{user.active_flags_count}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Flags</div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-destructive">{user.suspension_count}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Suspensions</div>
                    </div>
                </section>

                {/* Flags Information */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold">
                        <Flag className="w-5 h-5 text-destructive" />
                        <h2>Detailed Record</h2>
                    </div>

                    <div className="space-y-3">
                        {user.active_flags_count > 0 ? (
                            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                                <p className="text-sm">You have <span className="font-bold">{user.active_flags_count}</span> active flag{user.active_flags_count !== 1 && 's'}. Flags represent reports from other users that have been validated by our automated system.</p>
                            </div>
                        ) : (
                            <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center space-y-2">
                                <p className="text-sm font-medium">No active flags</p>
                                <p className="text-xs text-muted-foreground">Flags automatically expire after 30 days.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Timeline / Reports History Info */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-400 font-semibold">
                        <History className="w-5 h-5" />
                        <h2>System Logs</h2>
                    </div>
                    <div className="bg-muted/10 border border-border rounded-xl p-6 text-center">
                        <p className="text-sm text-muted-foreground italic">
                            For anonymity reasons, specific flag dates and reporter identities are not disclosed. All moderation actions are calculated automatically based on community feedback.
                        </p>
                    </div>
                </section>

                {/* Help Footnote */}
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Need help understanding these rules? Visit our <Link href="/help" className="text-primary hover:underline font-medium">Safety Center</Link> to learn how flagging and enforcement works.
                    </p>
                </div>
            </main>
        </div>
    );
}
