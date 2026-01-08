// -.-.-.-
import React, { useEffect, useState } from 'react';
import { Container } from '@components/layout/Container';
import { Header } from '@components/layout/Header';
import { Loader } from '@components/ui/Loader';
import { GameCard } from '@components/game/GameCard';
import { AttendeesList } from '@components/game/AttendeesList';
import { PresenceButtons } from '@components/game/PresenceButtons';
import { gameService } from '@services/gameService';
import { useAuth } from '@hooks/useAuth';
import { useSocket } from '@hooks/useSocket';

// -.-.-.-
export const Dashboard = () => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { socket } = useSocket();
  
  // -.-.-.-
  useEffect(() => {
    loadGame();
  }, []);
  
  // -.-.-.-
  useEffect(() => {
    if (!socket || !game) return;
    
    // Join game room
    socket.emit('join-game', game._id);
    
    // Listen for presence updates
    socket.on('presence-updated', (updatedGame) => {
      console.log('[Dashboard] Presence updated via socket');
      setGame(updatedGame);
    });
    
    return () => {
      socket.off('presence-updated');
      socket.emit('leave-game', game._id);
    };
  }, [socket, game?._id]);
  
  // -.-.-.-
  const loadGame = async () => {
    try {
      const data = await gameService.getNextGame();
      setGame(data);
    } catch (error) {
      console.error('[Dashboard] Failed to load game:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // -.-.-.-
  const handlePresenceUpdate = (updatedGame) => {
    setGame(updatedGame);
  };
  
  if (loading) return <Loader fullScreen message="A carregar jogo..." />;
  
  if (!game) {
    return (
      <Container>
        <Header title="Próximo Jogo" />
        <div className="text-center py-xl">
          <p className="text-muted">Nenhum jogo agendado no momento.</p>
        </div>
      </Container>
    );
  }
  
  const attendees = game?.attendees || [];
  const userPresence = attendees.find(a => a?.player?._id === user?._id);
  
  return (
    <Container>
      <Header title="Jogo da Semana" />
      
      <div className="flex flex-col gap-lg" style={{ paddingBottom: '100px' }}>
        {/* Game Info Card */}
        <GameCard game={game} userPresence={userPresence} />
        
        {/* Presence Buttons */}
        <PresenceButtons
          gameId={game._id}
          userPresence={userPresence}
          onUpdate={handlePresenceUpdate}
        />
        
        {/* Attendees List */}
        <AttendeesList 
          attendees={attendees} 
          currentUserId={user?._id}
        />
        
        {/* Real-time notice */}
        <p className="text-xs text-center text-muted">
          ℹ️ Atualiza em tempo real quando alguém confirma ou cancela presença
        </p>
      </div>
    </Container>
  );
};
