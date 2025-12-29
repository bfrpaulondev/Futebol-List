// -.-.-.-
import React from 'react';

// -.-.-.-
export const Container = ({ children, className = '' }) => {
  return (
    <div className={`phone ${className}`}>
      {children}
    </div>
  );
};
