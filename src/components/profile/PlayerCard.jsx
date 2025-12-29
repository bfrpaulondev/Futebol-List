// -.-.-.-
import React from 'react';
import { Card } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';

// -.-.-.-
export const PlayerCard = ({ user, onAvatarChange }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onAvatarChange(file);
    }
  };
  
  return (
    <Card style={{
      background: 'linear-gradient(135deg, #0e7490, #4f46e5)',
      borderColor: 'rgba(56, 189, 248, 0.5)'
    }}>
      <div className="grid-2 gap-lg">
        {/* Left: Avatar section */}
        <div className="flex flex-col items-center gap-md">
          <Avatar src={user.avatar} name={user.name} size="lg" />
          
          <Badge variant="green">{user.playerType}</Badge>
          
          <label style={{
            cursor: 'pointer',
            fontSize: '0.75rem',
            color: 'var(--color-blue)',
            textDecoration: 'underline'
          }}>
            Alterar foto
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
          
          {/* Rating */}
          <div className="text-center">
            <p className="text-xs text-muted mb-1">Rating Geral</p>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--gradient-coin)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: 'var(--text-dark)'
            }}>
              {user.overallRating}
            </div>
          </div>
        </div>
        
        {/* Right: Stats */}
        <div>
          <h3 className="text-2xl font-bold mb-2">{user.name}</h3>
          <p className="text-sm text-gray-300 mb-4">{user.position}</p>
          
          <div className="flex flex-col gap-sm">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Jogos:</span>
              <span className="font-bold">{user.stats.gamesPlayed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">MVP:</span>
              <span className="font-bold">{user.stats.mvpCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
