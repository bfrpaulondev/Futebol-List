// -.-.-.-
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Container } from '@components/layout/Container';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { useAuth } from '@hooks/useAuth';

// -.-.-.-
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter pelo menos 6 caracteres')
});

const registerSchema = loginSchema.extend({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  playerType: z.enum(['mensalista', 'grupo', 'externo'])
});

// -.-.-.-
export const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  
  const schema = mode === 'login' ? loginSchema : registerSchema;
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });
  
  // -.-.-.-
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(data.email, data.password);
      } else {
        await register(data);
      }
    } catch (error) {
      console.error('[Login] Failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center' 
      }}>
        {/* Logo */}
        <div className="text-center mb-lg">
          <h1 style={{ 
            fontSize: '3rem', 
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 'var(--space-sm)'
          }}>
            ⚽ Futebol App
          </h1>
          <p className="text-muted">Gestão do teu clube de futsal</p>
        </div>
        
        {/* Form Card */}
        <Card style={{ width: '100%', maxWidth: '400px' }}>
          <h2 className="text-center mb-lg">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-md">
            {mode === 'register' && (
              <>
                <Input
                  label="Nome"
                  {...formRegister('name')}
                  error={errors.name?.message}
                />
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Tipo de Jogador</label>
                  <select {...formRegister('playerType')} className="input">
                    <option value="mensalista">Mensalista</option>
                    <option value="grupo">Grupo</option>
                    <option value="externo">Externo</option>
                  </select>
                </div>
              </>
            )}
            
            <Input
              label="Email"
              type="email"
              {...formRegister('email')}
              error={errors.email?.message}
            />
            
            <Input
              label="Password"
              type="password"
              {...formRegister('password')}
              error={errors.password?.message}
            />
            
            <Button type="submit" variant="primary" fullWidth loading={loading}>
              {mode === 'login' ? 'Entrar' : 'Registar'}
            </Button>
          </form>
          
          <div className="divider" />
          
          <p className="text-center text-sm">
            {mode === 'login' ? 'Não tens conta?' : 'Já tens conta?'}
            {' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-teal)',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </Card>
      </div>
    </Container>
  );
};
