// -.-.-.-
import React from 'react';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// -.-.-.-
export const TransactionTable = ({ transactions }) => {
  return (
    <Card>
      <h4 className="font-bold mb-4">Movimentos Recentes</h4>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: 'var(--space-sm)', textAlign: 'left', color: 'var(--text-muted)' }}>Data</th>
              <th style={{ padding: 'var(--space-sm)', textAlign: 'left', color: 'var(--text-muted)' }}>Descrição</th>
              <th style={{ padding: 'var(--space-sm)', textAlign: 'right', color: 'var(--text-muted)' }}>Valor</th>
              <th style={{ padding: 'var(--space-sm)', textAlign: 'center', color: 'var(--text-muted)' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: 'var(--space-sm)' }}>
                  {format(new Date(tx.createdAt), 'dd MMM', { locale: ptBR })}
                </td>
                <td style={{ padding: 'var(--space-sm)' }}>
                  {tx.description}
                </td>
                <td 
                  style={{ 
                    padding: 'var(--space-sm)', 
                    textAlign: 'right',
                    color: tx.type === 'entrada' ? 'var(--color-green)' : 'var(--color-orange)',
                    fontWeight: 'bold'
                  }}
                >
                  {tx.type === 'entrada' ? '+' : '-'}{tx.amount.toFixed(2)}€
                </td>
                <td style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                  <Badge variant={tx.isPaid ? 'green' : 'orange'}>
                    {tx.isPaid ? 'Pago' : 'Pendente'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
