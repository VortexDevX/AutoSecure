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
import { usePrivacy } from '@/lib/context/PrivacyContext';

interface PerformanceData {
  _id: string;
  count: number;
  total_premium: number;
  total_commission: number;
  total_profit?: number;
}

interface PerformanceChartProps {
  title: string;
  subtitle?: string;
  data: PerformanceData[] | null;
  isLoading?: boolean;
  emptyMessage?: string;
  labelFormatter?: (value: string) => string;
}

interface PerformanceTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PerformanceData }>;
  formatPrivacyValue: (value: string) => string;
  labelFormatter: (value: string) => string;
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

const formatCompactCurrency = (value: number) => {
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

function PerformanceTooltipContent({
  active,
  payload,
  formatPrivacyValue,
  labelFormatter,
}: PerformanceTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="min-w-[200px] rounded-[16px] border border-slate-200 bg-[rgba(239,245,253,0.98)] p-3 shadow-[0_16px_30px_rgba(74,96,129,0.12)]">
        <p className="mb-2 font-semibold text-slate-900">{labelFormatter(item._id)}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Policies:</span>
            <span className="font-medium text-slate-900">{item.count.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Net Premium:</span>
            <span className="font-medium text-slate-700">
              {formatPrivacyValue(formatCompactCurrency(item.total_premium))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Commission:</span>
            <span className="font-medium text-amber-700">
              {formatPrivacyValue(formatCompactCurrency(item.total_commission))}
            </span>
          </div>
          {item.total_profit !== undefined && (
            <div className="mt-1 flex justify-between border-t border-slate-200 pt-1">
              <span className="font-medium text-slate-500">Profit:</span>
              <span className="font-bold text-slate-900">
                {formatPrivacyValue(formatCompactCurrency(item.total_profit))}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export function PerformanceChart({
  title,
  subtitle,
  data,
  isLoading,
  emptyMessage = 'No data available',
  labelFormatter = defaultLabelFormatter,
}: PerformanceChartProps) {
  const { formatPrivacyValue } = usePrivacy();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
          <span className="text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">{emptyMessage}</div>
    );
  }

  // Sort by premium and take top items
  const sortedData = [...data].sort((a, b) => b.total_premium - a.total_premium).slice(0, 8);

  return (
    <div className="min-w-0">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="h-64 min-w-0">
        <ResponsiveContainer width="100%" height={256} minWidth={0}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" tickFormatter={(value) => formatCompactCurrency(value)} fontSize={11} />
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
            <Tooltip
              content={
                <PerformanceTooltipContent
                  formatPrivacyValue={formatPrivacyValue}
                  labelFormatter={labelFormatter}
                />
              }
            />
            <Bar dataKey="total_premium" name="Premium" radius={[0, 4, 4, 0]} maxBarSize={30}>
              {sortedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
