'use client';

import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePolicyFormMeta } from '@/lib/hooks/useMeta';

interface PolicyFiltersProps {
  onSearch: (search: string) => void;
  onFilter: (filters: {
    ins_status?: string;
    customer_payment_status?: string;
    branch_id?: string;
    expiring_soon?: boolean;
  }) => void;
  onClear: () => void;
  currentSearch?: string;
  currentFilters?: {
    ins_status?: string;
    customer_payment_status?: string;
    branch_id?: string;
    expiring_soon?: boolean;
  };
}

export function PolicyFilters({
  onSearch,
  onFilter,
  onClear,
  currentSearch = '',
  currentFilters = {},
}: PolicyFiltersProps) {
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [localFilters, setLocalFilters] = useState(currentFilters);
  const { insStatuses, branches, isLoading } = usePolicyFormMeta();

  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentSearch) {
        onSearch(searchValue);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchValue, currentSearch, onSearch]);

  const handleFilterChange = (key: string, value: string) => {
    const nextFilters = {
      ...localFilters,
      [key]: value || undefined,
    };
    setLocalFilters(nextFilters);
    onFilter(nextFilters);
  };

  const handleClear = () => {
    setSearchValue('');
    setLocalFilters({});
    onClear();
  };

  const activeFilterCount =
    Number(Boolean(searchValue)) + Object.values(localFilters).filter(Boolean).length;

  return (
    <div className="glass-panel rounded-[20px] px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-[1.35]">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search policy no, customer, vehicle, email"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="input h-10 rounded-full pl-10 pr-10"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue('');
                onSearch('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            value={localFilters.ins_status || ''}
            onChange={(e) => handleFilterChange('ins_status', e.target.value)}
            className="input h-10"
            disabled={isLoading}
            aria-label="Policy status"
          >
            <option value="">All policy status</option>
            {insStatuses.map((status) => (
              <option key={String(status.id)} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={localFilters.customer_payment_status || ''}
            onChange={(e) => handleFilterChange('customer_payment_status', e.target.value)}
            className="input h-10"
            aria-label="Payment status"
          >
            <option value="">All payment status</option>
            <option value="done">Paid</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={localFilters.branch_id || ''}
            onChange={(e) => handleFilterChange('branch_id', e.target.value)}
            className="input h-10"
            disabled={isLoading}
            aria-label="Branch"
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={String(branch.id)} value={branch.value}>
                {branch.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 xl:self-stretch">
          {activeFilterCount > 0 && (
            <span className="rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {activeFilterCount}
            </span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-secondary h-10 shrink-0 px-4"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
