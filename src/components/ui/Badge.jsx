// -.-.-.-
import React from 'react';

// -.-.-.-
export const Badge = ({ 
  children, 
  variant = 'green',
  dot = false,
  className = '' 
}) => {
  const classes = ['badge', `badge-${variant}`, className]
    .filter(Boolean)
    .join(' ');
  
  return (
    <span className={classes}>
      {dot && <span style={{ 
        width: '6px', 
        height: '6px', 
        borderRadius: '50%', 
        backgroundColor: 'currentColor' 
      }} />}
      {children}
    </span>
  );
};
