'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export type DateRangePreset = '7d' | '30d' | '3m' | '6m' | '1y' | 'all';

export interface DateRangeOption {
  key: DateRangePreset;
  label: string;
  description: string;
}

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { key: '7d', label: 'Last 7 Days', description: 'Past week' },
  { key: '30d', label: 'Last 30 Days', description: 'Past month' },
  { key: '3m', label: 'Last 3 Months', description: 'Past quarter' },
  { key: '6m', label: 'Last 6 Months', description: 'Past half year' },
  { key: '1y', label: 'Last Year', description: 'Past 12 months' },
  { key: 'all', label: 'All Time', description: 'Complete history' },
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
    <div className={clsx('relative', className)}>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="text-left">
          <div className="font-medium">{selectedOption?.label}</div>
          <div className="text-xs text-gray-500">{selectedOption?.description}</div>
        </div>
        <ChevronDownIcon className="w-4 h-4 ml-2" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
            {DATE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  onRangeChange(option.key);
                  setIsOpen(false);
                }}
                className={clsx(
                  'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                  'first:rounded-t-lg last:rounded-b-lg',
                  selectedRange === option.key && 'bg-primary/5 text-primary'
                )}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export { DATE_RANGE_OPTIONS };
