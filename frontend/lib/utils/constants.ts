export const APP_NAME = 'AutoSecure';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  VERIFY_TOTP: '/verify-totp',

  // Dashboard
  DASHBOARD: '/dashboard',

  // Policies
  POLICIES: '/policies',
  POLICY_NEW: '/policies/new',
  POLICY_DETAIL: (id: string) => `/policies/${id}`,
  POLICY_EDIT: (id: string) => `/policies/${id}/edit`,

  // Admin
  ADMIN_META: '/admin/meta',
  ADMIN_USERS: '/admin/users',
  ADMIN_EMAIL_TEMPLATES: '/admin/email-templates',
  ADMIN_SETTINGS: '/admin/settings',

  // Other
  AUDIT_LOGS: '/audit-logs',
  EXPORTS: '/exports',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER: 'user',
  TOTP_EMAIL: 'totp_email',
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png'],
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100],
} as const;
