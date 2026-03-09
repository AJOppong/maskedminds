import { NextResponse } from 'next/server';
import { createAdminClient, verifyAdminSession } from '@/lib/adminAuth';

export async function GET(request: Request) {
    const { valid } = await verifyAdminSession(request);
    if (!valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = 20;
    const from = (page - 1) * pageSize;

    try {
        // Get all chats with message count
        const { data: chats, count } = await supabase
            .from('chats')
            .select('id, title, section_id, created_at, locked, flagged, flag_reason', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);

        if (!chats) return NextResponse.json({ discussions: [], total: 0 });

        // Get message counts for these chats
        const chatIds = chats.map(c => c.id);
        const { data: messageCounts } = await supabase
            .from('messages')
            .select('chat_id')
            .in('chat_id', chatIds)
            .eq('is_system', false);

        const countMap: Record<string, number> = {};
        messageCounts?.forEach(m => {
            countMap[m.chat_id] = (countMap[m.chat_id] ?? 0) + 1;
        });

        const discussions = chats.map(c => ({
            id: c.id,
            title: c.title,
            category: c.section_id,
            createdAt: c.created_at,
            replies: countMap[c.id] ?? 0,
            locked: c.locked ?? false,
            flagged: c.flagged ?? false,
            flagReason: c.flag_reason,
        }));

        return NextResponse.json({ discussions, total: count ?? 0 });
    } catch (error) {
        console.error('Admin discussions fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { valid } = await verifyAdminSession(request);
    if (!valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    try {
        const body = await request.json();
        const { chatId, action } = body;

        if (!chatId || !action) {
            return NextResponse.json({ error: 'Missing chatId or action' }, { status: 400 });
        }

        switch (action) {
            case 'delete':
                await supabase.from('chats').delete().eq('id', chatId);
                return NextResponse.json({ success: true, message: 'Discussion deleted' });

            case 'lock':
                await supabase.from('chats').update({ locked: true }).eq('id', chatId);
                return NextResponse.json({ success: true, message: 'Discussion locked' });

            case 'unlock':
                await supabase.from('chats').update({ locked: false }).eq('id', chatId);
                return NextResponse.json({ success: true, message: 'Discussion unlocked' });

            case 'flag':
                await supabase.from('chats').update({ flagged: true, flag_reason: body.reason ?? 'Admin flagged' }).eq('id', chatId);
                return NextResponse.json({ success: true, message: 'Discussion flagged' });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Admin discussion action error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
