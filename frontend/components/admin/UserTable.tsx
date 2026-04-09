'use client';

import { useState } from 'react';
import { User } from '@/lib/types/user';
import { updateUserRole, updateUserStatus } from '@/lib/api/users';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';
import { UserIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

interface UserTableProps {
  users: User[];
  currentUser: User;
  onUpdate: () => void;
  onDelete: (id: string) => void;
}

export function UserTable({ users, currentUser, onUpdate, onDelete }: UserTableProps) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const isOwner = currentUser.role === 'owner';
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'owner';

  const handleRoleChange = async (userId: string, newRole: 'owner' | 'admin' | 'user') => {
    if (!userId || userId === 'undefined') {
      toast.error('Invalid user ID');
      return;
    }

    if (!isOwner) {
      toast.error('Only owners can change user roles');
      return;
    }

    if (userId === currentUser.id) {
      toast.error('You cannot change your own role');
      return;
    }

    setLoadingUserId(userId);
    try {
      await updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      onUpdate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update role');
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    if (!userId || userId === 'undefined') {
      toast.error('Invalid user ID');
      return;
    }

    if (!isAdmin) {
      toast.error('You do not have permission to change user status');
      return;
    }

    if (userId === currentUser.id) {
      toast.error('You cannot deactivate your own account');
      return;
    }

    setLoadingUserId(userId);
    try {
      await updateUserStatus(userId, !currentStatus);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      onUpdate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setLoadingUserId(null);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    const variants = {
      owner: 'bg-red-100 text-red-700 border-red-200',
      admin: 'bg-amber-100 text-amber-700 border-amber-200',
      user: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return variants[role as keyof typeof variants] || variants.user;
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      owner: '👑',
      admin: '🛡️',
      user: '👤',
    };
    return icons[role as keyof typeof icons] || '👤';
  };

  const isOwnerAccount = (user: User) => user.role === 'owner';
  const isCurrentUser = (user: User) => user.id === currentUser.id;

  const validUsers = users.filter((u) => u.id && u.id !== 'undefined');

  if (validUsers.length === 0) {
    return (
      <div className="py-12 text-center">
        <UserIcon className="mx-auto mb-4 h-16 w-16 text-slate-400" />
        <p className="text-lg font-medium text-slate-700">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-3 text-left text-sm">
        <thead className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <tr>
            <th className="px-6 py-3">User</th>
            <th className="px-6 py-3">Role</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">2FA</th>
            <th className="px-6 py-3">Created</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {validUsers.map((user) => (
            <tr key={user.id} className={`group transition-all duration-300 ${isCurrentUser(user) ? 'scale-[1.005]' : ''}`}>
              <td className="rounded-l-[24px] border-y border-l border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-6 py-4 shadow-[0_14px_30px_rgba(148,163,184,0.09)]">
                <div>
                  <p className="font-medium text-slate-900">
                    {user.full_name || 'No Name'}
                    {isCurrentUser(user) && (
                      <span className="ml-2 text-xs font-semibold text-primary">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </td>

              <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-6 py-4">
                {isOwner && !isCurrentUser(user) && !isOwnerAccount(user) ? (
                  <Menu as="div" className="relative inline-block">
                    <MenuButton
                      disabled={loadingUserId === user.id}
                      className={`
                        inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all
                        ${getRoleBadgeClass(user.role)}
                        disabled:cursor-not-allowed disabled:opacity-50
                        focus:outline-none focus:ring-2 focus:ring-primary/30
                      `}
                    >
                      <span>{getRoleIcon(user.role)}</span>
                      <span className="capitalize">{user.role}</span>
                      <ChevronDownIcon className="w-3 h-3" />
                    </MenuButton>

                    <MenuItems
                      anchor="bottom start"
                      className="
                        z-[100] mt-2 w-40 origin-top-left rounded-2xl border border-slate-200/70 bg-[rgba(239,245,253,0.96)]
                        shadow-[0_24px_48px_rgba(74,96,129,0.18)] backdrop-blur-xl focus:outline-none
                        [--anchor-gap:4px]
                      "
                    >
                      <div className="py-1">
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={() => handleRoleChange(user.id, 'user')}
                              className={`
                                ${focus ? 'bg-slate-100' : ''}
                                group flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700
                                transition-colors
                              `}
                            >
                              <span>👤</span>
                              <span>User</span>
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={() => handleRoleChange(user.id, 'admin')}
                              className={`
                                ${focus ? 'bg-slate-100' : ''}
                                group flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700
                                transition-colors
                              `}
                            >
                              <span>🛡️</span>
                              <span>Admin</span>
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={() => handleRoleChange(user.id, 'owner')}
                              className={`
                                ${focus ? 'bg-slate-100' : ''}
                                group flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700
                                transition-colors
                              `}
                            >
                              <span>👑</span>
                              <span>Owner</span>
                            </button>
                          )}
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </Menu>
                ) : (
                  <span
                    className={`
                      inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border
                      ${getRoleBadgeClass(user.role)}
                    `}
                  >
                    <span>{getRoleIcon(user.role)}</span>
                    <span className="capitalize">{user.role}</span>
                  </span>
                )}
              </td>

              <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-6 py-4">
                <button
                  onClick={() => handleStatusToggle(user.id, user.active)}
                  disabled={
                    !isAdmin ||
                    isCurrentUser(user) ||
                    loadingUserId === user.id ||
                    isOwnerAccount(user)
                  }
                  className="disabled:cursor-not-allowed"
                  title={
                    isOwnerAccount(user)
                      ? 'Cannot deactivate owner account'
                      : isCurrentUser(user)
                        ? 'Cannot deactivate your own account'
                        : ''
                  }
                >
                  <Badge variant={user.active ? 'success' : 'secondary'}>
                    {user.active ? 'Active' : 'Inactive'}
                  </Badge>
                </button>
              </td>

              <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-6 py-4">
                <Badge variant={user.totp_enabled ? 'success' : 'warning'} size="sm">
                  {user.totp_enabled ? '✓ Enabled' : '✗ Disabled'}
                </Badge>
              </td>

              <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-6 py-4 text-slate-500">
                {user.created_at ? formatDate(user.created_at) : '-'}
              </td>

              <td className="rounded-r-[24px] border-y border-r border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-6 py-4 text-right">
                {isOwner && !isCurrentUser(user) && !isOwnerAccount(user) && (
                  <button
                    onClick={() => onDelete(user.id)}
                    disabled={loadingUserId === user.id}
                    className="rounded-full border border-rose-200 bg-rose-50/90 p-2 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                    title="Delete User"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
