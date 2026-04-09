'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { getMetaByCategory, getMetaCategories } from '@/lib/api/meta';
import { useRequireAdmin } from '@/lib/hooks/useRequireRole';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { MetaOptionsTable } from '@/components/admin/MetaOptionsTable';
import { CreateMetaModal } from '@/components/admin/CreateMetaModal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  PlusIcon,
  Squares2X2Icon,
  CheckBadgeIcon,
  NoSymbolIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

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

  if (isCheckingAuth || categoriesLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <AccessDenied message="Only administrators and owners can manage meta options." />;
  }

  if (categoriesError) {
    return (
      <div className="glass-panel rounded-[24px] p-8 text-center text-rose-800">
        Failed to load meta categories
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-6">
        <section className="glass-panel-strong rounded-[24px] px-4 py-4 sm:px-5">
          <p className="section-label">Meta Registry</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Meta fields
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            No categories were found. Seed the dropdown data first, then return here to manage it.
          </p>
        </section>
        <div className="glass-panel rounded-[22px] p-8 text-center">
          <Button variant="secondary" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Categories',
      value: categories.length,
      icon: Squares2X2Icon,
      iconBg: 'bg-sky-100 text-sky-600',
      accent: 'from-sky-100 via-white to-white',
    },
    {
      label: 'Active options',
      value: activeCount,
      icon: CheckBadgeIcon,
      iconBg: 'bg-emerald-100 text-emerald-600',
      accent: 'from-emerald-100 via-white to-white',
    },
    {
      label: 'Inactive options',
      value: inactiveCount,
      icon: NoSymbolIcon,
      iconBg: 'bg-amber-100 text-amber-600',
      accent: 'from-amber-100 via-white to-white',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel-strong rounded-[24px] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="section-label">Meta Registry</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Meta fields
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Maintain the dropdown system used across policy and license creation flows.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={handleRefresh}>
              <ArrowPathIcon className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="primary" onClick={() => setShowCreateModal(true)} disabled={!currentCategory}>
              <PlusIcon className="mr-2 h-5 w-5" />
              Add Option
            </Button>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[22px] px-5 py-4">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between gap-3 border-b border-slate-200/70 pb-3 last:border-b-0 md:border-b-0 md:pb-0 xl:col-span-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-900">
                    {item.value}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${item.iconBg}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="glass-panel rounded-[22px] p-4 lg:sticky lg:top-4 lg:self-start">
          <p className="section-label">Categories</p>
          <div className="mt-4 space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`w-full rounded-[16px] border px-4 py-3 text-left transition ${
                  currentCategory === category
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 bg-[rgba(239,245,253,0.82)] text-slate-700 hover:bg-slate-50'
                }`}
              >
                <p className="font-medium tracking-[-0.02em]">{formatCategoryLabel(category)}</p>
                <p className={`mt-1 text-xs uppercase tracking-[0.18em] ${currentCategory === category ? 'text-slate-300' : 'text-slate-400'}`}>{category}</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="glass-panel rounded-[22px] p-5">
          {optionsLoading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : optionsError ? (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50/80 p-8 text-center text-rose-700">
              Failed to load options for this category
            </div>
          ) : (
            <MetaOptionsTable
              category={currentCategory}
              options={options || []}
              onUpdate={() => mutateOptions()}
            />
          )}
        </div>
      </section>

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
