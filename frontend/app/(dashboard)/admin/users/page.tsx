'use client';

import { useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { deleteUser, getUsers } from '@/lib/api/users';
import { useRequireAdmin } from '@/lib/hooks/useRequireRole';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { UserTable } from '@/components/admin/UserTable';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import {
  PlusIcon,
  UsersIcon,
  CheckBadgeIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function UserManagementPage() {
  const { isAuthorized, isCheckingAuth, user: currentUser } = useRequireAdmin();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: users, error, isLoading, mutate } = useSWR(
    isAuthorized ? '/api/v1/users' : null,
    getUsers,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthorized || !currentUser) {
    return <AccessDenied message="Only administrators and owners can manage users." />;
  }

  const handleCreateSuccess = () => {
    mutate();
    setShowCreateModal(false);
    toast.success('User created successfully');
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;

    setIsDeleting(true);
    try {
      await deleteUser(deleteUserId);
      toast.success('User deleted successfully');
      setDeleteUserId(null);
      mutate();
    } catch (deleteError: any) {
      toast.error(deleteError?.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-[24px] p-8 text-center text-rose-800">
        Failed to load users
      </div>
    );
  }

  const activeUsers = users?.filter((u) => u.active).length || 0;
  const inactiveUsers = users?.filter((u) => !u.active).length || 0;
  const ownerUsers = users?.filter((u) => u.role === 'owner').length || 0;
  const stats = [
    {
      label: 'Total users',
      value: users?.length || 0,
      icon: UsersIcon,
      iconBg: 'bg-sky-100 text-sky-600',
      accent: 'from-sky-100 via-white to-white',
    },
    {
      label: 'Active',
      value: activeUsers,
      icon: CheckBadgeIcon,
      iconBg: 'bg-emerald-100 text-emerald-600',
      accent: 'from-emerald-100 via-white to-white',
    },
    {
      label: 'Inactive',
      value: inactiveUsers,
      icon: NoSymbolIcon,
      iconBg: 'bg-amber-100 text-amber-600',
      accent: 'from-amber-100 via-white to-white',
    },
    {
      label: 'Owners',
      value: ownerUsers,
      icon: ShieldCheckIcon,
      iconBg: 'bg-violet-100 text-violet-600',
      accent: 'from-violet-100 via-white to-white',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel-strong rounded-[24px] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="section-label">Admin Control</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              User management
            </h1>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)} className="px-5">
            <PlusIcon className="mr-2 h-5 w-5" />
            Add User
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-[22px] border border-slate-200/80 bg-[rgba(239,245,253,0.82)] p-5 shadow-[0_18px_36px_rgba(148,163,184,0.10)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-900">
                    {item.value}
                  </p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <Card className="rounded-[22px]">
        <div className="border-b border-white/50 px-6 py-5">
          <p className="section-label">Account Directory</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-900">
            Workspace users
          </h2>
        </div>
        <div className="p-6">
          <UserTable
            users={users || []}
            currentUser={currentUser}
            onUpdate={mutate}
            onDelete={(id) => setDeleteUserId(id)}
          />
        </div>
      </Card>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        currentUserRole={currentUser.role}
      />

      <ConfirmModal
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        variant="danger"
        confirmText="Delete User"
        isLoading={isDeleting}
      />
    </div>
  );
}
