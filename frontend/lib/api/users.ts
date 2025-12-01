import apiClient from './client';
import { User, UserRole } from '@/lib/types/user';

export interface CreateUserData {
  email: string;
  password: string;
  full_name?: string;
  role: UserRole;
}

/**
 * Get all users
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get('/api/v1/users');
  const backendUsers = response.data.data.users;

  return backendUsers.map((u: any) => ({
    id: u.id, // ✅ FIXED: Backend sends "id", not "_id"
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    active: u.active,
    totp_enabled: u.totp_enabled,
    created_at: u.created_at, // ✅ FIXED: Backend sends "created_at", not "createdAt"
  }));
};

/**
 * Create new user
 */
export const createUser = async (data: CreateUserData): Promise<User> => {
  const response = await apiClient.post('/api/v1/users', data);
  const u = response.data.data.user;

  return {
    id: u.id, // ✅ FIXED
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    active: u.active,
    totp_enabled: u.totp_enabled,
    created_at: u.created_at, // ✅ FIXED
  };
};

/**
 * Update user role (Owner only)
 */
export const updateUserRole = async (userId: string, role: UserRole): Promise<User> => {
  const response = await apiClient.patch(`/api/v1/users/${userId}/role`, { role });
  const u = response.data.data.user;

  return {
    id: u.id, // ✅ FIXED
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    active: u.active,
    totp_enabled: u.totp_enabled,
    created_at: u.created_at, // ✅ FIXED
  };
};

/**
 * Update user status (Admin)
 */
export const updateUserStatus = async (userId: string, active: boolean): Promise<User> => {
  const response = await apiClient.patch(`/api/v1/users/${userId}/status`, { active });
  const u = response.data.data.user;

  return {
    id: u.id, // ✅ FIXED
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    active: u.active,
    totp_enabled: u.totp_enabled,
    created_at: u.created_at, // ✅ FIXED
  };
};

/**
 * Delete user (Owner only)
 */
export const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/api/v1/users/${userId}`);
};
