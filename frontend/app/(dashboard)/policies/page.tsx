// frontend/app/(dashboard)/policies/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePolicies } from '@/lib/hooks/usePolicies';
import { PolicyFilters } from '@/components/policies/PolicyFilters';
import { PolicyTable } from '@/components/policies/PolicyTable';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SendEmailModal } from '@/components/policies/SendEmailModal';
import { Policy } from '@/lib/types/policy';
import { getPolicyById } from '@/lib/api/policies';
import {
  PlusIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';

export default function PoliciesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{
    ins_status?: string;
    customer_payment_status?: string;
    branch_id?: string;
    expiring_soon?: boolean;
  }>({});

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isLoadingPolicy, setIsLoadingPolicy] = useState(false);

  const { policies, pagination, isLoading, error, mutate } = usePolicies({
    page,
    limit,
    search,
    ...filters,
  });

  // Running month's net premium from analytics endpoint (fallback to page calculation)
  const [monthNetPremium, setMonthNetPremium] = useState<number | null>(null);
  const [isLoadingMonthNetPremium, setIsLoadingMonthNetPremium] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchOverview = async () => {
      setIsLoadingMonthNetPremium(true);
      try {
        const res = await apiClient.get('/api/v1/analytics/overview');
        const value = res?.data?.data?.financial?.month_net_premium;

        // Accept numbers or numeric strings from the API
        const parsed = value === undefined || value === null ? null : Number(value);
        if (mounted) {
          if (parsed !== null && !Number.isNaN(parsed)) {
            setMonthNetPremium(parsed);
          } else if (value === null || value === undefined) {
            setMonthNetPremium(null);
          } else {
            // non-numeric value — treat as 0 to avoid showing NaN
            setMonthNetPremium(0);
          }
        }
      } catch (err) {
        // silently ignore — we'll fallback to computing from current page
        if (mounted) setMonthNetPremium(null);
      } finally {
        if (mounted) setIsLoadingMonthNetPremium(false);
      }
    };

    fetchOverview();
    return () => {
      mounted = false;
    };
  }, []);

  // Calculate quick stats from current page data
  interface Stats {
    total: number;
    completed: number;
    pending: number;
    paymentPending: number;
    totalPremium: number;
    expiringSoon: number;
  }

  const stats: Stats = {
    total: pagination?.total || 0,
    completed: policies.filter((p) => p.ins_status === 'policy_done').length,
    pending: policies.filter((p) => p.ins_status === 'policy_pending').length,
    paymentPending: policies.filter((p) => p.customer_payment_status === 'pending').length,
    // Use server-provided running month net_premium when available; otherwise compute from current page
    totalPremium:
      monthNetPremium !== null
        ? monthNetPremium
        : policies.reduce((sum: number, p) => {
            const createdDate = p.created_at ? new Date(p.created_at) : null;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            if (createdDate && createdDate >= startOfMonth) {
              return sum + (p.net_premium || 0);
            }
            return sum;
          }, 0),
    expiringSoon: policies.filter((p) => {
      const saodDate = p.saod_end_date ? new Date(p.saod_end_date) : null;
      const endDate = new Date(p.end_date);
      const expiryDate = saodDate || endDate;
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate >= new Date() && expiryDate <= thirtyDaysFromNow;
    }).length,
  };

  const handleSearch = (searchValue: string) => {
    setSearch(searchValue);
    setPage(1);
  };

  const handleFilter = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleClear = () => {
    setSearch('');
    setFilters({});
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this policy? This will create a backup before deletion.'
      )
    ) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/policies/${id}`);
      toast.success('Policy deleted successfully');
      mutate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete policy');
    }
  };

  const handleSendEmail = async (id: string) => {
    setIsLoadingPolicy(true);
    try {
      const policy = await getPolicyById(id);
      setSelectedPolicy(policy);
      setShowEmailModal(true);
    } catch (error) {
      toast.error('Failed to load policy details');
    } finally {
      setIsLoadingPolicy(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-red-800">Failed to load policies</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <Button variant="secondary" onClick={() => mutate()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insurance Policies</h1>
          <p className="text-gray-600 mt-1">Manage and track all your insurance policies</p>
        </div>
        <Link href="/policies/new">
          <Button
            variant="primary"
            size="lg"
            className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <PlusIcon className="w-5 h-5" />
            Create New Policy
          </Button>
        </Link>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Policies */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Policies</p>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
            </div>
          </div>
        </div>

        {/* Pending Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
            </div>
          </div>
        </div>

        {/* Payment Pending */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.paymentPending}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Payment Due</p>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Expiring Soon</p>
            </div>
          </div>
        </div>

        {/* Total Premium (This Page) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CurrencyRupeeIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {isLoadingMonthNetPremium ? (
                  <>
                    <Spinner size="sm" />
                    <span className="text-base font-medium">Fetching...</span>
                  </>
                ) : (
                  formatCurrency(stats.totalPremium)
                )}
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                This Month Net Premium
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <PolicyFilters
          onSearch={handleSearch}
          onFilter={handleFilter}
          onClear={handleClear}
          currentSearch={search}
          currentFilters={filters}
        />
      </div>

      {/* Results Info - REMOVED duplicate "Clear all filters" button */}
      {!isLoading && pagination && (
        <div className="text-sm text-gray-600">
          <p>
            Showing <span className="font-medium">{policies.length}</span> of{' '}
            <span className="font-medium">{pagination.total}</span> policies
            {search && (
              <span className="ml-1">
                for "<span className="font-medium text-primary">{search}</span>"
              </span>
            )}
          </p>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-gray-500 mt-4">Loading policies...</p>
        </div>
      ) : policies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No policies found</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {search || Object.keys(filters).length > 0
              ? "Try adjusting your search or filters to find what you're looking for."
              : 'Get started by creating your first insurance policy.'}
          </p>
          {!search && Object.keys(filters).length === 0 && (
            <Link href="/policies/new">
              <Button variant="primary" className="mt-6">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Your First Policy
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <PolicyTable policies={policies} onDelete={handleDelete} onSendEmail={handleSendEmail} />

          {/* Pagination */}
          {pagination && pagination.total > limit && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={setPage}
                itemsPerPage={limit}
                onItemsPerPageChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
                totalItems={pagination.total}
              />
            </div>
          )}
        </>
      )}

      {/* Email Modal */}
      {selectedPolicy && (
        <SendEmailModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setSelectedPolicy(null);
          }}
          policy={selectedPolicy}
          onSuccess={() => {
            toast.success('Email sent successfully!');
          }}
        />
      )}

      {/* Loading overlay for policy fetch */}
      {isLoadingPolicy && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <Spinner size="md" />
            <span className="text-gray-700">Loading policy...</span>
          </div>
        </div>
      )}
    </div>
  );
}
