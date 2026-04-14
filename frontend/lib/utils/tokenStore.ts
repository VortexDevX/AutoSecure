'use client';

import { STORAGE_KEYS } from './constants';

/**
 * Token store with sessionStorage persistence.
 *
 * The access token is kept for the lifetime of the current browser tab so
 * refreshes and client navigations preserve auth, but closing the tab clears it.
 */

const TOKEN_KEY = STORAGE_KEYS.SESSION_ACCESS_TOKEN;

let accessToken: string | null = null;

// Bootstrap from sessionStorage on first import
if (typeof window !== 'undefined') {
  accessToken = sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Get the current access token
 */
export function getToken(): string | null {
  return accessToken;
}

/**
 * Set the access token (memory + sessionStorage)
 */
export function setToken(token: string | null): void {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }
}

/**
 * Clear the access token
 */
export function clearToken(): void {
  accessToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Check if an access token exists
 */
export function hasToken(): boolean {
  return accessToken !== null;
}
