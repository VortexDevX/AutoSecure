'use client';

import Link from 'next/link';
import { Fragment, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LicenseRecord } from '@/lib/types/license';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/hooks/useAuth';
import { EyeIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';

interface LicenseTableProps {
  licenses: LicenseRecord[];
  onDelete: (id: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

// Menu item heights for position calculation
const MENU_ITEM_HEIGHT = 40;
const MENU_DIVIDER_HEIGHT = 9;
const MENU_PADDING = 8;

function ActionsMenu({
  license,
  onDelete,
  canEdit,
}: {
  license: LicenseRecord;
  onDelete: (id: string) => void;
  canEdit: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getMenuHeight = () => {
    let itemCount = 1; // View always visible
    if (canEdit) itemCount += 2; // Edit + Delete
    const dividerCount = canEdit ? 1 : 0;
    return itemCount * MENU_ITEM_HEIGHT + dividerCount * MENU_DIVIDER_HEIGHT + MENU_PADDING;
  };

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = getMenuHeight();

      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      setOpenDirection(shouldOpenUp ? 'up' : 'down');

      let left = rect.right + window.scrollX - 192;
      if (left < 8) left = 8;

      if (shouldOpenUp) {
        setMenuPosition({
          top: rect.top + window.scrollY - menuHeight - 8,
          left,
        });
      } else {
        setMenuPosition({
          top: rect.bottom + window.scrollY + 8,
          left,
        });
      }
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (open) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
              window.removeEventListener('scroll', updatePosition, true);
              window.removeEventListener('resize', updatePosition);
            };
          }
        }, [open]);

        return (
          <>
            <Menu.Button
              ref={buttonRef}
              className="rounded-full border border-slate-200/70 bg-slate-50/85 p-2 transition hover:bg-white"
              aria-label="Actions"
            >
              <EllipsisVerticalIcon className="h-4 w-4 text-slate-500" />
            </Menu.Button>

            {isMounted &&
              createPortal(
                <Transition
                  as={Fragment}
                  show={open}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items
                    className={clsx(
                      'fixed z-50 w-44 rounded-2xl border border-slate-200/70 bg-[rgba(239,245,253,0.96)] shadow-[0_24px_48px_rgba(74,96,129,0.18)] backdrop-blur-xl focus:outline-none',
                      openDirection === 'up' ? 'origin-bottom-right' : 'origin-top-right'
                    )}
                    style={{
                      top: `${menuPosition.top}px`,
                      left: `${menuPosition.left}px`,
                    }}
                  >
                    <div className="py-2">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href={`/licenses/${license._id}`}
                            className={clsx(
                              'mx-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm',
                              active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                            )}
                          >
                            <EyeIcon className="w-4 h-4" />
                            View
                          </Link>
                        )}
                      </Menu.Item>

                      {canEdit && (
                        <>
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href={`/licenses/${license._id}/edit`}
                                className={clsx(
                                  'mx-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm',
                                  active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                                )}
                              >
                                <PencilIcon className="w-4 h-4" />
                                Edit
                              </Link>
                            )}
                          </Menu.Item>
                          <div className="my-2 border-t border-slate-200/70"></div>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => onDelete(license._id)}
                                className={clsx(
                                  'mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-xl px-3 py-2 text-left text-sm',
                                  active ? 'bg-rose-50 text-rose-700' : 'text-rose-600'
                                )}
                              >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </Menu.Item>
                        </>
                      )}
                    </div>
                  </Menu.Items>
                </Transition>,
                document.body
              )}
          </>
        );
      }}
    </Menu>
  );
}

