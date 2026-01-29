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
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Actions"
            >
              <EllipsisVerticalIcon className="w-4 h-4 text-gray-500" />
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
                      'fixed w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50',
                      openDirection === 'up' ? 'origin-bottom-right' : 'origin-top-right'
                    )}
                    style={{
                      top: `${menuPosition.top}px`,
                      left: `${menuPosition.left}px`,
                    }}
                  >
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href={`/policies/${policy.id}`}
                            className={clsx(
                              'flex items-center gap-2 px-3 py-2 text-sm',
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
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
                                'flex items-center gap-2 px-3 py-2 text-sm',
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
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
                              'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            )}
                          >
                            <EnvelopeIcon className="w-4 h-4" />
                            Email
                          </button>
                        )}
                      </Menu.Item>

                      {canDelete && (
                        <>
                          <div className="border-t border-gray-100 my-1"></div>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => onDelete(policy.id)}
                                className={clsx(
                                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                                  active ? 'bg-red-50 text-red-700' : 'text-red-600'
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
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-lg">No policies found</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80 text-xs text-gray-600 uppercase tracking-wide border-b border-gray-200">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Serial</th>
              <th className="px-3 py-2.5 text-left font-medium">Policy No</th>
              <th className="px-3 py-2.5 text-left font-medium">Customer</th>
              <th className="px-3 py-2.5 text-left font-medium">Vehicle</th>
              <th className="px-3 py-2.5 text-left font-medium">Ins. Company</th>
              <th className="px-3 py-2.5 text-left font-medium">Status</th>
              <th className="px-3 py-2.5 text-left font-medium">Payment</th>
              <th className="px-3 py-2.5 text-right font-medium">Premium</th>
              <th className="px-3 py-2.5 text-left font-medium">Expiry</th>
              <th className="px-3 py-2.5 text-right font-medium w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {policies.map((policy) => (
              <tr key={policy.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-3 py-2.5 text-gray-500 text-xs">{policy.serial_no || '-'}</td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/policies/${policy.id}`}
                    className="font-medium text-gray-900 hover:text-primary transition-colors"
                  >
                    {policy.policy_no}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate max-w-[180px]">
                      {policy.customer}
                    </p>
                    <p className="text-xs text-gray-500">{policy.mobile_no || '-'}</p>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-700 font-mono text-xs">
                  {policy.registration_number}
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-xs font-medium text-gray-600 uppercase">
                    {policy.ins_co_id || '-'}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      policy.ins_status === 'policy_done'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-700'
                    )}
                  >
                    {policy.ins_status === 'policy_done' ? 'Done' : policy.ins_status}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      policy.customer_payment_status === 'done'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-700'
                    )}
                  >
                    {policy.customer_payment_status === 'done' ? 'Paid' : 'Pending'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900 tabular-nums">
                  {formatCurrency(policy.net_premium ?? policy.premium_amount)}
                </td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">
                  {formatDate(policy.saod_end_date || policy.end_date)}
                </td>
                <td className="px-3 py-2.5 text-right">
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
