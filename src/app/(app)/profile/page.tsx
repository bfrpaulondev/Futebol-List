'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { LogOut, Calendar, Trophy, Settings } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [playerType, setPlayerType] = useState(user?.playerType || 'grupo');
  const [position, setPosition] = useState(user?.position || 'ALA');
  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? true);

  const skills = user?.skillsJson ? JSON.parse(user.skillsJson) : {};
  const skillLabels: Record<string, string> = {
    defense: 'Defesa',
    attack: 'Ataque',
    passing: 'Passe',
    technique: 'Técnica',
    stamina: 'Resistência',
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          playerType,
          position,
          notificationsEnabled: notifications,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        useAuthStore.getState().setUser(data.user);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getPlayerTypeColor = (type: string) => {
    switch (type) {
      case 'mensalista': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'grupo': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'externo': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Sair
        </Button>
      </div>

      {/* Player Card */}
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600/10 to-teal-600/10 p-6 text-center">
          <Avatar className="w-20 h-20 mx-auto mb-3">
            <AvatarFallback className="bg-zinc-800 text-zinc-300 text-2xl">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="outline" className={getPlayerTypeColor(user.playerType)}>
              {user.playerType}
            </Badge>
            <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
              {user.position}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full border-2 border-teal-500 flex items-center justify-center mb-1">
                <span className="text-xl font-bold text-teal-400">{user.overallRating}</span>
              </div>
              <span className="text-xs text-zinc-500">OVR</span>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{user.gamesPlayed}</p>
              <span className="text-xs text-zinc-500">Jogos</span>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{user.mvpCount}</p>
              <span className="text-xs text-zinc-500">MVPs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Bars */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">Habilidades</h3>
          <div className="space-y-3">
            {Object.entries(skillLabels).map(([key, label]) => {
              const value = skills[key] || 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-300">{label}</span>
                    <span className="text-sm font-bold text-teal-400">{value}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                      style={{ width: `${value * 10}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-400">Editar Perfil</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(!editing)}
              className="text-teal-400 text-sm"
            >
              {editing ? 'Cancelar' : 'Editar'}
            </Button>
          </div>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">Nome</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">Telefone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="912 345 678"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-zinc-300 text-sm">Tipo</Label>
                  <Select value={playerType} onValueChange={setPlayerType}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="mensalista" className="text-white">Mensalista</SelectItem>
                      <SelectItem value="grupo" className="text-white">Grupo</SelectItem>
                      <SelectItem value="externo" className="text-white">Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-300 text-sm">Posição</Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="GR" className="text-white">GR</SelectItem>
                      <SelectItem value="DEF" className="text-white">DEF</SelectItem>
                      <SelectItem value="ALA" className="text-white">ALA</SelectItem>
                      <SelectItem value="PIVO" className="text-white">PIVO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 text-sm">Notificações</Label>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
              >
                {saving ? 'A guardar...' : 'Guardar Alterações'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links */}
      <div className="space-y-2">
        <Link href="/coletes">
          <Card className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-teal-400" />
                <span className="text-white text-sm">Calendário de Coletes</span>
              </div>
              <span className="text-zinc-500">→</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/leaderboard">
          <Card className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-white text-sm">Ranking</span>
              </div>
              <span className="text-zinc-500">→</span>
            </CardContent>
          </Card>
        </Link>
        {user.role === 'admin' && (
          <Link href="/admin">
            <Card className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  <span className="text-white text-sm">Admin Painel</span>
                </div>
                <span className="text-zinc-500">→</span>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
