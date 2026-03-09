"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isResendingVerification, setIsResendingVerification] = useState(false);
    const [showResendOption, setShowResendOption] = useState(false);

    const handleResendVerification = async () => {
        setIsResendingVerification(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) throw error;

            setError("Verification email sent! Please check your inbox.");
            setTimeout(() => setError(""), 5000);
        } catch (err: any) {
            setError(err.message || "Failed to resend verification email.");
        } finally {
            setIsResendingVerification(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setShowResendOption(false);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Check if email is verified
            if (data.user && !data.user.email_confirmed_at) {
                setShowResendOption(true);
                throw new Error("Please verify your email address before signing in. Check your inbox for the verification link.");
            }

            router.push("/explore");
            router.refresh(); // Ensure context updates
        } catch (err: any) {
            setError(err.message || "Invalid login credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
                <p className="text-sm text-muted-foreground">
                    Sign in to continue your conversations.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p>{error}</p>
                                {showResendOption && (
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="h-auto p-0 text-destructive underline mt-2"
                                        onClick={handleResendVerification}
                                        disabled={isResendingVerification}
                                    >
                                        {isResendingVerification ? "Sending..." : "Resend verification email"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Email
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
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Password
                        </label>
                        <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-secondary/50 border-border focus:bg-background transition-colors"
                    />
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="text-primary hover:underline underline-offset-4">
                    Sign Up
                </Link>
            </div>
        </div>
    );
}
