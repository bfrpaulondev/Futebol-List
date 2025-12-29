// -.-.-.-
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Container } from '@components/layout/Container';
import { Header } from '@components/layout/Header';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { financeService } from '@services/financeService';
import toast from 'react-hot-toast';

// -.-.-.-
const suggestionSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  estimatedCost: z.number().positive('Custo deve ser positivo'),
  category: z.enum(['bolas', 'coletes', 'material', 'outros']),
  isPriority: z.boolean()
});

// -.-.-.-
export const SuggestionForm = () => {
  const [loading, setLoading] = useState(false);
  const [recentSuggestions, setRecentSuggestions] = useState([]);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      isPriority: false
    }
  });
  
  // -.-.-.-
  useEffect(() => {
    loadRecentSuggestions();
  }, []);
  
  // -.-.-.-
  const loadRecentSuggestions = async () => {
    try {
      const data = await financeService.getSuggestions();
      setRecentSuggestions(data.slice(0, 5));
    } catch (error) {
      console.error('[SuggestionForm] Failed to load suggestions:', error);
    }
  };
  
  // -.-.-.-
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await financeService.createSuggestion(data);
      toast.success('Sugestão enviada com sucesso!');
      reset();
      loadRecentSuggestions();
      setTimeout(() => navigate('/finances'), 1500);
    } catch (error) {
      console.error('[SuggestionForm] Failed to create suggestion:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // -.-.-.-
  const handleVote = async (suggestionId) => {
    try {
      await financeService.voteSuggestion(suggestionId);
      toast.success('Voto registado!');
      loadRecentSuggestions();
    } catch (error) {
      console.error('[SuggestionForm] Failed to vote:', error);
    }
  };
  
  return (
    <Container>
      <Header title="Nova Sugestão" showBack />
      
      <div className="flex flex-col gap-lg" style={{ paddingBottom: '100px' }}>
        {/* Form */}
        <Card>
          <h4 className="font-bold mb-4">Propor Compra</h4>
          
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-md">
            <Input
              label="Título"
              placeholder="Ex: Novas bolas de futsal"
              {...register('title')}
              error={errors.title?.message}
            />
            
            <div>
              <label className="block text-sm font-semibold mb-2">Descrição</label>
              <textarea
                className="input textarea"
                placeholder="Descreve a necessidade..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>
            
            <div className="grid-2 gap-md">
              <Input
                label="Custo Estimado (€)"
                type="number"
                step="0.01"
                {...register('estimatedCost', { valueAsNumber: true })}
                error={errors.estimatedCost?.message}
              />
              
              <div>
                <label className="block text-sm font-semibold mb-2">Categoria</label>
                <select {...register('category')} className="input">
                  <option value="bolas">Bolas</option>
                  <option value="coletes">Coletes</option>
                  <option value="material">Material</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </div>
            
            {/* Priority toggle */}
            <div 
              onClick={() => {
                const checkbox = document.getElementById('isPriority');
                checkbox.checked = !checkbox.checked;
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                id="isPriority"
                {...register('isPriority')}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <p className="font-semibold text-sm">Marcar como prioritária</p>
                <p className="text-xs text-muted">Urgente ou essencial para o grupo</p>
              </div>
            </div>
            
            <Button type="submit" variant="primary" fullWidth loading={loading}>
              Enviar Sugestão
            </Button>
          </form>
          
          <p className="text-xs text-muted text-center mt-4">
            ℹ️ Todos podem votar. Admins aprovam compras.
          </p>
        </Card>
        
        {/* Recent Suggestions */}
        {recentSuggestions.length > 0 && (
          <Card>
            <h4 className="font-bold mb-4">Sugestões Recentes</h4>
            
            <div className="flex flex-col gap-md">
              {recentSuggestions.map((suggestion) => (
                <div 
                  key={suggestion._id}
                  style={{
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold mb-0">{suggestion.title}</h5>
                    <Badge variant="blue">
                      👍 {suggestion.votes.length}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted mb-2">{suggestion.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">{suggestion.estimatedCost.toFixed(2)}€</span>
                    <Badge variant={
                      suggestion.status === 'em-analise' ? 'green' :
                      suggestion.status === 'aprovada' ? 'orange' : 'pink'
                    }>
                      {suggestion.status}
                    </Badge>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => handleVote(suggestion._id)}
                    style={{ marginTop: 'var(--space-sm)' }}
                  >
                    Votar
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Container>
  );
};
