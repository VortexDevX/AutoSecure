'use client';

import { useMemo } from 'react';

/**
 * Extract the dynamic [id] segment from the current URL pathname.
 *
 * In the Electron desktop app, Next.js static export pre-renders pages for
 * a single "dummy" param via generateStaticParams, and useParams() may
 * return "dummy" instead of the real ID when the route is loaded via
 * protocol fallback. This hook reads the actual browser URL to get the
 * correct ID regardless of how the HTML was served.
 *
 * Supports paths like:
 *   /policies/abc123       → "abc123"
 *   /policies/abc123/edit  → "abc123"
 *   /licenses/xyz789       → "xyz789"
 *   /licenses/xyz789/edit  → "xyz789"
 */
export function useRouteId(): string {
  return useMemo(() => {
    if (typeof window === 'undefined') return '';

    const pathname = window.location.pathname;
    // Split: ["", "policies", "abc123"] or ["", "policies", "abc123", "edit"]
    const segments = pathname.split('/').filter(Boolean);

    // The ID is always the second segment (index 1)
    // e.g. /policies/{id} or /licenses/{id} or /policies/{id}/edit
    return segments[1] || '';
  }, []);
}
