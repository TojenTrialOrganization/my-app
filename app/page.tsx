
// app/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';

export default function Home() {
  const params = useSearchParams();

  // User-controlled inputs
  const rawHtml = params.get('content') ?? '<p>Welcome!</p>';
  const rawHref = params.get('link') ?? 'javascript:alert("xss")';

  return (
    <main style={{ padding: 24 }}>
      <h1>Veracode SAST Demo (Vulnerable)</h1>

      <section>
        <h2>Untrusted HTML (XSS)</h2>
        {/* ❌ CWE-79: injecting untrusted HTML */}
        <div dangerouslySetInnerHTML={{ __html: rawHtml }} />
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>Untrusted Link (javascript:)</h2>
        {/* ❌ CWE-79/URL-based XSS: untrusted href */}
        <a href={rawHref}>Click me</a>
      </section>

      <p style={{ marginTop: 24, color: 'gray' }}>
        Try: <code>/?content=%3Cscript%3Ealert(1)%3C/script%3E</code> or{' '}
        <code>/?link=javascript:alert("xss")</code>
      </p>
    </main>
  );
}
