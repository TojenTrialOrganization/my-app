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

export function middleware(req: NextRequest, ev: NextFetchEvent) {
  console.log('Middleware: Starting execution for', req.url);
  const EdgeConfigRedirectsEnabled = process.env.EDGE_CONFIG_ENABLE_MIDDLEWARE_REDIRECTS === 'true';
  // If no Edge server contextId, skip Edge middlewares entirely.
  // (SSR/API can still use Local creds; no crash in Edge runtime.)
  if (!scConfig.api?.edge?.contextId) {
    console.log('Middleware: Skipped - No edge contextId');
    return NextResponse.next();
  }

  // Instantiate AFTER the guard so constructors don't run in local-only mode
  const multisite = new MultisiteMiddleware({
    /**
     * List of sites for site resolver to work with
     */
    sites,
    ...scConfig.api.edge,
    ...scConfig.multisite,
    // This function determines if the middleware should be turned off on per-request basis.
    // Certain paths are ignored by default (e.g. files and Next.js API routes), but you may wish to disable more.
    // This is an important performance consideration since Next.js Edge middleware runs on every request.
    skip: () => false,
  });

  const edgeConfigRedirects = new EdgeConfigRedirectMiddleware({
    /**
     * List of sites for site resolver to work with
     */
    sites,
    ...scConfig.api.edge,
    ...scConfig.redirects,
    // This function determines if the middleware should be turned off on per-request basis.
    // Certain paths are ignored by default (e.g. files and Next.js API routes), but you may wish to disable more.
    // By default it is disabled while in development mode.
    // This is an important performance consideration since Next.js Edge middleware runs on every request.
    skip: () => false,
    enabled: true,
    locales: ['en', 'da', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'th', 'pt', 'zh-Hans', 'zh-Hant'],
  });

  const sitecoreAiRedirects = new RedirectsMiddleware({
    /**
     * List of sites for site resolver to work with
     */
    sites,
    ...scConfig.api.edge,
    ...scConfig.redirects,
    // This function determines if the middleware should be turned off on per-request basis.
    // Certain paths are ignored by default (e.g. files and Next.js API routes), but you may wish to disable more.
    // By default it is disabled while in development mode.
    // This is an important performance consideration since Next.js Edge middleware runs on every request.
    skip: () => false,
    locales: ['en', 'da', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'th', 'pt', 'zh-Hans', 'zh-Hant'],
  });

  const personalize = new PersonalizeMiddleware({
    /**
     * List of sites for site resolver to work with
     */
    sites,
    ...scConfig.api.edge,
    ...scConfig.personalize,
    // This function determines if the middleware should be turned off on per-request basis.
    // Certain paths are ignored by default (e.g. files and Next.js API routes), but you may wish to disable more.
    // By default it is disabled while in development mode.
    // This is an important performance consideration since Next.js Edge middleware runs on every request
    skip: () => false,
  });

  const defaultLocale = new DefaultLocaleMiddleware({
    sites,
    ...scConfig.api.edge,
    // This function determines if the middleware should be turned off on per-request basis.
    // Certain paths are ignored by default (e.g. files and Next.js API routes), but you may wish to disable more.
    // By default it is disabled while in development mode.
    // This is an important performance consideration since Next.js Edge middleware runs on every request
    skip: () => false,
    sitesLanguagesMatrix: sitesLanguagesMatrix as SitesLanguagesMatrix,
  });

  return defineMiddleware(
    multisite,
    EdgeConfigRedirectsEnabled ? edgeConfigRedirects : sitecoreAiRedirects,
    defaultLocale,
    personalize,
    cspMiddleware
  ).exec(req, ev);
}

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
  ],
};