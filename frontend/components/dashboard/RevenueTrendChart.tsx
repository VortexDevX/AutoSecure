'use client';

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
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        No revenue data available
      </div>
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
    <div className="min-w-0">
      <div className="h-64 min-w-0">
        <ResponsiveContainer width="100%" height={256} minWidth={0}>
          <LineChart data={sortedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="displayDate" fontSize={11} interval="preserveStartEnd" />
            <YAxis
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              fontSize={11}
              width={50}
            />

            <Tooltip content={<CustomTooltip period={period} />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="total_premium"
              stroke="#475569"
              strokeWidth={2}
              name="Premium"
              dot={{ fill: '#475569', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="total_commission"
              stroke="#2563eb"
              strokeWidth={2}
              name="Commission"
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  period: 'daily' | 'monthly' | 'yearly';
}

const CustomTooltip = ({ active, payload, period }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-[16px] border border-slate-200 bg-[rgba(239,245,253,0.98)] p-3 shadow-[0_16px_30px_rgba(74,96,129,0.12)]">
        <p className="mb-2 font-medium text-slate-900">
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
          <p className="text-sm text-slate-700">Premium: {formatCurrency(data.total_premium)}</p>
          <p className="text-sm text-blue-700">
            Commission: {formatCurrency(data.total_commission)}
          </p>
          <p className="text-sm text-slate-500">Policies: {data.count}</p>
        </div>
      </div>
    );
  }
  return null;
};
