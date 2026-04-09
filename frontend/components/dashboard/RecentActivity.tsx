'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { usePrivacy } from '@/lib/context/PrivacyContext';
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
  const { formatPrivacyValue } = usePrivacy();

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
      <div className="p-4">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Recent Activity</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-[14px] bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!policies.length) {
    return (
      <div className="p-4">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Recent Activity</h3>
        <p className="py-8 text-center text-slate-500">No policies created yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200/80 p-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Activity</h3>
        <Link href="/policies" className="text-xs font-semibold text-primary uppercase tracking-wider hover:text-primary-600 transition-colors">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Policy No.</th>
              <th className="table-header-cell">Customer</th>
              <th className="table-header-cell">Vehicle</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Premium</th>
              <th className="table-header-cell">Created</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {policies.map((policy) => (
              <tr key={policy.id} className="table-row">
                <td className="table-cell font-semibold text-slate-900">
                  <Link href={`/policies/${policy.id}`} className="hover:text-primary transition-colors">
                    {policy.policy_no}
                  </Link>
                </td>
                <td className="table-cell text-slate-600">{policy.customer}</td>
                <td className="table-cell text-slate-500">{policy.registration_number}</td>
                <td className="table-cell">
                  <span className={`badge uppercase tracking-tighter ${
                    policy.ins_status === 'active' ? 'badge-success'
                    : policy.ins_status === 'expired' ? 'badge-danger'
                    : 'badge-gray'
                  }`}>
                    {policy.ins_status}
                  </span>
                </td>
                <td className="table-cell font-semibold text-slate-900">
                  {formatPrivacyValue('₹' + policy.premium_amount.toLocaleString('en-IN'))}
                </td>
                <td className="table-cell text-slate-400 text-xs">
                  {formatRelativeTime(policy.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
