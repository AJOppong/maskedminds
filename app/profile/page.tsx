"use client";

import { Button } from "@/components/ui/button";
import {
    DoorOpen,
    User,
    Moon,
    Sun,
    Shield,
    LogOut,
    Settings as SettingsIcon,
    MessageCircleQuestion,
    Edit2,
    Trash2,
    Calendar,
    Cat,
    Dog,
    Bird,
    Fish,
    Rabbit,
    Squirrel,
    Smile,
    Heart,
    Star,
    Zap,
    Flame,
    Sparkles,
    Ghost,
    Skull,
    Rocket,
    Crown
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

const PROFILE_ICONS = [
    { name: 'User', icon: User, color: 'text-blue-400' },
    { name: 'Cat', icon: Cat, color: 'text-orange-400' },
    { name: 'Dog', icon: Dog, color: 'text-amber-400' },
    { name: 'Bird', icon: Bird, color: 'text-sky-400' },
    { name: 'Fish', icon: Fish, color: 'text-cyan-400' },
    { name: 'Rabbit', icon: Rabbit, color: 'text-pink-400' },
    { name: 'Squirrel', icon: Squirrel, color: 'text-yellow-600' },
    { name: 'Smile', icon: Smile, color: 'text-yellow-400' },
    { name: 'Heart', icon: Heart, color: 'text-red-400' },
    { name: 'Star', icon: Star, color: 'text-yellow-300' },
    { name: 'Zap', icon: Zap, color: 'text-purple-400' },
    { name: 'Flame', icon: Flame, color: 'text-orange-500' },
    { name: 'Sparkles', icon: Sparkles, color: 'text-pink-300' },
    { name: 'Ghost', icon: Ghost, color: 'text-indigo-300' },
    { name: 'Skull', icon: Skull, color: 'text-gray-400' },
    { name: 'Rocket', icon: Rocket, color: 'text-blue-500' },
    { name: 'Crown', icon: Crown, color: 'text-yellow-500' },
];

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, deleteAccount, updateProfile } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editNickname, setEditNickname] = useState(user?.nickname || "");
    const [selectedIcon, setSelectedIcon] = useState('User');
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Load user's profile icon from Supabase auth metadata
    useEffect(() => {
        const loadUserIcon = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser?.user_metadata?.profileIcon) {
                setSelectedIcon(authUser.user_metadata.profileIcon);
            }
        };
        loadUserIcon();
    }, []);

    const handleUpdateProfile = async () => {
        if (!editNickname.trim()) return;
        setIsUpdating(true);
        try {
            await updateProfile(editNickname);
            // Update user metadata with selected icon
            await supabase.auth.updateUser({
                data: { profileIcon: selectedIcon }
            });
            setIsEditOpen(false);
        } catch (error) {
            console.error("Update failed:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await deleteAccount();
        } catch (error) {
            console.error("Deletion failed:", error);
            setIsDeleting(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground">You must be signed in to view this page.</p>
                    <Link href="/auth/login">
                        <Button>Sign In</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border p-4 flex items-center gap-4">
                <Link href="/explore">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <DoorOpen className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="font-bold text-lg">My Profile</h1>
            </header>

            <main className="max-w-md mx-auto p-6 space-y-8">
                {/* User Card */}
                <div className="bg-gradient-to-br from-primary/20 to-accent/10 p-6 rounded-2xl border border-primary/20 flex flex-col items-center text-center space-y-4 relative overflow-hidden">
                    <button
                        type="button"
                        onClick={async () => {
                            setEditNickname(user.nickname);
                            // Load current icon from auth metadata
                            const { data: { user: authUser } } = await supabase.auth.getUser();
                            setSelectedIcon(authUser?.user_metadata?.profileIcon || 'User');
                            setIsEditOpen(true);
                        }}
                        className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all hover:scale-110 shadow-md z-10"
                        title="Edit Profile"
                    >
                        <Edit2 className="w-4 h-4 text-primary" />
                    </button>

                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-2 shadow-inner">
                        {(() => {
                            const iconData = PROFILE_ICONS.find(i => i.name === selectedIcon);
                            const IconComponent = iconData?.icon || User;
                            const iconColor = iconData?.color || 'text-primary';
                            return <IconComponent className={`w-10 h-10 ${iconColor}`} />;
                        })()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{user.nickname}</h2>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                            <Calendar className="w-3 h-3" />
                            Member since {format(new Date(user.created_at), 'MMMM yyyy')}
                        </div>
                    </div>
                    <div className="flex gap-4 text-center w-full justify-center pt-2">
                        <div className="bg-background/50 px-4 py-2 rounded-xl flex-1 backdrop-blur-sm border border-white/5">
                            <div className="text-xl font-bold text-primary">--</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Chats</div>
                        </div>
                        <div className="bg-background/50 px-4 py-2 rounded-xl flex-1 backdrop-blur-sm border border-white/5">
                            <div className="text-xl font-bold text-green-500">0</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Flags</div>
                        </div>
                    </div>
                </div>

                {/* Settings List */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground px-2 uppercase tracking-wide">Settings</h3>
                    <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-orange-400" />}
                                <span>App Theme</span>
                            </div>
                            <span className="text-xs bg-muted px-2 py-1 rounded capitalize">{theme}</span>
                        </button>

                        <button
                            onClick={() => router.push("/profile/moderation")}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-blue-400" />
                                <span>Moderation History</span>
                            </div>
                            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-medium">Clear</span>
                        </button>

                        <button
                            onClick={() => router.push("/help")}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <MessageCircleQuestion className="w-5 h-5 text-green-400" />
                                <span>Help & Support</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-medium text-destructive px-2 uppercase tracking-wide">Danger Zone</h3>
                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 rounded-xl h-12 border-destructive/20 text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                                try {
                                    await logout();
                                } catch (error) {
                                    console.error("Logout error:", error);
                                }
                            }}
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </Button>

                        <button
                            onClick={() => setIsDeleteOpen(true)}
                            className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors py-2"
                        >
                            <Trash2 className="w-3 h-3" />
                            Permanently Delete Account
                        </button>
                    </div>
                </div>
            </main>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Change your anonymous nickname here.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nickname">Nickname</Label>
                            <Input
                                id="nickname"
                                value={editNickname}
                                onChange={(e) => setEditNickname(e.target.value)}
                                placeholder="Enter new nickname"
                                maxLength={20}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Profile Icon</Label>
                            <div className="grid grid-cols-6 gap-2">
                                {PROFILE_ICONS.map((iconData) => {
                                    const IconComponent = iconData.icon;
                                    return (
                                        <button
                                            key={iconData.name}
                                            type="button"
                                            onClick={() => setSelectedIcon(iconData.name)}
                                            className={`p-3 rounded-lg border-2 transition-all hover:scale-110 ${selectedIcon === iconData.name
                                                ? 'border-primary bg-primary/10 shadow-lg'
                                                : 'border-border bg-card hover:border-primary/50'
                                                }`}
                                            title={iconData.name}
                                        >
                                            <IconComponent className={`w-5 h-5 ${iconData.color}`} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                            {isUpdating ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Account Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[425px] border-destructive/50">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                        <DialogDescription>
                            This action is permanent. All your chats, reports, and profile data will be wiped. Are you absolutely sure?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="sm:flex-1">
                            No, Keep Account
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="sm:flex-1"
                        >
                            {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
