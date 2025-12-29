// -.-.-.-
import React, { forwardRef } from 'react';

// -.-.-.-
export const Input = forwardRef(({ 
  label,
  error,
  type = 'text',
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const inputClasses = ['input', error && 'border-red-500', className]
    .filter(Boolean)
    .join(' ');
  
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-semibold mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
