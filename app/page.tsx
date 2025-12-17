
// app/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';

export default function Home() {
  const params = useSearchParams();

  // User-controlled inputs
  const rawHtml = params.get('content') ?? '<p>Welcome to Next.js!</p>';
  const rawLink = params.get('link') ?? 'javascript:alert("xss")';

  // ❌ Intentionally unsafe: inject raw HTML directly into the DOM.
  // This is a classic DOM XSS sink that SAST tools flag.
  return (
    <main style={{ padding: 24 }}>
      <h1>Hello World (Vulnerable)</h1>

      <section>
        <h2>Untrusted HTML</h2>
        <div
          dangerouslySetInnerHTML={{
            __html: rawHtml, // CWE-79: Improper Neutralization of Input During Web Page Generation (XSS)
          }}
        />
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>Untrusted Link</h2>
        {/* ❌ Untrusted "href" attribute can allow javascript: URLs */}
        <a href={rawLink} style={{ color: 'blue', textDecoration: 'underline' }}>
          Untrusted link (click me)
        </a>
      </section>

      <p style={{ marginTop: 24, color: 'gray' }}>
        Try: <code>/?content=%3Cscript%3Ealert(1)%3C/script%3E</code> or{' '}
        <code>/?link=javascript:alert("xss")</code>
      </p>
    </main>
  );
}
