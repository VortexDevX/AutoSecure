import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, required, className = '', ...restProps }, ref) => {
    return (
      <div className="w-full">
        {label && <label className={`label ${required ? 'label-required' : ''}`}>{label}</label>}
        <input
          ref={ref}
          required={required}
          className={`input ${error ? 'input-error' : ''} ${className}`}
          suppressHydrationWarning
          {...restProps}
        />
        {helpText && !error && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
