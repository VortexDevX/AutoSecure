// frontend/components/policies/PolicyTable.tsx
'use client';

import Link from 'next/link';
import { Fragment, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PolicyListItem } from '@/lib/types/policy';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';

interface PolicyTableProps {
  policies: PolicyListItem[];
  onDelete: (id: string) => void;
  onSendEmail: (id: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

// Menu item heights for position calculation
const MENU_ITEM_HEIGHT = 40;
const MENU_DIVIDER_HEIGHT = 9;
const MENU_PADDING = 8;

function ActionsMenu({
  policy,
  onDelete,
  onSendEmail,
  canEdit,
  canDelete,
}: {
  policy: PolicyListItem;
  onDelete: (id: string) => void;
  onSendEmail: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getMenuHeight = () => {
    let itemCount = 2;
    if (canEdit) itemCount += 1;
    if (canDelete) itemCount += 1;
    const dividerCount = canDelete ? 1 : 0;
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

      let left = rect.right + window.scrollX - 224;
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
                      'fixed z-50 w-48 rounded-2xl border border-slate-200/70 bg-[rgba(239,245,253,0.96)] shadow-[0_24px_48px_rgba(74,96,129,0.18)] backdrop-blur-xl focus:outline-none',
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
                            href={`/policies/${policy.id}`}
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
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={`/policies/${policy.id}/edit`}
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
                      )}

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => onSendEmail(policy.id)}
                            className={clsx(
                              'mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-xl px-3 py-2 text-left text-sm',
                              active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                            )}
                          >
                            <EnvelopeIcon className="w-4 h-4" />
                            Email
                          </button>
                        )}
                      </Menu.Item>

                      {canDelete && (
                        <>
                          <div className="my-2 border-t border-slate-200/70"></div>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => onDelete(policy.id)}
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

export function PolicyTable({ policies, onDelete, onSendEmail }: PolicyTableProps) {
  const { user } = useAuth();

  const canEdit = user?.role === 'owner' || user?.role === 'admin';
  const canDelete = user?.role === 'owner' || user?.role === 'admin';

  if (!policies.length) {
    return (
      <div className="glass-panel rounded-[30px] p-12 text-center">
        <p className="text-lg font-medium text-slate-700">No policies found</p>
        <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden rounded-[24px]">
      <div className="border-b border-white/50 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Policy Ledger</p>
            <h3 className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-900">
              Active policy records
            </h3>
          </div>
          <div className="rounded-full border border-slate-200/70 bg-slate-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {policies.length} rows
          </div>
        </div>
      </div>
      <div className="overflow-x-auto px-3 py-3">
        <table className="w-full border-separate border-spacing-y-3 text-sm">
          <thead className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Serial</th>
              <th className="px-4 py-3 text-left">Policy No</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Vehicle</th>
              <th className="px-4 py-3 text-left">Ins. Company</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Payment</th>
              <th className="px-4 py-3 text-right">Premium</th>
              <th className="px-4 py-3 text-left">Expiry</th>
              <th className="px-4 py-3 text-right w-12"></th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id} className="group transition-all duration-300">
                <td className="rounded-l-[18px] border-y border-l border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3 text-xs text-slate-500 shadow-[0_10px_20px_rgba(148,163,184,0.08)] transition group-hover:-translate-y-0.5 group-hover:bg-white/95">
                  {policy.serial_no || '-'}
                </td>
                <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3">
                  <Link
                    href={`/policies/${policy.id}`}
                    className="font-semibold tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-primary"
                  >
                    {policy.policy_no}
                  </Link>
                </td>
                <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3">
                  <div className="min-w-0">
                    <p className="max-w-[170px] truncate font-medium text-slate-900">
                      {policy.customer}
                    </p>
                    <p className="text-xs text-slate-500">{policy.mobile_no || '-'}</p>
                  </div>
                </td>
                <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3 font-mono text-xs text-slate-700">
                  {policy.registration_number}
                </td>
                <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3">
                  <span className="inline-flex rounded-full border border-slate-200/70 bg-slate-50/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {policy.ins_co_id || '-'}
                  </span>
                </td>
                <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3">
                  <span
                    className={clsx(
                      'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                      policy.ins_status === 'policy_done'
                        ? 'border-emerald-200 bg-emerald-50/90 text-emerald-700'
                        : 'border-amber-200 bg-amber-50/90 text-amber-700'
                    )}
                  >
                    {policy.ins_status === 'policy_done' ? 'Done' : policy.ins_status}
                  </span>
                </td>
                <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3">
                  <span
                    className={clsx(
                      'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                      policy.customer_payment_status === 'done'
                        ? 'border-emerald-200 bg-emerald-50/90 text-emerald-700'
                        : 'border-rose-200 bg-rose-50/90 text-rose-700'
                    )}
                  >
                    {policy.customer_payment_status === 'done' ? 'Paid' : 'Pending'}
                  </span>
                </td>
                <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                  {formatCurrency(policy.net_premium ?? policy.premium_amount)}
                </td>
                <td className="border-y border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3 text-xs text-slate-500">
                  {formatDate(policy.saod_end_date || policy.end_date)}
                </td>
                <td className="rounded-r-[18px] border-y border-r border-slate-200/70 bg-[rgba(239,245,253,0.84)] px-3 py-3 text-right">
                  <ActionsMenu
                    policy={policy}
                    onDelete={onDelete}
                    onSendEmail={onSendEmail}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
