// -.-.-.-
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';

// -.-.-.-
const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  phone: z.string().optional(),
  playerType: z.enum(['mensalista', 'grupo', 'externo']),
  position: z.enum(['GR', 'DEF', 'ALA', 'PIVO']),
  notificationsEnabled: z.boolean()
});

// -.-.-.-
export const ProfileForm = ({ user, onSubmit, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone || '',
      playerType: user.playerType,
      position: user.position,
      notificationsEnabled: user.notificationsEnabled
    }
  });
  
  return (
    <Card>
      <h4 className="font-bold mb-4">Editar Perfil</h4>
      
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-md">
        <div className="grid-2 gap-md">
          <Input
            label="Nome"
            {...register('name')}
            error={errors.name?.message}
          />
          
          <Input
            label="Telefone"
            type="tel"
            {...register('phone')}
            error={errors.phone?.message}
          />
        </div>
        
        <div className="grid-2 gap-md">
          {/* Player Type */}
          <div>
            <label className="block text-sm font-semibold mb-2">Tipo de Jogador</label>
            <select {...register('playerType')} className="input">
              <option value="mensalista">Mensalista</option>
              <option value="grupo">Grupo</option>
              <option value="externo">Externo</option>
            </select>
            {errors.playerType && (
              <p className="text-red-500 text-xs mt-1">{errors.playerType.message}</p>
            )}
          </div>
          
          {/* Position */}
          <div>
            <label className="block text-sm font-semibold mb-2">Posição</label>
            <select {...register('position')} className="input">
              <option value="GR">Guarda-Redes</option>
              <option value="DEF">Defesa</option>
              <option value="ALA">Ala</option>
              <option value="PIVO">Pivô</option>
            </select>
            {errors.position && (
              <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>
            )}
          </div>
        </div>
        
        {/* Notifications */}
        <div className="flex items-center gap-sm">
          <input
            type="checkbox"
            id="notifications"
            {...register('notificationsEnabled')}
            style={{ width: '18px', height: '18px' }}
          />
          <label htmlFor="notifications" className="text-sm cursor-pointer">
            Receber notificações
          </label>
        </div>
        
        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Guardar alterações
        </Button>
      </form>
    </Card>
  );
};
