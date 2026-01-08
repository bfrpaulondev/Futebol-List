// -.-.-.-
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container } from '@components/layout/Container';
import { Header } from '@components/layout/Header';
import { Loader } from '@components/ui/Loader';
import { Button } from '@components/ui/Button';
import { Field } from '@components/teams/Field';
import { AICoachCard } from '@components/teams/AICoachCard';
import { gameService } from '@services/gameService';
import { useAuth } from '@hooks/useAuth';
import toast from 'react-hot-toast';

// -.-.-.-
export const Teams = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const { isAdmin } = useAuth();
  
  // -.-.-.-
  useEffect(() => {
    if (gameId) {
      loadGame();
    } else {
      loadNextGame();
    }
  }, [gameId]);
  
  // -.-.-.-
  const loadGame = async () => {
    try {
      const data = await gameService.getGameById(gameId);
      setGame(data);
    } catch (error) {
      console.error('[Teams] Failed to load game:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // -.-.-.-
  const loadNextGame = async () => {
    try {
      const data = await gameService.getNextGame();
      setGame(data);
    } catch (error) {
      console.error('[Teams] Failed to load next game:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // -.-.-.-
  const handleDrawTeams = async () => {
    setDrawing(true);
    try {
      const updatedGame = await gameService.drawTeams(game._id);
      setGame(updatedGame);
      toast.success('Equipas sorteadas!');
    } catch (error) {
      console.error('[Teams] Draw failed:', error);
    } finally {
      setDrawing(false);
    }
  };
  
  if (loading) return <Loader fullScreen message="A carregar equipas..." />;
  
  if (!game) {
    return (
      <Container>
        <Header title="Equipas" />
        <div className="text-center py-xl">
          <p className="text-muted">Nenhum jogo disponível.</p>
        </div>
      </Container>
    );
  }
  
  const hasTeams = game?.teams?.teamA?.length > 0 && game?.teams?.teamB?.length > 0;
  const attendees = game?.attendees || [];
  
  return (
    <Container>
      <Header title="Equipas" showBack />
      
      <div className="flex flex-col gap-lg" style={{ paddingBottom: '100px' }}>
        {/* Draw button (admin only) */}
        {isAdmin && !hasTeams && attendees.length >= 10 && (
          <Button
            variant="primary"
            fullWidth
            onClick={handleDrawTeams}
            loading={drawing}
          >
            🎲 Sortear Equipas
          </Button>
        )}
        
        {hasTeams ? (
          <>
            {/* Field */}
            <Field 
              teamA={game.teams.teamA} 
              teamB={game.teams.teamB}
            />
            
            {/* AI Coach Comment */}
            <AICoachCard comment={game.aiCoachComment} />
          </>
        ) : (
          <div className="text-center py-xl">
            <p className="text-muted">
              {attendees.length < 10 
                ? `Aguardar mais jogadores (${attendees.length}/10)`
                : 'Aguardando sorteio das equipas'}
            </p>
          </div>
        )}
      </div>
    </Container>
  );
};
