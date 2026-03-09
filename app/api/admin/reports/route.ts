import { NextResponse } from 'next/server';
import { createAdminClient, verifyAdminSession } from '@/lib/adminAuth';

export async function GET(request: Request) {
    const { valid } = await verifyAdminSession(request);
    if (!valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    try {
        // Fetch reports with the associated chat title
        const { data: reports, error } = await supabase
            .from('reports')
            .select('id, chat_id, reason, status, created_at, chats(title)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by chat_id and count
        const groupedMap: Record<string, {
            chatId: string;
            topic: string;
            reportCount: number;
            latestReport: string;
            status: string;
            reason: string;
        }> = {};

        reports?.forEach(r => {
            const chatId = r.chat_id;
            const chatTitle = (r.chats as any)?.title ?? 'Unknown';

            if (!groupedMap[chatId]) {
                groupedMap[chatId] = {
                    chatId,
                    topic: chatTitle,
                    reportCount: 0,
                    latestReport: r.created_at,
                    status: r.status,
                    reason: r.reason ?? 'No reason given',
                };
            }
            groupedMap[chatId].reportCount++;
            if (r.created_at > groupedMap[chatId].latestReport) {
                groupedMap[chatId].latestReport = r.created_at;
            }
        });

        return NextResponse.json({ reports: Object.values(groupedMap) });
    } catch (error) {
        console.error('Admin reports fetch error:', error);
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
            case 'remove':
                // Delete the chat (cascades to messages and reports)
                await supabase.from('chats').delete().eq('id', chatId);
                await supabase.from('reports').update({ status: 'resolved' }).eq('chat_id', chatId);
                return NextResponse.json({ success: true, message: 'Content removed' });

            case 'ignore':
                await supabase.from('reports').update({ status: 'ignored' }).eq('chat_id', chatId);
                return NextResponse.json({ success: true, message: 'Reports ignored' });

            case 'lock':
                await supabase.from('chats').update({ locked: true }).eq('id', chatId);
                await supabase.from('reports').update({ status: 'resolved' }).eq('chat_id', chatId);
                return NextResponse.json({ success: true, message: 'Discussion locked' });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Admin report action error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
