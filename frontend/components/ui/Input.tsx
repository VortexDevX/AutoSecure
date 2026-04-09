import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helpText, required, className = '', onChange, type = 'text', ...restProps },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Auto-uppercase for text inputs
      if (type === 'text' && e.target.value) {
        e.target.value = e.target.value.toUpperCase();
      }
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label className={clsx('label', required && 'label-required')}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          onChange={handleChange}
          required={required}
          className={clsx(
            'input',
            error && 'input-error',
            'placeholder:tracking-[0.01em]',
            className
          )}
          suppressHydrationWarning
          {...restProps}
        />
        {helpText && !error && <p className="mt-2 text-xs text-slate-500">{helpText}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
