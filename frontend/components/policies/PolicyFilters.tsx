'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePolicyFormMeta } from '@/lib/hooks/useMeta';

interface PolicyFiltersProps {
  onSearch: (search: string) => void;
  onFilter: (filters: {
    ins_status?: string;
    customer_payment_status?: string;
    branch_id?: string;
  }) => void;
  onClear: () => void;
  currentSearch?: string;
  currentFilters?: {
    ins_status?: string;
    customer_payment_status?: string;
    branch_id?: string;
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
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(currentFilters);

  const { insStatuses, branches, isLoading } = usePolicyFormMeta();

  // Sync with parent state
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentSearch) {
        onSearch(searchValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, currentSearch, onSearch]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = {
      ...localFilters,
      [key]: value || undefined,
    };
    setLocalFilters(newFilters);
    onFilter(newFilters);
  };

  const handleClear = () => {
    setSearchValue('');
    setLocalFilters({});
    onClear();
  };

  const activeFilterCount = Object.values(localFilters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by policy no, customer, vehicle, email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {searchValue && (
            <button
              onClick={() => {
                setSearchValue('');
                onSearch('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium transition-colors
            ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span
              className={`
              w-5 h-5 rounded-full text-xs flex items-center justify-center
              ${showFilters ? 'bg-white text-primary' : 'bg-primary text-white'}
            `}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear All Button */}
        {(searchValue || activeFilterCount > 0) && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium"
          >
            <XMarkIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {/* Policy Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Policy Status</label>
            <select
              value={localFilters.ins_status || ''}
              onChange={(e) => handleFilterChange('ins_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={isLoading}
            >
              <option value="">All Statuses</option>
              {insStatuses.map((status) => (
                <option key={String(status.id)} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
            <select
              value={localFilters.customer_payment_status || ''}
              onChange={(e) => handleFilterChange('customer_payment_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">All Payments</option>
              <option value="done">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch</label>
            <select
              value={localFilters.branch_id || ''}
              onChange={(e) => handleFilterChange('branch_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={isLoading}
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={String(branch.id)} value={branch.value}>
                  {branch.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Tags */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {localFilters.ins_status && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              Status:{' '}
              {insStatuses.find((s) => s.value === localFilters.ins_status)?.label ||
                localFilters.ins_status}
              <button
                onClick={() => handleFilterChange('ins_status', '')}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {localFilters.customer_payment_status && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              Payment: {localFilters.customer_payment_status === 'done' ? 'Paid' : 'Pending'}
              <button
                onClick={() => handleFilterChange('customer_payment_status', '')}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {localFilters.branch_id && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              Branch:{' '}
              {branches.find((b) => b.value === localFilters.branch_id)?.label ||
                localFilters.branch_id}
              <button
                onClick={() => handleFilterChange('branch_id', '')}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
