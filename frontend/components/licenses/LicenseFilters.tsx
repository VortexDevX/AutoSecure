'use client';

import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface LicenseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  approved: string;
  onApprovedChange: (value: string) => void;
  facelessType: string;
  onFacelessTypeChange: (value: string) => void;
  expiringSoon: boolean;
  onExpiringSoonChange: (value: boolean) => void;
  onClear: () => void;
}

const APPROVED_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Approved' },
  { value: 'false', label: 'Pending' },
];

const FACELESS_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'faceless', label: 'Faceless' },
  { value: 'non-faceless', label: 'Non-Faceless' },
  { value: 'reminder', label: 'Reminder' },
];

export function LicenseFilters({
  search,
  onSearchChange,
  approved,
  onApprovedChange,
  facelessType,
  onFacelessTypeChange,
  expiringSoon,
  onExpiringSoonChange,
  onClear,
}: LicenseFiltersProps) {
  const hasFilters = search || approved || facelessType || expiringSoon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value.toUpperCase())}
              placeholder="Search by license no, name, mobile..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all uppercase"
              style={{ textTransform: 'uppercase' }}
            />
          </div>
        </div>

        {/* Approved Filter */}
        <Select
          options={APPROVED_OPTIONS}
          value={approved}
          onChange={onApprovedChange}
          placeholder="Approval Status"
          className="h-[42px]"
        />

        {/* Faceless Type Filter */}
        <Select
          options={FACELESS_OPTIONS}
          value={facelessType}
          onChange={onFacelessTypeChange}
          placeholder="Type"
          className="h-[42px]"
        />

        {/* Expiring Soon & Clear */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={expiringSoon}
              onChange={(e) => onExpiringSoonChange(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Expiring (90d)
            </span>
          </label>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-gray-500 hover:text-gray-900"
            >
              <XMarkIcon className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
