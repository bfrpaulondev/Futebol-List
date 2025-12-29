// -.-.-.-
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

// -.-.-.-
const navItems = [
  { path: '/', label: 'Jogo', icon: '⚽' },
  { path: '/teams', label: 'Equipas', icon: '👥' },
  { path: '/chat', label: 'Chat', icon: '💬' },
  { path: '/finances', label: 'Finanças', icon: '💰' },
  { path: '/profile', label: 'Perfil', icon: '👤' }
];

// -.-.-.-
export const Navigation = () => {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid var(--border-color)',
      padding: 'var(--space-sm) 0',
      zIndex: 100
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        maxWidth: '420px',
        margin: '0 auto'
      }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  padding: 'var(--space-sm)',
                  color: isActive ? 'var(--color-teal)' : 'var(--text-muted)',
                  transition: 'color var(--transition-fast)'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      width: '32px',
                      height: '2px',
                      backgroundColor: 'var(--color-teal)',
                      borderRadius: '2px 2px 0 0'
                    }}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
