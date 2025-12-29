// -.-.-.-
import React, { useState } from 'react';
import { Button } from '@components/ui/Button';

// -.-.-.-
export const MessageInput = ({ onSend, loading }) => {
  const [message, setMessage] = useState('');
  
  // -.-.-.-
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage('');
  };
  
  return (
    <form 
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: 'var(--space-sm)',
        padding: 'var(--space-md)',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderTop: '1px solid var(--border-color)',
        position: 'sticky',
        bottom: 0
      }}
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escreve uma mensagem..."
        className="input"
        style={{ flex: 1, margin: 0 }}
        disabled={loading}
      />
      <Button 
        type="submit" 
        variant="primary"
        loading={loading}
        disabled={!message.trim()}
      >
        Enviar
      </Button>
    </form>
  );
};
