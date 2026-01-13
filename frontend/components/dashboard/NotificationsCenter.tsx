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
        className={`relative p-2 rounded-lg transition-colors ${
          isOpen
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900">Expiring Soon</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {!hasNotifications ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No expiring items</p>
              </div>
            ) : (
              <>
                {/* Policies */}
                {expiringPolicies.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {policy.policy_no}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
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
                  <div className="border-t border-gray-100" />
                )}

                {/* Licenses */}
                {expiringLicenses.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {license.lic_no}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
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
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <Link
                href="/policies?expiring_soon=true"
                className="block w-full py-2 text-center text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
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
