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
  meta: string;
}

const actions: QuickAction[] = [
  {
    icon: PlusCircleIcon,
    label: 'New Policy',
    href: '/policies/new',
    color: 'bg-sky-50/80 text-sky-700 hover:bg-sky-100 border-sky-200/80',
    meta: 'Create',
  },
  {
    icon: IdentificationIcon,
    label: 'New License',
    href: '/licenses/new',
    color: 'bg-cyan-50/80 text-cyan-700 hover:bg-cyan-100 border-cyan-200/80',
    meta: 'Create',
  },
  {
    icon: DocumentTextIcon,
    label: 'All Policies',
    href: '/policies',
    color: 'bg-slate-50/85 text-slate-700 hover:bg-slate-100 border-slate-200/80',
    meta: 'Review',
  },
  {
    icon: IdentificationIcon,
    label: 'All Licenses',
    href: '/licenses',
    color: 'bg-blue-50/80 text-blue-700 hover:bg-blue-100 border-blue-200/80',
    meta: 'Review',
  },
  {
    icon: ClockIcon,
    label: 'Expiring Items',
    href: '/policies',
    color: 'bg-amber-50/80 text-amber-700 hover:bg-amber-100 border-amber-200/80',
    meta: 'Follow up',
  },
  {
    icon: ArrowDownTrayIcon,
    label: 'Export Data',
    href: '/exports',
    color: 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 border-indigo-200/80',
    meta: 'Export',
  },
];

export function QuickActionsPanel() {
  return (
    <div className="glass-panel rounded-[24px] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/45 pb-4">
        <div>
          <p className="section-label">Actions</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-900">
            Quick actions
          </h3>
        </div>
        <span className="rounded-full border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          6 shortcuts
        </span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`group rounded-[18px] border px-3 py-3 transition hover:-translate-y-0.5 ${action.color}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-white/60 bg-white/80">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
                  {action.meta}
                </span>
              </div>
              <div className="mt-3 min-w-0">
                <p className="text-sm font-semibold tracking-[-0.02em]">{action.label}</p>
                <p className="mt-1 text-xs opacity-75">
                  {action.meta === 'Create'
                    ? `Open ${action.label.toLowerCase()} form`
                    : action.meta === 'Review'
                      ? `Go to ${action.label.toLowerCase()}`
                      : action.meta === 'Follow up'
                        ? 'Check upcoming renewals'
                        : 'Download filtered data'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
