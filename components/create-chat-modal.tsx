"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { SECTIONS } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/auth-context";

export function CreateChatModal() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const sectionId = params.id as string;
    const section = SECTIONS.find(s => s.id === sectionId);

    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in to create a chat.");
            return;
        }

        setIsSubmitting(true);
        console.log("Creating chat with:", { title, description, sectionId, userId: user.id });

        try {
            // STEP 0: Check if profile exists
            // This is often the cause of the timeout - missing foreign key relation
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (profileError || !profileData) {
                console.warn("User profile missing. Attempting to auto-create...");
                // Attempt to auto-create profile if missing (failsafe)
                const { error: createProfileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: user.id,
                        nickname: user.nickname || 'Anonymous'
                    }]);

                if (createProfileError) {
                    throw new Error(`Profile missing and auto-creation failed: ${createProfileError.message}`);
                }
                console.log("Profile auto-created successfully.");
            }

            // STEP 1: Create Chat
            // Add timeout to prevent hanging (increased to 20s)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out after 20 seconds. This usually means a database policy is blocking the request.")), 20000)
            );

            console.log("Supabase client initialized.");

            const chatData = {
                title,
                description,
                section_id: sectionId,
                created_by: user.id
            };
            console.log("Attempting to insert chat data:", chatData);

            const insertPromise = supabase
                .from('chats')
                .insert([chatData])
                .select()
                .single();

            console.log("Insert promise created, waiting for response...");
            const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

            console.log("Insert operation completed. Result:", { data, error });

            if (error) {
                console.error("Supabase insert error:", error);
                throw error;
            }

            if (!data) {
                throw new Error("No data returned from insert operation");
            }

            console.log("Chat created successfully:", data);
            setOpen(false);
            setTitle("");
            setDescription("");
            router.refresh(); // Refresh to show new chat in list

            router.push(`/chat/${data.id}`);
        } catch (err: any) {
            console.error("FAILED to create chat. Full error details:", err);

            // Extract meaningful error message
            let errorMessage = err.message || "Unknown error";
            if (err.code) errorMessage += ` (Code: ${err.code})`;
            if (err.details) errorMessage += ` - ${err.details}`;

            console.error("Error structured:", {
                message: errorMessage,
                originalError: err
            });

            alert(`Failed to create chat: ${errorMessage}. Check console for more info.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="rounded-full"
                    onClick={(e) => {
                        if (!user) {
                            e.preventDefault();
                            alert("Please sign in to start a new discussion.");
                            return;
                        }
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" /> Create New Chat
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Start a New Discussion</DialogTitle>
                    <DialogDescription>
                        Create a topic in <span className="text-primary font-medium">{section?.title || 'this section'}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-sm font-medium">
                                Topic Title
                            </label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Anxiety about finals..."
                                className="bg-secondary/50"
                                required
                                maxLength={60}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium">
                                Short Description
                            </label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What do you want to talk about?"
                                className="bg-secondary/50"
                                required
                                maxLength={120}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting || !title.trim()}>
                            {isSubmitting ? "Creating..." : "Create Chat"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
