'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueData {
  _id: { year: number; month: number; day?: number };
  count: number;
  total_premium: number;
  total_commission: number;
}

interface RevenueTrendChartProps {
  data: RevenueData[] | null;
  period: 'daily' | 'monthly' | 'yearly';
}

export function RevenueTrendChart({ data, period }: RevenueTrendChartProps) {
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
          <p className="font-medium text-gray-900 mb-2">
            {period === 'yearly'
              ? data._id.year
              : period === 'monthly'
              ? new Date(data._id.year, data._id.month - 1).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : new Date(data._id.year, data._id.month - 1, data._id.day).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric', year: 'numeric' }
                )}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600">Premium: {formatCurrency(data.total_premium)}</p>
            <p className="text-sm text-green-600">
              Commission: {formatCurrency(data.total_commission)}
            </p>
            <p className="text-sm text-gray-600">Policies: {data.count}</p>
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
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          <p className="text-sm text-gray-600">Premium and commission over time</p>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center h-64 text-gray-500">
            No revenue data available
          </div>
        </CardBody>
      </Card>
    );
  }

  // Sort data by date and create proper data structure for the chart
  const sortedData = [...(data || [])]
    .sort((a, b) => {
      if (a._id.year !== b._id.year) return a._id.year - b._id.year;
      if (a._id.month !== b._id.month) return a._id.month - b._id.month;
      return (a._id.day || 0) - (b._id.day || 0);
    })
    .map((item) => ({
      ...item,
      dateKey:
        period === 'yearly'
          ? item._id.year.toString()
          : period === 'monthly'
          ? `${item._id.year}-${(item._id.month || 1).toString().padStart(2, '0')}`
          : `${item._id.year}-${(item._id.month || 1).toString().padStart(2, '0')}-${(
              item._id.day || 1
            )
              .toString()
              .padStart(2, '0')}`,
      displayDate:
        period === 'yearly'
          ? item._id.year.toString()
          : period === 'monthly'
          ? new Date(item._id.year, (item._id.month || 1) - 1).toLocaleDateString('en-US', {
              month: 'short',
              year: '2-digit',
            })
          : new Date(
              item._id.year,
              (item._id.month || 1) - 1,
              item._id.day || 1
            ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
        <p className="text-sm text-gray-600">Premium and commission over time</p>
      </CardHeader>
      <CardBody>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sortedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="displayDate" fontSize={11} interval="preserveStartEnd" />
              <YAxis
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                fontSize={11}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="total_premium"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Premium"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="total_commission"
                stroke="#10B981"
                strokeWidth={2}
                name="Commission"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
