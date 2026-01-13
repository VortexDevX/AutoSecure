'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
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

interface PerformanceData {
  _id: string;
  count: number;
  total_premium: number;
  total_commission: number;
}

interface PerformanceChartProps {
  title: string;
  subtitle?: string;
  data: PerformanceData[] | null;
  isLoading?: boolean;
  emptyMessage?: string;
  labelFormatter?: (value: string) => string;
}

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
  '#84CC16',
  '#F97316',
  '#6366F1',
];

// Default label formatter - converts snake_case/camelCase to Title Case
const defaultLabelFormatter = (value: string): string => {
  if (!value) return 'N/A';
  // First, handle common patterns
  return value
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export function PerformanceChart({
  title,
  subtitle,
  data,
  isLoading,
  emptyMessage = 'No data available',
  labelFormatter = defaultLabelFormatter,
}: PerformanceChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
          <p className="font-semibold text-gray-900 mb-2">{labelFormatter(item._id)}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Policies:</span>
              <span className="font-medium text-gray-900">
                {item.count.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Premium:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(item.total_premium)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commission:</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(item.total_commission)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </CardHeader>
        <CardBody>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </CardHeader>
        <CardBody>
          <div className="h-64 flex items-center justify-center text-gray-500">{emptyMessage}</div>
        </CardBody>
      </Card>
    );
  }

  // Sort by premium and take top items
  const sortedData = [...data].sort((a, b) => b.total_premium - a.total_premium).slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </CardHeader>
      <CardBody>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} fontSize={11} />
              <YAxis
                type="category"
                dataKey="_id"
                width={120}
                fontSize={11}
                tickFormatter={(value) => {
                  const label = labelFormatter(value);
                  return label.length > 15 ? `${label.substring(0, 15)}...` : label;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_premium" name="Premium" radius={[0, 4, 4, 0]} maxBarSize={30}>
                {sortedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
