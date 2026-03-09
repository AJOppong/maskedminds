import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { CHAT_EXPIRATION_HOURS } from '@/lib/constants';

// Prevent caching for this route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Optional: Add a secret key check for simple security
    const authHeader = req.headers.get('authorization');
    // For now, we'll leave it open or check for a specific secret if the user configured one.
    // In a production env, you'd check process.env.CRON_SECRET

    try {
        // Call the Database Function
        const { data, error } = await supabase
            .rpc('cleanup_expired_chats', { hours_retention: CHAT_EXPIRATION_HOURS });

        if (error) {
            console.error('Error cleaning up chats:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Cleanup successful.`,
            deleted_count: data
        });
    } catch (err: any) {
        console.error('Unexpected error during cleanup:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
