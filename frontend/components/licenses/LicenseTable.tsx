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
    <div className="">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-2 px-2">
          <thead className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">License No</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Mobile</th>
              <th className="px-4 py-3 text-left">Expiry</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Approved</th>
              <th className="px-4 py-3 text-right">Fee</th>
              <th className="px-4 py-3 text-right">Profit</th>
              <th className="px-4 py-3 text-right w-12"></th>
            </tr>
          </thead>
          <tbody className="space-y-3">
            {licenses.map((license) => {
              const isExpired = new Date(license.expiry_date) < new Date();
              const isExpiringSoon =
                !isExpired &&
                new Date(license.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

              return (
                <tr
                  key={license._id}
                  className="bg-white shadow-sm hover:shadow-md rounded-2xl transition-all duration-200 group"
                >
                  <td className="px-4 py-3 first:rounded-l-2xl last:rounded-r-2xl border-y border-l border-gray-100 group-hover:border-primary-100">
                    <Link
                      href={`/licenses/${license._id}`}
                      className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors"
                    >
                      {license.lic_no}
                    </Link>
                  </td>
                  <td className="px-4 py-3 first:rounded-l-2xl last:rounded-r-2xl border-y border-gray-100 group-hover:border-primary-100">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate max-w-[150px]">
                        {license.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">{license.aadhar_no}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 first:rounded-l-2xl last:rounded-r-2xl text-gray-600 text-xs border-y border-gray-100 group-hover:border-primary-100">
                    {license.mobile_no}
                  </td>
                  <td className="px-4 py-3 first:rounded-l-2xl last:rounded-r-2xl border-y border-gray-100 group-hover:border-primary-100">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={clsx(
                          'text-xs font-medium',
                          isExpired
                            ? 'text-red-700'
                            : isExpiringSoon
                              ? 'text-amber-700'
                              : 'text-gray-700'
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
                  <td className="px-4 py-3 first:rounded-l-2xl last:rounded-r-2xl border-y border-gray-100 group-hover:border-primary-100">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        license.faceless_type === 'faceless'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-gray-50 text-gray-700 border border-gray-100'
                      )}
                    >
                      {license.faceless_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 first:rounded-l-2xl last:rounded-r-2xl border-y border-gray-100 group-hover:border-primary-100">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        license.approved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      )}
                    >
                      {license.approved ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 first:rounded-l-2xl last:rounded-r-2xl text-right font-medium text-gray-900 tabular-nums border-y border-gray-100 group-hover:border-primary-100">
                    {formatCurrency(license.fee)}
                  </td>
                  <td className="px-4 py-3 first:rounded-l-2xl last:rounded-r-2xl text-right tabular-nums border-y border-gray-100 group-hover:border-primary-100">
                    <span
                      className={clsx(
                        'font-bold',
                        license.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      )}
                    >
                      {formatCurrency(license.profit)}
                    </span>
                  </td>
                  <td className="px-4 py-3 first:rounded-l-2xl last:rounded-r-2xl text-right border-y border-r border-gray-100 group-hover:border-primary-100">
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
