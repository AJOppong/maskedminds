"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfile {
    id: string;
    email: string | undefined;
    nickname: string;
    created_at: string;
    status: 'Normal' | 'Warning' | 'Suspended' | 'Banned';
    suspension_count: number;
    last_suspension_at: string | null;
    banned_at: string | null;
    active_flags_count: number;
}

interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    login: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    updateProfile: (nickname: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            // Get current session
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Fetch profile
                let { data: profile } = await supabase
                    .from('profiles')
                    .select('nickname, created_at, status, suspension_count, last_suspension_at, banned_at, active_flags_count')
                    .eq('id', session.user.id)
                    .single();

                // Check for suspension lift
                if (profile?.status === 'Suspended') {
                    await supabase.rpc('check_suspension_lift', { user_id: session.user.id });
                    // Re-fetch after potential lift
                    const { data: updatedProfile } = await supabase
                        .from('profiles')
                        .select('nickname, created_at, status, suspension_count, last_suspension_at, banned_at, active_flags_count')
                        .eq('id', session.user.id)
                        .single();
                    if (updatedProfile) profile = updatedProfile;
                }

                // If profile is missing, log warning but continue
                // Profile should be created by database trigger on signup
                if (!profile) {
                    console.warn("Profile not found for user. This should have been created by the database trigger.");
                    // Set a minimal profile to allow the app to function
                    profile = {
                        nickname: session.user.user_metadata?.nickname || session.user.email?.split('@')[0] || 'Anonymous',
                        created_at: session.user.created_at,
                        status: 'Normal',
                        suspension_count: 0,
                        last_suspension_at: null,
                        banned_at: null,
                        active_flags_count: 0
                    };
                }

                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    nickname: profile?.nickname || session.user.user_metadata?.nickname || 'Anonymous',
                    created_at: profile?.created_at || session.user.created_at,
                    status: profile?.status || 'Normal',
                    suspension_count: profile?.suspension_count || 0,
                    last_suspension_at: profile?.last_suspension_at || null,
                    banned_at: profile?.banned_at || null,
                    active_flags_count: profile?.active_flags_count || 0
                });
            }
            setIsLoading(false);

            // Listen for changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (session?.user) {
                    let { data: profile } = await supabase
                        .from('profiles')
                        .select('nickname, created_at, status, suspension_count, last_suspension_at, banned_at, active_flags_count')
                        .eq('id', session.user.id)
                        .single();

                    if (profile?.status === 'Suspended') {
                        await supabase.rpc('check_suspension_lift', { user_id: session.user.id });
                        const { data: updatedProfile } = await supabase
                            .from('profiles')
                            .select('nickname, created_at, status, suspension_count, last_suspension_at, banned_at, active_flags_count')
                            .eq('id', session.user.id)
                            .single();
                        if (updatedProfile) profile = updatedProfile;
                    }

                    // If profile is missing, log warning but continue
                    // Profile should be created by database trigger on signup
                    if (!profile) {
                        console.warn("Profile not found for user. This should have been created by the database trigger.");
                        // Set a minimal profile to allow the app to function
                        profile = {
                            nickname: session.user.user_metadata?.nickname || session.user.email?.split('@')[0] || 'Anonymous',
                            created_at: session.user.created_at,
                            status: 'Normal',
                            suspension_count: 0,
                            last_suspension_at: null,
                            banned_at: null,
                            active_flags_count: 0
                        };
                    }

                    setUser({
                        id: session.user.id,
                        email: session.user.email,
                        nickname: profile?.nickname || session.user.user_metadata?.nickname || 'Anonymous',
                        created_at: profile?.created_at || session.user.created_at,
                        status: profile?.status || 'Normal',
                        suspension_count: profile?.suspension_count || 0,
                        last_suspension_at: profile?.last_suspension_at || null,
                        banned_at: profile?.banned_at || null,
                        active_flags_count: profile?.active_flags_count || 0
                    });
                } else {
                    setUser(null);
                }
                setIsLoading(false);
            });

            return () => subscription.unsubscribe();
        };

        initializeAuth();
    }, []);

    // Note: Actual login calls happen in the page components using supabase directly for more control,
    // but we can expose helper methods here if we want to standardize.
    // For now, sticking to the existing interface but warning that pages need update.
    const login = async (email: string) => {
        console.warn("Please use supabase.auth.signInWithPassword in the component directly.");
    };

    const logout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Logout error:", error);
                throw error;
            }
            router.push("/auth/login");
        } catch (error) {
            console.error("Failed to logout:", error);
            // Still redirect even if there's an error
            router.push("/auth/login");
        }
    };

    const deleteAccount = async () => {
        try {
            // 1. Delete user's profile data
            if (user?.id) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', user.id);

                if (profileError) {
                    console.error("Error deleting profile:", profileError);
                }
            }

            // 2. Sign the user out
            await supabase.auth.signOut();

            // 3. Cleanup state
            setUser(null);

            // 4. Redirect
            router.push("/auth/signup");
        } catch (error) {
            console.error("Failed to delete account:", error);
            throw error;
        }
    };

    const updateProfile = async (nickname: string) => {
        try {
            if (!user?.id) return;

            const { error } = await supabase
                .from('profiles')
                .update({ nickname })
                .eq('id', user.id);

            if (error) throw error;

            setUser(prev => prev ? { ...prev, nickname } : null);
        } catch (error) {
            console.error("Failed to update profile:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, deleteAccount, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
