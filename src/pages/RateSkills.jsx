// -.-.-.-
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container } from '@components/layout/Container';
import { Header } from '@components/layout/Header';
import { Card } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Loader } from '@components/ui/Loader';
import { gameService } from '@services/gameService';
import api from '@services/api';
import { useAuth } from '@hooks/useAuth';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

// -.-.-.-
const skillLabels = {
  defense: 'Defesa',
  attack: 'Ataque',
  passing: 'Passe',
  technique: 'Técnica',
  stamina: 'Resistência'
};

// -.-.-.-
export const RateSkills = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [ratings, setRatings] = useState({}); // { playerId: { defense: 5, attack: 6, ... } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  
  // -.-.-.-
  useEffect(() => {
    if (gameId) {
      loadGame();
    }
  }, [gameId]);
  
  // -.-.-.-
  const loadGame = async () => {
    try {
      const data = await gameService.getGameById(gameId);
      setGame(data);
      
      // Initialize ratings
      const myTeam = getMyTeam(data);
      const initialRatings = {};
      myTeam.forEach(p => {
        if (p.player._id !== user._id) {
          initialRatings[p.player._id] = {
            defense: 5,
            attack: 5,
            passing: 5,
            technique: 5,
            stamina: 5
          };
        }
      });
      setRatings(initialRatings);
    } catch (error) {
      console.error('[RateSkills] Failed to load game:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // -.-.-.-
  const getMyTeam = (gameData) => {
    const inTeamA = gameData.teams.teamA.find(p => p.player._id === user._id);
    return inTeamA ? gameData.teams.teamA : gameData.teams.teamB;
  };
  
  // -.-.-.-
  const handleRatingChange = (playerId, skill, value) => {
    setRatings(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [skill]: parseInt(value)
      }
    }));
  };
  
  // -.-.-.-
  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Submit each rating
      await Promise.all(
        Object.entries(ratings).map(([playerId, scores]) =>
          api.post('/ratings', {
            gameId: game._id,
            ratedPlayerId: playerId,
            scores
          })
        )
      );
      
      toast.success('Avaliações guardadas!');
      navigate('/');
    } catch (error) {
      console.error('[RateSkills] Failed to save ratings:', error);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) return <Loader fullScreen message="A carregar avaliações..." />;
  
  if (!game || !game.ratingsOpen) {
    return (
      <Container>
        <Header title="Avaliar Jogadores" showBack />
        <div className="text-center py-xl">
          <p className="text-muted">Avaliações não disponíveis no momento.</p>
        </div>
      </Container>
    );
  }
  
  const myTeam = getMyTeam(game);
  const hoursLeft = differenceInHours(new Date(game.ratingsCloseAt), new Date());
  
  return (
    <Container>
      <Header title="Avaliar Jogadores" showBack />
      
      <div className="flex flex-col gap-lg" style={{ paddingBottom: '100px' }}>
        {/* Game Info */}
        <Card style={{ background: 'linear-gradient(135deg, #0e7490, #4f46e5)' }}>
          <div className="flex justify-between items-start">
            <div>
              <Badge variant="green">Equipa {myTeam === game.teams.teamA ? 'A' : 'B'} · Pós-jogo</Badge>
              <h4 className="mt-2 mb-1">
                {format(new Date(game.date), "d 'de' MMMM", { locale: ptBR })}
              </h4>
              <p className="text-sm text-gray-300">
                Resultado: {game.result.scoreA} - {game.result.scoreB}
              </p>
            </div>
            <Badge variant="orange">{hoursLeft}h restantes</Badge>
          </div>
        </Card>
        
        {/* Note */}
        <p className="text-sm text-muted text-center">
          ℹ️ Avalias apenas os teus colegas de equipa. Não avalias a ti próprio.
        </p>
        
        {/* Players to rate */}
        {myTeam
          .filter(p => p.player._id !== user._id)
          .map((teammate) => (
            <Card key={teammate.player._id}>
              <div className="flex items-start gap-md mb-4">
                <Avatar 
                  src={teammate.player.avatar} 
                  name={teammate.player.name} 
                  size="md"
                />
                <div>
                  <h5 className="font-bold mb-0">{teammate.player.name}</h5>
                  <p className="text-xs text-muted">{teammate.role} · OVR {teammate.player.overallRating}</p>
                </div>
              </div>
              
              {/* Skill sliders */}
              <div className="flex flex-col gap-md">
                {Object.keys(skillLabels).map((skill) => (
                  <div key={skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted">{skillLabels[skill]}</span>
                      <span className="font-bold" style={{ color: 'var(--color-yellow)' }}>
                        {ratings[teammate.player._id]?.[skill] || 5}
                      </span>
                    </div>
                    
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={ratings[teammate.player._id]?.[skill] || 5}
                      onChange={(e) => handleRatingChange(teammate.player._id, skill, e.target.value)}
                      style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(15, 23, 42, 0.8)',
                        outline: 'none',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                      className="skill-slider"
                    />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        
        {/* Submit buttons */}
        <div className="grid-2 gap-md">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/')}
          >
            Mais tarde
          </Button>
          <Button
            variant="primary"
            fullWidth
            loading={saving}
            onClick={handleSubmit}
          >
            Guardar Avaliações
          </Button>
        </div>
      </div>
      
      {/* Custom slider styles */}
      <style>{`
        .skill-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--gradient-coin);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(250, 204, 21, 0.6);
        }
        
        .skill-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--gradient-coin);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(250, 204, 21, 0.6);
        }
      `}</style>
    </Container>
  );
};
