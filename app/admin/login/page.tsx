"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ShieldCheck, Eye, EyeOff, AlertCircle, Lock } from "lucide-react";

const ADMIN_EMAIL = "maskedminds26@gmail.com";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Enforce fixed admin email
            if (email.toLowerCase() !== ADMIN_EMAIL) {
                throw new Error("Access denied. Unrecognized admin account.");
            }

            const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

            if (signInError) throw signInError;

            // Verify admin role in Supabase app_metadata
            const isAdmin = data.user?.app_metadata?.role === "admin";
            if (!isAdmin) {
                await supabase.auth.signOut();
                throw new Error("Access denied. This account does not have admin privileges.");
            }

            router.push("/admin/dashboard");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Login failed. Please try again.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md space-y-8 animate-fade-in">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Access</h1>
                            <p className="text-muted-foreground mt-1.5 text-sm">
                                Restricted to authorized administrators only
                            </p>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-xl shadow-black/20">
                        {/* Branding */}
                        <div className="flex items-center gap-2 mb-6 pb-6 border-b border-border">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                Masked Minds — Admin Panel
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Admin Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="maskedminds26@gmail.com"
                                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2.5 pr-10 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        Sign In to Admin Panel
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        Not an admin?{" "}
                        <a href="/" className="text-primary hover:underline">
                            Return to Masked Minds
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
