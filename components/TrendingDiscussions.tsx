"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { SECTIONS } from "@/lib/constants";
import { Flame, MessageCircle, TrendingUp } from "lucide-react";

interface TrendingChat {
    id: string;
    title: string;
    section_id: string;
    section_name: string;
    message_count: number;
    last_activity_at: string;
    trend_score: number;
}

function getSectionName(sectionId: string): string {
    return SECTIONS.find((s) => s.id === sectionId)?.title ?? "Discussion";
}

/** Compute recency bonus: full bonus if activity within last hour, half if within 3h */
function recencyBonus(lastActivity: string): number {
    const diffMs = Date.now() - new Date(lastActivity).getTime();
    const diffH = diffMs / (1000 * 60 * 60);
    if (diffH <= 1) return 10;
    if (diffH <= 3) return 5;
    return 0;
}

export function TrendingDiscussions({ className }: { className?: string }) {
    const router = useRouter();
    const [trending, setTrending] = useState<TrendingChat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTrending = async () => {
        try {
            // Fetch all chats created in the last 24h (or any active ones),
            // plus a count of messages per chat
            const { data: chats, error } = await supabase
                .from("chats")
                .select("id, title, section_id, created_at")
                .order("created_at", { ascending: false })
                .limit(50);

            if (error || !chats) return;

            // Fetch message counts per chat
            const chatIds = chats.map((c) => c.id);
            if (chatIds.length === 0) {
                setTrending([]);
                setIsLoading(false);
                return;
            }

            // Get latest message timestamps and counts
            const { data: msgStats } = await supabase
                .from("messages")
                .select("chat_id, created_at")
                .in("chat_id", chatIds)
                .eq("is_system", false);

            // Aggregate client-side
            const statsMap: Record<string, { count: number; lastAt: string }> = {};
            for (const msg of msgStats ?? []) {
                if (!statsMap[msg.chat_id]) {
                    statsMap[msg.chat_id] = { count: 0, lastAt: msg.created_at };
                }
                statsMap[msg.chat_id].count++;
                if (msg.created_at > statsMap[msg.chat_id].lastAt) {
                    statsMap[msg.chat_id].lastAt = msg.created_at;
                }
            }

            const scored: TrendingChat[] = chats.map((chat) => {
                const stats = statsMap[chat.id];
                const msgCount = stats?.count ?? 0;
                const lastActivityAt = stats?.lastAt ?? chat.created_at;
                return {
                    id: chat.id,
                    title: chat.title,
                    section_id: chat.section_id,
                    section_name: getSectionName(chat.section_id),
                    message_count: msgCount,
                    last_activity_at: lastActivityAt,
                    trend_score: msgCount * 2 + recencyBonus(lastActivityAt),
                };
            }).filter((chat) => {
                // Feature request: only show chats with active users online.
                // We estimate this by checking if the last activity was within 15 minutes.
                const inactivityMs = Date.now() - new Date(chat.last_activity_at).getTime();
                const inactivityMinutes = inactivityMs / (1000 * 60);
                return inactivityMinutes <= 15;
            });

            // Sort by trend_score desc, take top 5
            scored.sort((a, b) => b.trend_score - a.trend_score);
            setTrending(scored.slice(0, 5).filter((c) => c.trend_score > 0));
        } catch (err) {
            console.error("Error fetching trending:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrending();
        const interval = setInterval(fetchTrending, 90_000); // refresh every 90s
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className={`${className} space-y-3`}>
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Flame className="w-4 h-4 text-primary" />
                    Trending Now
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
                ))}
            </div>
        );
    }

    if (trending.length === 0) {
        return (
            <div className={`${className} space-y-3`}>
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Flame className="w-4 h-4 text-primary" />
                    Trending Now
                </div>
                <p className="text-xs text-muted-foreground py-4 text-center">
                    No trending discussions yet. Start one!
                </p>
            </div>
        );
    }

    return (
        <div className={`${className} space-y-3`}>
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">Trending Now</span>
                </div>
                <TrendingUp className="w-3.5 h-3.5 text-primary/60 ml-auto" />
            </div>

            {/* List */}
            <div className="space-y-2">
                {trending.map((chat, index) => (
                    <button
                        key={chat.id}
                        onClick={() => router.push(`/chat/${chat.id}`)}
                        className="w-full text-left p-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-secondary/30 transition-all group"
                    >
                        <div className="flex items-start gap-2.5">
                            {/* Rank */}
                            <span
                                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5
                                    ${index === 0
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                {index + 1}
                            </span>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                                    {chat.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                    {chat.section_name}
                                </p>
                            </div>
                            {/* Reply count */}
                            <div className="flex-shrink-0 flex items-center gap-1 text-muted-foreground text-[10px] font-medium mt-0.5">
                                <MessageCircle className="w-3 h-3" />
                                <span>{chat.message_count}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
