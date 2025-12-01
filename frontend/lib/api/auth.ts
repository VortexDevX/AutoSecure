import apiClient, { getErrorMessage } from './client';
import { ApiResponse } from '../types/api';
import { LoginCredentials, TOTPVerification, AuthResponse, User } from '../types/user';

export const authApi = {
  /**
   * Login - Step 1: Email + Password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/api/v1/auth/login',
        credentials
      );

      const data = response.data.data || response.data;
      return data as AuthResponse;
    } catch (error: any) {
      // ✅ IMPROVED: Extract specific error messages
      const message = error?.response?.data?.message || getErrorMessage(error);

      // ✅ Map backend errors to user-friendly messages
      if (
        message.includes('Invalid credentials') ||
        message.includes('Invalid email or password')
      ) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      if (
        message.includes('disabled') ||
        message.includes('deactivated') ||
        message.includes('inactive')
      ) {
        throw new Error(
          'Your account has been deactivated. Please contact the system administrator.'
        );
      }
      if (message.includes('not found')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }

      throw new Error(message || 'Login failed. Please try again.');
    }
  },

  /**
   * Login - Step 2: TOTP Verification
   */
  async verifyTOTP(verification: TOTPVerification): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/api/v1/auth/verify-totp',
        verification
      );

      const data = response.data.data || response.data;
      return data as AuthResponse;
    } catch (error: any) {
      // ✅ IMPROVED: Specific TOTP error messages
      const message = error?.response?.data?.message || getErrorMessage(error);

      if (message.includes('Invalid') || message.includes('incorrect')) {
        throw new Error('Invalid TOTP code. Please check your authenticator app and try again.');
      }
      if (message.includes('expired')) {
        throw new Error('TOTP code expired. Please generate a new code.');
      }

      throw new Error(message || 'TOTP verification failed. Please try again.');
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
};
