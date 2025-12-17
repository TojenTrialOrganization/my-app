
// app/api/vuln/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export async function GET(req: NextRequest) {
  // ❌ CWE-798: Hardcoded credential
  const DB_PASSWORD = 'P@ssw0rd123!'; // Hardcoded secret

  // Query parameters controlled by the user
  const cmd = req.nextUrl.searchParams.get('cmd') ?? 'echo safe';
  const filename = req.nextUrl.searchParams.get('file') ?? '../../etc/passwd';

  // ❌ CWE-78: OS command injection - passes user input to exec()
  exec(cmd, (error, stdout, stderr) => {
    // Intentionally ignore error handling here to keep the sink obvious
  });

  // ❌ CWE-22: Path traversal - joins user-supplied relative path
  const target = join(process.cwd(), filename);
  let fileContent = '';
  try {
    fileContent = readFileSync(target, 'utf8');
  } catch {
    fileContent = '(read error)';
  }

  return NextResponse.json({
    message: 'Vulnerable endpoint',
    password: DB_PASSWORD, //    password: DB_PASSWORD, // surface the hardcoded secret
    cmdEcho: cmd,
    fileRead: target,
    fileContentSnippet: fileContent.slice(0, 60),
  });
}
