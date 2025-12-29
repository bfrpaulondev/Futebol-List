// -.-.-.-
import React from 'react';
import { motion } from 'framer-motion';

// -.-.-.-
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'sm' ? 'text-sm px-4 py-2' : size === 'lg' ? 'text-lg px-8 py-4' : '';
  const widthClass = fullWidth ? 'btn-full' : '';
  
  const classes = [baseClass, variantClass, sizeClass, widthClass, className]
    .filter(Boolean)
    .join(' ');
  
  return (
    <motion.button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {loading ? (
        <>
          <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
          <span>A processar...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};
