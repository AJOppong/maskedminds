"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DoorOpen, Send, MoreVertical, Flag, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/auth-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    is_system: boolean;
    profiles?: {
        nickname: string;
    };
}

interface ChatDetails {
    id: string;
    title: string;
    section_id: string;
    created_by: string;
}

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const chatId = params.id as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    // Flagging State
    const [isFlagOpen, setIsFlagOpen] = useState(false);
    const [flagStep, setFlagStep] = useState<'confirm' | 'reason'>('confirm');
    const [selectedUserToFlag, setSelectedUserToFlag] = useState<{ id: string, nickname: string, messageId: string } | null>(null);
    const [flagReason, setFlagReason] = useState("misconduct");
    const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);

    // Fetch Chat Details
    useEffect(() => {
        const fetchChat = async () => {
            const { data } = await supabase
                .from('chats')
                .select('id, title, section_id, created_by')
                .eq('id', chatId)
                .single();
            if (data) setChatDetails(data);
        };
        fetchChat();
    }, [chatId]);

    // Fetch Messages & Subscribe
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    profiles (nickname)
                `)
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            console.log("Fetching messages for chat:", chatId);

            if (error) {
                console.error("Error fetching messages:", error);
            } else if (data) {
                // @ts-ignore : Supabase types for join
                setMessages(data);
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }

        };

        fetchMessages();

        // Realtime Subscription
        const channel = supabase
            .channel(`chat:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`
                },
                async (payload) => {
                    const newMessage = payload.new as Message;

                    // Skip the message if we sent it ourselves (we already have it optimistically)
                    if (user && newMessage.sender_id === user.id) return;

                    // Fetch sender profile for the new message
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('nickname')
                        .eq('id', newMessage.sender_id)
                        .maybeSingle();

                    if (profileError) {
                        console.warn("Profile fetch error in realtime:", profileError);
                    }

                    const messageWithProfile = {
                        ...newMessage,
                        profiles: { nickname: profileData?.nickname || 'Anonymous' }
                    };

                    setMessages((prev) => {
                        // Extra safety check to prevent any accidental duplicates
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        return [...prev, messageWithProfile];
                    });
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            )
            .subscribe((status) => {
                console.log(`Subscription status for chat:${chatId}:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const content = newMessage;
        setNewMessage(""); // Optimistic clear

        // Generate a real UUID client-side for the message so we can deduplicate exactly
        const messageId = crypto.randomUUID();
        
        // Optimistic UI Update
        const tempMessage: Message = {
            id: messageId,
            content,
            sender_id: user.id,
            created_at: new Date().toISOString(),
            is_system: false,
            profiles: {
                nickname: user.nickname || 'You'
            }
        };

        setMessages((prev) => [...prev, tempMessage]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        const { error } = await supabase
            .from('messages')
            .insert([
                {
                    id: messageId,
                    content,
                    chat_id: chatId,
                    sender_id: user.id
                }
            ]);

        if (error) {
            console.error("Error sending message:", error);
            // Remove optimistic message on error and restore input
            setMessages((prev) => prev.filter(msg => msg.id !== messageId));
            setNewMessage(content);
            alert("Failed to send message: " + error.message);
        }
    };

    const handleEndChat = async () => {
        if (!confirm("Are you sure you want to end this chat? This cannot be undone.")) return;

        try {
            const { error } = await supabase
                .from('chats')
                .delete()
                .eq('id', chatId);

            if (error) throw error;

            // Navigate back to section
            if (chatDetails?.section_id) {
                router.push(`/section/${chatDetails.section_id}`);
            } else {
                router.push('/explore');
            }
        } catch (error: any) {
            console.error("Error ending chat:", error);
            alert("Failed to end chat: " + error.message);
        }
    };

    const isCreator = user && chatDetails && user.id === chatDetails.created_by;

    return (
        <div className="h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="flex-none border-b border-border bg-background/80 backdrop-blur-md p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => {
                            if (chatDetails?.section_id) {
                                router.push(`/section/${chatDetails.section_id}`);
                            } else {
                                router.push('/explore');
                            }
                        }}
                    >
                        <DoorOpen className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-sm sm:text-base">{chatDetails?.title || 'Loading...'}</h1>
                        <p className="text-xs text-muted-foreground">Live</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">


                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {isCreator && (
                                <DropdownMenuItem onClick={handleEndChat} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    End Chat
                                </DropdownMenuItem>
                            )}
                            {!isCreator && (
                                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                    Chat Info
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground opacity-50 text-sm py-10">
                        No messages yet. Start the conversation!
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = user ? msg.sender_id === user.id : false;
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col max-w-[85%] sm:max-w-[70%]",
                                msg.is_system ? "mx-auto items-center text-center max-w-full my-6" :
                                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                        >
                            {/* System Message Label */}
                            {msg.is_system && (
                                <div className="bg-muted/50 px-4 py-1 rounded-full text-xs text-muted-foreground mb-1 flex items-center gap-2 border border-border">
                                    <ShieldAlert className="w-3 h-3" />
                                    Moderator Note
                                </div>
                            )}

                            {/* Sender Info (Nickname + Flag) */}
                            {!msg.is_system && (
                                <div className={cn("flex items-center gap-2 ml-1 mb-1", isMe && "flex-row-reverse mr-1 ml-0")}>
                                    <span className="text-xs text-muted-foreground">
                                        {msg.profiles?.nickname || 'Anonymous'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            console.log("Flag clicked for user:", msg.sender_id);
                                            setSelectedUserToFlag({
                                                id: msg.sender_id,
                                                nickname: msg.profiles?.nickname || 'Anonymous',
                                                messageId: msg.id
                                            });
                                            setFlagStep('reason');
                                            setFlagReason('misconduct');
                                            setIsFlagOpen(true);
                                        }}
                                        className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-full transition-all border border-transparent hover:border-destructive/20 group"
                                        title="Report User"
                                    >
                                        <Flag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div
                                className={cn(
                                    "px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm break-words",
                                    msg.is_system
                                        ? "bg-transparent text-muted-foreground text-center italic"
                                        : isMe
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-card border border-border rounded-tl-none"
                                )}
                            >
                                {msg.content}
                            </div>

                            {/* Timestamp */}
                            {!msg.is_system && (
                                <span className="text-[10px] text-muted-foreground opacity-50 mt-1 px-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </main>

            {/* Input Area */}
            <footer className="flex-none p-4 bg-background border-t border-border">
                <form onSubmit={handleSendMessage} className="flex flex-col gap-2 max-w-4xl mx-auto w-full">
                    {user?.status === 'Suspended' ? (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-2xl text-center font-medium animate-in fade-in slide-in-from-bottom-2">
                            You are currently suspended and cannot send messages. Check your <Link href="/profile/moderation" className="underline font-bold">Moderation History</Link> for details.
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 w-full">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={user ? "Type your message..." : "Sign in to chat..."}
                                className="flex-1 rounded-full bg-secondary/50 border-transparent focus:border-primary focus:bg-background transition-all"
                                disabled={!user}
                            />
                            <Button type="submit" size="icon" className="rounded-full shadow-lg hover:scale-105 transition-transform" disabled={!newMessage.trim() || !user}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </form>
            </footer>

            {/* Flag User Dialog */}
            <Dialog open={isFlagOpen} onOpenChange={(open) => {
                console.log("Dialog state changed to:", open);
                setIsFlagOpen(open);
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Report User</DialogTitle>
                        <DialogDescription>
                            {flagStep === 'reason'
                                ? "Please select a reason for flagging this user."
                                : "Review the report details before confirming."}
                        </DialogDescription>
                    </DialogHeader>

                    {flagStep === 'reason' && (
                        <div className="grid gap-4 py-4">
                            <RadioGroup value={flagReason} onValueChange={setFlagReason}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="misconduct" id="misconduct" />
                                    <Label htmlFor="misconduct">Misconduct</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="off-topic" id="off-topic" />
                                    <Label htmlFor="off-topic">Off-topic</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="fraud" id="fraud" />
                                    <Label htmlFor="fraud">Fraud / Scam</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="harassment" id="harassment" />
                                    <Label htmlFor="harassment">Harassment</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="spam" id="spam" />
                                    <Label htmlFor="spam">Spam</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="other" id="other" />
                                    <Label htmlFor="other">Other</Label>
                                </div>
                            </RadioGroup>
                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setIsFlagOpen(false)}>Cancel</Button>
                                <Button onClick={() => setFlagStep('confirm')}>Next</Button>
                            </DialogFooter>
                        </div>
                    )}

                    {flagStep === 'confirm' && (
                        <div className="space-y-4 pt-4">
                            <div className="bg-muted/50 p-4 rounded-xl border border-border space-y-2">
                                <p className="text-sm">Reporting: <span className="font-bold">{selectedUserToFlag?.nickname}</span></p>
                                <p className="text-sm">Reason: <span className="font-bold capitalize">{flagReason}</span></p>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button variant="ghost" onClick={() => setFlagStep('reason')} className="flex-1">Back</Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    disabled={isSubmittingFlag}
                                    onClick={async () => {
                                        if (!selectedUserToFlag || !user) return;
                                        setIsSubmittingFlag(true);
                                        try {
                                            const { error } = await supabase
                                                .from('user_flags')
                                                .insert([{
                                                    reporter_id: user.id,
                                                    target_user_id: selectedUserToFlag.id,
                                                    chat_id: chatId,
                                                    message_id: selectedUserToFlag.messageId,
                                                    reason: flagReason
                                                }]);

                                            if (error) {
                                                if (error.code === '23505') {
                                                    alert("You have already reported this message.");
                                                } else {
                                                    throw error;
                                                }
                                            } else {
                                                alert("User reported. Thank you for making the community safer.");
                                            }
                                        } catch (err) {
                                            console.error("Flagging error:", err);
                                            alert("Failed to submit report. Please try again.");
                                        } finally {
                                            setIsSubmittingFlag(false);
                                            setIsFlagOpen(false);
                                        }
                                    }}
                                >
                                    {isSubmittingFlag ? "Reporting..." : "Confirm Flag"}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
