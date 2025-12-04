'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLicenses } from '@/lib/api/licenses';
import { LicenseRecord } from '@/lib/types/license';
import { LicenseTable } from '@/components/licenses/LicenseTable';
import { LicenseFilters } from '@/components/licenses/LicenseFilters';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { deleteLicense } from '@/lib/api/licenses';

export default function LicensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [approved, setApproved] = useState(searchParams.get('approved') || '');
  const [facelessType, setFacelessType] = useState(searchParams.get('faceless_type') || '');
  const [expiringSoon, setExpiringSoon] = useState(searchParams.get('expiring_soon') === 'true');

  const fetchLicenses = useCallback(async () => {
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

      const data = await getLicenses(params as Parameters<typeof getLicenses>[0]);
      setLicenses(data.licenses);
      setPagination(data.pagination);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to fetch licenses');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, approved, facelessType, expiringSoon]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  // Update URL params
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

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleClearFilters = () => {
    setSearch('');
    setApproved('');
    setFacelessType('');
    setExpiringSoon(false);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Licenses</h1>
          <p className="text-gray-600 mt-1">
            Manage driving license records ({pagination.total} total)
          </p>
        </div>
        <Link href="/licenses/new">
          <Button>
            <PlusIcon className="w-5 h-5 mr-2" />
            New License
          </Button>
        </Link>
      </div>

      {/* Filters */}
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

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <LicenseTable licenses={licenses} onDelete={handleDelete} />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
                itemsPerPage={0}
                onItemsPerPageChange={function (limit: number): void {
                  throw new Error('Function not implemented.');
                }}
                totalItems={0}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
