'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
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
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#2c3e50] text-white flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-white/10">
          <div className="w-8 h-8 relative flex-shrink-0">
            <Image
              src="/logo.png"
              alt="AutoSecure Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
          </div>
          <h1 className="text-xl font-bold">AutoSecure</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="flex flex-col gap-2">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'hover:bg-white/5 text-white/80 hover:text-white'
                    )}
                  >
                    <Icon className={clsx('w-5 h-5', isActive ? 'text-secondary' : '')} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
