import React from 'react';
import clsx from 'clsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'gray' | 'red';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-500',
    green: 'bg-green-50 border-green-200 text-green-500',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-500',
    gray: 'bg-gray-100 border-gray-200 text-gray-500',
    red: 'bg-red-50 border-red-200 text-red-500',
  };

  return (
    <div className={clsx('rounded-xl p-6 border shadow-sm', colorClasses[color])}>
      <div className="flex justify-between items-center mb-2">
        <p className="text-gray-700 font-medium text-sm">{title}</p>
        {icon && <div className="text-current">{icon}</div>}
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value.toLocaleString('en-IN')}</p>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      {trend && (
        <p
          className={clsx(
            'text-sm font-medium mt-1',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}
        >
          {trend.isPositive ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  );
}
