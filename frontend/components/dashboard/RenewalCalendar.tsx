'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { formatDate, formatRelativeTime } from '@/lib/utils/formatters';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface CalendarEvent {
  id: string;
  type: 'policy' | 'license';
  title: string;
  date: string;
  registration?: string;
}

interface RenewalCalendarProps {
  policies: CalendarEvent[];
  licenses: CalendarEvent[];
  isLoading?: boolean;
}

interface QueueItem extends CalendarEvent {
  href: string;
}

const isWithinDays = (date: string, days: number) => {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  const diffDays = diff / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
};

export function RenewalCalendar({ policies, licenses, isLoading }: RenewalCalendarProps) {
  const queue = useMemo<QueueItem[]>(() => {
    const policyItems = policies.map((event) => ({
      ...event,
      href: `/policies/${event.id}`,
    }));
    const licenseItems = licenses.map((event) => ({
      ...event,
      href: `/licenses/${event.id}`,
    }));

    return [...policyItems, ...licenseItems].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [licenses, policies]);

  const queueStats = useMemo(
    () => [
      { label: 'Today', value: queue.filter((item) => isWithinDays(item.date, 1)).length },
      { label: '7 days', value: queue.filter((item) => isWithinDays(item.date, 7)).length },
      { label: '30 days', value: queue.filter((item) => isWithinDays(item.date, 30)).length },
    ],
    [queue]
  );

  if (isLoading) {
    return (
      <div className="glass-panel rounded-[24px] p-4 sm:p-5">
        <p className="section-label">Renewals</p>
        <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-900">
          Renewal queue
        </h3>
        <p className="mt-3 text-sm text-slate-500">Loading upcoming expirations.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-[24px] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-white/45 pb-4">
        <div>
          <p className="section-label">Renewals</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-900">
            Renewal queue
          </h3>
        </div>
        <div className="rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {queue.length} live
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {queueStats.map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] border border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {queue.length > 0 ? (
          queue.slice(0, 6).map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={item.href}
              className="flex items-start gap-3 rounded-[18px] border border-slate-200/70 bg-[rgba(239,245,253,0.74)] px-3 py-3 transition hover:bg-white"
            >
              <div
                className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  item.type === 'policy' ? 'bg-amber-500' : 'bg-sky-500'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      item.type === 'policy'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {item.registration || 'Reference not available'}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-600">{formatDate(item.date)}</span>
                  <span className="font-medium text-slate-500">{formatRelativeTime(item.date)}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-[16px] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No upcoming renewals in the current queue.
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href="/policies?expiring_soon=true"
          className="flex items-center justify-between rounded-[18px] border border-slate-200/70 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white"
        >
          Policies due
          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400" />
        </Link>
        <Link
          href="/licenses?expiring_soon=true"
          className="flex items-center justify-between rounded-[18px] border border-slate-200/70 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white"
        >
          Licenses due
          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
