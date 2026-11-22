import { InputHTMLAttributes, forwardRef } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ hasError, className = '', ...rest }, ref) => (
  <input
    ref={ref}
    {...rest}
    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
      hasError
        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
    } ${className}`}
  />
));
Input.displayName = 'Input';
