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
  const colorStyles = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-white',
      border: 'border-blue-100',
      text: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-50 to-white',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    yellow: {
      bg: 'bg-gradient-to-br from-amber-50 to-white',
      border: 'border-amber-100',
      text: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
    gray: {
      bg: 'bg-gradient-to-br from-slate-50 to-white',
      border: 'border-slate-100',
      text: 'text-slate-600',
      iconBg: 'bg-slate-100',
    },
    red: {
      bg: 'bg-gradient-to-br from-rose-50 to-white',
      border: 'border-rose-100',
      text: 'text-rose-600',
      iconBg: 'bg-rose-100',
    },
  };

  const styles = colorStyles[color];

  return (
    <div
      className={clsx(
        'rounded-2xl p-6 border shadow-sm transition-all duration-200 hover:shadow-md',
        styles.bg,
        styles.border
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-500 font-medium text-sm tracking-wide uppercase">{title}</p>
        </div>
        {icon && <div className={clsx('p-2 rounded-lg', styles.iconBg, styles.text)}>{icon}</div>}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
        </div>
        {trend && (
          <div
            className={clsx(
              'flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full',
              trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
            )}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
