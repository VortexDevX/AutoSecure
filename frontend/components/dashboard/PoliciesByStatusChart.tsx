'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PoliciesByStatusChartProps {
  data: Array<{ _id: string; count: number }>;
}

export function PoliciesByStatusChart({ data }: PoliciesByStatusChartProps) {
  const chartData = data.map((item) => ({
    status: item._id || 'Unknown',
    count: item.count,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="font-semibold text-lg text-gray-900 mb-4">Policies by Status</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
