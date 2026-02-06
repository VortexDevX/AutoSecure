'use client';

import { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  type: 'policy' | 'license';
  title: string;
  date: string;
  registration?: string;
}

interface RenewalCalendarProps {
  policies: CalendarEvent[];
  licenses: CalendarEvent[];
  isLoading?: boolean;
}

export function RenewalCalendar({ policies, licenses, isLoading }: RenewalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
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

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, { policies: CalendarEvent[]; licenses: CalendarEvent[] }> = {};

    policies.forEach((event) => {
      const dateStr = new Date(event.date).toISOString().split('T')[0];
      if (!map[dateStr]) map[dateStr] = { policies: [], licenses: [] };
      map[dateStr].policies.push(event);
    });

    licenses.forEach((event) => {
      const dateStr = new Date(event.date).toISOString().split('T')[0];
      if (!map[dateStr]) map[dateStr] = { policies: [], licenses: [] };
      map[dateStr].licenses.push(event);
    });

    return map;
  }, [policies, licenses]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const getDateStr = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(
      2,
      '0'
    )}`;
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 bg-gray-50" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = getDateStr(day);
      const events = eventsByDate[dateStr];
      const policyCount = events?.policies?.length || 0;
      const licenseCount = events?.licenses?.length || 0;

      days.push(
        <div
          key={day}
          className={`min-h-[3rem] p-1 border-b border-r border-gray-100 transition-colors hover:bg-gray-50 ${
            isToday(day) ? 'bg-blue-50' : ''
          }`}
        >
          <div
            className={`text-[10px] font-medium mb-0.5 ${
              isToday(day) ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            {day}
          </div>
          <div className="flex flex-col gap-0.5">
            {policyCount > 0 && (
              <Link
                href={`/policies?expiring_soon=true`}
                className="flex items-center gap-1 px-1 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-medium hover:bg-amber-200 transition-colors truncate"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                {policyCount} {policyCount === 1 ? 'policy' : 'policies'}
              </Link>
            )}
            {licenseCount > 0 && (
              <Link
                href={`/licenses?expiring_soon=true`}
                className="flex items-center gap-1 px-1 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px] font-medium hover:bg-orange-200 transition-colors truncate"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                {licenseCount} {licenseCount === 1 ? 'license' : 'licenses'}
              </Link>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Renewal Calendar</h3>
          <p className="text-sm text-gray-600">Upcoming policy and license expirations</p>
        </CardHeader>
        <CardBody>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Loading calendar...</span>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Renewal Calendar</h3>
            <p className="text-xs text-gray-500 mt-0.5">Expirations</p>
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center border border-gray-200 rounded-lg shadow-sm">
              <button
                onClick={prevMonth}
                className="p-1 hover:bg-gray-50 transition-colors rounded-l-lg border-r border-gray-100"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <span className="px-2 py-1 text-xs font-semibold text-gray-700 min-w-[100px] text-center bg-gray-50/50">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-gray-50 transition-colors rounded-r-lg border-l border-gray-100"
              >
                <ChevronRightIcon className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {dayNames.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">{renderCalendarDays()}</div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Policy Expiring</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>License Expiring</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
