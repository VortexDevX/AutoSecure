'use client';

/**
 * Token store with localStorage persistence.
 *
 * In a web browser we would keep the token in memory only to prevent XSS.
 * In the Electron desktop context there is no third-party code injection
 * risk, and the `app://` protocol cannot send httpOnly cookies to the
 * backend on `localhost`, so we persist the access token in localStorage
 * so it survives client-side navigations and component re-mounts.
 */

const TOKEN_KEY = '__autosecure_at';

let accessToken: string | null = null;

// Bootstrap from localStorage on first import
if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem(TOKEN_KEY);
}

/**
 * Get the current access token
 */
export function getToken(): string | null {
  return accessToken;
}

/**
 * Set the access token (memory + localStorage)
 */
export function setToken(token: string | null): void {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}

/**
 * Clear the access token
 */
export function clearToken(): void {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Check if an access token exists
 */
export function hasToken(): boolean {
  return accessToken !== null;
}

