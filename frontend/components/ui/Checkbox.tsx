'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, indeterminate, className = '', id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`relative flex items-start ${className}`}>
        <div className="flex h-6 items-center">
          <div className="relative">
            <input
              ref={(el) => {
                if (typeof ref === 'function') {
                  ref(el);
                } else if (ref) {
                  ref.current = el;
                }
                if (el) {
                  el.indeterminate = indeterminate || false;
                }
              }}
              id={inputId}
              type="checkbox"
              className="peer sr-only"
              {...props}
            />
            <div
              className={`
                h-5 w-5 rounded border-2 transition-all duration-150 cursor-pointer
                ${props.disabled ? 'cursor-not-allowed opacity-50' : ''}
                ${error ? 'border-red-500' : 'border-gray-300'}
                peer-checked:border-primary peer-checked:bg-primary
                peer-indeterminate:border-primary peer-indeterminate:bg-primary
                peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2
                peer-hover:border-gray-400 peer-checked:peer-hover:border-primary
              `}
              onClick={() => {
                if (!props.disabled) {
                  const input = document.getElementById(inputId) as HTMLInputElement;
                  if (input) {
                    input.click();
                  }
                }
              }}
            >
              {/* Checkmark */}
              <CheckIcon
                className={`
                  h-4 w-4 text-white absolute top-0.5 left-0.5
                  transition-opacity duration-150
                  peer-checked:opacity-100 opacity-0
                `}
              />
              {/* Indeterminate dash */}
              {indeterminate && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-0.5 bg-white rounded" />
              )}
            </div>
            {/* Show check when checked */}
            <CheckIcon
              className={`
                h-4 w-4 text-white absolute top-0.5 left-0.5 pointer-events-none
                transition-opacity duration-150
                ${props.checked ? 'opacity-100' : 'opacity-0'}
              `}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={inputId}
                className={`
                  text-sm font-medium cursor-pointer select-none
                  ${props.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}
                  ${error ? 'text-red-600' : ''}
                `}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={`text-xs ${error ? 'text-red-500' : 'text-gray-500'}`}>{description}</p>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Checkbox Group Component
interface CheckboxGroupProps {
  label?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function CheckboxGroup({
  label,
  description,
  error,
  children,
  className = '',
}: CheckboxGroupProps) {
  return (
    <fieldset className={className}>
      {label && <legend className="text-sm font-medium text-gray-900 mb-2">{label}</legend>}
      {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}
      <div className="space-y-2">{children}</div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </fieldset>
  );
}
