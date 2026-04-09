'use client';

import { Select } from '@/components/ui/Select';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
  { value: '', label: 'All status' },
  { value: 'true', label: 'Approved' },
  { value: 'false', label: 'Pending' },
];

const FACELESS_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'faceless', label: 'Faceless' },
  { value: 'non-faceless', label: 'Non-faceless' },
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
  const activeFilterCount =
    Number(Boolean(search)) + Number(Boolean(approved)) + Number(Boolean(facelessType)) + Number(expiringSoon);

  return (
    <div className="glass-panel rounded-[20px] px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-[1.35]">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value.toUpperCase())}
            placeholder="Search license no, customer, mobile"
            className="input h-10 rounded-full pl-10 uppercase"
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Select
            options={APPROVED_OPTIONS}
            value={approved}
            onChange={onApprovedChange}
            placeholder="All status"
            className="h-10"
          />

          <Select
            options={FACELESS_OPTIONS}
            value={facelessType}
            onChange={onFacelessTypeChange}
            placeholder="All types"
            className="h-10"
          />

          <label className="flex h-10 items-center gap-2 rounded-[16px] border border-[var(--input-stroke)] bg-[var(--input-fill)] px-3.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <input
              type="checkbox"
              checked={expiringSoon}
              onChange={(e) => onExpiringSoonChange(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
            />
            <span className="whitespace-nowrap">Expiring 90d</span>
          </label>
        </div>

        <div className="flex items-center gap-2 xl:self-stretch">
          {activeFilterCount > 0 && (
            <span className="rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {activeFilterCount}
            </span>
          )}
          <button type="button" onClick={onClear} className="btn btn-secondary h-10 shrink-0 px-4">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
