export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'site_toggle'
  | 'role_change';

export type ResourceType = 'policy' | 'meta' | 'user' | 'site_settings';

export interface AuditLogUser {
  id: string;
  email: string;
  full_name?: string;
  role: 'owner' | 'admin' | 'user';
}

export interface AuditLog {
  id: string;
  user: AuditLogUser | null;
  action: AuditAction;
  resource_type?: ResourceType;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogFilters {
  action?: AuditAction | 'all';
  resource_type?: ResourceType | 'all';
  user_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

export interface AuditLogsResponse {
  success: boolean;
  data: {
    logs: AuditLog[];
    pagination: AuditLogPagination;
  };
}

export interface AuditLogStatsResponse {
  success: boolean;
  data: {
    period_days: number;
    total_logs: number;
    by_action: Array<{ action: string; count: number }>;
    by_resource: Array<{ resource_type: string; count: number }>;
    daily_activity: Array<{ date: string; count: number }>;
  };
}

// Display helpers
export const ACTION_LABELS: Record<AuditAction, string> = {
  login: 'Login',
  logout: 'Logout',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  export: 'Export',
  site_toggle: 'Site Toggle',
  role_change: 'Role Change',
};

export const ACTION_COLORS: Record<AuditAction, { bg: string; text: string }> = {
  login: { bg: 'bg-blue-100', text: 'text-blue-700' },
  logout: { bg: 'bg-gray-100', text: 'text-gray-700' },
  create: { bg: 'bg-green-100', text: 'text-green-700' },
  update: { bg: 'bg-amber-100', text: 'text-amber-700' },
  delete: { bg: 'bg-red-100', text: 'text-red-700' },
  export: { bg: 'bg-purple-100', text: 'text-purple-700' },
  site_toggle: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  role_change: { bg: 'bg-pink-100', text: 'text-pink-700' },
};

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  policy: 'Policy',
  meta: 'Meta',
  user: 'User',
  site_settings: 'Site Settings',
};
