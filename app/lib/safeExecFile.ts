
// lib/safeExecFile.ts
// Safe wrapper around child_process.execFile to avoid OS command injection (CWE-78)

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Derive these lists from your Sitecore "sites" config and supported locales.
 * Keep them tight. Never trust raw request inputs.
 */
const ALLOWED_SITES = new Set<string>([
  'site-a',
  'site-b',
  'site-c',
]);

const ALLOWED_LOCALES = new Set<string>([
  'en', 'da', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'th', 'pt', 'zh-Hans', 'zh-Hant',
]);

// Small, strict token regex for additional hardening (optional)
const TOKEN_RE = /^[a-z0-9\-_.]{1,32}$/i;

/**
 * Safely invokes an external binary with validated, allowlisted arguments.
 * No shell is used; arguments are passed as an array to prevent injection.
 *
 * @throws Error if inputs are invalid or the command fails.
 */
export async function runMyTool(opts: { site: string; locale: string }) {
  const { site, locale } = opts;

  // Allowlist checks
  if (!ALLOWED_SITES.has(site)) {
    throw new Error('Invalid site');
  }
  if (!ALLOWED_LOCALES.has(locale)) {
    throw new Error('Invalid locale');
  }

  // Regex token check (extra hardening)
  if (!TOKEN_RE.test(site) || !TOKEN_RE.test(locale)) {
    throw new Error('Invalid characters in input');
  }

  // Absolute path to the executable; avoid PATH lookups for predictability
  // Tip: keep this in an env var and resolve to an absolute path at boot.
  const exe = process.env.MY_TOOL_PATH || '/usr/local/bin/mytool';

  // ✅ No shell. Arguments are separated.
  const { stdout, stderr } = await execFileAsync(
    exe,
    ['--site', site, '--locale', locale],
    {
      timeout: 3000,        // prevent long hangs
      windowsHide: true,    // reduce console popups on Windows
      maxBuffer: 1024 * 1024, // 1MB output cap
      // cwd: '/srv/tools',  // optional: restrict working directory
      // env: { PATH: '/usr/local/bin' }, // optional: narrow environment
    }
  );

  // Optional: minimally handle stderr (don’t echo untrusted data blindly)
  if (stderr && stderr.trim().length > 0) {
    // Log with care; consider redaction or structured logging
    // console.warn('mytool stderr:', sanitize(stderr));
  }

  return stdout;
}
