import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

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
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Policies by Type</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center h-64 text-gray-500">
            No data available
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Policies by Type</h3>
            <p className="text-sm text-gray-600">Distribution by insurance category</p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
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
      </CardBody>
    </Card>
  );
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900">{data.name}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.fill }} />
          <p className="text-sm text-gray-600">{data.value} policies</p>
        </div>
      </div>
    );
  }
  return null;
};
