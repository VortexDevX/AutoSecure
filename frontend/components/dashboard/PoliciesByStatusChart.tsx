'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface PoliciesByStatusChartProps {
  data: Array<{ _id: string; count: number }>;
}

export function PoliciesByStatusChart({ data }: PoliciesByStatusChartProps) {
  const chartData = data.map((item) => ({
    status: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unknown', // Capitalize
    count: item.count,
  }));

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        No policy data available
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-slate-900">Policies by Status</h3>
        <p className="text-sm text-slate-500">Distribution of policy statuses</p>
      </div>
      <div className="h-64 min-w-0">
        <ResponsiveContainer width="100%" height={256} minWidth={0}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
            <XAxis
              dataKey="status"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip cursor={{ fill: '#F3F4F6' }} content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[16px] border border-slate-200 bg-[rgba(239,245,253,0.98)] p-3 shadow-[0_16px_30px_rgba(74,96,129,0.12)]">
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">{payload[0].value} policies</p>
      </div>
    );
  }
  return null;
};
