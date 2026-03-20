'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import { authApi } from '../api/auth';
import { useRouter } from 'next/navigation';
import { ROUTES, STORAGE_KEYS } from '../utils/constants';
import { setToken, clearToken, hasToken } from '../utils/tokenStore';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ requiresTOTP: boolean; totpSetup?: any }>;
  verifyTOTP: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user on mount — recover auth state from localStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const savedToken = localStorage.getItem('__autosecure_at');

        // Ensure the in-memory token store is synced with localStorage
        if (savedToken) {
          setToken(savedToken);
        }

        if (savedUser && savedToken) {
          // Both user and token exist — restore session immediately
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);

          // Background verify: check if the token is still valid.
          // This is NON-DESTRUCTIVE: if verification fails due to a
          // network error or transient issue, we KEEP the cached user
          // instead of logging them out. Only clear on a definitive 401.
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
          } catch (error: any) {
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
              // Token is definitively expired/invalid
              clearToken();
              localStorage.removeItem(STORAGE_KEYS.USER);
              localStorage.removeItem('__autosecure_at');
              setUser(null);
            }
            // For network errors, timeouts, 500s etc. — keep the cached user
            // The user can still interact; API calls will fail individually
          }
        } else {
          // No saved session
          clearToken();
          localStorage.removeItem(STORAGE_KEYS.USER);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authApi.login({ email, password });

    if (!result.success || !result.data) {
      const errorMsg = result.error || 'Login failed';
      console.warn('Login failed:', errorMsg);
      throw new Error(errorMsg);
    }

    const response = result.data;

    // Save email for TOTP step
    localStorage.setItem(STORAGE_KEYS.TOTP_EMAIL, email);

    // Check if TOTP setup is needed (first time)
    if (response.totp_setup_required && response.totp_qr_code) {
      sessionStorage.setItem(
        'totp_setup',
        JSON.stringify({
          qr_code: response.totp_qr_code,
        })
      );
    }

    // Always requires TOTP
    return {
      requiresTOTP: true,
      totpSetup: response.totp_setup_required
        ? {
            qr_code: response.totp_qr_code || '',
          }
        : undefined,
    };
  };

  const verifyTOTP = async (email: string, code: string) => {
    const result = await authApi.verifyTOTP({ email, totp_code: code });

    if (!result.success || !result.data) {
      const errorMsg = result.error || 'TOTP verification failed';
      console.warn('TOTP verification failed:', errorMsg);
      throw new Error(errorMsg);
    }

    const response = result.data;

    const accessToken = response.accessToken || response.access_token;
    const userData = response.user;

    if (!accessToken) {
      throw new Error('No access token received from server');
    }

    if (!userData) {
      throw new Error('No user data received from server');
    }

    // Save token in memory (not localStorage) for XSS protection
    setToken(accessToken);

    // Save user data in localStorage (non-sensitive, for UX)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    localStorage.removeItem(STORAGE_KEYS.TOTP_EMAIL);

    setUser(userData);

    // Clear TOTP setup data
    sessionStorage.removeItem('totp_setup');

    // Redirect to dashboard
    router.push(ROUTES.DASHBOARD);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token from memory
      clearToken();

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOTP_EMAIL);
      sessionStorage.removeItem('totp_setup');

      setUser(null);

      // Redirect to login
      router.push(ROUTES.LOGIN);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, logout
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        verifyTOTP,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
