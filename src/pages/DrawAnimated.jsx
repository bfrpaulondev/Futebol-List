// -.-.-.-
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container } from '@components/layout/Container';
import { Header } from '@components/layout/Header';
import { Card } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Loader } from '@components/ui/Loader';
import { gameService } from '@services/gameService';
import { motion, AnimatePresence } from 'framer-motion';

// -.-.-.-
export const DrawAnimated = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState(null); // 'A' or 'B'
  
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [queue, setQueue] = useState([]);
  
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
      
      // Sort players by rating (balanced queue)
      const sorted = [...data.attendees]
        .map(a => a.player)
        .sort((a, b) => b.overallRating - a.overallRating);
      
      setQueue(sorted);
      
      // Initialize empty slots
      setTeamA(Array(6).fill(null)); // GR + 4 LINHA + SUP
      setTeamB(Array(6).fill(null));
    } catch (error) {
      console.error('[DrawAnimated] Failed to load game:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // -.-.-.-
  const handleFlipCoin = () => {
    if (currentIndex >= queue.length) return;
    
    setCoinFlipping(true);
    setCoinResult(null);
    
    // Simulate coin flip (random)
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'A' : 'B';
      setCoinResult(result);
      setCoinFlipping(false);
      
      // Assign player to team
      const player = queue[currentIndex];
      if (result === 'A') {
        const emptySlot = teamA.findIndex(slot => slot === null);
        const newTeamA = [...teamA];
        newTeamA[emptySlot] = player;
        setTeamA(newTeamA);
      } else {
        const emptySlot = teamB.findIndex(slot => slot === null);
        const newTeamB = [...teamB];
        newTeamB[emptySlot] = player;
        setTeamB(newTeamB);
      }
      
      // Move to next player
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setCoinResult(null);
      }, 1500);
    }, 2000);
  };
  
  if (loading) return <Loader fullScreen message="A preparar sorteio..." />;
  
  const currentPlayer = queue[currentIndex];
  const isComplete = currentIndex >= queue.length;
  
  return (
    <Container>
      <Header title="Sorteio Animado" showBack />
      
      <div style={{ paddingBottom: '100px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 280px',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)'
        }}>
          {/* Team A Slots */}
          <TeamSlots 
            team={teamA} 
            teamName="Equipa A" 
            color="green"
          />
          
          {/* Team B Slots */}
          <TeamSlots 
            team={teamB} 
            teamName="Equipa B" 
            color="blue"
          />
          
          {/* Coin & Queue */}
          <div className="flex flex-col gap-md">
            {/* Coin Card */}
            <Card style={{ 
              background: 'linear-gradient(135deg, #facc15, #f97316)',
              padding: 'var(--space-lg)',
              textAlign: 'center'
            }}>
              <AnimatePresence mode="wait">
                {coinFlipping ? (
                  <motion.div
                    key="flipping"
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: 1080 }}
                    exit={{ rotateY: 1080 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      margin: '0 auto var(--space-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: 'var(--text-dark)'
                    }}
                  >
                    ?
                  </motion.div>
                ) : coinResult ? (
                  <motion.div
                    key="result"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: coinResult === 'A' 
                        ? 'var(--gradient-primary)' 
                        : 'var(--gradient-secondary)',
                      margin: '0 auto var(--space-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: 'white'
                    }}
                  >
                    {coinResult}
                  </motion.div>
                ) : (
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      margin: '0 auto var(--space-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: 'var(--text-dark)'
                    }}
                  >
                    🪙
                  </div>
                )}
              </AnimatePresence>
              
              {currentPlayer && !isComplete && (
                <div className="mb-4">
                  <p className="text-xs text-dark mb-1">Próximo a sortear:</p>
                  <p className="font-bold text-dark">{currentPlayer.name}</p>
                  <p className="text-xs text-dark">OVR {currentPlayer.overallRating}</p>
                </div>
              )}
              
              {!isComplete ? (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleFlipCoin}
                  disabled={coinFlipping}
                  style={{ 
                    background: 'rgba(0,0,0,0.3)',
                    color: 'white'
                  }}
                >
                  {coinFlipping ? 'A lançar...' : 'Lançar Moeda'}
                </Button>
              ) : (
                <Badge variant="green">Sorteio completo!</Badge>
              )}
            </Card>
            
            {/* Queue */}
            <Card>
              <h5 className="font-bold text-sm mb-2">Fila de Jogadores</h5>
              <p className="text-xs text-muted mb-3">
                Ordem equilibrada pela IA. Moeda decide o lado.
              </p>
              
              <div className="flex flex-col gap-sm">
                {queue.slice(currentIndex).slice(0, 5).map((player, idx) => (
                  <div 
                    key={player._id}
                    className="flex items-center gap-sm p-2 rounded"
                    style={{ 
                      backgroundColor: idx === 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.4)'
                    }}
                  >
                    <Avatar src={player.avatar} name={player.name} size="sm" />
                    <div style={{ flex: 1 }}>
                      <p className="text-xs font-semibold mb-0">{player.name}</p>
                      <p className="text-xs text-muted">OVR {player.overallRating}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
};

// -.-.-.-
const TeamSlots = ({ team, teamName, color }) => {
  const roles = ['GR', 'LINHA', 'LINHA', 'LINHA', 'LINHA', 'SUP'];
  const gradient = color === 'green' 
    ? 'linear-gradient(135deg, #0e7490, #14b8a6)'
    : 'linear-gradient(135deg, #4f46e5, #7c3aed)';
  
  return (
    <Card style={{ background: gradient }}>
      <h4 className="text-center font-bold mb-4">{teamName}</h4>
      
      <div className="flex flex-col gap-sm">
        {team.map((player, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              minHeight: '48px'
            }}
          >
            <span className="text-xs font-bold text-gray-400" style={{ width: '40px' }}>
              {roles[idx]}
            </span>
            
            {player ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-sm flex-1"
              >
                <Avatar src={player.avatar} name={player.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold mb-0">{player.name}</p>
                  <Badge variant="yellow">{player.overallRating}</Badge>
                </div>
              </motion.div>
            ) : (
              <span className="text-muted text-sm">---</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
