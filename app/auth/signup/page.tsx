"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // 1. Sign Up with email confirmation enabled
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nickname: nickname // Metadata for triggers or easy access
                    },
                    emailRedirectTo: `${window.location.origin}/auth/login`,
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create Profile (Manually if no trigger)
                // Even if a trigger exists, this doesn't hurt if we use UPSERT or check existence
                // But relying on trigger is better. 
                // For this app, let's do a manual insert for robustness in case user doesn't run the trigger SQL
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        { id: authData.user.id, nickname: nickname }
                    ]);

                if (profileError) {
                    // If trigger already handled it, we might get duplicate error depending on policy
                    // Let's assume user runs SQL. 
                    console.warn("Profile creation warning:", profileError);
                }

                // Show success message with email verification instructions
                alert("Account created! Please check your email to verify your account before signing in. Don't forget to check your spam folder!");
                router.push("/auth/login");
            }
        } catch (err: any) {
            console.error("Signup error:", err);
            if (err.message && (err.message.includes("User already registered") || err.message.includes("already has been registered"))) {
                setError("This email address is already in use. Please sign in instead.");
            } else {
                setError(err.message || "An error occurred during sign up.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
                <p className="text-sm text-muted-foreground">
                    Join the community anonymously.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                        {error}
                    </div>
                )}
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Nickname (Public Identity)
                    </label>
                    <Input
                        placeholder="e.g. ShadowThinker99"
                        required
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="bg-secondary/50 border-border focus:bg-background transition-colors"
                        minLength={3}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Email (Private & Verified)
                    </label>
                    <Input
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-secondary/50 border-border focus:bg-background transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Password
                    </label>
                    <Input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-secondary/50 border-border focus:bg-background transition-colors"
                        minLength={6}
                    />
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline underline-offset-4">
                    Sign In
                </Link>
            </div>
        </div>
    );
}
