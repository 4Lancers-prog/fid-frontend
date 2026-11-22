import { SelectHTMLAttributes, forwardRef } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, Props>(({ hasError, className = '', children, ...rest }, ref) => (
  <select
    ref={ref}
    {...rest}
    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
      hasError
        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
    } ${className}`}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
