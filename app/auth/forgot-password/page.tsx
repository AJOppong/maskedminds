"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DoorOpen, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess(false);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to send password reset email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Check Your Email</h1>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
                        Click the link in the email to reset your password.
                    </p>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-sm font-medium">Didn't receive the email?</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Check your spam or junk folder</li>
                        <li>Make sure you entered the correct email address</li>
                        <li>Wait a few minutes for the email to arrive</li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            setSuccess(false);
                            setEmail("");
                        }}
                    >
                        Try Another Email
                    </Button>
                    <Link href="/auth/login" className="w-full">
                        <Button variant="ghost" className="w-full">
                            <DoorOpen className="w-4 h-4 mr-2" />
                            Back to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Forgot Password?</h1>
                <p className="text-sm text-muted-foreground">
                    No worries! Enter your email and we'll send you a reset link.
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
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-secondary/50 border-border focus:bg-background transition-colors pl-10"
                        />
                    </div>
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
            </form>

            <div className="text-center">
                <Link href="/auth/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <DoorOpen className="w-4 h-4 mr-2" />
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
