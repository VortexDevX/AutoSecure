'use client';

import { Fragment } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Menu, Transition } from '@headlessui/react';
import { Bars3Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

interface TopbarProps {
  onMenuClick: () => void;
}

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/policies': 'Policies',
  '/policies/new': 'New Policy',
  '/exports': 'Exports',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/users': 'Users',
  '/admin/meta': 'Meta Fields',
  '/admin/email-templates': 'Email Templates',
  '/admin/settings': 'Settings',
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Get breadcrumb for current page
  const getBreadcrumb = () => {
    // Check for dynamic routes
    if (pathname.startsWith('/policies/') && pathname !== '/policies/new') {
      if (pathname.endsWith('/edit')) {
        return 'Edit Policy';
      }
      return 'Policy Details';
    }
    return breadcrumbMap[pathname] || 'Dashboard';
  };

  return (
    <header className="flex-shrink-0 bg-white/70 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Bars3Icon className="w-6 h-6 text-gray-600" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2" aria-label="Breadcrumb">
          <a
            href="/dashboard"
            className="text-gray-500 text-sm font-medium hidden sm:inline hover:text-primary-600 transition-colors"
          >
            Dashboard
          </a>
          {pathname !== '/dashboard' && (
            <>
              <span className="text-gray-300 text-sm hidden sm:inline">/</span>
              <span className="text-gray-900 text-sm font-semibold tracking-tight">
                {getBreadcrumb()}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right: User menu */}
      <div className="flex items-center gap-4">
        {/* User dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-3 hover:bg-white/50 rounded-full pl-1 pr-3 py-1 transition-all border border-transparent hover:border-gray-200">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary-500/20">
              {user?.email.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="font-semibold text-sm text-gray-900">
                {user?.full_name || user?.email.split('@')[0]}
              </p>
              <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider leading-none">
                {user?.role}
              </p>
            </div>
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-xl shadow-xl shadow-gray-200/50 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 p-1">
              <div className="p-3 border-b border-gray-100 mb-1">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">Role: {user?.role}</p>
              </div>

              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => logout()}
                      className={clsx(
                        'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors',
                        active ? 'bg-red-50 text-red-700' : 'text-gray-700'
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
