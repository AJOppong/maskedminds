"use client";

import { SECTIONS } from "@/lib/constants";
import Link from "next/link";
import { MessageCircle, DoorOpen, Settings, LogOut, User, Palette, HelpCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import { useState, useRef, useEffect } from "react";

export default function ExplorePage() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <DoorOpen className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Masked Minds
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 relative" ref={dropdownRef}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <Settings className="w-5 h-5" />
                        </Button>

                        {/* Custom Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-12 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md z-50">
                                <div className="px-2 py-1.5 text-sm font-semibold">Settings</div>
                                <div className="h-px bg-muted my-1" />

                                <Link
                                    href="/profile"
                                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </Link>

                                <button
                                    onClick={() => toggleTheme()}
                                    className="w-full relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                    <Palette className="mr-2 h-4 w-4" />
                                    <span>Theme</span>
                                    <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded capitalize">{theme}</span>
                                </button>

                                <Link
                                    href="/help"
                                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <HelpCircle className="mr-2 h-4 w-4" />
                                    <span>Help</span>
                                </Link>

                                <div className="h-px bg-muted my-1" />

                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-destructive"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="px-6 py-12 flex-1">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8 text-center">Join a Page</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SECTIONS.map((section) => (
                            <div key={section.id} className="relative group">
                                {user?.status === 'Suspended' ? (
                                    <div
                                        onClick={() => alert("You are currently suspended and cannot join new chats.")}
                                        className="h-full p-6 rounded-2xl bg-card border border-border opacity-60 cursor-not-allowed transition-all duration-300"
                                    >
                                        <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-muted opacity-50`}>
                                            <ShieldAlert className="text-muted-foreground h-6 w-6" />
                                        </div>
                                        <div className="absolute top-4 right-4 bg-destructive text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase">Restricted</div>
                                        <h3 className="text-xl font-semibold mb-2 text-muted-foreground">
                                            {section.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm italic">
                                            Membership restricted during suspension.
                                        </p>
                                    </div>
                                ) : (
                                    <Link href={`/section/${section.id}`}>
                                        <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                                            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br ${section.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}>
                                                <MessageCircle className="text-white h-6 w-6" />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                                                {section.title}
                                            </h3>
                                            <p className="text-muted-foreground text-sm">
                                                {section.description}
                                            </p>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

