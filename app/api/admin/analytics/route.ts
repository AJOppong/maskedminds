import { NextResponse } from 'next/server';
import { createAdminClient, verifyAdminSession } from '@/lib/adminAuth';

export async function GET(request: Request) {
    const { valid } = await verifyAdminSession(request);
    if (!valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    try {
        // Get messages from last 30 days grouped by day
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: messages } = await supabase
            .from('messages')
            .select('created_at, chat_id')
            .gte('created_at', thirtyDaysAgo)
            .eq('is_system', false)
            .order('created_at', { ascending: true });

        // Build daily counts (last 30 days)
        const dailyMap: Record<string, number> = {};
        const dailyLabels: string[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().split('T')[0];
            dailyMap[key] = 0;
            dailyLabels.push(key);
        }
        messages?.forEach(m => {
            const key = m.created_at.split('T')[0];
            if (key in dailyMap) dailyMap[key]++;
        });
        const dailyActivity = dailyLabels.map(d => ({ date: d, count: dailyMap[d] }));

        // Weekly (last 8 weeks)
        const weeklyMap: Record<string, number> = {};
        const weeklyLabels: string[] = [];
        for (let i = 7; i >= 0; i--) {
            const startOfWeek = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
            const key = `W${getWeekNumber(startOfWeek)}`;
            weeklyMap[key] = 0;
            weeklyLabels.push(key);
        }
        messages?.forEach(m => {
            const d = new Date(m.created_at);
            const key = `W${getWeekNumber(d)}`;
            if (key in weeklyMap) weeklyMap[key] = (weeklyMap[key] ?? 0) + 1;
        });
        const weeklyActivity = weeklyLabels.map(w => ({ week: w, count: weeklyMap[w] }));

        // Most active topics (by message count)
        const chatCounts: Record<string, number> = {};
        messages?.forEach(m => {
            chatCounts[m.chat_id] = (chatCounts[m.chat_id] ?? 0) + 1;
        });
        const topChatIds = Object.entries(chatCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id]) => id);

        let topTopics: Array<{ topic: string; category: string; messages: number }> = [];
        if (topChatIds.length > 0) {
            const { data: topChats } = await supabase
                .from('chats')
                .select('id, title, section_id')
                .in('id', topChatIds);

            topTopics = (topChats ?? []).map(c => ({
                topic: c.title,
                category: c.section_id,
                messages: chatCounts[c.id] ?? 0,
            })).sort((a, b) => b.messages - a.messages);
        }

        // Peak hours (0-23) from last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentMessages } = await supabase
            .from('messages')
            .select('created_at')
            .gte('created_at', sevenDaysAgo)
            .eq('is_system', false);

        const hourCounts: number[] = new Array(24).fill(0);
        recentMessages?.forEach(m => {
            const hour = new Date(m.created_at).getUTCHours();
            hourCounts[hour]++;
        });
        const peakHours = hourCounts.map((count, hour) => ({ hour, count }));

        // Get total post counts per category
        const { data: chats } = await supabase
            .from('chats')
            .select('section_id');
        const categoryCounts: Record<string, number> = {};
        chats?.forEach(c => {
            categoryCounts[c.section_id] = (categoryCounts[c.section_id] ?? 0) + 1;
        });
        const discussionsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({
            category,
            count
        })).sort((a, b) => b.count - a.count);

        return NextResponse.json({
            dailyActivity,
            weeklyActivity,
            topTopics,
            peakHours,
            discussionsByCategory,
        });
    } catch (error) {
        console.error('Admin analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    return Math.ceil((diff / (7 * 24 * 60 * 60 * 1000)) + 1);
}
