'use client';

import Link from 'next/link';
import { Fragment, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LicenseRecord } from '@/lib/types/license';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/hooks/useAuth';
import { EyeIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';

interface LicenseTableProps {
  licenses: LicenseRecord[];
  onDelete: (id: string) => void;
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
                      'fixed w-44 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50',
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
                            href={`/licenses/${license._id}`}
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
                        <>
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href={`/licenses/${license._id}/edit`}
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
                          <div className="border-t border-gray-100 my-1"></div>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => onDelete(license._id)}
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

export function LicenseTable({ licenses, onDelete }: LicenseTableProps) {
  const { user } = useAuth();
  const canEdit = user?.role === 'owner' || user?.role === 'admin';

  if (!licenses.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-lg">No licenses found</p>
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
              <th className="px-3 py-2.5 text-left font-medium">License No</th>
              <th className="px-3 py-2.5 text-left font-medium">Customer</th>
              <th className="px-3 py-2.5 text-left font-medium">Mobile</th>
              <th className="px-3 py-2.5 text-left font-medium">Expiry</th>
              <th className="px-3 py-2.5 text-left font-medium">Type</th>
              <th className="px-3 py-2.5 text-left font-medium">Approved</th>
              <th className="px-3 py-2.5 text-right font-medium">Fee</th>
              <th className="px-3 py-2.5 text-right font-medium">Profit</th>
              <th className="px-3 py-2.5 text-right font-medium w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {licenses.map((license) => {
              const isExpired = new Date(license.expiry_date) < new Date();
              const isExpiringSoon =
                !isExpired &&
                new Date(license.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

              return (
                <tr key={license._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/licenses/${license._id}`}
                      className="font-medium text-gray-900 hover:text-primary transition-colors"
                    >
                      {license.lic_no}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate max-w-[180px]">
                        {license.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">{license.aadhar_no}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs">{license.mobile_no}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={clsx(
                          'text-xs',
                          isExpired
                            ? 'text-red-600 font-medium'
                            : isExpiringSoon
                              ? 'text-amber-600 font-medium'
                              : 'text-gray-600'
                        )}
                      >
                        {formatDate(license.expiry_date)}
                      </span>
                      {isExpired && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                          Expired
                        </span>
                      )}
                      {isExpiringSoon && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                          Soon
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        license.faceless_type === 'faceless'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {license.faceless_type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        license.approved
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      )}
                    >
                      {license.approved ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-gray-900 tabular-nums">
                    {formatCurrency(license.fee)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span
                      className={clsx(
                        'font-semibold',
                        license.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {formatCurrency(license.profit)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
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
