'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { formatDate, formatRelativeTime } from '@/lib/utils/formatters';
import Link from 'next/link';

interface RecentPolicy {
  id: string;
  policy_no: string;
  customer: string;
  registration_number: string;
  ins_status: string;
  premium_amount: number;
  created_at: string;
  created_by?: { email: string; full_name?: string };
}

export function RecentActivity() {
  const [policies, setPolicies] = useState<RecentPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await apiClient.get(
          '/api/v1/policies?limit=5&sort_by=createdAt&sort_order=desc'
        );
        setPolicies(response.data.data?.policies || []);
      } catch (error) {
        console.error('Failed to fetch recent policies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecent();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!policies.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-gray-500 text-center py-8">No policies created yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-3">Policy No.</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Vehicle</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Premium</th>
              <th className="px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <Link href={`/policies/${policy.id}`} className="hover:text-primary">
                    {policy.policy_no}
                  </Link>
                </td>
                <td className="px-6 py-4">{policy.customer}</td>
                <td className="px-6 py-4">{policy.registration_number}</td>
                <td className="px-6 py-4">
                  <span className="badge-primary">{policy.ins_status}</span>
                </td>
                <td className="px-6 py-4">₹{policy.premium_amount.toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 text-gray-500">{formatRelativeTime(policy.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
