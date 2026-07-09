import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        console.error('delete-account: missing Supabase credentials');
        return new Response('Server not configured', { status: 500, headers: CORS_HEADERS });
    }

    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token) {
        return new Response('Missing auth token', { status: 401, headers: CORS_HEADERS });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // The caller is identified from their own access token, so a client can
    // only ever delete the account it is logged in to
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
        return new Response('Invalid auth token', { status: 401, headers: CORS_HEADERS });
    }
    const uid = userData.user.id;

    // albums has no FK to vault_users, so it must be wiped explicitly;
    // vault_users and follows cascade from the auth-user delete below
    const { error: albumError } = await admin.from('albums').delete().eq('user_id', uid);
    if (albumError) {
        console.error('delete-account: album wipe failed:', albumError.message);
        return new Response('Failed to delete records', { status: 500, headers: CORS_HEADERS });
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
    if (deleteError) {
        console.error('delete-account: auth delete failed:', deleteError.message);
        return new Response('Failed to delete account', { status: 500, headers: CORS_HEADERS });
    }

    console.log('delete-account: removed user', uid);
    return new Response('OK', { headers: CORS_HEADERS });
};
