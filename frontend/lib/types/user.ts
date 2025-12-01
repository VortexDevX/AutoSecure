export type UserRole = 'owner' | 'admin' | 'user';

export interface User {
  id: string; // ✅ Changed from _id
  email: string;
  role: UserRole;
  full_name?: string;
  active: boolean;
  totp_enabled?: boolean;
  totp_verified?: boolean;
  created_at?: string; // ✅ Changed from createdAt
}

export interface AuthResponse {
  user?: User;
  accessToken?: string; // ✅ Changed from access_token
  access_token?: string; // Keep both for compatibility
  totp_required?: boolean;
  totp_setup_required?: boolean;
  totp_qr_code?: string;
  totp_secret?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TOTPVerification {
  email: string;
  totp_code: string;
}
