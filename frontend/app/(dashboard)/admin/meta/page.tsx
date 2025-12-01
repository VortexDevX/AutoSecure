'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { useRequireAdmin } from '@/lib/hooks/useRequireRole';
import { AccessDenied } from '@/components/admin/AccessDenied';
import {
  getMetaCategories,
  getMetaByCategory,
  updateMetaOption,
  deleteMetaOption,
} from '@/lib/api/meta';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { MetaOptionsTable } from '@/components/admin/MetaOptionsTable';
import { CreateMetaModal } from '@/components/admin/CreateMetaModal';
import { ConfirmModal } from '@/components/ui/Modal';
import {
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  FireIcon,
  DocumentTextIcon,
  TagIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Category configuration with icons and grouping
const CATEGORY_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    group: string;
    description: string;
  }
> = {
  // Policy Group
  ins_type: {
    icon: ShieldCheckIcon,
    color: 'blue',
    group: 'Policy',
    description: 'Types of insurance policies',
  },
  ins_status_add: {
    icon: TagIcon,
    color: 'blue',
    group: 'Policy',
    description: 'Policy status options',
  },
  insurance_company: {
    icon: BuildingOfficeIcon,
    color: 'blue',
    group: 'Policy',
    description: 'Insurance companies list',
  },
  insurance_dealer: {
    icon: BuildingOfficeIcon,
    color: 'blue',
    group: 'Policy',
    description: 'Insurance dealers list',
  },

  // Customer Group
  branch: {
    icon: MapPinIcon,
    color: 'green',
    group: 'Customer',
    description: 'Branch locations',
  },
  exicutive_name: {
    icon: UserIcon,
    color: 'green',
    group: 'Customer',
    description: 'Executive/agent names',
  },
  city: {
    icon: MapPinIcon,
    color: 'green',
    group: 'Customer',
    description: 'City options',
  },
  nominee_relation: {
    icon: UserGroupIcon,
    color: 'green',
    group: 'Customer',
    description: 'Nominee relationships',
  },

  // Vehicle Group
  vehicle_product: {
    icon: TruckIcon,
    color: 'purple',
    group: 'Vehicle',
    description: 'Vehicle product types',
  },
  manufacturer: {
    icon: WrenchScrewdriverIcon,
    color: 'purple',
    group: 'Vehicle',
    description: 'Vehicle manufacturers',
  },
  fuel_type: {
    icon: FireIcon,
    color: 'purple',
    group: 'Vehicle',
    description: 'Fuel types',
  },

  // Premium Group
  ncb: {
    icon: CurrencyRupeeIcon,
    color: 'amber',
    group: 'Premium',
    description: 'No Claim Bonus percentages',
  },
  addon_coverage: {
    icon: SparklesIcon,
    color: 'amber',
    group: 'Premium',
    description: 'Add-on coverage options',
  },

  // Payment Group
  payment_mode: {
    icon: CreditCardIcon,
    color: 'red',
    group: 'Payment',
    description: 'Payment modes',
  },
  customer_payment_type: {
    icon: CreditCardIcon,
    color: 'red',
    group: 'Payment',
    description: 'Customer payment types',
  },
  company_payment_mode: {
    icon: BuildingOfficeIcon,
    color: 'red',
    group: 'Payment',
    description: 'Company payment modes',
  },
  company_bank_name_add: {
    icon: BuildingOfficeIcon,
    color: 'red',
    group: 'Payment',
    description: 'Bank names for company payments',
  },
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; light: string }> = {
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-200',
    light: 'bg-blue-50',
  },
  green: {
    bg: 'bg-green-500',
    text: 'text-green-600',
    border: 'border-green-200',
    light: 'bg-green-50',
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    border: 'border-purple-200',
    light: 'bg-purple-50',
  },
  amber: {
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-200',
    light: 'bg-amber-50',
  },
  red: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200', light: 'bg-red-50' },
};

const GROUP_ORDER = ['Policy', 'Customer', 'Vehicle', 'Premium', 'Payment'];

