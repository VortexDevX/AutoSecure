'use client';

import Link from 'next/link';
import { LicenseRecord } from '@/lib/types/license';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface LicenseTableProps {
  licenses: LicenseRecord[];
  onDelete: (id: string) => void;
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
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap">License No</th>
              <th className="px-6 py-3 whitespace-nowrap">Customer</th>
              <th className="px-6 py-3 whitespace-nowrap">Mobile</th>
              <th className="px-6 py-3 whitespace-nowrap">Expiry Date</th>
              <th className="px-6 py-3 whitespace-nowrap">Type</th>
              <th className="px-6 py-3 whitespace-nowrap">Approved</th>
              <th className="px-6 py-3 whitespace-nowrap">Fee</th>
              <th className="px-6 py-3 whitespace-nowrap">Profit</th>
              <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => {
              const isExpired = new Date(license.expiry_date) < new Date();
              const isExpiringSoon =
                !isExpired &&
                new Date(license.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

              return (
                <tr key={license._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    <Link href={`/licenses/${license._id}`} className="hover:text-primary">
                      {license.lic_no}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{license.customer_name}</p>
                      <p className="text-xs text-gray-500">{license.aadhar_no}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{license.mobile_no}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          isExpired
                            ? 'text-red-600'
                            : isExpiringSoon
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                        }
                      >
                        {formatDate(license.expiry_date)}
                      </span>
                      {isExpired && (
                        <Badge variant="danger" size="sm">
                          Expired
                        </Badge>
                      )}
                      {isExpiringSoon && (
                        <Badge variant="warning" size="sm">
                          Soon
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={license.faceless_type === 'faceless' ? 'info' : 'default'}>
                      {license.faceless_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={license.approved ? 'success' : 'warning'}>
                      {license.approved ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {formatCurrency(license.fee)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`font-semibold ${license.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(license.profit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/licenses/${license._id}`}
                        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                        title="View"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Link>
                      {canEdit && (
                        <>
                          <Link
                            href={`/licenses/${license._id}/edit`}
                            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => onDelete(license._id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
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
