'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BranchData {
  _id: string;
  count: number;
  total_premium: number;
  total_commission: number;
}

interface BranchPerformanceProps {
  data: BranchData[];
}

export function BranchPerformance({ data }: BranchPerformanceProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600">Policies: {data.count}</p>
            <p className="text-sm text-green-600">Premium: {formatCurrency(data.total_premium)}</p>
            <p className="text-sm text-purple-600">
              Commission: {formatCurrency(data.total_commission)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Branch Performance</h3>
          <p className="text-sm text-gray-600">Policies and revenue by branch</p>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center h-64 text-gray-500">
            No branch data available
          </div>
        </CardBody>
      </Card>
    );
  }

  // Sort by total premium descending
  const sortedData = [...data].sort((a, b) => b.total_premium - a.total_premium);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Branch Performance</h3>
        <p className="text-sm text-gray-600">Policies and revenue by branch</p>
      </CardHeader>
      <CardBody>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="_id" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_premium" fill="#3B82F6" name="Premium" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedData.slice(0, 6).map((branch) => (
            <div key={branch._id} className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-900 text-sm">{branch._id}</p>
              <p className="text-xs text-gray-600">{branch.count} policies</p>
              <p className="text-xs text-blue-600 font-medium">
                {formatCurrency(branch.total_premium)}
              </p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
