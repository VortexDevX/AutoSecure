'use client';

/**
 * In-memory token store for secure access token management.
 * Token is stored in memory only, not localStorage, to prevent XSS attacks.
 * Token is lost on page refresh - use refresh token (httpOnly cookie) to recover.
 */

let accessToken: string | null = null;

/**
 * Get the current access token from memory
 */
export function getToken(): string | null {
  return accessToken;
}

/**
 * Set the access token in memory
 */
export function setToken(token: string | null): void {
  accessToken = token;
}

/**
 * Clear the access token from memory
 */
export function clearToken(): void {
  accessToken = null;
}

/**
 * Check if an access token exists in memory
 */
export function hasToken(): boolean {
  return accessToken !== null;
}
