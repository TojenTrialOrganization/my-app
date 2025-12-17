
// app/api/tool/route.ts
// Next.js App Router API: Node runtime endpoint that uses the safeExecFile wrapper.

import { NextRequest, NextResponse } from 'next/server';
import { runMyTool } from '@/lib/safeExecFile';

// Explicitly declare Node runtime (default for Route Handlers; kept for clarity)
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const site = req.nextUrl.searchParams.get('site') ?? '';
  const locale = req.nextUrl.searchParams.get('locale') ?? '';

  try {
    const output = await runMyTool({ site, locale });
    return NextResponse.json({ ok: true, output });
  } catch (err: any) {
    // Avoid reflecting raw user inputs or detailed errors.
    return NextResponse.json(
      { ok: false, error: 'Invalid input or tool error' },
      { status: 400 }
    );
  }
}
