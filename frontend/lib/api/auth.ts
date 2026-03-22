import apiClient, { getErrorMessage } from './client';
import { ApiResponse } from '../types/api';
import { LoginCredentials, TOTPVerification, AuthResponse, User } from '../types/user';

export const authApi = {
  /**
   * Login - Step 1: Email + Password
   */
  async login(
    credentials: LoginCredentials
  ): Promise<{ success: boolean; data?: AuthResponse; error?: string }> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/api/v1/auth/login',
        credentials
      );

      const data = response.data.data || response.data;
      return { success: true, data: data as AuthResponse };
    } catch (error: any) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Login - Step 2: TOTP Verification
   */
  async verifyTOTP(
    verification: TOTPVerification
  ): Promise<{ success: boolean; data?: AuthResponse; error?: string }> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/api/v1/auth/verify-totp',
        verification
      );

      const data = response.data.data || response.data;
      return { success: true, data: data as AuthResponse };
    } catch (error: any) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>('/api/v1/auth/me');
      const data = response.data.data || response.data;

      if ((data as any).user) {
        return (data as any).user;
      }

      return data as User;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ access_token: string }> {
    try {
      const response =
        await apiClient.post<ApiResponse<{ access_token: string }>>('/api/v1/auth/refresh');
      const data = response.data.data || response.data;
      return data as { access_token: string };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Request password reset OTP
   */
  async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.post<ApiResponse<null>>('/api/v1/auth/forgot-password', {
        email,
      });
      const data = response.data;
      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Reset password with OTP
   */
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.post<ApiResponse<null>>('/api/v1/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      const data = response.data;
      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
