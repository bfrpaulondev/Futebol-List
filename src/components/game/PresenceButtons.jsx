// -.-.-.-
import React, { useState } from 'react';
import { Button } from '@components/ui/Button';
import { gameService } from '@services/gameService';
import toast from 'react-hot-toast';

// -.-.-.-
export const PresenceButtons = ({ gameId, userPresence, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  // -.-.-.-
  const handleConfirm = async () => {
    setLoading(true);
    try {
      const updatedGame = await gameService.confirmPresence(gameId);
      toast.success('Presença confirmada!');
      onUpdate(updatedGame);
    } catch (error) {
      console.error('[PresenceButtons] Confirm failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // -.-.-.-
  const handleCancel = async () => {
    setLoading(true);
    try {
      const updatedGame = await gameService.cancelPresence(gameId);
      toast.success('Presença cancelada.');
      onUpdate(updatedGame);
    } catch (error) {
      console.error('[PresenceButtons] Cancel failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (userPresence) {
    return (
      <Button
        variant="secondary"
        fullWidth
        loading={loading}
        onClick={handleCancel}
      >
        ✗ Não vou jogar
      </Button>
    );
  }
  
  return (
    <Button
      variant="primary"
      fullWidth
      loading={loading}
      onClick={handleConfirm}
    >
      ✓ Vou jogar
    </Button>
  );
};
