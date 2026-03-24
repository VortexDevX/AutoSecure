'use client';

import { useParams } from 'next/navigation';

/**
 * Extract the dynamic [id] segment from the current URL pathname.
 * Pure React Next.js router implementation that guarantees 
 * synchronization with Soft Navigation transitions.
 */
export function useRouteId(): string {
  const params = useParams();

  if (!params || !params.id) {
    return '';
  }

  return params.id as string;
}
