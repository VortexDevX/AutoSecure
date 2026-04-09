'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface LicenseStatusData {
  _id: string;
  count: number;
}

interface LicenseAnalyticsProps {
  statusBreakdown: LicenseStatusData[];
  totalLicenses: number;
}

interface LicenseTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload: { color: string };
  }>;
  totalLicenses: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  expired: 'Expired',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
  pending: 'Pending',
  renewed: 'Renewed',
};

function LicenseTooltipContent({ active, payload, totalLicenses }: LicenseTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percentage = ((data.value / totalLicenses) * 100).toFixed(1);
    return (
      <div className="rounded-[16px] border border-slate-200 bg-[rgba(239,245,253,0.98)] p-3 shadow-[0_16px_30px_rgba(74,96,129,0.12)]">
        <p className="font-medium text-slate-900">{data.name}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <p className="text-sm text-slate-500">
            {data.value} licenses ({percentage}%)
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function LicenseAnalytics({ statusBreakdown, totalLicenses }: LicenseAnalyticsProps) {
  const chartData = statusBreakdown.map((item, index) => ({
    name: STATUS_LABELS[item._id] || item._id,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));

  if (!statusBreakdown || statusBreakdown.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        No license data available
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-slate-900">License Status Distribution</h3>
        <p className="text-sm text-slate-500">Breakdown of license statuses</p>
      </div>
      <div className="h-48 min-w-0">
        <ResponsiveContainer width="100%" height={192} minWidth={0}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<LicenseTooltipContent totalLicenses={totalLicenses} />} />
            <Legend
              verticalAlign="bottom"
              height={30}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color, fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {chartData.slice(0, 4).map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-slate-500">
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
