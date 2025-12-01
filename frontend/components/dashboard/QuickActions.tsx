'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircleIcon, EyeIcon, ArrowDownTrayIcon, UserIcon } from '@heroicons/react/24/outline';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      icon: PlusCircleIcon,
      label: 'Add New Policy',
      href: '/policies/new',
      color: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
    },
    {
      icon: EyeIcon,
      label: 'View All Policies',
      href: '/policies',
      color: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    },
    {
      icon: ArrowDownTrayIcon,
      label: 'Export Reports',
      href: '/exports',
      color: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    },
    {
      icon: UserIcon,
      label: 'Users',
      href: '/admin/users',
      color: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="font-bold text-lg text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-lg transition-colors ${action.color}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-semibold text-center">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
