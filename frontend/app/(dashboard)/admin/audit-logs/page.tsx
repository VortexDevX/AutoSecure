'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useRequireAdmin } from '@/lib/hooks/useRequireRole';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { SingleDatePicker } from '@/components/ui/DatePicker';
import { getAuditLogs, getAuditLogStats, GetAuditLogsParams } from '@/lib/api/auditLogs';
import {
  AuditLog,
  AuditAction,
  ResourceType,
  ACTION_LABELS,
  ACTION_COLORS,
  RESOURCE_LABELS,
  AuditLogStatsResponse,
} from '@/lib/types/auditLog';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const ACTIONS: Array<{ value: AuditAction | 'all'; label: string }> = [
  { value: 'all', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'export', label: 'Export' },
  { value: 'site_toggle', label: 'Site Toggle' },
  { value: 'role_change', label: 'Role Change' },
];

const RESOURCE_TYPES: Array<{ value: ResourceType | 'all'; label: string }> = [
  { value: 'all', label: 'All Resources' },
  { value: 'policy', label: 'Policy' },
  { value: 'user', label: 'User' },
  { value: 'meta', label: 'Meta' },
  { value: 'site_settings', label: 'Site Settings' },
];

export default function AuditLogsPage() {
  const { isAuthorized, isCheckingAuth } = useRequireAdmin();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
    has_next_page: false,
    has_previous_page: false,
  });
  const [stats, setStats] = useState<AuditLogStatsResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState<GetAuditLogsParams>({
    page: 1,
    limit: 20,
    action: 'all',
    resource_type: 'all',
    start_date: '',
    end_date: '',
    search: '',
  });

  const fetchLogs = useCallback(async () => {
    if (!isAuthorized) return;

    try {
      setIsLoading(true);
      const result = await getAuditLogs(filters);
      setLogs(result.logs);
      setPagination(result.pagination);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [filters, isAuthorized]);

  const fetchStats = useCallback(async () => {
    if (!isAuthorized) return;

    try {
      const result = await getAuditLogStats(7);
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      fetchLogs();
      fetchStats();
    }
  }, [isAuthorized, fetchLogs, fetchStats]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      action: 'all',
      resource_type: 'all',
      start_date: '',
      end_date: '',
      search: '',
    });
  };

  const hasActiveFilters =
    filters.action !== 'all' ||
    filters.resource_type !== 'all' ||
    filters.start_date ||
    filters.end_date ||
    filters.search;

  const formatDetails = (details?: Record<string, any>): string => {
    if (!details) return '-';
    const entries = Object.entries(details);
    if (entries.length === 0) return '-';
    return entries
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join(', ');
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <AccessDenied message="Only administrators and owners can view audit logs." />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
      <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <section className="glass-panel-strong rounded-[24px] px-4 py-4">
          <p className="section-label">Audit Monitor</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Audit logs
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Trace user actions, exports, and administrative events from a compact monitoring desk.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => { fetchLogs(); fetchStats(); }} className="w-full justify-center">
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </section>

        {stats && (
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-1">
            <div className="glass-panel rounded-[20px] p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-sky-100 text-sky-600">
                <ChartBarIcon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-900">
                {stats.total_logs}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Total (7d)
              </p>
            </div>

            {stats.by_action.slice(0, 3).map((item) => (
              <div key={item.action} className="glass-panel rounded-[20px] p-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-[12px] ${ACTION_COLORS[item.action as AuditAction]?.bg || 'bg-slate-100'}`}>
                  <ClipboardDocumentListIcon
                    className={`h-4 w-4 ${ACTION_COLORS[item.action as AuditAction]?.text || 'text-slate-600'}`}
                  />
                </div>
                <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-900">
                  {item.count}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {ACTION_LABELS[item.action as AuditAction] || item.action}
                </p>
              </div>
            ))}
          </section>
        )}

        <section className="glass-panel rounded-[22px] p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="section-label">Filters</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 transition hover:text-slate-900"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by resource ID"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10"
              />
            </div>

            <select
              value={filters.action || 'all'}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="input"
            >
              {ACTIONS.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>

            <select
              value={filters.resource_type || 'all'}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              className="input"
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <SingleDatePicker
              value={filters.start_date ? new Date(filters.start_date) : null}
              onChange={(date) => handleFilterChange('start_date', date ? date.toISOString() : '')}
              placeholder="Start date"
            />
            <SingleDatePicker
              value={filters.end_date ? new Date(filters.end_date) : null}
              onChange={(date) => handleFilterChange('end_date', date ? date.toISOString() : '')}
              placeholder="End date"
            />
          </div>
        </section>
      </aside>

      <section className="space-y-4">
        <div className="glass-panel rounded-[24px] px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="section-label">Activity Stream</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-900">
                {pagination.total} audit events
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Click a row to inspect the full event payload and user details.
              </p>
            </div>
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {filters.action !== 'all' && (
                  <span className="rounded-full border border-slate-200 bg-slate-50/90 px-2.5 py-1 text-[11px] text-slate-600">
                    Action: {filters.action}
                  </span>
                )}
                {filters.resource_type !== 'all' && (
                  <span className="rounded-full border border-slate-200 bg-slate-50/90 px-2.5 py-1 text-[11px] text-slate-600">
                    Resource: {filters.resource_type}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-[24px] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardDocumentListIcon className="mx-auto mb-4 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">No audit logs found for the current filters.</p>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={handleClearFilters} className="mt-4">
                  <XMarkIcon className="h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto px-4 py-4">
                <table className="w-full border-separate border-spacing-y-2.5 text-left text-sm">
                  <thead className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Timestamp</th>
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Action</th>
                      <th className="px-4 py-2">Resource</th>
                      <th className="px-4 py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="cursor-pointer transition hover:-translate-y-0.5"
                      >
                        <td className="rounded-l-[18px] border-y border-l border-white/70 bg-white/78 px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <CalendarIcon className="h-4 w-4" />
                            {new Date(log.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="border-y border-white/70 bg-white/78 px-4 py-3">
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                                <UserIcon className="h-4 w-4 text-slate-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {log.user.full_name || log.user.email.split('@')[0]}
                                </p>
                                <p className="text-xs text-slate-500">{log.user.role}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">System</span>
                          )}
                        </td>
                        <td className="border-y border-white/70 bg-white/78 px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                              ACTION_COLORS[log.action]?.bg || 'bg-slate-100'
                            } ${ACTION_COLORS[log.action]?.text || 'text-slate-700'}`}
                          >
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td className="border-y border-white/70 bg-white/78 px-4 py-3">
                          {log.resource_type ? (
                            <div>
                              <p className="text-sm text-slate-900">
                                {RESOURCE_LABELS[log.resource_type] || log.resource_type}
                              </p>
                              {log.resource_id && (
                                <p className="max-w-[180px] truncate font-mono text-xs text-slate-500">
                                  {log.resource_id}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="rounded-r-[18px] border-y border-r border-white/70 bg-white/78 px-4 py-3">
                          <p className="max-w-[320px] truncate text-sm text-slate-600">
                            {formatDetails(log.details)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {logs.length > 0 && (
                <div className="border-t border-slate-200/80 px-4 py-4">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.total_pages}
                    onPageChange={(nextPage) => handleFilterChange('page', nextPage)}
                    itemsPerPage={pagination.limit}
                    onItemsPerPageChange={(nextLimit) =>
                      setFilters((prev) => ({ ...prev, limit: nextLimit, page: 1 }))
                    }
                    totalItems={pagination.total}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Audit Log Details" size="lg">
        {selectedLog && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Timestamp</label>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(selectedLog.created_at).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <label className="label">Action</label>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      ACTION_COLORS[selectedLog.action]?.bg || 'bg-slate-100'
                    } ${ACTION_COLORS[selectedLog.action]?.text || 'text-slate-700'}`}
                  >
                    {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-[16px] border border-slate-200 bg-slate-50/90 p-4">
              <label className="label">User</label>
              {selectedLog.user ? (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <UserIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{selectedLog.user.email}</p>
                    <p className="text-sm text-slate-500">
                      {selectedLog.user.full_name || 'No name'} • {selectedLog.user.role}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-slate-400">System</p>
              )}
            </div>

            {selectedLog.resource_type && (
              <div>
                <label className="label">Resource</label>
                <div className="mt-1 rounded-[16px] border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm text-slate-800">
                  <span className="font-medium">
                    {RESOURCE_LABELS[selectedLog.resource_type] || selectedLog.resource_type}
                  </span>
                  {selectedLog.resource_id && (
                    <span className="ml-2 font-mono text-xs text-slate-500">
                      ID: {selectedLog.resource_id}
                    </span>
                  )}
                </div>
              </div>
            )}

            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <div>
                <label className="label">Details</label>
                <pre className="mt-1 max-h-56 overflow-auto rounded-[16px] bg-slate-900 px-4 py-3 text-xs text-slate-100">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <label className="label">Log ID</label>
              <p className="text-xs font-mono text-slate-500">{selectedLog.id}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
