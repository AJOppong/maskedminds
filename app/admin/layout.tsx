"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            // Allow access to the login page without auth check
            if (pathname === "/admin/login") {
                setIsChecking(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace("/admin/login");
                return;
            }

            // Check admin role in app_metadata
            const isAdminUser = session.user.app_metadata?.role === "admin";
            if (!isAdminUser) {
                await supabase.auth.signOut();
                router.replace("/admin/login");
                return;
            }

            setIsAdmin(true);
            setIsChecking(false);
        };

        checkAdmin();
    }, [pathname, router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace("/admin/login");
    };

    // Login page renders without sidebar
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen flex bg-background text-foreground">
            <AdminSidebar onLogout={handleLogout} />
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    );
}
