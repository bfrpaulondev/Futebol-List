// -.-.-.-
import React from 'react';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// -.-.-.-
export const GameCard = ({ game, userPresence }) => {
  const mensalistasCount = game.attendees.filter(a => a.playerType === 'mensalista').length;
  const grupoCount = game.attendees.filter(a => a.playerType === 'grupo').length;
  const externosCount = game.attendees.filter(a => a.playerType === 'externo').length;
  const waitingCount = game.waitingList.length;
  
  const spotsLeft = game.maxPlayers - game.attendees.length;
  const isFull = spotsLeft <= 0;
  
  return (
    <Card glow style={{ 
      background: 'linear-gradient(135deg, #0e7490 0%, #0369a1 100%)',
      borderColor: 'rgba(56, 189, 248, 0.4)'
    }}>
      {/* Date & Location */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold mb-1">
            {format(new Date(game.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          <p className="text-sm text-gray-300">
            📍 {game.location} · {format(new Date(game.date), 'HH:mm')}
          </p>
        </div>
        <Badge variant={isFull ? 'orange' : 'green'}>
          {isFull ? 'LOTADO' : `${spotsLeft} VAGAS`}
        </Badge>
      </div>
      
      {/* User status */}
      {userPresence && (
        <div className="mb-4 p-3 bg-black/20 rounded-lg">
          <p className="text-sm font-semibold text-green-300">
            ✓ Presença confirmada
          </p>
        </div>
      )}
      
      {/* Counters */}
      <div className="grid grid-3 gap-md">
        <div className="text-center">
          <Badge variant="green" dot>
            {mensalistasCount}
          </Badge>
          <p className="text-xs text-gray-400 mt-1">Mensalistas</p>
        </div>
        <div className="text-center">
          <Badge variant="blue" dot>
            {grupoCount}
          </Badge>
          <p className="text-xs text-gray-400 mt-1">Grupo</p>
        </div>
        {waitingCount > 0 && (
          <div className="text-center">
            <Badge variant="orange" dot>
              {waitingCount}
            </Badge>
            <p className="text-xs text-gray-400 mt-1">Espera</p>
          </div>
        )}
      </div>
    </Card>
  );
};
