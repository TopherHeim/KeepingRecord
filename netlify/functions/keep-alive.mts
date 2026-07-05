import type { Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export default async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Keep-alive: missing Supabase credentials');
        return new Response('Missing Supabase credentials', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Write to the keep_alive table so the project registers activity.
    // Requires the anon RLS policies on keep_alive (scoped to id = 1).
    const { error } = await supabase
        .from('keep_alive')
        .upsert({ id: 1, last_ping: new Date().toISOString() });

    if (error) {
        console.error('Keep-alive write failed:', error.message);
        return new Response(`Failed: ${error.message}`, { status: 500 });
    }

    console.log('Keep-alive ping successful at', new Date().toISOString());
    return new Response('OK');
};

// Daily at midnight UTC — Supabase pauses free projects after ~7 days of
// inactivity, so daily leaves a wide margin and costs nothing
export const config: Config = { schedule: '@daily' };
