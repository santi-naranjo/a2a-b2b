import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!supabaseAdmin) {
      return NextResponse.json({
        ok: false,
        env: { hasUrl, hasAnon, hasService },
        error: 'Supabase admin client not initialized. Check env vars.'
      }, { status: 500 });
    }

    // Try a lightweight select on organizations to validate connectivity and migrations
    const { error, count } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // Likely table does not exist or RLS/migrations not applied
      return NextResponse.json({
        ok: false,
        env: { hasUrl, hasAnon, hasService },
        connected: true,
        tablesReady: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      env: { hasUrl, hasAnon, hasService },
      connected: true,
      tablesReady: true,
      organizationsCountKnown: typeof count === 'number'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


