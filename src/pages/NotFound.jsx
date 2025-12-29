// -.-.-.-
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@components/layout/Container';
import { Button } from '@components/ui/Button';

// -.-.-.-
export const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Container>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '6rem', marginBottom: 0 }}>404</h1>
        <h2 className="mb-4">Página não encontrada</h2>
        <p className="text-muted mb-lg">
          A página que procuras não existe ou foi removida.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Voltar ao Início
        </Button>
      </div>
    </Container>
  );
};
