'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { getPolicyById } from '@/lib/api/policies';
import { usePolicies } from '@/lib/hooks/usePolicies';
import { Policy } from '@/lib/types/policy';
import { PolicyFilters } from '@/components/policies/PolicyFilters';
import { PolicyTable } from '@/components/policies/PolicyTable';
import { SendEmailModal } from '@/components/policies/SendEmailModal';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PlusIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

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
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isLoadingPolicy, setIsLoadingPolicy] = useState(false);
  const [monthNetPremium, setMonthNetPremium] = useState<number | null>(null);

  const { policies, pagination, isLoading, error, mutate } = usePolicies({
    page,
    limit,
    search,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...filters,
  });

  useEffect(() => {
    let mounted = true;
    const fetchOverview = async () => {
      try {
        const res = await apiClient.get('/api/v1/analytics/overview');
        const value = res?.data?.data?.financial?.month_net_premium;
        const parsed = value === undefined || value === null ? null : Number(value);

        if (!mounted) return;
        if (parsed !== null && !Number.isNaN(parsed)) setMonthNetPremium(parsed);
        else if (value === null || value === undefined) setMonthNetPremium(null);
        else setMonthNetPremium(0);
      } catch {
        if (mounted) setMonthNetPremium(null);
      }
    };

    fetchOverview();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') {
        setSortBy('createdAt');
        setSortOrder('desc');
      }
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const stats = useMemo(() => {
    const totalPremium =
      monthNetPremium !== null
        ? monthNetPremium
        : policies.reduce((sum: number, policy) => {
            const createdDate = policy.created_at ? new Date(policy.created_at) : null;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            if (createdDate && createdDate >= startOfMonth) return sum + (policy.net_premium || 0);
            return sum;
          }, 0);

    return {
      total: pagination?.total || 0,
      completed: policies.filter((policy) => policy.ins_status === 'policy_done').length,
      pending: policies.filter((policy) => policy.ins_status === 'policy_pending').length,
      paymentPending: policies.filter((policy) => policy.customer_payment_status === 'pending').length,
      totalPremium,
    };
  }, [monthNetPremium, pagination?.total, policies]);

  const summaryItems = [
    { label: 'Total', value: stats.total },
    { label: 'Done', value: stats.completed },
    { label: 'Pending', value: stats.pending },
    { label: 'Payment pending', value: stats.paymentPending },
    {
      label: 'Month net premium',
      value: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(stats.totalPremium),
    },
  ];

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
    } catch (deleteError: any) {
      toast.error(deleteError?.response?.data?.message || 'Failed to delete policy');
    }
  };

  const handleSendEmail = async (id: string) => {
    setShowEmailModal(true);
    setSelectedPolicy(null);
    setIsLoadingPolicy(true);
    try {
      const policy = await getPolicyById(id);
      setSelectedPolicy(policy);
    } catch {
      toast.error('Failed to load policy details');
    } finally {
      setIsLoadingPolicy(false);
    }
  };

  if (error) {
    return (
      <div className="glass-panel mx-auto max-w-6xl rounded-[24px] p-8 text-center">
        <ExclamationCircleIcon className="mx-auto h-10 w-10 text-rose-400" />
        <p className="mt-3 text-lg font-semibold text-rose-900">Failed to load policies</p>
        <p className="mt-1 text-sm text-rose-700">{error}</p>
        <Button variant="secondary" onClick={() => mutate()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="glass-panel-strong rounded-[22px] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="section-label">Policies</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Insurance policies
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Create policies, review status, and track payments.
            </p>
          </div>

          <Link href="/policies/new" className="shrink-0">
            <Button variant="primary">
              <PlusIcon className="h-4 w-4" />
              New Policy
            </Button>
          </Link>
        </div>

        <div className="mt-4 grid gap-4 border-t border-stone-200/80 pt-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryItems.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky top-[5.25rem] z-20">
        <PolicyFilters
          onSearch={handleSearch}
          onFilter={handleFilter}
          onClear={handleClear}
          currentSearch={search}
          currentFilters={filters}
        />
      </div>

      <section className="space-y-4">
        <div className="glass-panel rounded-[20px] px-4 py-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900">
                {pagination?.total || 0} policy records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search records, update details, and send follow-ups.
              </p>
            </div>
            <div className="text-xs font-medium text-slate-500">
              Sorted by {sortBy} • {sortOrder}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="glass-panel rounded-[24px] py-14">
            <div className="flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          </div>
        ) : (
          <>
            <PolicyTable
              policies={policies}
              onDelete={handleDelete}
              onSendEmail={handleSendEmail}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />

            {pagination && (
              <div className="glass-panel rounded-[22px] p-4">
                <Pagination
                  currentPage={page}
                  totalPages={pagination.totalPages}
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
      </section>
      <SendEmailModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setSelectedPolicy(null);
          setIsLoadingPolicy(false);
        }}
        policy={selectedPolicy}
        isLoading={isLoadingPolicy}
      />
    </div>
  );
}
