'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendData } from '@/lib/api/analytics';

interface MonthlyTrendChartProps {
  data: TrendData | null;
}

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (!data || !data.trends.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Monthly Trend</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No trend data available
        </div>
      </div>
    );
  }

  const chartData = data.trends.map((item) => ({
    month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
    policies: item.count,
    premium: item.total_premium,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="font-semibold text-lg text-gray-900 mb-4">Monthly Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="policies"
            stroke="#3B82F6"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="premium"
            stroke="#10B981"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
