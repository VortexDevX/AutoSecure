'use client';

import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { DateRangePicker } from '@/components/ui/DatePicker';
import { Spinner } from '@/components/ui/Spinner';
import { useMetaCategory } from '@/lib/hooks/useMeta';
import {
  exportPolicies,
  downloadExportFile,
  getExportCount,
  exportLicenses,
  getExportLicenseCount,
  ExportFilters,
  ExportDateRange,
} from '@/lib/api/exports';
import {
  EXPORT_FIELD_CATEGORIES,
  DEFAULT_SELECTED_FIELDS,
  ALL_EXPORT_FIELDS,
} from '@/lib/utils/exportFields';
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TableCellsIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

type ExportMode = 'all' | 'selected';
type ExportType = 'policies' | 'licenses';

interface MetaOption {
  value: string;
  label: string;
}

interface DateRangeValue {
  from: Date | null;
  to: Date | null;
}

export default function ExportsPage() {
  const [exportType, setExportType] = useState<ExportType>('policies');
  const [exportMode, setExportMode] = useState<ExportMode>('all');
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_SELECTED_FIELDS);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>(undefined);
  const [filters, setFilters] = useState<ExportFilters>({});
  const [policyCount, setPolicyCount] = useState<number | null>(null);
  const [licenseCount, setLicenseCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: insStatusOptions } = useMetaCategory('ins_status_add');
  const { data: branchOptions } = useMetaCategory('branch');
  const { data: insCompanyOptions } = useMetaCategory('insurance_company');
  const { data: insTypeOptions } = useMetaCategory('ins_type');
  const { data: executiveOptions } = useMetaCategory('exicutive_name');

  const buildDateRange = useCallback((): ExportDateRange | undefined => {
    if (!dateRange?.from) return undefined;
    return {
      start: format(dateRange.from, 'yyyy-MM-dd'),
      end: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(dateRange.from, 'yyyy-MM-dd'),
    };
  }, [dateRange]);

  const fetchCount = useCallback(async () => {
    try {
      setIsLoadingCount(true);
      if (exportType === 'policies') {
        const count = await getExportCount({
          date_range: buildDateRange(),
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        });
        setPolicyCount(count);
      } else {
        const count = await getExportLicenseCount({
          date_range: buildDateRange(),
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        });
        setLicenseCount(count);
      }
    } catch (error) {
      console.error('Failed to get count:', error);
      if (exportType === 'policies') setPolicyCount(null);
      else setLicenseCount(null);
    } finally {
      setIsLoadingCount(false);
    }
  }, [buildDateRange, filters, exportType]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCount();
    }, 250);
    return () => clearTimeout(debounce);
  }, [fetchCount]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params = {
        fields: exportMode === 'all' ? undefined : selectedFields,
        date_range: buildDateRange(),
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      };

      if (exportType === 'policies') {
        const blob = await exportPolicies(params);
        downloadExportFile(blob, `policies_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`);
        toast.success(`Exported ${policyCount || 0} policies successfully`);
      } else {
        const blob = await exportLicenses(params);
        downloadExportFile(blob, `licenses_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`);
        toast.success(`Exported ${licenseCount || 0} licenses successfully`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `Failed to export ${exportType}`;
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryKey) ? prev.filter((key) => key !== categoryKey) : [...prev, categoryKey]
    );
  };

  const toggleField = (fieldKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey) ? prev.filter((key) => key !== fieldKey) : [...prev, fieldKey]
    );
  };

  const toggleCategoryFields = (categoryKey: string) => {
    const category = EXPORT_FIELD_CATEGORIES.find((current) => current.key === categoryKey);
    if (!category) return;

    const categoryFieldKeys = category.fields.map((field) => field.key);
    const allSelected = categoryFieldKeys.every((key) => selectedFields.includes(key));

    if (allSelected) {
      setSelectedFields((prev) => prev.filter((key) => !categoryFieldKeys.includes(key)));
    } else {
      setSelectedFields((prev) => [...new Set([...prev, ...categoryFieldKeys])]);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    setDateRange(undefined);
  };

  const getCategorySelectionState = (categoryKey: string): 'none' | 'some' | 'all' => {
    const category = EXPORT_FIELD_CATEGORIES.find((current) => current.key === categoryKey);
    if (!category) return 'none';

    const categoryFieldKeys = category.fields.map((field) => field.key);
    const selectedCount = categoryFieldKeys.filter((key) => selectedFields.includes(key)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryFieldKeys.length) return 'all';
    return 'some';
  };

  const hasActiveFilters = Boolean(dateRange?.from || Object.values(filters).some((value) => value));
  const exportCount = exportType === 'policies' ? policyCount : licenseCount;

  return (
    <div className="grid gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
      <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <section className="glass-panel-strong rounded-[24px] px-4 py-4">
          <p className="section-label">Export Studio</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Data export
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Build a filtered export, choose the fields you want, then download the final Excel file.
          </p>
        </section>

        <section className="glass-panel rounded-[22px] p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setExportType('policies')}
              className={clsx(
                'flex items-center gap-2 rounded-[16px] border px-3 py-3 text-left text-sm font-medium transition',
                exportType === 'policies'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50/90 text-slate-600 hover:bg-white hover:text-slate-900'
              )}
            >
              <DocumentTextIcon className="h-4 w-4" />
              Policies
            </button>
            <button
              onClick={() => setExportType('licenses')}
              className={clsx(
                'flex items-center gap-2 rounded-[16px] border px-3 py-3 text-left text-sm font-medium transition',
                exportType === 'licenses'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50/90 text-slate-600 hover:bg-white hover:text-slate-900'
              )}
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              Licenses
            </button>
          </div>
        </section>

        {exportType === 'policies' && (
          <section className="glass-panel rounded-[22px] p-3">
            <p className="section-label">Field Mode</p>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => setExportMode('all')}
                className={clsx(
                  'flex w-full items-start gap-3 rounded-[16px] border px-3 py-3 text-left transition',
                  exportMode === 'all'
                    ? 'border-primary/25 bg-primary/8'
                    : 'border-slate-200 bg-slate-50/90 hover:bg-white'
                )}
              >
                <div className={clsx('flex h-8 w-8 items-center justify-center rounded-[12px]', exportMode === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500')}>
                  <TableCellsIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">All fields</p>
                  <p className="mt-1 text-xs text-slate-500">Export every available field.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportMode('selected')}
                className={clsx(
                  'flex w-full items-start gap-3 rounded-[16px] border px-3 py-3 text-left transition',
                  exportMode === 'selected'
                    ? 'border-primary/25 bg-primary/8'
                    : 'border-slate-200 bg-slate-50/90 hover:bg-white'
                )}
              >
                <div className={clsx('flex h-8 w-8 items-center justify-center rounded-[12px]', exportMode === 'selected' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500')}>
                  <ListBulletIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">Selected fields</p>
                  <p className="mt-1 text-xs text-slate-500">{selectedFields.length} fields selected.</p>
                </div>
              </button>
            </div>
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
            <DateRangePicker
              label="Date Range"
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select date range"
              showPresets
            />

            {exportType === 'policies' ? (
              <>
                <select
                  value={filters.ins_status || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, ins_status: e.target.value || undefined }))}
                  className="input"
                >
                  <option value="">All statuses</option>
                  {insStatusOptions.map((opt: MetaOption) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.branch_id || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, branch_id: e.target.value || undefined }))}
                  className="input"
                >
                  <option value="">All branches</option>
                  {branchOptions.map((opt: MetaOption) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.ins_co_id || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, ins_co_id: e.target.value || undefined }))}
                  className="input"
                >
                  <option value="">All companies</option>
                  {insCompanyOptions.map((opt: MetaOption) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.ins_type || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, ins_type: e.target.value || undefined }))}
                  className="input"
                >
                  <option value="">All types</option>
                  {insTypeOptions.map((opt: MetaOption) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.exicutive_name || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, exicutive_name: e.target.value || undefined }))
                  }
                  className="input"
                >
                  <option value="">All executives</option>
                  {executiveOptions.map((opt: MetaOption) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.customer_payment_status || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      customer_payment_status: e.target.value || undefined,
                    }))
                  }
                  className="input"
                >
                  <option value="">All payments</option>
                  <option value="pending">Pending</option>
                  <option value="done">Done</option>
                </select>
              </>
            ) : (
              <input
                type="number"
                value={filters.expiry_year || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, expiry_year: e.target.value || undefined }))
                }
                placeholder="Expiry year"
                className="input"
                min="1900"
                max="2100"
              />
            )}
          </div>
        </section>

        <section className="glass-panel rounded-[22px] p-3">
          <p className="section-label">Ready State</p>
          <div className="mt-3 space-y-2">
            <div className="rounded-[16px] border border-slate-200 bg-slate-50/90 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Records
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                {isLoadingCount ? (
                  <>
                    <Spinner size="sm" />
                    Counting...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-4 w-4 text-slate-400" />
                    <span>{exportCount ?? 0} ready for export</span>
                  </>
                )}
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={
                isExporting ||
                (exportType === 'policies' && (policyCount === 0 || policyCount === null)) ||
                (exportType === 'licenses' && (licenseCount === 0 || licenseCount === null))
              }
              className="w-full justify-center"
            >
              {isExporting ? (
                <>
                  <Spinner size="sm" />
                  Exporting...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Export to Excel
                </>
              )}
            </Button>
          </div>
        </section>
      </aside>

      <section className="space-y-4">
        <div className="glass-panel rounded-[24px] px-4 py-4">
          <p className="section-label">Export Workspace</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-900">
            {exportType === 'policies' ? 'Policy export configuration' : 'License export configuration'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review the selected dataset, inspect fields, and export only what matters.
          </p>
        </div>

        {exportType === 'policies' && exportMode === 'selected' ? (
          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="glass-panel rounded-[24px] overflow-hidden">
              <div className="border-b border-white/45 px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="section-label">Field Selector</p>
                    <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-900">
                      Selected fields
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFields([...ALL_EXPORT_FIELDS])}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFields([])}>
                      Deselect All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFields([...DEFAULT_SELECTED_FIELDS])}>
                      Default
                    </Button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-200/80">
                {EXPORT_FIELD_CATEGORIES.map((category) => {
                  const isExpanded = expandedCategories.includes(category.key);
                  const selectionState = getCategorySelectionState(category.key);
                  const count = category.fields.filter((field) => selectedFields.includes(field.key)).length;

                  return (
                    <div key={category.key}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.key)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50/80"
                      >
                        <div className="flex items-center gap-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectionState === 'all'}
                              indeterminate={selectionState === 'some'}
                              onChange={() => toggleCategoryFields(category.key)}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{category.label}</p>
                            <p className="text-xs text-slate-500">
                              {count}/{category.fields.length} selected
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUpIcon className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="grid gap-3 bg-slate-50/70 px-4 py-4 md:grid-cols-2 xl:grid-cols-3">
                          {category.fields.map((field) => (
                            <Checkbox
                              key={field.key}
                              label={field.label}
                              checked={selectedFields.includes(field.key)}
                              onChange={() => toggleField(field.key)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel rounded-[24px] p-4">
              <p className="section-label">Selection Summary</p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-900">
                {selectedFields.length} fields selected
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedFields.slice(0, 18).map((field) => (
                  <span
                    key={field}
                    className="rounded-full border border-slate-200 bg-slate-50/90 px-2.5 py-1 text-[11px] text-slate-600"
                  >
                    {field}
                  </span>
                ))}
                {selectedFields.length > 18 && (
                  <span className="rounded-full border border-slate-200 bg-slate-50/90 px-2.5 py-1 text-[11px] text-slate-600">
                    +{selectedFields.length - 18} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-[24px] p-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                <p className="section-label">Mode</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-900">
                  {exportType === 'policies'
                    ? exportMode === 'all'
                      ? 'All policy fields'
                      : 'Selected policy fields'
                    : 'License export'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {exportType === 'policies'
                    ? exportMode === 'all'
                      ? `${ALL_EXPORT_FIELDS.length} fields included by default`
                      : `${selectedFields.length} chosen fields will be exported`
                    : 'License export uses the available license export schema'}
                </p>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                <p className="section-label">Filters Applied</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-900">
                  {hasActiveFilters ? 'Filtered export' : 'Full dataset'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {hasActiveFilters
                    ? 'Date or field filters are limiting the exported records.'
                    : 'No active filters are reducing the export set.'}
                </p>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                <p className="section-label">Ready Count</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-900">
                  {exportCount ?? 0}
                </p>
                <p className="mt-1 text-sm text-slate-500">Records currently ready to download.</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