export function LicenseTable({ licenses, onDelete, sortBy, sortOrder, onSort }: LicenseTableProps) {
  const { user } = useAuth();
  const canEdit = user?.role === 'owner' || user?.role === 'admin';
  const expiringSoonThreshold = new Date();
  expiringSoonThreshold.setDate(expiringSoonThreshold.getDate() + 90);

  if (!licenses.length) {
    return (
      <div className="glass-panel rounded-[30px] p-12 text-center">
        <p className="text-lg font-medium text-slate-700">No licenses found</p>
        <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden rounded-[24px]">
      <div className="border-b border-white/50 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">License Ledger</p>
            <h3 className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-900">
              Current license records
            </h3>
          </div>
          <div className="rounded-full border border-slate-200/70 bg-slate-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {licenses.length} rows
          </div>
        </div>
      </div>
      <div className="overflow-x-auto px-3 py-3">
        <table className="w-full border-separate border-spacing-y-3 text-sm">
          <thead className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">License No</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Mobile</th>
              <th
                className="group cursor-pointer px-4 py-3 text-left transition-colors hover:text-slate-800"
                onClick={() => onSort?.('expiry_date')}
              >
                <div className="flex items-center gap-1">
                  Expiry
                  <span className="text-slate-400 group-hover:text-slate-600">
                    {sortBy === 'expiry_date' ? (
                      sortOrder === 'asc' ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )
                    ) : (
                      <div className="w-4 h-4 flex flex-col justify-center gap-0 opacity-50">
                        <ChevronUpIcon className="w-3 h-3 -mb-1" />
                        <ChevronDownIcon className="w-3 h-3 -mt-1" />
                      </div>
                    )}
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Approved</th>
              <th className="px-4 py-3 text-right">Fee</th>
              <th className="px-4 py-3 text-right">Profit</th>
              <th className="px-4 py-3 text-right w-12"></th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => {
              const isExpired = new Date(license.expiry_date) < new Date();
              const isExpiringSoon = !isExpired && new Date(license.expiry_date) < expiringSoonThreshold;

              return (
                <tr key={license._id} className="group transition-all duration-300">
                  <td className="rounded-l-[18px] border-y border-l border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3 shadow-[0_10px_20px_rgba(148,163,184,0.08)] transition group-hover:-translate-y-0.5 group-hover:bg-white/95">
                    <Link
                      href={`/licenses/${license._id}`}
                      className="font-semibold tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-primary"
                    >
                      {license.lic_no}
                    </Link>
                  </td>
                  <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3">
                    <div className="min-w-0">
                      <p className="max-w-[170px] truncate font-medium text-slate-900">
                        {license.customer_name}
                      </p>
                      <p className="text-xs text-slate-500">{license.aadhar_no}</p>
                    </div>
                  </td>
                  <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3 text-xs text-slate-600">
                    {license.mobile_no}
                  </td>
                  <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={clsx(
                          'text-xs font-medium',
                          isExpired
                            ? 'text-red-700'
                            : isExpiringSoon
                              ? 'text-amber-700'
                              : 'text-slate-700'
                        )}
                      >
                        {formatDate(license.expiry_date)}
                      </span>
                      {isExpired && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100">
                          Expired
                        </span>
                      )}
                      {isExpiringSoon && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                          Soon
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3">
                    <span
                      className={clsx(
                        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                        license.faceless_type === 'faceless'
                          ? 'border-sky-200 bg-sky-50/90 text-sky-700'
                          : 'border-slate-200 bg-slate-50/90 text-slate-700'
                      )}
                    >
                      {license.faceless_type}
                    </span>
                  </td>
                  <td className="border-y border-white/70 bg-white/70 px-3 py-3">
                    <span
                      className={clsx(
                        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                        license.approved
                          ? 'border-emerald-200 bg-emerald-50/90 text-emerald-700'
                          : 'border-amber-200 bg-amber-50/90 text-amber-700'
                      )}
                    >
                      {license.approved ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3 text-right font-medium tabular-nums text-slate-900">
                    {formatCurrency(license.fee)}
                  </td>
                  <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3 text-right tabular-nums">
                    <span
                      className={clsx(
                        'font-bold',
                        license.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      )}
                    >
                      {formatCurrency(license.profit)}
                    </span>
                  </td>
                  <td className="rounded-r-[18px] border-y border-r border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3 text-right">
                    <ActionsMenu license={license} onDelete={onDelete} canEdit={canEdit} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
