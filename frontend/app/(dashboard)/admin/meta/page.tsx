'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { getMetaByCategory, getMetaCategories } from '@/lib/api/meta';
import { useRequireAdmin } from '@/lib/hooks/useRequireRole';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { MetaOptionsTable } from '@/components/admin/MetaOptionsTable';
import { CreateMetaModal } from '@/components/admin/CreateMetaModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const formatCategoryLabel = (category: string): string =>
  category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function MetaManagementPage() {
  const { isAuthorized, isCheckingAuth } = useRequireAdmin();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: categories,
    error: categoriesError,
    isLoading: categoriesLoading,
    mutate: mutateCategories,
  } = useSWR(isAuthorized ? '/api/v1/meta/categories' : null, getMetaCategories, {
    revalidateOnFocus: false,
  });

  const currentCategory = useMemo(() => {
    if (!categories || categories.length === 0) return '';
    if (selectedCategory && categories.includes(selectedCategory)) return selectedCategory;
    return categories[0];
  }, [categories, selectedCategory]);

  const {
    data: options,
    error: optionsError,
    isLoading: optionsLoading,
    mutate: mutateOptions,
  } = useSWR(
    isAuthorized && currentCategory ? `/api/v1/meta/${currentCategory}` : null,
    () => getMetaByCategory(currentCategory),
    { revalidateOnFocus: false }
  );

  const activeCount = useMemo(
    () => (options || []).filter((option) => option.active).length,
    [options]
  );

  const inactiveCount = useMemo(
    () => (options || []).filter((option) => !option.active).length,
    [options]
  );

  const handleRefresh = async () => {
    await Promise.all([mutateCategories(), mutateOptions()]);
    toast.success('Meta options refreshed');
  };

  const handleCreateSuccess = async () => {
    await Promise.all([mutateCategories(), mutateOptions()]);
    setShowCreateModal(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <AccessDenied message="Only administrators and owners can manage meta options." />;
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
        <p className="text-red-600">Failed to load meta categories</p>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meta Fields</h1>
          <p className="text-gray-600 mt-1">No categories found yet.</p>
        </div>
        <Card>
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">Seed meta data first to start managing dropdowns.</p>
            <Button variant="secondary" onClick={handleRefresh}>
              Refresh
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meta Fields</h1>
          <p className="text-gray-600 mt-1">Manage dropdown options used across policy and license forms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)} disabled={!currentCategory}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Option
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Categories</p>
            <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Active Options</p>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Inactive Options</p>
            <p className="text-2xl font-bold text-amber-600">{inactiveCount}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <div className="border border-gray-200 rounded-lg p-3 h-fit">
              <p className="text-sm font-semibold text-gray-700 mb-3">Categories</p>
              <div className="space-y-1 max-h-[520px] overflow-y-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      currentCategory === category
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {formatCategoryLabel(category)}
                    <p className="text-xs text-gray-500 mt-0.5">{category}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              {optionsLoading ? (
                <div className="flex items-center justify-center min-h-[320px]">
                  <Spinner size="lg" />
                </div>
              ) : optionsError ? (
                <div className="text-center py-12">
                  <p className="text-red-600">Failed to load options for this category</p>
                </div>
              ) : (
                <MetaOptionsTable
                  category={currentCategory}
                  options={options || []}
                  onUpdate={() => mutateOptions()}
                />
              )}
            </div>
          </div>
        </div>
      </Card>

      {currentCategory && (
        <CreateMetaModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          category={currentCategory}
          onSuccess={handleCreateSuccess}
          existingOptions={options || []}
        />
      )}
    </div>
  );
}
