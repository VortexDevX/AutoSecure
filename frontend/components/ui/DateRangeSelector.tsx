'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export type DateRangePreset =
  | '7d'
  | 'this_month'
  | 'last_month'
  | 'last_year'
  | 'this_year'
  | 'all'
  | 'custom';

export interface DateRangeOption {
  key: DateRangePreset;
  label: string;
  description: string;
}

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { key: '7d', label: 'Last 7 Days', description: 'Past week' },
  { key: 'this_month', label: 'This Month', description: 'Current month' },
  { key: 'last_month', label: 'Last Month', description: 'Previous month' },
  { key: 'this_year', label: 'This Year', description: 'Current year' },
  { key: 'last_year', label: 'Last Year', description: 'Previous year' },
  { key: 'all', label: 'All Time', description: 'Complete history' },
  { key: 'custom', label: 'Custom Range', description: 'Select start & end' },
];

interface DateRangeSelectorProps {
  selectedRange: DateRangePreset;
  onRangeChange: (range: DateRangePreset) => void;
  className?: string;
}

export function DateRangeSelector({
  selectedRange,
  onRangeChange,
  className,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = DATE_RANGE_OPTIONS.find((opt) => opt.key === selectedRange);

  return (
    <div className={clsx('relative z-[120]', className)}>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="text-left">
          <div className="font-medium">{selectedOption?.label}</div>
          <div className="text-xs text-slate-500">{selectedOption?.description}</div>
        </div>
        <ChevronDownIcon className="w-4 h-4 ml-2" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[115]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-[120] mt-1 overflow-hidden rounded-[18px] border border-slate-200/90 bg-[rgba(239,245,253,0.98)] shadow-[0_16px_32px_rgba(74,96,129,0.12)]">
            {DATE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  onRangeChange(option.key);
                  setIsOpen(false);
                }}
                className={clsx(
                  'w-full px-4 py-3 text-left transition-colors hover:bg-slate-100/80',
                  selectedRange === option.key && 'bg-slate-100/80 text-slate-900'
                )}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-slate-500">{option.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export { DATE_RANGE_OPTIONS };
