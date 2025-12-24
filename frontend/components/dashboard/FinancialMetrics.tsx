'use client';

import { MetricCard } from './MetricCard';
import {
  CurrencyRupeeIcon,
  BanknotesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface FinancialMetricsProps {
  totalPremium: number;
  totalCommission: number;
  rangePremium: number;
  rangeCommission: number;
  rangeLabel?: string;
  previousRangePremium?: number;
  previousRangeCommission?: number;
}

export function FinancialMetrics({
  totalPremium,
  totalCommission,
  rangePremium,
  rangeCommission,
  rangeLabel = 'Selected Period',
  previousRangePremium,
  previousRangeCommission,
}: FinancialMetricsProps) {
  // Calculate growth percentages
  const premiumGrowth = previousRangePremium
    ? ((rangePremium - previousRangePremium) / previousRangePremium) * 100
    : null;

  const commissionGrowth = previousRangeCommission
    ? ((rangeCommission - previousRangeCommission) / previousRangeCommission) * 100
    : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Premium"
        value={formatCurrency(totalPremium)}
        subtitle="All time collected"
        icon={<CurrencyRupeeIcon className="w-6 h-6" />}
        color="green"
      />
      <MetricCard
        title="Total Commission"
        value={formatCurrency(totalCommission)}
        subtitle="All time earned"
        icon={<BanknotesIcon className="w-6 h-6" />}
        color="blue"
      />
      <MetricCard
        title="Period Premium"
        value={formatCurrency(rangePremium)}
        subtitle={rangeLabel.toLowerCase()}
        icon={<ChartBarIcon className="w-6 h-6" />}
        trend={
          premiumGrowth !== null
            ? {
                value: `${Math.abs(premiumGrowth).toFixed(1)}%`,
                isPositive: premiumGrowth >= 0,
              }
            : undefined
        }
        color="yellow"
      />
      <MetricCard
        title="Period Commission"
        value={formatCurrency(rangeCommission)}
        subtitle={rangeLabel.toLowerCase()}
        icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
        trend={
          commissionGrowth !== null
            ? {
                value: `${Math.abs(commissionGrowth).toFixed(1)}%`,
                isPositive: commissionGrowth >= 0,
              }
            : undefined
        }
        color="gray"
      />
    </div>
  );
}