export default function MetaManagementPage() {
  // ✅ Role-based access control
  const { isAuthorized, isCheckingAuth } = useRequireAdmin();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const getCategoryDisplayName = (category: string): string => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getCategoryConfig = (category: string) => {
    return (
      CATEGORY_CONFIG[category] || {
        icon: DocumentTextIcon,
        color: 'blue',
        group: 'Other',
        description: 'Meta options',
      }
    );
  };

  // Fetch all categories
  const {
    data: categories,
    error: categoriesError,
    isLoading: categoriesLoading,
  } = useSWR(isAuthorized ? '/api/v1/meta/categories' : null, getMetaCategories);

  // Fetch options for selected category
  const {
    data: options,
    error: optionsError,
    isLoading: optionsLoading,
    mutate: mutateOptions,
  } = useSWR(isAuthorized && selectedCategory ? `/api/v1/meta/${selectedCategory}` : null, () =>
    getMetaByCategory(selectedCategory!)
  );

  // Group categories
  const groupedCategories = useMemo(() => {
    if (!categories) return {};

    const groups: Record<string, string[]> = {};

    categories.forEach((category) => {
      const config = CATEGORY_CONFIG[category];
      const group = config?.group || 'Other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(category);
    });

    return groups;
  }, [categories]);

  // Filter categories by search
  const filteredGroupedCategories = useMemo(() => {
    if (!categorySearch.trim()) return groupedCategories;

    const filtered: Record<string, string[]> = {};
    Object.entries(groupedCategories).forEach(([group, cats]) => {
      const matchingCats = cats.filter(
        (cat) =>
          cat.toLowerCase().includes(categorySearch.toLowerCase()) ||
          getCategoryDisplayName(cat).toLowerCase().includes(categorySearch.toLowerCase())
      );
      if (matchingCats.length > 0) {
        filtered[group] = matchingCats;
      }
    });
    return filtered;
  }, [groupedCategories, categorySearch]);

  // Filter options by search
  const filteredOptions = useMemo(() => {
    if (!options || !searchQuery.trim()) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(opt.value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setEditingId(null);
    setSearchQuery('');
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const handleCreateSuccess = () => {
    mutateOptions();
    setShowCreateModal(false);
    toast.success('Meta option created successfully');
  };

  // Edit handlers
  const handleEditClick = (id: string, currentLabel: string) => {
    setEditingId(id);
    setEditLabel(currentLabel);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateMetaOption(id, { label: editLabel });
      toast.success('Option updated successfully');
      setEditingId(null);
      mutateOptions();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update option');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  const handleToggleActive = async (option: any) => {
    try {
      await updateMetaOption(option.id, { active: !option.active });
      toast.success(`Option ${option.active ? 'deactivated' : 'activated'}`);
      mutateOptions();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteMetaOption(deleteId);
      toast.success('Option deleted successfully');
      setDeleteId(null);
      mutateOptions();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete option');
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // ✅ Show access denied if not authorized
  if (!isAuthorized) {
    return <AccessDenied message="Only administrators and owners can manage meta fields." />;
  }

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-red-600 font-medium">Failed to load meta categories</p>
        <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {!selectedCategory ? (
        /* ============ CATEGORIES VIEW ============ */
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meta Management</h1>
              <p className="text-gray-600 mt-1">
                Manage dropdown options for forms across the application
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="info" className="text-sm px-3 py-1">
                {categories?.length || 0} Categories
              </Badge>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Categories by Group */}
          <div className="space-y-8">
            {GROUP_ORDER.map((group) => {
              const cats = filteredGroupedCategories[group];
              if (!cats || cats.length === 0) return null;

              return (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">{group}</h2>
                    <Badge variant="secondary" className="text-xs">
                      {cats.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cats.map((category) => {
                      const config = getCategoryConfig(category);
                      const colorClasses = COLOR_CLASSES[config.color];
                      const IconComponent = config.icon;

                      return (
                        <button
                          key={category}
                          onClick={() => handleCategoryClick(category)}
                          className={`
                            group relative bg-white rounded-xl border-2 p-5 text-left transition-all
                            hover:shadow-lg hover:border-primary hover:-translate-y-0.5
                            ${colorClasses.border}
                          `}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses.light}`}
                            >
                              <IconComponent className={`w-6 h-6 ${colorClasses.text}`} />
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                            {getCategoryDisplayName(category)}
                          </h3>
                          <p className="text-xs text-gray-500 mb-2">{config.description}</p>
                          <code className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded font-mono">
                            {category}
                          </code>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Other categories */}
            {filteredGroupedCategories['Other'] &&
              filteredGroupedCategories['Other'].length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Other</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredGroupedCategories['Other'].map((category) => {
                      const config = getCategoryConfig(category);
                      const colorClasses = COLOR_CLASSES[config.color];
                      const IconComponent = config.icon;

                      return (
                        <button
                          key={category}
                          onClick={() => handleCategoryClick(category)}
                          className="group relative bg-white rounded-xl border-2 border-gray-200 p-5 text-left transition-all hover:shadow-lg hover:border-primary hover:-translate-y-0.5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                              <IconComponent className="w-6 h-6 text-gray-600" />
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                            {getCategoryDisplayName(category)}
                          </h3>
                          <code className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded font-mono">
                            {category}
                          </code>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>

          {/* No results */}
          {categorySearch && Object.keys(filteredGroupedCategories).length === 0 && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No categories found matching "{categorySearch}"</p>
              <button
                onClick={() => setCategorySearch('')}
                className="text-primary hover:underline mt-2"
              >
                Clear search
              </button>
            </div>
          )}
        </>
      ) : (
        /* ============ OPTIONS VIEW ============ */
        <>
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                {(() => {
                  const config = getCategoryConfig(selectedCategory);
                  const colorClasses = COLOR_CLASSES[config.color];
                  const IconComponent = config.icon;
                  return (
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses.light}`}
                    >
                      <IconComponent className={`w-6 h-6 ${colorClasses.text}`} />
                    </div>
                  );
                })()}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getCategoryDisplayName(selectedCategory)}
                  </h1>
                  <p className="text-sm text-gray-500">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {selectedCategory}
                    </code>
                    <span className="mx-2">•</span>
                    {options?.length || 0} options
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-16 lg:ml-0">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white shadow text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid View"
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white shadow text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>

              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Option
              </Button>
            </div>
          </div>

          {/* Search within options */}
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Options Content */}
          <Card>
            <div className="p-6">
              {optionsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Spinner size="lg" />
                </div>
              ) : optionsError ? (
                <div className="text-center py-16">
                  <p className="text-red-600">Failed to load options</p>
                  <Button variant="secondary" onClick={() => mutateOptions()} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : filteredOptions && filteredOptions.length > 0 ? (
                viewMode === 'list' ? (
                  <MetaOptionsTable
                    category={selectedCategory}
                    options={filteredOptions}
                    onUpdate={mutateOptions}
                  />
                ) : (
                  /* Grid View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`
                          relative border rounded-xl p-4 transition-all group
                          ${
                            option.active
                              ? 'border-gray-200 hover:border-primary hover:shadow-md'
                              : 'border-gray-100 bg-gray-50 opacity-60'
                          }
                        `}
                      >
                        {/* Status indicator */}
                        <div
                          className={`absolute top-3 right-3 w-2 h-2 rounded-full ${option.active ? 'bg-green-500' : 'bg-gray-300'}`}
                        />

                        <div className="pr-6">
                          {editingId === option.id ? (
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="w-full px-3 py-1.5 border border-primary rounded-lg text-sm focus:ring-2 focus:ring-primary"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(option.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          ) : (
                            <>
                              <h4 className="font-semibold text-gray-900 truncate mb-1">
                                {option.label}
                              </h4>
                              <p className="text-xs text-gray-500 font-mono bg-gray-100 inline-block px-2 py-0.5 rounded truncate max-w-full">
                                {option.value}
                              </p>
                            </>
                          )}
                        </div>

                        {option.parent_value && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-500">Parent: </span>
                            <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {option.parent_value}
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        <div
                          className={`
                          flex items-center justify-between mt-4 pt-3 border-t border-gray-100
                          ${editingId === option.id ? '' : 'opacity-0 group-hover:opacity-100'}
                          transition-opacity
                        `}
                        >
                          <span className="text-xs text-gray-400">#{option.sort_order}</span>

                          {editingId === option.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(option.id)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Save"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleActive(option)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  option.active
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                                title={option.active ? 'Deactivate' : 'Activate'}
                              >
                                {option.active ? (
                                  <XMarkIcon className="w-4 h-4" />
                                ) : (
                                  <CheckIcon className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleEditClick(option.id, option.label)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteId(option.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : searchQuery ? (
                <div className="text-center py-16">
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No options found matching "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-primary hover:underline text-sm"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="text-center py-16">
                  <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No options yet</h3>
                  <p className="text-gray-500 mb-6">
                    Get started by adding your first option to this category.
                  </p>
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add First Option
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Create Meta Modal */}
      <CreateMetaModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        category={selectedCategory || ''}
        onSuccess={handleCreateSuccess}
        existingOptions={options || []}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Meta Option"
        message="Are you sure you want to delete this option? This action cannot be undone and may affect existing policies using this value."
        variant="danger"
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
