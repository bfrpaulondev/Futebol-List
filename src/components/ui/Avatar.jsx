// -.-.-.-
import React from 'react';

// -.-.-.-
export const Avatar = ({ 
  src, 
  name, 
  size = 'md',
  className = '' 
}) => {
  const classes = ['avatar', `avatar-${size}`, className]
    .filter(Boolean)
    .join(' ');
  
  // -.-.-.-
  // Get initials from name
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  return (
    <div className={classes}>
      {src ? (
        <img src={src} alt={name} loading="lazy" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
