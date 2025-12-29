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
        {attendees.map((attendee, index) => (
          <div 
            key={attendee.player._id}
            className="flex items-center gap-md p-3 rounded-lg"
            style={{ 
              backgroundColor: attendee.player._id === currentUserId 
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
              src={attendee.player.avatar} 
              name={attendee.player.name} 
              size="md"
            />
            
            {/* Info */}
            <div style={{ flex: 1 }}>
              <p className="font-semibold">
                {attendee.player.name}
                {attendee.player._id === currentUserId && ' (Tu)'}
              </p>
              <p className="text-xs text-muted">
                {format(new Date(attendee.confirmedAt), 'HH:mm')}
              </p>
            </div>
            
            {/* Badge */}
            <Badge variant={badgeVariant[attendee.playerType]}>
              {attendee.playerType}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};
