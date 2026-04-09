import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PoliciesByTypeChartProps {
  data: Array<{ _id: string; count: number }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function PoliciesByTypeChart({ data }: PoliciesByTypeChartProps) {
  const chartData = data.map((item) => ({
    name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unknown',
    value: item.count,
  }));

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-500">
        No data available
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-slate-900">Policies by Type</h3>
        <p className="text-sm text-slate-500">Distribution by insurance category</p>
      </div>
      <div className="h-48 min-w-0">
        <ResponsiveContainer width="100%" height={192} minWidth={0}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  strokeWidth={0}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-[16px] border border-slate-200 bg-[rgba(239,245,253,0.98)] p-3 shadow-[0_16px_30px_rgba(74,96,129,0.12)]">
        <p className="font-medium text-slate-900">{data.name}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.fill }} />
          <p className="text-sm text-slate-500">{data.value} policies</p>
        </div>
      </div>
    );
  }
  return null;
};
