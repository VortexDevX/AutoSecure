'use client';

import { forwardRef, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option',
      label,
      error,
      disabled = false,
      className = '',
    },
    ref
  ) => {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <div className={className}>
        {label && <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>}
        <Listbox value={value || ''} onChange={onChange} disabled={disabled}>
          <div className="relative">
            <Listbox.Button
              ref={ref}
              className={clsx(
                'relative w-full cursor-pointer rounded-[16px] py-2.5 pl-3 pr-10 text-left border text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]',
                'focus:outline-none focus:ring-2 focus:ring-slate-300/50 focus:border-slate-400/50',
                'transition-colors duration-150',
                disabled && 'bg-slate-100 cursor-not-allowed opacity-60',
                error ? 'border-red-500' : 'border-[var(--input-stroke)] hover:border-slate-300/60'
              )}
              style={{ background: 'var(--input-fill)' }}
            >
              <span
                className={clsx(
                  'block truncate',
                  selectedOption ? 'text-slate-900' : 'text-slate-400'
                )}
              >
                {selectedOption?.label || placeholder}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className={clsx(
                  'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[18px] border py-1 text-sm focus:outline-none',
                  'border-slate-200/80 bg-[rgba(239,245,253,0.98)] shadow-[0_16px_32px_rgba(74,96,129,0.12)]'
                )}
              >
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={({ active, selected }) =>
                      clsx(
                        'relative cursor-pointer select-none py-2 pl-10 pr-4',
                        active ? 'bg-slate-100 text-slate-900' : 'text-slate-900',
                        selected && 'bg-slate-50',
                        option.disabled && 'opacity-50 cursor-not-allowed'
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={clsx(
                            'block truncate',
                            selected ? 'font-medium' : 'font-normal'
                          )}
                        >
                          {option.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
