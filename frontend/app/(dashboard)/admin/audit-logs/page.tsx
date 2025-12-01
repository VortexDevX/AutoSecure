'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRequireAdmin } from '@/lib/hooks/useRequireRole';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { Card, CardBody } from '@/components/ui/Card';
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
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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

  // State
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
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [issueDate, setIssueDate] = useState<Date | null>(null);

  // Filters
  const [filters, setFilters] = useState<GetAuditLogsParams>({
    page: 1,
    limit: 20,
    action: 'all',
    resource_type: 'all',
    start_date: '',
    end_date: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    if (!isAuthorized) return;

    try {
      setIsLoading(true);
      const result = await getAuditLogs(filters);
      setLogs(result.logs);
      setPagination(result.pagination);
    } catch (error: any) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [filters, isAuthorized]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!isAuthorized) return;

    try {
      setIsLoadingStats(true);
      const result = await getAuditLogStats(7);
      setStats(result);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [isAuthorized]);

  // Initial load
  useEffect(() => {
    if (isAuthorized) {
      fetchLogs();
      fetchStats();
    }
  }, [isAuthorized]);

  // Fetch logs when filters change
  useEffect(() => {
    if (isAuthorized) {
      fetchLogs();
    }
  }, [filters, fetchLogs]);

  // Handlers
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
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

  const handleRefresh = () => {
    fetchLogs();
    fetchStats();
  };

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
  };

  const hasActiveFilters =
    filters.action !== 'all' ||
    filters.resource_type !== 'all' ||
    filters.start_date ||
    filters.end_date ||
    filters.search;

  // Format details for display
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <AccessDenied message="Only administrators and owners can view audit logs." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">View system activity and user actions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleRefresh} disabled={isLoading}>
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && <span className="ml-2 w-2 h-2 bg-white rounded-full" />}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Logs (7d)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_logs}</p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardBody>
          </Card>

          {stats.by_action.slice(0, 3).map((item) => (
            <Card key={item.action}>
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {ACTION_LABELS[item.action as AuditAction] || item.action}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${ACTION_COLORS[item.action as AuditAction]?.bg || 'bg-gray-100'}`}
                  >
                    <ClipboardDocumentListIcon
                      className={`w-5 h-5 ${ACTION_COLORS[item.action as AuditAction]?.text || 'text-gray-600'}`}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="label">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by resource ID..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>

              {/* Action Filter */}
              <div>
                <label className="label">Action</label>
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
              </div>

              {/* Resource Type Filter */}
              <div>
                <label className="label">Resource Type</label>
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
              </div>

              {/* Date Range */}
              <div className="lg:col-span-2">
                <label className="label">Date Range</label>
                <div className="flex gap-2">
                  <SingleDatePicker
                    value={filters.start_date ? new Date(filters.start_date) : null}
                    onChange={(date) =>
                      handleFilterChange('start_date', date ? date.toISOString() : '')
                    }
                    placeholder="Select Start date"
                  />
                  <SingleDatePicker
                    value={filters.end_date ? new Date(filters.end_date) : null}
                    onChange={(date) =>
                      handleFilterChange('end_date', date ? date.toISOString() : '')
                    }
                    placeholder="Select End date"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Logs Table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found</p>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={handleClearFilters} className="mt-4">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => handleRowClick(log)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {log.user.full_name || log.user.email.split('@')[0]}
                              </p>
                              <p className="text-xs text-gray-500">{log.user.role}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ACTION_COLORS[log.action]?.bg || 'bg-gray-100'
                          } ${ACTION_COLORS[log.action]?.text || 'text-gray-700'}`}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.resource_type ? (
                          <div>
                            <p className="text-sm text-gray-900">
                              {RESOURCE_LABELS[log.resource_type] || log.resource_type}
                            </p>
                            {log.resource_id && (
                              <p className="text-xs text-gray-500 font-mono truncate max-w-[150px]">
                                {log.resource_id}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 truncate max-w-[250px]">
                          {formatDetails(log.details)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} logs
              </p>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
                itemsPerPage={0}
                onItemsPerPageChange={function (limit: number): void {
                  throw new Error('Function not implemented.');
                }}
                totalItems={0}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Timestamp</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
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
                <label className="text-xs text-gray-500 uppercase tracking-wider">Action</label>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ACTION_COLORS[selectedLog.action]?.bg || 'bg-gray-100'
                    } ${ACTION_COLORS[selectedLog.action]?.text || 'text-gray-700'}`}
                  >
                    {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                  </span>
                </p>
              </div>
            </div>

            {/* User Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="text-xs text-gray-500 uppercase tracking-wider">User</label>
              {selectedLog.user ? (
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedLog.user.email}</p>
                    <p className="text-sm text-gray-500">
                      {selectedLog.user.full_name || 'No name'} • {selectedLog.user.role}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 mt-2">System</p>
              )}
            </div>

            {/* Resource Info */}
            {selectedLog.resource_type && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Resource</label>
                <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">
                      {RESOURCE_LABELS[selectedLog.resource_type] || selectedLog.resource_type}
                    </span>
                    {selectedLog.resource_id && (
                      <span className="text-gray-600 ml-2 font-mono text-xs">
                        ID: {selectedLog.resource_id}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Details */}
            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Details</label>
                <pre className="mt-1 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}

            {/* Log ID */}
            <div className="pt-4 border-t border-gray-200">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Log ID</label>
              <p className="text-xs font-mono text-gray-500 mt-1">{selectedLog.id}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
