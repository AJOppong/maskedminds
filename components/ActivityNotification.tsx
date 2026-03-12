"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/auth-context";
import { SECTIONS } from "@/lib/constants";
import { Flame, X, ArrowRight } from "lucide-react";

interface NotificationData {
    id: string;
    chatId: string;
    sectionId: string;
    sectionName: string;
    preview: string;
    count: number; // for batching
    type: "message" | "chat";
}

// Resolve section name from section_id
function getSectionName(sectionId: string): string {
    return SECTIONS.find((s) => s.id === sectionId)?.title ?? "Discussion";
}

export function ActivityNotification() {
    const { user } = useAuth();
    const router = useRouter();
    const [notification, setNotification] = useState<NotificationData | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);

    // Batch queue: stores pending events
    const pendingRef = useRef<{ chatId: string; sectionId: string; preview: string; type: "message" | "chat" }[]>([]);
    const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Chat cache so we can resolve chatId → sectionId for message events
    const chatCacheRef = useRef<Map<string, string>>(new Map());

    const clearDismissTimer = () => {
        if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
            dismissTimerRef.current = null;
        }
    };

    const dismiss = useCallback(() => {
        setIsDismissing(true);
        clearDismissTimer();
        setTimeout(() => {
            setNotification(null);
            setIsVisible(false);
            setIsDismissing(false);
        }, 350);
    }, []);

    const showBatchedNotification = useCallback(() => {
        const pending = pendingRef.current;
        if (pending.length === 0) return;
        pendingRef.current = [];

        // Group by chatId
        const grouped: Record<string, typeof pending[0] & { count: number }> = {};
        for (const item of pending) {
            if (grouped[item.chatId]) {
                grouped[item.chatId].count++;
            } else {
                grouped[item.chatId] = { ...item, count: 1 };
            }
        }

        // Pick the first group (most recent)
        const first = Object.values(grouped)[0];
        const totalCount = Object.values(grouped).reduce((s, g) => s + g.count, 0);

        const preview =
            totalCount > 1
                ? `${totalCount} new messages in ${getSectionName(first.sectionId)}`
                : first.preview.length > 80
                ? first.preview.slice(0, 80) + "…"
                : first.preview;

        // Dismiss old, then show new
        clearDismissTimer();
        setIsDismissing(false);
        setNotification({
            id: `${Date.now()}`,
            chatId: first.chatId,
            sectionId: first.sectionId,
            sectionName: getSectionName(first.sectionId),
            preview,
            count: totalCount,
            type: first.type,
        });
        setIsVisible(true);

        // Auto-dismiss after 6s
        dismissTimerRef.current = setTimeout(dismiss, 6000);
    }, [dismiss]);

    const queueEvent = useCallback(
        (item: { chatId: string; sectionId: string; preview: string; type: "message" | "chat" }) => {
            pendingRef.current.push(item);
            // Debounce: reset 3s timer on each new event
            if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
            batchTimerRef.current = setTimeout(showBatchedNotification, 3000);
        },
        [showBatchedNotification]
    );

    useEffect(() => {
        // Subscribe to new messages globally
        const messageChannel = supabase
            .channel("activity-notification-messages")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                async (payload) => {
                    console.log("[ActivityNotification] Realtime message received:", payload);
                    const msg = payload.new as {
                        id: string;
                        content: string;
                        chat_id: string;
                        sender_id: string;
                        is_system: boolean;
                    };

                    // Skip system messages and own messages
                    if (msg.is_system) {
                        console.log("[ActivityNotification] Ignored: System message");
                        return;
                    }
                    if (user && msg.sender_id === user.id) {
                        console.log("[ActivityNotification] Ignored: Message sent by current user");
                        return;
                    }

                    console.log("[ActivityNotification] Processing message for notification...");

                    // Resolve sectionId from cache or DB
                    let sectionId: string = chatCacheRef.current.get(msg.chat_id) ?? "";

                    if (!sectionId) {
                        const { data } = await supabase
                            .from("chats")
                            .select("section_id")
                            .eq("id", msg.chat_id)
                            .single();
                        sectionId = data?.section_id ?? "unknown";
                        chatCacheRef.current.set(msg.chat_id, sectionId);
                    }

                    queueEvent({
                        chatId: msg.chat_id,
                        sectionId,
                        preview: msg.content,
                        type: "message",
                    });
                }
            )
            .subscribe();

        // Subscribe to new chats globally
        const chatChannel = supabase
            .channel("activity-notification-chats")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "chats" },
                (payload) => {
                    const chat = payload.new as {
                        id: string;
                        title: string;
                        section_id: string;
                        created_by: string;
                    };

                    // Skip own chats
                    if (user && chat.created_by === user.id) return;

                    // Cache
                    chatCacheRef.current.set(chat.id, chat.section_id);

                    queueEvent({
                        chatId: chat.id,
                        sectionId: chat.section_id,
                        preview: `New discussion: "${chat.title}"`,
                        type: "chat",
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messageChannel);
            supabase.removeChannel(chatChannel);
            if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
            clearDismissTimer();
        };
    }, [user, queueEvent]);

    if (!notification) return null;

    return (
        <div
            className={`
                fixed top-5 left-1/2 z-[9999] w-[calc(100vw-2rem)] max-w-sm
                transition-all duration-350 ease-out
                ${isVisible && !isDismissing
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-4 pointer-events-none"
                }
            `}
            style={{ transform: `translateX(-50%) translateY(${isVisible && !isDismissing ? "0" : "-1rem"})` }}
            role="alert"
            aria-live="polite"
        >
            <div className="bg-card border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 overflow-hidden">
                {/* Progress bar */}
                <div className="h-0.5 w-full bg-primary/20">
                    <div
                        className="h-full bg-primary"
                        style={{
                            animation: isVisible && !isDismissing ? "shrink-bar 6s linear forwards" : "none",
                        }}
                    />
                </div>
                <div className="p-4 flex gap-3 items-start">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20">
                        <Flame className="w-4 h-4 text-primary" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-0.5">
                            {notification.type === "chat" ? "New Discussion" : `New in ${notification.sectionName}`}
                        </p>
                        <p className="text-sm text-foreground/90 line-clamp-2 leading-snug">
                            {notification.preview}
                        </p>
                        <button
                            onClick={() => {
                                dismiss();
                                if (notification.type === "chat") {
                                    router.push(`/section/${notification.sectionId}`);
                                } else {
                                    router.push(`/chat/${notification.chatId}`);
                                }
                            }}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                            Join Discussion <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    {/* Close */}
                    <button
                        onClick={dismiss}
                        className="flex-shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        aria-label="Dismiss notification"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
