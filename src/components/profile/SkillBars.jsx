// -.-.-.-
import React from 'react';
import { Card } from '@components/ui/Card';

// -.-.-.-
const skillLabels = {
  defense: 'Defesa',
  attack: 'Ataque',
  passing: 'Passe',
  technique: 'Técnica',
  stamina: 'Resistência'
};

// -.-.-.-
export const SkillBars = ({ skills }) => {
  return (
    <Card>
      <h4 className="font-bold mb-4">Habilidades</h4>
      
      <div className="flex flex-col gap-md">
        {Object.entries(skills).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted">{skillLabels[key]}</span>
              <span className="font-bold">{value}/10</span>
            </div>
            
            {/* Progress bar */}
            <div style={{
              height: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${(value / 10) * 100}%`,
                background: 'linear-gradient(90deg, var(--color-green), var(--color-yellow))',
                transition: 'width 0.5s ease',
                borderRadius: 'var(--radius-full)'
              }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
