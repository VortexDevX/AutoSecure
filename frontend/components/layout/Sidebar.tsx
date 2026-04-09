'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import clsx from 'clsx';
import { useAuth } from '@/lib/hooks/useAuth';
import { NavLink } from '@/lib/context/NavigationContext';
import {
  HomeIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  ArrowDownTrayIcon,
  UsersIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('owner' | 'admin' | 'user')[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Policies', href: '/policies', icon: DocumentTextIcon },
  { name: 'New Policy', href: '/policies/new', icon: PlusCircleIcon },
  { name: 'Licenses', href: '/licenses', icon: DocumentTextIcon },
  { name: 'Exports', href: '/exports', icon: ArrowDownTrayIcon },
  {
    name: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: ClipboardDocumentListIcon,
    roles: ['owner', 'admin'],
  },
  { name: 'Meta Fields', href: '/admin/meta', icon: TagIcon, roles: ['owner', 'admin'] },
  { name: 'Users', href: '/admin/users', icon: UsersIcon, roles: ['owner', 'admin'] },
  {
    name: 'Email Templates',
    href: '/admin/email-templates',
    icon: EnvelopeIcon,
    roles: ['owner'],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const isItemActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/policies') {
      return pathname === '/policies' || (pathname.startsWith('/policies/') && !pathname.startsWith('/policies/new'));
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[80] bg-slate-900/28 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className="fixed inset-y-0 left-0 z-[90] px-3 py-3 lg:px-2 lg:py-4">
        <div
          className={clsx(
            'glass-panel-strong flex h-full w-[17rem] max-w-[82vw] flex-col transition-transform duration-250 lg:max-w-none lg:overflow-hidden lg:transition-[width] lg:duration-200',
            isOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0',
            isHovered ? 'lg:w-[15rem]' : 'lg:w-[4.75rem]'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center gap-3 px-4 py-4 lg:px-3 lg:py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-slate-900 text-white shadow-[0_10px_22px_rgba(15,23,42,0.18)]">
              <Image src="/logo.png" alt="AutoSecure" width={22} height={22} className="rounded" />
            </div>
            <div
              className={clsx(
                'min-w-0 transition-all duration-200 lg:overflow-hidden',
                isHovered ? 'lg:w-auto lg:opacity-100' : 'lg:w-0 lg:opacity-0'
              )}
            >
              <p className="section-label whitespace-nowrap">AutoSecure</p>
              <h1 className="mt-1 whitespace-nowrap text-sm font-semibold tracking-[-0.03em] text-slate-900">
                Navigation
              </h1>
            </div>
          </div>

          <nav className="flex-1 px-3 pb-4 lg:px-2">
            <ul className="space-y-1.5">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);

                return (
                  <li key={item.name}>
                    <NavLink
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        'flex h-10 items-center rounded-[14px] text-sm font-medium transition',
                        isHovered
                          ? 'gap-3 px-3 justify-start'
                          : 'mx-auto w-10 justify-center px-0 lg:gap-0',
                        active
                          ? 'bg-slate-900 text-white shadow-[0_10px_20px_rgba(15,23,42,0.16)]'
                          : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span
                        className={clsx(
                          'whitespace-nowrap transition-all duration-200 lg:overflow-hidden',
                          isHovered ? 'lg:w-auto lg:translate-x-0 lg:opacity-100' : 'lg:w-0 lg:-translate-x-1 lg:opacity-0'
                        )}
                      >
                        {item.name}
                      </span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto border-t border-slate-200/70 px-4 py-3 lg:px-3">
            <div
              className={clsx(
                'flex items-center rounded-[14px] bg-slate-50/90 transition-all duration-200',
                isHovered ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2'
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div
                className={clsx(
                  'min-w-0 transition-all duration-200 lg:overflow-hidden',
                  isHovered ? 'lg:w-auto lg:opacity-100' : 'lg:w-0 lg:opacity-0'
                )}
              >
                <p className="truncate text-sm font-medium text-slate-800">
                  {user?.full_name || user?.email?.split('@')[0] || 'Account'}
                </p>
                <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {user?.role || 'member'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
