'use client';

import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
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
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  XMarkIcon,
  TableCellsIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

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
  // Export type tab
  const [exportType, setExportType] = useState<ExportType>('policies');

  // Export mode
  const [exportMode, setExportMode] = useState<ExportMode>('all');

  // Selected fields (for 'selected' mode)
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_SELECTED_FIELDS);

  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Date range
  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>(undefined);

  // Filters
  const [filters, setFilters] = useState<ExportFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Count preview
  const [policyCount, setPolicyCount] = useState<number | null>(null);
  const [licenseCount, setLicenseCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Export loading
  const [isExporting, setIsExporting] = useState(false);

  // Meta data for filter dropdowns
  const { data: insStatusOptions } = useMetaCategory('ins_status_add');
  const { data: branchOptions } = useMetaCategory('branch');
  const { data: insCompanyOptions } = useMetaCategory('insurance_company');
  const { data: insTypeOptions } = useMetaCategory('ins_type');
  const { data: executiveOptions } = useMetaCategory('exicutive_name');

  // Build date range for API
  const buildDateRange = useCallback((): ExportDateRange | undefined => {
    if (!dateRange?.from) return undefined;
    return {
      start: format(dateRange.from, 'yyyy-MM-dd'),
      end: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(dateRange.from, 'yyyy-MM-dd'),
    };
  }, [dateRange]);

  // Fetch policy count
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
      if (exportType === 'policies') {
        setPolicyCount(null);
      } else {
        setLicenseCount(null);
      }
    } finally {
      setIsLoadingCount(false);
    }
  }, [buildDateRange, filters, exportType]);

  // Fetch count on filter/date change
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCount();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchCount]);

  // Handle export
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
        const filename = `policies_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
        downloadExportFile(blob, filename);
        toast.success(`Exported ${policyCount || 0} policies successfully!`);
      } else {
        const blob = await exportLicenses(params);
        const filename = `licenses_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
        downloadExportFile(blob, filename);
        toast.success(`Exported ${licenseCount || 0} licenses successfully!`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to export ${exportType}`;
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryKey) ? prev.filter((k) => k !== categoryKey) : [...prev, categoryKey]
    );
  };

  // Toggle field selection
  const toggleField = (fieldKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey) ? prev.filter((k) => k !== fieldKey) : [...prev, fieldKey]
    );
  };

  // Toggle all fields in a category
  const toggleCategoryFields = (categoryKey: string) => {
    const category = EXPORT_FIELD_CATEGORIES.find((c) => c.key === categoryKey);
    if (!category) return;

    const categoryFieldKeys = category.fields.map((f) => f.key);
    const allSelected = categoryFieldKeys.every((k) => selectedFields.includes(k));

    if (allSelected) {
      setSelectedFields((prev) => prev.filter((k) => !categoryFieldKeys.includes(k)));
    } else {
      setSelectedFields((prev) => [...new Set([...prev, ...categoryFieldKeys])]);
    }
  };

  // Select/Deselect all
  const handleSelectAll = () => {
    setSelectedFields([...ALL_EXPORT_FIELDS]);
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const handleResetToDefault = () => {
    setSelectedFields([...DEFAULT_SELECTED_FIELDS]);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({});
    setDateRange(undefined);
  };

  // Check if category has some/all fields selected
  const getCategorySelectionState = (categoryKey: string): 'none' | 'some' | 'all' => {
    const category = EXPORT_FIELD_CATEGORIES.find((c) => c.key === categoryKey);
    if (!category) return 'none';

    const categoryFieldKeys = category.fields.map((f) => f.key);
    const selectedCount = categoryFieldKeys.filter((k) => selectedFields.includes(k)).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryFieldKeys.length) return 'all';
    return 'some';
  };

  const hasActiveFilters = dateRange?.from || Object.values(filters).some((v) => v);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
          <p className="text-gray-600 mt-1">Export policies or licenses to Excel</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setShowFilters((s) => !s)}>
            <FunnelIcon className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setExportType('policies')}
          className={clsx(
            'pb-3 px-2 font-medium transition-colors',
            exportType === 'policies'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <DocumentTextIcon className="w-4 h-4 inline mr-2" />
          Export Policies
        </button>
        <button
          onClick={() => setExportType('licenses')}
          className={clsx(
            'pb-3 px-2 font-medium transition-colors',
            exportType === 'licenses'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <DocumentDuplicateIcon className="w-4 h-4 inline mr-2" />
          Export Licenses
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Export Filters</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div className="lg:col-span-2">
                <DateRangePicker
                  label="Date Range"
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Select date range"
                  showPresets
                />
              </div>

              {/* Insurance Status */}
              {exportType === 'policies' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Status
                    </label>
                    <select
                      value={filters.ins_status || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, ins_status: e.target.value || undefined }))
                      }
                      className="input"
                    >
                      <option value="">All Statuses</option>
                      {insStatusOptions.map((opt: MetaOption) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                    <select
                      value={filters.branch_id || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, branch_id: e.target.value || undefined }))
                      }
                      className="input"
                    >
                      <option value="">All Branches</option>
                      {branchOptions.map((opt: MetaOption) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Insurance Company */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Company
                    </label>
                    <select
                      value={filters.ins_co_id || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, ins_co_id: e.target.value || undefined }))
                      }
                      className="input"
                    >
                      <option value="">All Companies</option>
                      {insCompanyOptions.map((opt: MetaOption) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Insurance Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Type
                    </label>
                    <select
                      value={filters.ins_type || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, ins_type: e.target.value || undefined }))
                      }
                      className="input"
                    >
                      <option value="">All Types</option>
                      {insTypeOptions.map((opt: MetaOption) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Executive Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Executive Name
                    </label>
                    <select
                      value={filters.exicutive_name || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          exicutive_name: e.target.value || undefined,
                        }))
                      }
                      className="input"
                    >
                      <option value="">All Executives</option>
                      {executiveOptions.map((opt: MetaOption) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Status
                    </label>
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
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button variant="ghost" onClick={handleClearFilters}>
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* License-specific filters (expiry year dropdown) */}
      {showFilters && exportType === 'licenses' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">License Filters</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Expiry Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Year</label>
                <input
                  type="number"
                  value={filters.expiry_year || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      expiry_year: e.target.value || undefined,
                    }))
                  }
                  placeholder="Enter year (e.g., 2025)"
                  className="input"
                  min="1900"
                  max="2100"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(filters.expiry_year || dateRange?.from) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button variant="ghost" onClick={handleClearFilters}>
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Export Mode Selection (only for policies) */}
      {exportType === 'policies' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Export Options</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export All Fields */}
              <button
                type="button"
                onClick={() => setExportMode('all')}
                className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${
                  exportMode === 'all'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${exportMode === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}
                  `}
                  >
                    <TableCellsIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Export All Fields</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Export all {ALL_EXPORT_FIELDS.length} available fields
                    </p>
                  </div>
                  {exportMode === 'all' && <CheckIcon className="w-5 h-5 text-primary" />}
                </div>
              </button>

              {/* Export Selected Fields */}
              <button
                type="button"
                onClick={() => setExportMode('selected')}
                className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${
                  exportMode === 'selected'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${
                      exportMode === 'selected'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}
                  >
                    <ListBulletIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Export Selected Fields</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose specific fields ({selectedFields.length} selected)
                    </p>
                  </div>
                  {exportMode === 'selected' && <CheckIcon className="w-5 h-5 text-primary" />}
                </div>
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Field Selection (only shown when exportMode === 'selected' AND exportType === 'policies') */}
      {exportMode === 'selected' && exportType === 'policies' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-medium">Select Fields</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleResetToDefault}>
                  Reset to Default
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200">
              {EXPORT_FIELD_CATEGORIES.map((category) => {
                const isExpanded = expandedCategories.includes(category.key);
                const selectionState = getCategorySelectionState(category.key);

                return (
                  <div key={category.key}>
                    {/* Category Header */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.key)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectionState === 'all'}
                            indeterminate={selectionState === 'some'}
                            onChange={() => toggleCategoryFields(category.key)}
                          />
                        </div>
                        <span className="font-medium text-gray-900">{category.label}</span>
                        <span className="text-sm text-gray-500">
                          ({category.fields.filter((f) => selectedFields.includes(f.key)).length}/
                          {category.fields.length})
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* Category Fields */}
                    {isExpanded && (
                      <div className="px-6 py-4 bg-gray-50 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
          </CardBody>
        </Card>
      )}

      {/* Export Action */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Count Preview */}
            <div className="flex items-center gap-3">
              {isLoadingCount ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Spinner size="sm" />
                  <span>Counting {exportType}...</span>
                </div>
              ) : exportType === 'policies' ? (
                policyCount !== null ? (
                  <div className="flex items-center gap-2">
                    <DocumentArrowDownIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      This will export{' '}
                      <span className="font-semibold text-primary">{policyCount}</span>{' '}
                      {policyCount === 1 ? 'policy' : 'policies'}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">Unable to count policies</span>
                )
              ) : licenseCount !== null ? (
                <div className="flex items-center gap-2">
                  <DocumentArrowDownIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    This will export{' '}
                    <span className="font-semibold text-primary">{licenseCount}</span>{' '}
                    {licenseCount === 1 ? 'license' : 'licenses'}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">Unable to count licenses</span>
              )}
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={
                isExporting ||
                (exportType === 'policies' && (policyCount === 0 || policyCount === null)) ||
                (exportType === 'licenses' && (licenseCount === 0 || licenseCount === null))
              }
              size="lg"
            >
              {isExporting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  Export to Excel
                </>
              )}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
