'use client';

import Link from 'next/link';
import {
  PlusCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  color: string;
  description: string;
}

const actions: QuickAction[] = [
  {
    icon: PlusCircleIcon,
    label: 'New Policy',
    href: '/policies/new',
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
    description: 'Create a new insurance policy',
  },
  {
    icon: IdentificationIcon,
    label: 'New License',
    href: '/licenses/new',
    color: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
    description: 'Add a new license record',
  },
  {
    icon: DocumentTextIcon,
    label: 'All Policies',
    href: '/policies',
    color: 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200',
    description: 'View all policies',
  },
  {
    icon: IdentificationIcon,
    label: 'All Licenses',
    href: '/licenses',
    color: 'bg-teal-50 text-teal-600 hover:bg-teal-100 border-teal-200',
    description: 'View all licenses',
  },
  {
    icon: ClockIcon,
    label: 'Expiring Items',
    href: '/policies',
    color: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200',
    description: 'View soon-to-expire items',
  },
  {
    icon: ArrowDownTrayIcon,
    label: 'Export Data',
    href: '/exports',
    color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
    description: 'Generate reports and exports',
  },
];

export function QuickActionsPanel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${action.color}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-semibold text-center">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
