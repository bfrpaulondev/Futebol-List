// -.-.-.-
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@components/ui/Avatar';
import { useAuth } from '@hooks/useAuth';

// -.-.-.-
export const Header = ({ title, showBack = false, actions = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 'var(--space-lg)',
      paddingBottom: 'var(--space-md)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
            style={{ 
              padding: 'var(--space-sm) var(--space-md)',
              fontSize: '1.25rem',
              lineHeight: 1
            }}
            aria-label="Voltar"
          >
            ←
          </button>
        )}
        <h2 className="mb-0">{title}</h2>
      </div>
      
      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {actions}
        {user && (
          <Avatar 
            src={user.avatar} 
            name={user.name} 
            size="sm"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
          />
        )}
      </div>
    </header>
  );
};
