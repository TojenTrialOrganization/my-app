
// app/api/vuln/route.ts (fixed)
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);

export const runtime = 'nodejs';

const ALLOWED = new Set(['echo', 'date']);
const TOKEN = /^[a-zA-Z0-9._-]{1,32}$/;

export async function GET(req: NextRequest) {
  const cmd = req.nextUrl.searchParams.get('cmd') ?? 'echo';
  const arg = req.nextUrl.searchParams.get('arg') ?? 'Hello';

  if (!ALLOWED.has(cmd) || !TOKEN.test(arg)) {
    return NextResponse.json({ ok: false, error: 'invalid input' }, { status: 400 });
  }

  const { stdout } = await execFileAsync(cmd, [arg], {
    timeout: 2000,
    windowsHide: true,
    maxBuffer: 256 * 1024,
  });

  return NextResponse.json({ ok: true, stdout: String(stdout) });
}
