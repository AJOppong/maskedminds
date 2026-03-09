import { createClient } from '@supabase/supabase-js';

// Admin Supabase client using service role key (bypasses RLS)
// This is ONLY ever used on the server side in API routes
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase admin environment variables. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    });
}

// Verify that the incoming request has a valid admin session
export async function verifyAdminSession(request: Request): Promise<{ valid: boolean; userId?: string }> {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return { valid: false };
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return { valid: false };
        }

        // Check admin role in app_metadata
        const isAdmin = user.app_metadata?.role === 'admin';
        return { valid: isAdmin, userId: isAdmin ? user.id : undefined };
    } catch {
        return { valid: false };
    }
}
