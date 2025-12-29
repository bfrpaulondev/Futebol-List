// -.-.-.-
import React from 'react';
import { motion } from 'framer-motion';

// -.-.-.-
export const PlayerDot = ({ player, role, variant = 'yellow' }) => {
  const colors = {
    yellow: 'linear-gradient(135deg, #facc15, #f97316)',
    green: 'linear-gradient(135deg, #22c55e, #14b8a6)'
  };
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      {/* Dot */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: colors[variant],
        border: '2px solid rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        position: 'relative'
      }}>
        {/* Rating */}
        <span style={{
          fontSize: '1rem',
          fontWeight: 'bold',
          color: 'var(--text-dark)'
        }}>
          {player.overallRating}
        </span>
      </div>
      
      {/* Name */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.65rem',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        maxWidth: '80px',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {player.name.split(' ')[0]}
      </div>
      
      {/* Role badge */}
      <div style={{
        fontSize: '0.6rem',
        color: 'var(--text-muted)',
        fontWeight: 'bold'
      }}>
        {role}
      </div>
    </motion.div>
  );
};
