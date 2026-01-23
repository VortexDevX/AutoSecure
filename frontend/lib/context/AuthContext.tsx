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

  // Load user on mount - recover token via refresh if needed
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (savedUser) {
          // Set user from localStorage for immediate UI
          setUser(JSON.parse(savedUser));

          // If no token in memory, try to get one via refresh
          if (!hasToken()) {
            try {
              // Refresh token is in httpOnly cookie, this will recover access token
              const refreshResponse = await authApi.refreshToken();
              if (refreshResponse.access_token) {
                setToken(refreshResponse.access_token);
              }
            } catch (error) {
              // Refresh failed, clear user
              localStorage.removeItem(STORAGE_KEYS.USER);
              setUser(null);
              return;
            }
          }

          // Verify user is still valid
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
          } catch (error) {
            // Token invalid, clear everything
            clearToken();
            localStorage.removeItem(STORAGE_KEYS.USER);
            setUser(null);
          }
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
    try {
      const response = await authApi.login({ email, password });

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
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const verifyTOTP = async (email: string, code: string) => {
    try {
      const response = await authApi.verifyTOTP({ email, totp_code: code });

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
    } catch (error) {
      console.error('TOTP verification error:', error);
      throw error;
    }
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
