// -.-.-.-
import React, { useEffect, useState } from 'react';
import { Container } from '@components/layout/Container';
import { Header } from '@components/layout/Header';
import { Avatar } from '@components/ui/Avatar';
import { Loader } from '@components/ui/Loader';
import api from '@services/api';

// -.-.-.-
const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// -.-.-.-
export const Coletes = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // -.-.-.-
  useEffect(() => {
    loadSchedule();
  }, []);
  
  // -.-.-.-
  const loadSchedule = async () => {
    try {
      const { data } = await api.get('/coletes/schedule');
      setSchedule(data);
    } catch (error) {
      console.error('[Coletes] Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Loader fullScreen message="A carregar calendário..." />;
  
  if (!schedule) {
    return (
      <Container>
        <Header title="Calendário de Coletes" />
        <div className="text-center py-xl">
          <p className="text-muted">Calendário não disponível.</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header title="Calendário de Coletes" />
      
      <div className="flex flex-col gap-lg" style={{ paddingBottom: '100px' }}>
        {/* Title */}
        <div className="text-center">
          <h3 className="mb-2" style={{ color: 'var(--color-yellow)' }}>
            🏆 Responsáveis {schedule.year}
          </h3>
          <p className="text-sm text-muted">
            Cada mensalista lava os coletes no seu mês
          </p>
        </div>
        
        {/* Grid of months */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-md)'
        }}>
          {schedule.months.map((assignment) => {
            const isCurrent = assignment.month === currentMonth;
            
            return (
              <div
                key={assignment.month}
                style={{
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--gradient-card)',
                  border: isCurrent 
                    ? '2px solid var(--color-green)' 
                    : '1px solid var(--card-border)',
                  boxShadow: isCurrent ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                  textAlign: 'center',
                  transition: 'all var(--transition-base)'
                }}
                className={isCurrent ? 'animate-glow' : ''}
              >
                {/* Month name */}
                <p className="text-xs font-bold text-muted mb-2">
                  {months[assignment.month - 1]}
                </p>
                
                {/* Avatar */}
                <div className="flex justify-center mb-2">
                  <Avatar
                    src={assignment.responsiblePlayer.avatar}
                    name={assignment.responsiblePlayer.name}
                    size="md"
                  />
                </div>
                
                {/* Player name */}
                <p className="text-xs font-semibold">
                  {assignment.responsiblePlayer.name.split(' ')[0]}
                </p>
                
                {/* Current month indicator */}
                {isCurrent && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-green)' }}>
                    ● Mês atual
                  </p>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Note */}
        <div style={{
          padding: 'var(--space-md)',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)'
        }}>
          <p className="text-sm text-center">
            ℹ️ Admins podem trocar meses entre mensalistas caso necessário
          </p>
        </div>
      </div>
    </Container>
  );
};
