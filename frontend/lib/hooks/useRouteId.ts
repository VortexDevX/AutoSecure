'use client';

import { usePathname } from 'next/navigation';

/**
 * Extract the dynamic [id] segment from the current URL pathname.
 *
 * In the Electron desktop app, Next.js static export pre-renders pages for
 * a single "dummy" param via generateStaticParams, and useParams() may
 * return "dummy" instead of the real ID when the route is loaded via
 * protocol fallback. This hook reads the actual browser URL via usePathname
 * to get the correct ID reactively regardless of how the HTML was served.
 *
 * Supports paths like:
 *   /policies/abc123       → "abc123"
 *   /policies/abc123/edit  → "abc123"
 *   /licenses/xyz789       → "xyz789"
 *   /licenses/xyz789/edit  → "xyz789"
 */
export function useRouteId(): string {
  const pathname = usePathname();
  
  // Provide defensive fallback for server-side initialization
  if (!pathname && typeof window === 'undefined') return '';
  
  // Always prioritize genuine browser path string during client-side hydration or transitions
  const activePath = typeof window !== 'undefined' ? window.location.pathname : pathname;
  
  const segments = (activePath || '').split('/').filter(Boolean);
  return segments[1] || '';
}
