// -.-.-.-
import React, { useState } from 'react';
import { Container } from '@components/layout/Container';
import { Header } from '@components/layout/Header';
import { Button } from '@components/ui/Button';
import { PlayerCard } from '@components/profile/PlayerCard';
import { SkillBars } from '@components/profile/SkillBars';
import { ProfileForm } from '@components/profile/ProfileForm';
import { userService } from '@services/userService';
import { useAuth } from '@hooks/useAuth';
import toast from 'react-hot-toast';

// -.-.-.-
export const Profile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // -.-.-.-
  const handleAvatarChange = async (file) => {
    setUploading(true);
    try {
      await userService.uploadAvatar(file);
      toast.success('Foto atualizada!');
      window.location.reload(); // Refresh to get new avatar
    } catch (error) {
      console.error('[Profile] Avatar upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  // -.-.-.-
  const handleProfileUpdate = async (data) => {
    setLoading(true);
    try {
      await userService.updateProfile(data);
      toast.success('Perfil atualizado!');
      window.location.reload(); // Refresh user data
    } catch (error) {
      console.error('[Profile] Update failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <Header 
        title="Meu Perfil"
        actions={
          <Button variant="secondary" size="sm" onClick={logout}>
            Sair
          </Button>
        }
      />
      
      <div className="flex flex-col gap-lg" style={{ paddingBottom: '100px' }}>
        {/* Player Card */}
        <PlayerCard user={user} onAvatarChange={handleAvatarChange} />
        
        {uploading && (
          <p className="text-center text-sm text-muted">A fazer upload da foto...</p>
        )}
        
        {/* Skills */}
        <SkillBars skills={user.skills} />
        
        {/* Edit Form */}
        <ProfileForm 
          user={user} 
          onSubmit={handleProfileUpdate}
          loading={loading}
        />
      </div>
    </Container>
  );
};
