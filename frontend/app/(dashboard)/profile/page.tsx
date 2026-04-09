'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { updateProfile, changePassword } from '@/lib/api/users';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  UserIcon,
  LockClosedIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      await updateProfile({ full_name: fullName });
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      toast.error('Both old and new passwords are required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="glass-panel-strong rounded-[24px] px-4 py-4 sm:px-5">
        <p className="section-label">Account</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
          Profile settings
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Update your account details and password.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <div className="glass-panel rounded-[22px] p-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[20px] border border-white/70 bg-gradient-to-br from-primary/12 to-white text-primary shadow-[0_18px_34px_rgba(99,102,241,0.12)]">
              <UserIcon className="h-9 w-9" />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-900">
              {user.full_name || 'User'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              <ShieldCheckIcon className="h-4 w-4" />
              {user.role}
            </div>
          </div>

          <div className="rounded-[20px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(236,253,245,0.7))] p-4 shadow-[0_14px_26px_rgba(148,163,184,0.1)]">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircleIcon className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Security note</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use a unique password with a long passphrase pattern. Keep owner and admin access
              limited to people who actually operate the system.
            </p>
          </div>
        </aside>

        <div className="space-y-6">
          <Card className="rounded-[22px]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-900">
                    General information
                  </h3>
                  <p className="text-sm text-slate-500">Identity and contact details.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="label mb-2 block">Email address</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type="email"
                        value={user.email}
                        disabled
                        className="pl-11 text-slate-500"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Email changes are restricted. Contact an owner or administrator if needed.
                    </p>
                  </div>

                  <div>
                    <label className="label mb-2 block">Full name</label>
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isUpdatingProfile || fullName === user.full_name}
                    className="px-5"
                  >
                    {isUpdatingProfile ? <Spinner size="sm" /> : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card className="rounded-[22px]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <LockClosedIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-900">
                    Password
                  </h3>
                  <p className="text-sm text-slate-500">Rotate credentials without leaving the app.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="label mb-2 block">Current password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label mb-2 block">New password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label mb-2 block">Confirm new password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={
                      isChangingPassword || !passwordData.oldPassword || !passwordData.newPassword
                    }
                    className="px-5"
                  >
                    {isChangingPassword ? <Spinner size="sm" /> : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
