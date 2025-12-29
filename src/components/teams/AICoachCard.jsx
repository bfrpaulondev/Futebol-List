// -.-.-.-
import React from 'react';
import { Card } from '@components/ui/Card';

// -.-.-.-
export const AICoachCard = ({ comment }) => {
  if (!comment) return null;
  
  return (
    <Card style={{
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      borderColor: 'var(--color-blue)',
      marginTop: 'var(--space-lg)'
    }}>
      <div className="flex items-start gap-md">
        {/* AI Icon */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--gradient-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          flexShrink: 0
        }}>
          🤖
        </div>
        
        {/* Content */}
        <div>
          <h4 className="font-bold text-blue-400 mb-2">Coach AI</h4>
          <p className="text-sm text-gray-300" style={{ lineHeight: 1.6 }}>
            {comment}
          </p>
        </div>
      </div>
    </Card>
  );
};
