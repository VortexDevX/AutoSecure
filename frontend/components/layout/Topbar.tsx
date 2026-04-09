'use client';

import { Fragment } from 'react';
import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePrivacy } from '@/lib/context/PrivacyContext';
import {
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface TopbarProps {
  onMenuClick: () => void;
}

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/policies': 'Policies',
  '/policies/new': 'New Policy',
  '/licenses': 'Licenses',
  '/exports': 'Exports',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/users': 'Users',
  '/admin/meta': 'Meta Fields',
  '/admin/email-templates': 'Email Templates',
  '/profile': 'Profile Settings',
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const { isPrivacyMode, togglePrivacyMode, canTogglePrivacy } = usePrivacy();
  const pathname = usePathname();
  const router = useRouter();

  const getBreadcrumb = () => {
    if (pathname.startsWith('/policies/') && pathname !== '/policies/new') {
      return pathname.endsWith('/edit') ? 'Edit Policy' : 'Policy Details';
    }
    if (pathname.startsWith('/licenses/')) {
      return pathname.endsWith('/edit') ? 'Edit License' : 'License Details';
    }
    return breadcrumbMap[pathname] || 'Dashboard';
  };

  return (
    <header className="relative z-[60] px-3 pt-3 sm:px-4 lg:px-5 lg:pt-4">
      <div className="glass-panel flex items-center justify-between rounded-[22px] px-3.5 py-2.5 sm:px-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-white hover:text-slate-900 lg:hidden"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 transition hover:bg-white hover:text-slate-800"
              >
                Dashboard
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {getBreadcrumb()}
              </span>
            </div>
            <p className="truncate text-base font-semibold tracking-[-0.03em] text-slate-900 sm:mt-1">
              {getBreadcrumb()}
            </p>
          </div>
        </div>

        <div className="ml-4 flex items-center gap-2">
          {canTogglePrivacy && (
            <button
              onClick={togglePrivacyMode}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-white hover:text-primary"
              title={isPrivacyMode ? 'Disable Privacy Mode' : 'Enable Privacy Mode'}
            >
              {isPrivacyMode ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          )}

          <Menu as="div" className="relative z-[100]">
            <Menu.Button className="flex items-center gap-2 rounded-full bg-slate-100 p-1 pr-2.5 transition hover:bg-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold tracking-[-0.02em] text-slate-900">
                  {user?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  {user?.role}
                </p>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition duration-100 ease-out"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="transition duration-75 ease-in"
              leaveFrom="scale-100 opacity-100"
              leaveTo="scale-95 opacity-0"
            >
              <Menu.Items className="glass-panel-strong absolute right-0 z-[110] mt-2 w-60 rounded-[20px] p-2 focus:outline-none">
                <div className="border-b border-white/45 px-3 py-3">
                  <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Account
                  </p>
                </div>

                <div className="py-2">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => router.push('/profile')}
                        className={clsx(
                          'flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm transition',
                          active ? 'bg-slate-100 text-slate-900' : 'text-slate-600'
                        )}
                      >
                        <UserIcon className="h-4 w-4" />
                        Profile Settings
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => logout()}
                        className={clsx(
                          'flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm transition',
                          active ? 'bg-rose-50/85 text-rose-700' : 'text-slate-600'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}
