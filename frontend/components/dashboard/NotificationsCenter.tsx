'use client';

import { useState, useRef, useEffect } from 'react';
import { BellIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/formatters';

interface ExpiringItem {
  _id: string;
  policy_no?: string;
  lic_no?: string;
  customer?: string;
  customer_name?: string;
  end_date?: string;
  saod_end_date?: string;
  expiry_date?: string;
  registration_number?: string;
}

interface NotificationsCenterProps {
  expiringPolicies: ExpiringItem[];
  expiringLicenses: ExpiringItem[];
  policiesCount: number;
  licensesCount: number;
}

export function NotificationsCenter({
  expiringPolicies,
  expiringLicenses,
  policiesCount,
  licensesCount,
}: NotificationsCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalCount = policiesCount + licensesCount;
  const hasNotifications = totalCount > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-full p-2 transition-colors ${
          isOpen
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
        aria-label="Notifications"
      >
        {hasNotifications ? (
          <BellAlertIcon className="w-6 h-6 text-amber-500" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}

        {/* Badge */}
        {hasNotifications && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="glass-panel-strong absolute right-0 top-full z-[120] mt-2 w-96 overflow-hidden rounded-[20px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 bg-[rgba(239,245,253,0.7)] px-4 py-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Expiring Soon</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 transition-colors hover:bg-slate-200"
            >
              <XMarkIcon className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {!hasNotifications ? (
              <div className="px-4 py-8 text-center text-slate-500">
                <BellIcon className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                <p>No expiring items</p>
              </div>
            ) : (
              <>
                {/* Policies */}
                {expiringPolicies.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Policies ({policiesCount})
                      </h4>
                      <Link
                        href="/policies?expiring_soon=true"
                        className="text-xs text-primary font-medium hover:underline"
                        onClick={() => setIsOpen(false)}
                      >
                        View all
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {expiringPolicies.slice(0, 5).map((policy) => (
                        <Link
                          key={policy._id}
                          href={`/policies/${policy._id}`}
                          className="flex items-start gap-3 rounded-[14px] p-2 transition-colors hover:bg-amber-50/70"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {policy.policy_no}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {policy.customer} • {policy.registration_number}
                            </p>
                            <p className="text-xs text-amber-600 font-medium">
                              Expires{' '}
                              {formatRelativeTime(policy.saod_end_date || policy.end_date || '')}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {expiringPolicies.length > 0 && expiringLicenses.length > 0 && (
                  <div className="border-t border-slate-200/70" />
                )}

                {/* Licenses */}
                {expiringLicenses.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Licenses ({licensesCount})
                      </h4>
                      <Link
                        href="/licenses?expiring_soon=true"
                        className="text-xs text-primary font-medium hover:underline"
                        onClick={() => setIsOpen(false)}
                      >
                        View all
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {expiringLicenses.slice(0, 5).map((license) => (
                        <Link
                          key={license._id}
                          href={`/licenses/${license._id}`}
                          className="flex items-start gap-3 rounded-[14px] p-2 transition-colors hover:bg-orange-50/70"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {license.lic_no}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {license.customer_name}
                            </p>
                            <p className="text-xs text-orange-600 font-medium">
                              Expires {formatRelativeTime(license.expiry_date || '')}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {hasNotifications && (
            <div className="border-t border-slate-200/80 bg-[rgba(239,245,253,0.7)] px-4 py-3">
              <Link
                href="/policies?expiring_soon=true"
                className="block w-full rounded-[14px] py-2 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                onClick={() => setIsOpen(false)}
              >
                View All Expiring Items →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
