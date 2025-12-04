'use client';

import { forwardRef, useState, useRef, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  getYear,
  getMonth,
  parseISO,
} from 'date-fns';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';

// Default year range
const currentYear = getYear(new Date());
const DEFAULT_MIN_YEAR = 1900;
const DEFAULT_MAX_YEAR = currentYear + 15;

// Generate year options
const generateYears = (minYear: number, maxYear: number) => {
  const years: number[] = [];
  for (let year = maxYear; year >= minYear; year--) {
    years.push(year);
  }
  return years;
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// ============================================
// Single Date Picker (for forms)
// ============================================
interface SingleDatePickerProps {
  value?: Date | string | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  minYear?: number;
  maxYear?: number;
  className?: string;
  isClearable?: boolean;
}

export function SingleDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  error,
  label,
  minDate,
  maxDate,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = DEFAULT_MAX_YEAR,
  className = '',
  isClearable = true,
}: SingleDatePickerProps) {
  const years = generateYears(minYear, maxYear);

  // Convert string to Date if needed
  const getDateValue = (): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      // Parse ISO string and create date at noon to avoid timezone issues
      const parsed = parseISO(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  const dateValue = getDateValue();

  // FIX: Handle date selection properly to avoid timezone shift
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      onChange(null);
      return;
    }

    // Create a new date at noon local time to avoid timezone boundary issues
    // This ensures the date doesn't shift when converted to/from ISO string
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Set to noon to avoid any timezone edge cases
    const normalizedDate = new Date(year, month, day, 12, 0, 0, 0);
    onChange(normalizedDate);
  };

  const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
    ({ value: displayValue, onClick }, ref) => (
      <button
        type="button"
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 
          border rounded-lg text-left text-sm
          transition-colors duration-150
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'}
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20'}
        `}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
            {displayValue || placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {displayValue && isClearable && !disabled && (
            <XMarkIcon
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            />
          )}
        </div>
      </button>
    )
  );
  CustomInput.displayName = 'CustomInput';

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <ReactDatePicker
        selected={dateValue}
        onChange={handleDateChange}
        customInput={<CustomInput />}
        dateFormat="dd MMM yyyy"
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        showPopperArrow={false}
        popperClassName="date-picker-popper"
        calendarClassName="date-picker-calendar"
        wrapperClassName="w-full"
        renderCustomHeader={({
          date,
          changeYear,
          changeMonth,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <button
              type="button"
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
            </button>

            <div className="flex items-center gap-1">
              <select
                value={getMonth(date)}
                onChange={({ target: { value } }) => changeMonth(Number(value))}
                className="text-sm font-medium bg-transparent border-none cursor-pointer focus:ring-0 pr-1"
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={getYear(date)}
                onChange={({ target: { value } }) => changeYear(Number(value))}
                className="text-sm font-medium bg-transparent border-none cursor-pointer focus:ring-0"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ============================================
// Date Range Picker with Presets (for exports/filters)
// ============================================
export type DatePreset =
  | 'today'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'custom';

interface DateRangeValue {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value?: DateRangeValue;
  onChange: (range: DateRangeValue | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  showPresets?: boolean;
  minYear?: number;
  maxYear?: number;
  className?: string;
}

interface PresetOption {
  value: DatePreset;
  label: string;
}

const PRESETS: PresetOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'lastYear', label: 'Last Year' },
  { value: 'custom', label: 'Custom' },
];

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  disabled = false,
  error,
  label,
  showPresets = true,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = DEFAULT_MAX_YEAR,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<DatePreset | null>(null);
  const [tempRange, setTempRange] = useState<DateRangeValue>({ from: null, to: null });
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const years = generateYears(minYear, maxYear);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (value) {
      setTempRange(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (preset: DatePreset) => {
    setActivePreset(preset);
    const today = new Date();
    let range: DateRangeValue;

    switch (preset) {
      case 'today':
        range = { from: today, to: today };
        break;
      case 'last30':
        range = { from: subDays(today, 30), to: today };
        break;
      case 'thisMonth':
        range = { from: startOfMonth(today), to: endOfMonth(today) };
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        range = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
      case 'thisYear':
        range = { from: startOfYear(today), to: endOfYear(today) };
        break;
      case 'lastYear':
        const lastYear = subYears(today, 1);
        range = { from: startOfYear(lastYear), to: endOfYear(lastYear) };
        break;
      case 'custom':
        return;
      default:
        return;
    }

    onChange(range);
    setTempRange(range);
    setIsOpen(false);
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    const newRange = { from: start, to: end };
    setTempRange(newRange);
    setActivePreset('custom');

    if (start && end) {
      onChange(newRange);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setTempRange({ from: null, to: null });
    setActivePreset(null);
  };

  const formatRange = () => {
    if (!value?.from) return placeholder;
    if (!value.to) return format(value.from, 'dd MMM yyyy');
    return `${format(value.from, 'dd MMM yyyy')} - ${format(value.to, 'dd MMM yyyy')}`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 
          border rounded-lg text-left text-sm
          transition-colors duration-150
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'}
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary'}
          ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className={value?.from ? 'text-gray-900' : 'text-gray-400'}>{formatRange()}</span>
        </div>
        <div className="flex items-center gap-1">
          {value?.from && !disabled && (
            <XMarkIcon
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
        </div>
      </button>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg
            ${isMobile ? 'left-0 right-0 mx-auto w-[calc(100vw-2rem)] max-w-sm' : 'right-0'}
          `}
          style={
            isMobile
              ? {
                  left: '50%',
                  transform: 'translateX(-50%)',
                  position: 'fixed',
                  top: '50%',
                  marginTop: '-200px',
                }
              : {}
          }
        >
          {/* Mobile: Full screen overlay style */}
          {isMobile ? (
            <div className="flex flex-col max-h-[80vh] overflow-auto">
              {/* Presets - Horizontal scroll on mobile */}
              {showPresets && (
                <div className="border-b border-gray-200 p-3">
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handlePresetClick(preset.value)}
                        className={`
                          flex-shrink-0 px-3 py-1.5 text-xs rounded-full
                          transition-colors duration-150 whitespace-nowrap
                          ${
                            activePreset === preset.value
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendar - Single month on mobile */}
              <div className="p-3 flex justify-center">
                <ReactDatePicker
                  selected={tempRange.from}
                  onChange={handleDateChange}
                  startDate={tempRange.from}
                  endDate={tempRange.to}
                  selectsRange
                  inline
                  monthsShown={1}
                  showPopperArrow={false}
                  calendarClassName="date-picker-calendar-range"
                  renderCustomHeader={({
                    date,
                    changeYear,
                    changeMonth,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }) => (
                    <div className="flex items-center justify-between gap-1 px-1 py-2">
                      <button
                        type="button"
                        onClick={decreaseMonth}
                        disabled={prevMonthButtonDisabled}
                        className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                      </button>

                      <div className="flex items-center gap-1">
                        <select
                          value={getMonth(date)}
                          onChange={({ target: { value } }) => changeMonth(Number(value))}
                          className="text-xs font-medium bg-transparent border-none cursor-pointer focus:ring-0 p-0 pr-4"
                        >
                          {MONTHS.map((month, index) => (
                            <option key={month} value={index}>
                              {month.slice(0, 3)}
                            </option>
                          ))}
                        </select>

                        <select
                          value={getYear(date)}
                          onChange={({ target: { value } }) => changeYear(Number(value))}
                          className="text-xs font-medium bg-transparent border-none cursor-pointer focus:ring-0 p-0"
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={increaseMonth}
                        disabled={nextMonthButtonDisabled}
                        className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  )}
                />
              </div>

              {/* Close button for mobile */}
              <div className="border-t border-gray-200 p-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Desktop: Side-by-side layout */
            <div className="flex">
              {/* Presets - Compact */}
              {showPresets && (
                <div className="border-r border-gray-200 p-2 w-28 shrink-0">
                  <div className="space-y-0.5">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handlePresetClick(preset.value)}
                        className={`
                          w-full text-left px-2 py-1.5 text-xs rounded-md
                          transition-colors duration-150
                          ${
                            activePreset === preset.value
                              ? 'bg-primary text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendar */}
              <div className="p-3">
                <ReactDatePicker
                  selected={tempRange.from}
                  onChange={handleDateChange}
                  startDate={tempRange.from}
                  endDate={tempRange.to}
                  selectsRange
                  inline
                  monthsShown={2}
                  showPopperArrow={false}
                  calendarClassName="date-picker-calendar-range"
                  renderCustomHeader={({
                    date,
                    changeYear,
                    changeMonth,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                    customHeaderCount,
                  }) => (
                    <div className="flex items-center justify-between gap-1 px-1 py-2">
                      {customHeaderCount === 0 ? (
                        <button
                          type="button"
                          onClick={decreaseMonth}
                          disabled={prevMonthButtonDisabled}
                          className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                        </button>
                      ) : (
                        <div className="w-6" />
                      )}

                      <div className="flex items-center gap-1">
                        <select
                          value={getMonth(date)}
                          onChange={({ target: { value } }) => changeMonth(Number(value))}
                          className="text-xs font-medium bg-transparent border-none cursor-pointer focus:ring-0 p-0 pr-4"
                        >
                          {MONTHS.map((month, index) => (
                            <option key={month} value={index}>
                              {month.slice(0, 3)}
                            </option>
                          ))}
                        </select>

                        <select
                          value={getYear(date)}
                          onChange={({ target: { value } }) => changeYear(Number(value))}
                          className="text-xs font-medium bg-transparent border-none cursor-pointer focus:ring-0 p-0"
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>

                      {customHeaderCount === 1 ? (
                        <button
                          type="button"
                          onClick={increaseMonth}
                          disabled={nextMonthButtonDisabled}
                          className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                        </button>
                      ) : (
                        <div className="w-6" />
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile backdrop */}
      {isOpen && isMobile && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
