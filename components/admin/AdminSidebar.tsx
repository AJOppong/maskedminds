"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Flag,
    BarChart2,
    LogOut,
    ShieldCheck,
} from "lucide-react";

const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/discussions", label: "Discussions", icon: MessageSquare },
    { href: "/admin/reports", label: "Reports", icon: Flag },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
];

interface AdminSidebarProps {
    onLogout: () => void;
}

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-64 min-h-screen flex flex-col bg-card border-r border-border shrink-0">
            {/* Logo */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-foreground">Masked Minds</p>
                        <p className="text-xs text-muted-foreground">Admin Panel</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                                ${isActive
                                    ? "bg-primary/15 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                }`}
                        >
                            <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-primary" : "group-hover:text-foreground"}`} />
                            {label}
                            {isActive && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
                >
                    <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
