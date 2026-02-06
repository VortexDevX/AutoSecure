'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { NavLink } from '@/lib/context/NavigationContext';
import clsx from 'clsx';
import {
  HomeIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  ArrowDownTrayIcon,
  UsersIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  ChevronLeftIcon,
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
  // ✅ Admin section - moved audit-logs here
  {
    name: 'Audit Logs',
    href: '/admin/audit-logs', // ✅ Changed from /audit-logs
    icon: ClipboardDocumentListIcon,
    roles: ['owner', 'admin'],
  },
  { name: 'Users', href: '/admin/users', icon: UsersIcon, roles: ['owner', 'admin'] },
  { name: 'Meta Fields', href: '/admin/meta', icon: TagIcon, roles: ['owner', 'admin'] },
  {
    name: 'Email Templates',
    href: '/admin/email-templates',
    icon: EnvelopeIcon,
    roles: ['owner'], // ✅ Owner only
  },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon, roles: ['owner'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out',
          'bg-white text-gray-700 shadow-xl shadow-gray-200/50 border-r border-gray-100', // Light bg, subtle border
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'w-20 lg:w-20' : 'w-64 lg:w-72',
          'lg:rounded-2xl lg:h-full', // Floating pill shape on Desktop
          'h-full' // Full height on mobile
        )}
      >
        {/* Logo / Header */}
        <div
          className={clsx(
            'flex items-center justify-between p-6 transition-all duration-300',
            isCollapsed ? 'px-4 justify-center' : 'px-6'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0 cursor-pointer">
              <div className="w-10 h-10 relative bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                <Image
                  src="/logo.png"
                  alt="AutoSecure"
                  width={24}
                  height={24}
                  className="rounded-lg bg-white/10"
                />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">AutoSecure</h1>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                  Admin Panel
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Separator */}
        <div className="px-6 py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-none">
          <ul className="flex flex-col gap-1.5">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <li key={item.name} title={isCollapsed ? item.name : ''}>
                  <NavLink
                    href={item.href}
                    onClick={onClose}
                    className={clsx(
                      'group flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 relative overflow-hidden',
                      isActive
                        ? 'bg-primary-50 text-primary-700 border border-primary-100'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                      isCollapsed && 'justify-center px-0'
                    )}
                  >
                    {/* Active Gradient Glow - Subtle for Light Mode */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-white opacity-50 z-0" />
                    )}

                    <Icon
                      className={clsx(
                        'w-6 h-6 flex-shrink-0 relative z-10 transition-transform duration-300',
                        isActive
                          ? 'text-primary-600 scale-110'
                          : 'group-hover:text-primary-600 group-hover:scale-110'
                      )}
                    />

                    {!isCollapsed && (
                      <span
                        className={clsx(
                          'text-sm font-medium relative z-10',
                          isActive ? 'text-primary-900' : ''
                        )}
                      >
                        {item.name}
                      </span>
                    )}

                    {/* Active Indicator Bar */}
                    {isActive && !isCollapsed && (
                      <div className="absolute right-0 w-1 h-6 bg-primary-500 rounded-l-full" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Toggle (Collapsed State) */}
        {isCollapsed && (
          <div className="p-4 flex justify-center border-t border-gray-100">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex w-8 h-8 items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-all"
            >
              <ChevronLeftIcon className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
