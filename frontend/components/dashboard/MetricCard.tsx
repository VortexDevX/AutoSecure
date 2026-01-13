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
  valueFormat?: 'number' | 'currency';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  valueFormat = 'number',
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

  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;
    if (valueFormat === 'currency') {
      // Format as compact currency for large values
      if (val >= 10000000) {
        return `₹${(val / 10000000).toFixed(2)}Cr`;
      }
      if (val >= 100000) {
        return `₹${(val / 100000).toFixed(2)}L`;
      }
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val.toLocaleString('en-IN');
  };

  return (
    <div
      className={clsx(
        'rounded-xl p-4 border shadow-sm transition-all duration-200 hover:shadow-md',
        styles.bg,
        styles.border
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-gray-500 font-medium text-xs tracking-wide uppercase truncate">
            {title}
          </p>
        </div>
        {icon && <div className={clsx('p-1.5 rounded-lg', styles.iconBg, styles.text)}>{icon}</div>}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-bold text-gray-900 mb-0.5">{formatValue(value)}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {trend && (
          <div
            className={clsx(
              'flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full',
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
