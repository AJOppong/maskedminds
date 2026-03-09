import { NextResponse } from 'next/server';
import { createAdminClient, verifyAdminSession } from '@/lib/adminAuth';

export async function GET(request: Request) {
    const { valid } = await verifyAdminSession(request);
    if (!valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    try {
        // Total discussions
        const { count: totalDiscussions } = await supabase
            .from('chats')
            .select('*', { count: 'exact', head: true });

        // Discussions created today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { count: discussionsToday } = await supabase
            .from('chats')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', todayStart.toISOString());

        // Pending reports
        const { count: pendingReports } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // Total profiles (registered users)
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Recent active users (joined chats in last 30 min — simulated via recent messages)
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: recentMessages } = await supabase
            .from('messages')
            .select('sender_id, created_at, chat_id')
            .gte('created_at', thirtyMinAgo)
            .eq('is_system', false)
            .order('created_at', { ascending: false });

        // Unique active users
        const uniqueActive = new Set(recentMessages?.map(m => m.sender_id) ?? []);
        const onlineUsers = uniqueActive.size;

        // Active user details
        const recentUserIds = Array.from(uniqueActive).slice(0, 20);
        let activeUsersData: Array<{
            sessionId: string;
            joinedTime: string;
            lastActive: string;
            device: string;
        }> = [];

        if (recentUserIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, nickname, created_at')
                .in('id', recentUserIds);

            activeUsersData = (profiles ?? []).map(p => {
                const lastMsg = recentMessages?.find(m => m.sender_id === p.id);
                return {
                    sessionId: p.id.substring(0, 8).toUpperCase(),
                    joinedTime: p.created_at,
                    lastActive: lastMsg?.created_at ?? p.created_at,
                    device: 'Web',
                };
            });
        }

        return NextResponse.json({
            totalDiscussions: totalDiscussions ?? 0,
            discussionsToday: discussionsToday ?? 0,
            pendingReports: pendingReports ?? 0,
            totalUsers: totalUsers ?? 0,
            onlineUsers,
            activeUsers: activeUsersData,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
