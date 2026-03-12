"use client";

import { SECTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { DoorOpen, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CreateChatModal } from "@/components/create-chat-modal";
import { TrendingDiscussions } from "@/components/TrendingDiscussions";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Chat {
    id: string;
    title: string;
    description: string;
    section_id: string;
    active_users: number;
    created_at: string;
}

export default function SectionPage() {
    const params = useParams();
    const router = useRouter();
    const sectionId = params.id as string;
    const section = SECTIONS.find((s) => s.id === sectionId) || SECTIONS[0];

    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchChats = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('chats')
                    .select('*')
                    .eq('section_id', sectionId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error("Error fetching chats:", error);
                } else {
                    setChats(data || []);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChats();

        const channel = supabase
            .channel('public:chats')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chats',
                    filter: `section_id=eq.${sectionId}`
                },
                (payload) => {
                    console.log("New chat created!", payload);
                    setChats((prev) => [payload.new as Chat, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sectionId]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/explore">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <DoorOpen className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold flex items-center gap-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Masked Minds
                            </h1>
                            <p className="text-sm font-semibold flex items-center gap-2">
                                {section.title}
                            </p>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                {section.description}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content — two-column on large screens */}
            <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Left / Main column */}
                    <div className="flex-1 min-w-0 space-y-10">
                        {/* Create Section */}
                        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8 border-b border-border/50">
                            <div className={`p-6 rounded-full bg-gradient-to-br ${section.gradient} bg-opacity-10`}>
                                <Users className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold">Start a Conversation</h2>
                            <p className="text-muted-foreground max-w-md">
                                Topics here are anonymous. Start a new chat to discuss anything related to {section.title}.
                            </p>
                            <CreateChatModal />
                        </div>

                        {/* Trending — mobile only (above discussion list) */}
                        <div className="lg:hidden">
                            <TrendingDiscussions className="p-4 rounded-2xl bg-card border border-border" />
                        </div>

                        {/* Active Discussions */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-2 h-8 rounded-full bg-primary/50"></span>
                                Active Discussions
                            </h2>

                            {isLoading ? (
                                <div className="text-center py-10 text-muted-foreground animate-pulse">
                                    Loading discussions...
                                </div>
                            ) : chats.length === 0 ? (
                                <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed border-border">
                                    <p className="text-muted-foreground">No active discussions yet.</p>
                                    <p className="text-sm text-muted-foreground mt-1">Be the first to start one!</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {chats.map((chat) => (
                                        <Link key={chat.id} href={`/chat/${chat.id}`}>
                                            <div className="group h-full p-6 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-all hover:shadow-md hover:border-primary/30 cursor-pointer flex flex-col justify-between">
                                                <div className="space-y-3">
                                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                                                        {chat.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {chat.description}
                                                    </p>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>{new Date(chat.created_at).toLocaleDateString()}</span>
                                                    <Button variant="ghost" size="sm" className="h-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Join Chat &rarr;
                                                    </Button>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right sidebar — desktop only */}
                    <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24">
                        <TrendingDiscussions className="p-4 rounded-2xl bg-card border border-border" />
                    </aside>

                </div>
            </main>
        </div>
    );
}
