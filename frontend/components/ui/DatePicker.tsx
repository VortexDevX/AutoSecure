'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
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
  parse,
  isValid,
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
const DEFAULT_MAX_YEAR = currentYear + 50;

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

interface SingleDateInputButtonProps {
  value?: string;
  onClick?: () => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder: string;
  isClearable: boolean;
  onClear: () => void;
}

const SingleDateInputButton = forwardRef<HTMLInputElement, SingleDateInputButtonProps>(
  (
    {
      value: displayValue,
      onClick,
      onChange,
      onBlur,
      onFocus,
      onKeyDown,
      disabled,
      error,
      placeholder,
      isClearable,
      onClear,
    },
    ref
  ) => (
    <div className="relative w-full">
      <CalendarIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={ref}
        type="text"
        value={displayValue || ''}
        onClick={onClick}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          input w-full pl-10 pr-10
          ${disabled ? 'cursor-not-allowed !bg-[rgba(232,238,248,0.62)] text-slate-400' : ''}
          ${error ? 'input-error' : ''}
        `}
      />
      {displayValue && isClearable && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  )
);

SingleDateInputButton.displayName = 'SingleDateInputButton';

const parseManualDate = (rawValue: string): Date | null => {
  const value = rawValue.trim();
  if (!value) return null;

  const supportedFormats = ['dd/MM/yyyy', 'd/M/yyyy', 'dd-MM-yyyy', 'd-M-yyyy', 'yyyy-MM-dd'];

  for (const formatString of supportedFormats) {
    const parsedDate = parse(value, formatString, new Date());
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }

  return null;
};

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
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const displayValue = isTyping ? inputValue : dateValue ? format(dateValue, 'dd/MM/yyyy') : '';

  // FIX: Handle date selection properly to avoid timezone shift
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      setIsTyping(false);
      setInputValue('');
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
    setIsTyping(false);
    setInputValue(format(normalizedDate, 'dd/MM/yyyy'));
    onChange(normalizedDate);
  };

  const commitManualInput = () => {
    const rawValue = inputValue.trim();
    setIsTyping(false);
    if (!rawValue) {
      setInputValue('');
      onChange(null);
      return;
    }

    const parsedDate = parseManualDate(rawValue);
    if (parsedDate) {
      handleDateChange(parsedDate);
      return;
    }

    setInputValue(dateValue ? format(dateValue, 'dd/MM/yyyy') : '');
  };

  return (
    <div className={`relative ${className}`}>
      {label && <label className="label mb-2 block">{label}</label>}
      <ReactDatePicker
        selected={dateValue}
        onChange={handleDateChange}
        customInput={
          <SingleDateInputButton
            value={displayValue}
            disabled={disabled}
            error={Boolean(error)}
            placeholder={placeholder}
            isClearable={isClearable}
            onClear={() => {
              setIsTyping(false);
              setInputValue('');
              onChange(null);
            }}
          />
        }
        value={displayValue}
        dateFormat="dd/MM/yyyy"
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        showPopperArrow={false}
        popperClassName="date-picker-popper"
        calendarClassName="date-picker-calendar"
        wrapperClassName="w-full"
        onChangeRaw={(event) => {
          if (!event) return;
          event.preventDefault();
          const rawValue = (event.target as HTMLInputElement).value;
          setIsTyping(true);
          setInputValue(rawValue);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitManualInput();
          }
        }}
        onFocus={() => setIsTyping(true)}
        onBlur={commitManualInput}
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
              className="rounded-md p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeftIcon className="h-4 w-4 text-slate-600" />
            </button>

            <div className="flex items-center gap-1">
              <select
                value={getMonth(date)}
                onChange={({ target: { value } }) => changeMonth(Number(value))}
                className="cursor-pointer border-none bg-transparent pr-1 text-sm font-medium text-slate-700 focus:ring-0"
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
                className="cursor-pointer border-none bg-transparent text-sm font-medium text-slate-700 focus:ring-0"
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
              className="rounded-md p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRightIcon className="h-4 w-4 text-slate-600" />
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

export interface DateRangeValue {
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
    <div className={`relative z-[120] ${className}`} ref={containerRef}>
      {label && <label className="label mb-2 block">{label}</label>}

      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          if (!isOpen) {
            setTempRange(value || { from: null, to: null });
          }
          setIsOpen(!isOpen);
        }}
        disabled={disabled}
        className={`
          input flex w-full items-center justify-between text-left
          ${disabled ? 'cursor-not-allowed !bg-slate-100/80 text-slate-400' : 'cursor-pointer'}
          ${error ? 'input-error' : ''}
          ${isOpen ? '!border-slate-400/60 ring-2 ring-slate-300/40' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-slate-400" />
          <span className={value?.from ? 'text-slate-900' : 'text-slate-400'}>{formatRange()}</span>
        </div>
        <div className="flex items-center gap-1">
          {value?.from && !disabled && (
            <XMarkIcon
              className="h-4 w-4 text-slate-400 hover:text-slate-600"
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
            absolute z-[125] mt-1 rounded-[18px] border border-slate-200/80 bg-[rgba(239,245,253,0.98)] shadow-[0_16px_32px_rgba(74,96,129,0.12)]
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
                <div className="border-b border-slate-200 p-3">
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
                              ? 'bg-slate-800 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                        className="rounded-md p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronLeftIcon className="h-4 w-4 text-slate-600" />
                      </button>

                      <div className="flex items-center gap-1">
                        <select
                          value={getMonth(date)}
                          onChange={({ target: { value } }) => changeMonth(Number(value))}
                          className="cursor-pointer border-none bg-transparent p-0 pr-4 text-xs font-medium text-slate-700 focus:ring-0"
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
                          className="cursor-pointer border-none bg-transparent p-0 text-xs font-medium text-slate-700 focus:ring-0"
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
                        className="rounded-md p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronRightIcon className="h-4 w-4 text-slate-600" />
                      </button>
                    </div>
                  )}
                />
              </div>

              {/* Close button for mobile */}
                <div className="border-t border-slate-200 p-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full rounded-[14px] bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
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
                <div className="w-28 shrink-0 border-r border-slate-200 p-2">
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
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-700 hover:bg-slate-100'
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
                          className="rounded-md p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ChevronLeftIcon className="h-4 w-4 text-slate-600" />
                        </button>
                      ) : (
                        <div className="w-6" />
                      )}

                      <div className="flex items-center gap-1">
                        <select
                          value={getMonth(date)}
                          onChange={({ target: { value } }) => changeMonth(Number(value))}
                          className="cursor-pointer border-none bg-transparent p-0 pr-4 text-xs font-medium text-slate-700 focus:ring-0"
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
                          className="cursor-pointer border-none bg-transparent p-0 text-xs font-medium text-slate-700 focus:ring-0"
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
                          className="rounded-md p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ChevronRightIcon className="h-4 w-4 text-slate-600" />
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
        <div className="fixed inset-0 z-[115] bg-black/20" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
