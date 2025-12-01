'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import { authApi } from '../api/auth';
import { useRouter } from 'next/navigation';
import { ROUTES, STORAGE_KEYS } from '../utils/constants';

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

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          // Verify token is still valid
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
          } catch (error) {
            // Token invalid, clear storage
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
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

      console.log('Login response in context:', response); // Debug log

      // Save email for TOTP step
      localStorage.setItem(STORAGE_KEYS.TOTP_EMAIL, email);

      // Check if TOTP setup is needed (first time)
      if (response.totp_setup_required && response.totp_qr_code) {
        sessionStorage.setItem(
          'totp_setup',
          JSON.stringify({
            secret: response.totp_secret,
            qr_code: response.totp_qr_code,
          })
        );
      }

      // Always requires TOTP
      return {
        requiresTOTP: true,
        totpSetup: response.totp_setup_required
          ? {
              secret: response.totp_secret || '',
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

      console.log('TOTP verification response:', response); // Debug log

      // Backend returns { data: { user: {...}, accessToken: "..." } }
      const accessToken = response.accessToken || response.access_token;
      const user = response.user;

      if (!accessToken) {
        console.error('No access token in response:', response);
        throw new Error('No access token received from server');
      }

      if (!user) {
        console.error('No user in response:', response);
        throw new Error('No user data received from server');
      }

      // Save token and user
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.removeItem(STORAGE_KEYS.TOTP_EMAIL);

      setUser(user);

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
      // Clear local storage
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
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
