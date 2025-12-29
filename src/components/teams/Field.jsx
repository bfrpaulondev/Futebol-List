// -.-.-.-
import React from 'react';
import { PlayerDot } from './PlayerDot';

// -.-.-.-
export const Field = ({ teamA, teamB }) => {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '600px',
      background: 'linear-gradient(90deg, #0e7490 0%, #0e7490 50%, #6366f1 50%, #6366f1 100%)',
      borderRadius: 'var(--radius-lg)',
      border: '3px solid var(--color-yellow)',
      overflow: 'hidden'
    }}>
      {/* Center line */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: '2px',
        backgroundColor: 'var(--color-yellow)',
        transform: 'translateX(-50%)'
      }} />
      
      {/* Center circle */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: '80px',
        height: '80px',
        border: '2px solid var(--color-yellow)',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)'
      }} />
      
      {/* Team A (left side) */}
      <div style={{ position: 'absolute', left: '5%', top: '10%', width: '40%', height: '80%' }}>
        <TeamSide team={teamA} side="A" />
      </div>
      
      {/* Team B (right side) */}
      <div style={{ position: 'absolute', right: '5%', top: '10%', width: '40%', height: '80%' }}>
        <TeamSide team={teamB} side="B" />
      </div>
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        right: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        fontWeight: 'bold'
      }}>
        <span style={{ color: 'var(--color-green)' }}>EQUIPA A</span>
        <span style={{ color: 'var(--color-blue)' }}>EQUIPA B</span>
      </div>
    </div>
  );
};

// -.-.-.-
const TeamSide = ({ team, side }) => {
  const gr = team.find(p => p.role === 'GR');
  const linha = team.filter(p => p.role === 'LINHA');
  const sup = team.find(p => p.role === 'SUP');
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* GR */}
      {gr && (
        <div style={{ position: 'absolute', left: '50%', bottom: '5%', transform: 'translateX(-50%)' }}>
          <PlayerDot player={gr.player} role="GR" />
        </div>
      )}
      
      {/* LINHA (defenders in 2x2 grid) */}
      {linha.slice(0, 4).map((p, idx) => {
        const positions = [
          { left: '20%', bottom: '30%' },
          { left: '80%', bottom: '30%' },
          { left: '20%', top: '30%' },
          { left: '80%', top: '30%' }
        ];
        return (
          <div key={p.player._id} style={{ position: 'absolute', ...positions[idx], transform: 'translate(-50%, -50%)' }}>
            <PlayerDot player={p.player} role="LINHA" />
          </div>
        );
      })}
      
      {/* SUP */}
      {sup && (
        <div style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)' }}>
          <PlayerDot player={sup.player} role="SUP" variant="green" />
        </div>
      )}
    </div>
  );
};
