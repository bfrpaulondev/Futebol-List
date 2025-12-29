// -.-.-.-
import React from 'react';

// -.-.-.-
export const Loader = ({ fullScreen = false, message = 'A carregar...' }) => {
  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    zIndex: 300
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
  };
  
  return (
    <div style={containerStyle}>
      <div className="loader" />
      {message && (
        <p className="text-muted mt-4">{message}</p>
      )}
    </div>
  );
};
