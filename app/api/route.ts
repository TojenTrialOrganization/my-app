// app/api/vuln/route.ts
// 🚨 INTENTIONALLY VULNERABLE FOR SAST DEMO: OS Command Injection (CWE-78)
// Do NOT deploy this in production.

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'node:child_process';

// Ensure Node runtime (Edge doesn't support child_process)
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const cmd = req.nextUrl.searchParams.get('cmd') ?? 'echo Hello';

  // ❌ Vulnerable sink: executes untrusted shell command
  exec(cmd, (_error, _stdout, _stderr) => {
    // Intentionally minimal to keep the vulnerable pattern obvious
  });

  return NextResponse.json({
    message: 'Executed command (vulnerable demo)',
    cmd,
  });
}