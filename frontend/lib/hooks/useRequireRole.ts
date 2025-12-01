'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

type Role = 'owner' | 'admin' | 'user';

interface UseRequireRoleOptions {
  allowedRoles: Role[];
  redirectTo?: string;
  showToast?: boolean;
}

/**
 * Hook to enforce role-based access control
 * Redirects unauthorized users to dashboard with optional toast message
 */
export function useRequireRole(options: UseRequireRoleOptions) {
  const { allowedRoles, redirectTo = '/dashboard', showToast = true } = options;
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAuthorized = user && allowedRoles.includes(user.role);
  const isCheckingAuth = isLoading || !user;

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // If no user, the dashboard layout will handle redirect to login
    if (!user) return;

    // Check role authorization
    if (!allowedRoles.includes(user.role)) {
      if (showToast) {
        toast.error('You do not have permission to access this page');
      }
      router.push(redirectTo);
    }
  }, [user, isLoading, allowedRoles, redirectTo, showToast, router]);

  return {
    isAuthorized,
    isCheckingAuth,
    user,
  };
}

/**
 * Pre-configured hooks for common role combinations
 */
export function useRequireOwner() {
  return useRequireRole({ allowedRoles: ['owner'] });
}

export function useRequireAdmin() {
  return useRequireRole({ allowedRoles: ['owner', 'admin'] });
}

export function useRequireAdminOrOwner() {
  return useRequireRole({ allowedRoles: ['owner', 'admin'] });
}
