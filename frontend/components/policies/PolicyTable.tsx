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
const MENU_ITEM_HEIGHT = 40; // Each menu item ~40px
const MENU_DIVIDER_HEIGHT = 9; // Divider with margin ~9px
const MENU_PADDING = 8; // py-1 = 8px total

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

  // Calculate actual menu height based on visible items
  const getMenuHeight = () => {
    let itemCount = 2; // View Details + Send Email (always visible)
    if (canEdit) itemCount += 1; // Edit Policy
    if (canDelete) itemCount += 1; // Delete Policy

    const dividerCount = canDelete ? 1 : 0; // Divider only shows before Delete

    return itemCount * MENU_ITEM_HEIGHT + dividerCount * MENU_DIVIDER_HEIGHT + MENU_PADDING;
  };

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = getMenuHeight();

      // Determine if we should open up or down
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      setOpenDirection(shouldOpenUp ? 'up' : 'down');

      // Calculate left position (ensure menu doesn't go off-screen)
      let left = rect.right + window.scrollX - 224; // 224 = menu width (w-56 = 14rem = 224px)
      if (left < 8) left = 8; // Minimum 8px from left edge

      if (shouldOpenUp) {
        // Position above the button
        setMenuPosition({
          top: rect.top + window.scrollY - menuHeight - 8,
          left,
        });
      } else {
        // Position below the button
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Actions"
            >
              <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
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
                      'fixed w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50',
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
                              'flex items-center gap-2 px-4 py-2 text-sm',
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            )}
                          >
                            <EyeIcon className="w-4 h-4" />
                            View Details
                          </Link>
                        )}
                      </Menu.Item>

                      {/* Edit - Only for admin/owner */}
                      {canEdit && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={`/policies/${policy.id}/edit`}
                              className={clsx(
                                'flex items-center gap-2 px-4 py-2 text-sm',
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              )}
                            >
                              <PencilIcon className="w-4 h-4" />
                              Edit Policy
                            </Link>
                          )}
                        </Menu.Item>
                      )}

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => onSendEmail(policy.id)}
                            className={clsx(
                              'w-full flex items-center gap-2 px-4 py-2 text-sm text-left',
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            )}
                          >
                            <EnvelopeIcon className="w-4 h-4" />
                            Send Email
                          </button>
                        )}
                      </Menu.Item>

                      {/* Delete - Only for admin/owner */}
                      {canDelete && (
                        <>
                          <div className="border-t border-gray-100 my-1"></div>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => onDelete(policy.id)}
                                className={clsx(
                                  'w-full flex items-center gap-2 px-4 py-2 text-sm text-left',
                                  active ? 'bg-red-50 text-red-700' : 'text-red-600'
                                )}
                              >
                                <TrashIcon className="w-4 h-4" />
                                Delete Policy
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

  // Users can only view and send email, not edit or delete
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
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap">Serial No.</th>
              <th className="px-6 py-3 whitespace-nowrap">Policy No.</th>
              <th className="px-6 py-3 whitespace-nowrap">Customer</th>
              <th className="px-6 py-3 whitespace-nowrap">Vehicle</th>
              <th className="px-6 py-3 whitespace-nowrap">Status</th>
              <th className="px-6 py-3 whitespace-nowrap">Payment</th>
              <th className="px-6 py-3 whitespace-nowrap">Net Premium</th>
              <th className="px-6 py-3 whitespace-nowrap">Expiry Date</th>
              <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                  {policy.serial_no || '-'}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  <Link href={`/policies/${policy.id}`} className="hover:text-primary">
                    {policy.policy_no}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-gray-900">{policy.customer}</p>
                    <p className="text-xs text-gray-500">{policy.mobile_no || '-'}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{policy.registration_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={clsx(
                      'badge',
                      policy.ins_status === 'policy_done' ? 'badge-success' : 'badge-warning'
                    )}
                  >
                    {policy.ins_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={clsx(
                      'badge',
                      policy.customer_payment_status === 'done' ? 'badge-success' : 'badge-warning'
                    )}
                  >
                    {policy.customer_payment_status}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold whitespace-nowrap">
                  {formatCurrency(policy.net_premium ?? policy.premium_amount)}
                </td>
                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                  {/* FIX: Show saod_end_date if available, otherwise end_date */}
                  {formatDate(policy.saod_end_date || policy.end_date)}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
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
