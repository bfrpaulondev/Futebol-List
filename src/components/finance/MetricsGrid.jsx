// -.-.-.-
import React from 'react';

// -.-.-.-
export const MetricsGrid = ({ entradas, saidas, mensalistas }) => {
  return (
    <div className="grid-3 gap-md" style={{ marginTop: 'var(--space-lg)' }}>
      {/* Entradas */}
      <div style={{
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        textAlign: 'center'
      }}>
        <p className="text-xs text-muted mb-1">Entradas</p>
        <p className="text-xl font-bold" style={{ color: 'var(--color-green)' }}>
          +{entradas.toFixed(0)}€
        </p>
      </div>
      
      {/* Saídas */}
      <div style={{
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(249, 115, 22, 0.1)',
        border: '1px solid rgba(249, 115, 22, 0.3)',
        textAlign: 'center'
      }}>
        <p className="text-xs text-muted mb-1">Saídas</p>
        <p className="text-xl font-bold" style={{ color: 'var(--color-orange)' }}>
          -{saidas.toFixed(0)}€
        </p>
      </div>
      
      {/* Mensalistas */}
      <div style={{
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(56, 189, 248, 0.1)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        textAlign: 'center'
      }}>
        <p className="text-xs text-muted mb-1">Mensalistas</p>
        <p className="text-xl font-bold" style={{ color: 'var(--color-blue)' }}>
          {mensalistas}
        </p>
      </div>
    </div>
  );
};
