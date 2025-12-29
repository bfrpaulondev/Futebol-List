// -.-.-.-
import React from 'react';
import { Card } from '@components/ui/Card';

// -.-.-.-
export const BalanceCard = ({ balance }) => {
  const isPositive = balance >= 0;
  
  return (
    <Card glow style={{
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      borderColor: isPositive ? 'var(--color-green)' : 'var(--color-orange)'
    }}>
      <div className="text-center">
        <p className="text-sm text-muted mb-2">Saldo Atual</p>
        <h2 
          className="text-4xl font-bold mb-0"
          style={{ color: isPositive ? 'var(--color-success)' : 'var(--color-orange)' }}
        >
          {balance >= 0 ? '+' : ''}{balance.toFixed(2)}€
        </h2>
        <p className="text-xs text-muted mt-2">
          {isPositive ? 'Caixa positiva' : 'Atenção ao saldo'}
        </p>
      </div>
    </Card>
  );
};
