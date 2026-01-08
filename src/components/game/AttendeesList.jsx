// -.-.-.-
import React from 'react';
import { Card } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { format } from 'date-fns';

// -.-.-.-
export const AttendeesList = ({ attendees, currentUserId }) => {
  const badgeVariant = {
    'mensalista': 'green',
    'grupo': 'blue',
    'externo': 'pink'
  };
  
  return (
    <Card>
      <h4 className="font-bold mb-4">Confirmados ({attendees.length})</h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {attendees.map((attendee, index) => {
          // Verificar se attendee e player existem
          if (!attendee || !attendee.player) {
            return null;
          }
          
          const player = attendee.player;
          const isCurrentUser = player._id === currentUserId;
          
          return (
            <div 
              key={player._id || `attendee-${index}`}
              className="flex items-center gap-md p-3 rounded-lg"
              style={{ 
                backgroundColor: isCurrentUser
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(15, 23, 42, 0.4)'
              }}
            >
              {/* Position number */}
              <div style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: 'var(--color-blue)',
                color: 'var(--text-dark)',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}>
                {index + 1}
              </div>
              
              {/* Avatar */}
              <Avatar 
                src={player.avatar} 
                name={player.name} 
                size="md"
              />
              
              {/* Info */}
              <div style={{ flex: 1 }}>
                <p className="font-semibold">
                  {player.name}
                  {isCurrentUser && ' (Tu)'}
                </p>
                <p className="text-xs text-muted">
                  {attendee.confirmedAt 
                    ? format(new Date(attendee.confirmedAt), 'HH:mm')
                    : '--:--'
                  }
                </p>
              </div>
              
              {/* Badge */}
              <Badge variant={badgeVariant[attendee.playerType] || 'blue'}>
                {attendee.playerType || 'player'}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
