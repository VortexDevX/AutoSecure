'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { deleteLicense, getLicenses } from '@/lib/api/licenses';
import { LicenseRecord } from '@/lib/types/license';
import { useAuth } from '@/lib/hooks/useAuth';
import { LicenseTable } from '@/components/licenses/LicenseTable';
import { LicenseFilters } from '@/components/licenses/LicenseFilters';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function LicensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [approved, setApproved] = useState(searchParams.get('approved') || '');
  const [facelessType, setFacelessType] = useState(searchParams.get('faceless_type') || '');
  const [expiringSoon, setExpiringSoon] = useState(searchParams.get('expiring_soon') === 'true');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchLicenses = useCallback(async () => {
    if (isAuthLoading || !user) return;

    try {
      setIsLoading(true);
      const params: Record<string, unknown> = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (search) params.search = search;
      if (approved) params.approved = approved === 'true';
      if (facelessType) params.faceless_type = facelessType;
      if (expiringSoon) params.expiring_soon = true;
      if (sortBy) params.sort_by = sortBy;
      if (sortOrder) params.sort_order = sortOrder;

      const data = await getLicenses(params as Parameters<typeof getLicenses>[0]);
      setLicenses(data.licenses);
      setPagination(data.pagination);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to fetch licenses');
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    approved,
    facelessType,
    expiringSoon,
    sortBy,
    sortOrder,
    isAuthLoading,
    user,
  ]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (approved) params.set('approved', approved);
    if (facelessType) params.set('faceless_type', facelessType);
    if (expiringSoon) params.set('expiring_soon', 'true');
    if (pagination.page > 1) params.set('page', pagination.page.toString());

    const queryString = params.toString();
    router.replace(`/licenses${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [search, approved, facelessType, expiringSoon, pagination.page, router]);

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
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this license record?')) return;

    try {
      await deleteLicense(id);
      toast.success('License deleted successfully');
      fetchLicenses();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to delete license');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setApproved('');
    setFacelessType('');
    setExpiringSoon(false);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const computedStats = useMemo(() => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 90);

    return {
      approvedCount: licenses.filter((license) => license.approved).length,
      pendingCount: licenses.filter((license) => !license.approved).length,
      expiringSoonCount: licenses.filter((license) => {
        const expiry = new Date(license.expiry_date);
        return expiry >= new Date() && expiry <= threshold;
      }).length,
      projectedFees: licenses.reduce((sum, license) => sum + (license.fee || 0), 0),
    };
  }, [licenses]);

  const summaryItems = [
    { label: 'Total', value: pagination.total },
    { label: 'Approved', value: computedStats.approvedCount },
    { label: 'Pending', value: computedStats.pendingCount },
    { label: 'Renewing', value: computedStats.expiringSoonCount },
    { label: 'Fees in view', value: `₹${computedStats.projectedFees.toLocaleString('en-IN')}` },
  ];

  return (
    <div className="space-y-4">
      <section className="glass-panel-strong rounded-[22px] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="section-label">Licenses</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Driving licenses
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track approvals, expiry dates, and fees.
            </p>
          </div>

          <Link href="/licenses/new" className="shrink-0">
            <Button>
              <PlusIcon className="h-4 w-4" />
              New License
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
        <LicenseFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          approved={approved}
          onApprovedChange={(value) => {
            setApproved(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          facelessType={facelessType}
          onFacelessTypeChange={(value) => {
            setFacelessType(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          expiringSoon={expiringSoon}
          onExpiringSoonChange={(value) => {
            setExpiringSoon(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          onClear={handleClearFilters}
        />
      </div>

      <section className="space-y-4">
        <div className="glass-panel rounded-[20px] px-4 py-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900">
                {pagination.total} license records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review approvals, track expiry, and keep the daily queue moving.
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
            <LicenseTable
              licenses={licenses}
              onDelete={handleDelete}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />

            {pagination && (
              <div className="glass-panel rounded-[22px] p-4">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={(nextPage) => setPagination((prev) => ({ ...prev, page: nextPage }))}
                  itemsPerPage={pagination.limit}
                  onItemsPerPageChange={(nextLimit) => {
                    setPagination((prev) => ({ ...prev, limit: nextLimit, page: 1 }));
                  }}
                  totalItems={pagination.total}
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
