'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getUsers, deleteUser } from '@/lib/api/users';
import { useRequireAdmin } from '@/lib/hooks/useRequireRole';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { UserTable } from '@/components/admin/UserTable';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function UserManagementPage() {
  // ✅ Role-based access control
  const { isAuthorized, isCheckingAuth, user: currentUser } = useRequireAdmin();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all users (only if authorized)
  const {
    data: users,
    error,
    isLoading,
    mutate,
  } = useSWR(isAuthorized ? '/api/v1/users' : null, getUsers, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // ✅ Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // ✅ Show access denied if not authorized
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
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load users</p>
      </div>
    );
  }

  const activeUsers = users?.filter((u) => u.active).length || 0;
  const inactiveUsers = users?.filter((u) => !u.active).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-amber-600">{inactiveUsers}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <span className="text-2xl">🚫</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Owners</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users?.filter((u) => u.role === 'owner').length || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">👑</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <div className="p-6">
          <UserTable
            users={users || []}
            currentUser={currentUser}
            onUpdate={mutate}
            onDelete={(id) => setDeleteUserId(id)}
          />
        </div>
      </Card>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        currentUserRole={currentUser.role}
      />

      {/* Delete Confirmation Modal */}
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
