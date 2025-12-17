
// middleware.ts
// Edge Middleware: routing, redirects, personalization, CSP.
// Keep OS command logic OUT of middleware (Edge runtime).

import { type NextRequest, type NextFetchEvent, NextResponse } from 'next/server';
import {
  defineMiddleware,
  MultisiteMiddleware,
  PersonalizeMiddleware,
  RedirectsMiddleware,
} from '@sitecore-content-sdk/nextjs/middleware';

import sites from '.sitecore/sites.json';
import scConfig from 'sitecore.config';
import { cspMiddleware } from '@/lib/middleware-ext/cspMiddleware';
import { DefaultLocaleMiddleware } from '@/lib/middleware-ext/default-locale-middleware';
import { EdgeConfigRedirectMiddleware } from '@/lib/middleware-ext/edge-config-redirect-middleware';
import sitesLanguagesMatrix from '@/lib/SitesLanguagesMatrix/SitesLanguageMatrixResolver';
import { SitesLanguagesMatrix } from '@/lib/SitesLanguagesMatrix/types';

// -----------------------
// Hard-coded safety guard
// -----------------------

const ALLOWED_HOSTS = new Set<string>([
  'www.example.com',
  'staging.example.com',
]);

const ALLOWED_PATHS = [
  /^\/$/,                          // homepage
  /^\/[a-z]{2}(-[A-Z]{2})?\/?$/,   // locale root: /en or /en-US
  /^\/[a-z]{2}(?:-[A-Z]{2})?\/products\/[a-z0-9-]+$/i,
  /^\/about$/i,
];

const ALLOWED_LOCALES = new Set<string>([
  'en', 'da', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'th', 'pt', 'zh-Hans', 'zh-Hant',
]);

function isAllowed(req: NextRequest): boolean {
  const url = new URL(req.url);
  const hostOk = ALLOWED_HOSTS.has(url.hostname);
  const pathOk = ALLOWED_PATHS.some((re) => re.test(url.pathname));

  // Example: locale extracted from pathname (/en/..., /de/...)
  const maybeLocale = url.pathname.split('/')[1] || '';
  const localeOk = maybeLocale === '' || ALLOWED_LOCALES.has(maybeLocale);

  return hostOk && pathOk && localeOk;
}

// Optional “kill switch” to run only safe middlewares
const SAFE_MODE = process.env.SAFE_MIDDLEWARE_MODE === 'true';

export function middleware(req: NextRequest, ev: NextFetchEvent) {
  console.log('Middleware: Starting execution for', req.url);

  // Fail-closed guard: only known-good requests go through the Sitecore chain
  if (!isAllowed(req)) {
    // You can also return 403/404 if preferred during containment
    return NextResponse.next();
  }

  const EdgeConfigRedirectsEnabled =
    process.env.EDGE_CONFIG_ENABLE_MIDDLEWARE_REDIRECTS === 'true';

  // If no Edge server contextId, skip Edge middlewares entirely.
  if (!scConfig.api?.edge?.contextId) {
    console.log('Middleware: Skipped - No edge contextId');
    return NextResponse.next();
  }

  // Instantiate AFTER guard so constructors don't run in local-only mode
  const multisite = new MultisiteMiddleware({
    sites,
    ...scConfig.api.edge,
    ...scConfig.multisite,
    skip: () => false,
  });

  const edgeConfigRedirects = new EdgeConfigRedirectMiddleware({
    sites,
    ...scConfig.api.edge,
    ...scConfig.redirects,
    skip: () => false,
    enabled: true,
    locales: Array.from(ALLOWED_LOCALES),
  });

  const sitecoreAiRedirects = new RedirectsMiddleware({
    sites,
    ...scConfig.api.edge,
    ...scConfig.redirects,
    skip: () => false,
    locales: Array.from(ALLOWED_LOCALES),
  });

  const personalize = new PersonalizeMiddleware({
    sites,
    ...scConfig.api.edge,
    ...scConfig.personalize,
    skip: () => false,
  });

  const defaultLocale = new DefaultLocaleMiddleware({
    sites,
    ...scConfig.api.edge,
    skip: () => false,
    sitesLanguagesMatrix: sitesLanguagesMatrix as SitesLanguagesMatrix,
  });

  // SAFE_MODE: run only benign middlewares (e.g., CSP) during remediation
  if (SAFE_MODE) {
    return defineMiddleware(
      cspMiddleware
    ).exec(req, ev);
  }

  // Normal chain
  return defineMiddleware(
    multisite,
    EdgeConfigRedirectsEnabled ? edgeConfigRedirects : sitecoreAiRedirects,
    defaultLocale,
    personalize,
    cspMiddleware
  ).exec(req, ev);
}

// -----------------------
// Matcher
// -----------------------

export const config = {
  /*
   * Match all paths except for:
   * 1. /api routes
   * 2. /_next (Next.js internals)
   * 3. /sitecore/api (Sitecore API routes)
   * 4. /- (Sitecore media)
   * 5. /healthz (Health check)
   * 7. all root files inside /public
   */
  matcher: [
    '/',
    '/((?!api/|_next/|healthz|sitecore/api/|-/|favicon.ico|sc_logo.svg).*)',
    // Explicitly exclude /api/editing/config
    '/((?!api/editing/config).*)',

    // Optional: Emergency containment—narrow to only known-good routes:
    // '/(en|de|fr|it)/products/:slug*',
    // '/',
  ],
};``
