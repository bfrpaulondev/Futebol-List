'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  LogOut,
  Calendar,
  Trophy,
  Settings,
  CreditCard,
  ChevronRight,
  Flame,
  Target,
  Award,
  TrendingUp,
  MessageSquare,
  Newspaper,
  DollarSign,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  congregation?: string | null;
  playerType: string;
  position: string;
  avatar: string | null;
  role: string;
  skillsJson: string;
  overallRating: number;
  gamesPlayed: number;
  mvpCount: number;
  notificationsEnabled: boolean;
  currentStreak?: number;
  bestStreak?: number;
  totalGoals?: number;
  totalAssists?: number;
  marketValue?: number;
  badgeCount?: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extendedStats, setExtendedStats] = useState<{
    currentStreak: number;
    bestStreak: number;
    totalGoals: number;
    totalAssists: number;
    marketValue: number;
    badgeCount: number;
  } | null>(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [congregation, setCongregation] = useState(user?.congregation || '');
  const [position, setPosition] = useState(user?.position || 'ALA');
  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/users/profile/stats');
        if (res.ok) {
          const data = await res.json();
          setExtendedStats(data);
        }
      } catch {
        // ignore
      }
    };
    fetchStats();
  }, []);

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
          congregation: congregation.trim() || null,
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

  if (!user) return null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Meu Perfil</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Futebol Bonfim</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Sair
        </Button>
      </div>

      {/* Player Card */}
      <div className={`rounded-2xl shadow-lg shadow-black/20 overflow-hidden ${
        user.playerType === 'mensalista' ? 'gradient-border-emerald' : 'gradient-border-sky'
      }`}>
        <div className="bg-zinc-900 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 p-6 text-center">
            <Avatar className="w-20 h-20 mx-auto mb-3 ring-2 ring-offset-2 ring-offset-zinc-900 ring-emerald-500/50">
              <AvatarFallback className="bg-zinc-800 text-zinc-300 text-2xl">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            {user.congregation && (
              <p className="text-zinc-400 text-sm mt-1">⛪ {user.congregation}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline" className={`text-xs ${
                user.playerType === 'mensalista'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
              }`}>
                {user.playerType}
              </Badge>
              <Badge variant="outline" className="text-xs bg-zinc-800 text-zinc-300 border-zinc-700">
                {user.position}
              </Badge>
            </div>
          </div>
          <CardContent className="p-4">
            {/* Main Stats Row */}
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full border-2 border-emerald-500/50 flex items-center justify-center mb-1 bg-emerald-500/5">
                  <span className="text-xl font-bold text-emerald-400">{user.overallRating}</span>
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

            {/* Extended Stats Row */}
            {extendedStats && (
              <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-zinc-800/50">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <Target className="w-3 h-3 text-emerald-400" />
                    <p className="text-sm font-bold text-white">{extendedStats.totalGoals}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500">Golos</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <Trophy className="w-3 h-3 text-sky-400" />
                    <p className="text-sm font-bold text-white">{extendedStats.totalAssists}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500">Assist.</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <p className="text-sm font-bold text-white">{extendedStats.currentStreak}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500">Streak</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <Award className="w-3 h-3 text-purple-400" />
                    <p className="text-sm font-bold text-white">{extendedStats.badgeCount}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500">Badges</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <DollarSign className="w-3 h-3 text-teal-400" />
                    <p className="text-sm font-bold text-white">{extendedStats.marketValue.toFixed(1)}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500">Valor €</span>
                </div>
              </div>
            )}

            {/* Streak Fire Indicator */}
            {extendedStats && extendedStats.currentStreak >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 text-center"
              >
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-lg"
                >
                  🔥
                </motion.span>
                <span className="text-orange-400 text-xs font-medium ml-1">
                  {extendedStats.currentStreak} jogos seguidos!
                </span>
              </motion.div>
            )}
          </CardContent>
        </div>
      </div>

      {/* Skill Bars */}
      <div className="glass-card rounded-2xl shadow-lg shadow-black/20 p-4">
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Habilidades</h3>
        <div className="space-y-3">
          {Object.entries(skillLabels).map(([key, label]) => {
            const value = skills[key] || 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-zinc-300">{label}</span>
                  <span className="text-sm font-bold text-emerald-400">{value}</span>
                </div>
                <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-400 h-2 rounded-full transition-all duration-500 skill-glow"
                    style={{ width: `${value * 10}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass-card rounded-2xl shadow-lg shadow-black/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-400">Editar Perfil</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(!editing)}
            className="text-emerald-400 text-sm hover:bg-emerald-500/10 transition-all duration-200"
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
                className="bg-zinc-800/80 border-zinc-700/50 text-white transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Telefone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="912 345 678"
                className="bg-zinc-800/80 border-zinc-700/50 text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Congregação</Label>
              <Input
                value={congregation}
                onChange={(e) => setCongregation(e.target.value)}
                placeholder="Ex: Setúbal Bonfim"
                className="bg-zinc-800/80 border-zinc-700/50 text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Posição</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="bg-zinc-800/80 border-zinc-700/50 text-white">
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
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300 text-sm">Notificações</Label>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-gradient-animated text-white transition-all duration-200 shadow-lg shadow-emerald-500/20"
            >
              {saving ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          </div>
        )}
      </div>

      {/* Quick Access Links */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-400 mb-2">Explorar</h3>

        <Link href="/badges">
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-zinc-800/60 group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Award className="w-4.5 h-4.5 text-purple-400" />
              </div>
              <div>
                <span className="text-white text-sm font-medium">Conquistas</span>
                <p className="text-zinc-500 text-xs">As tuas medalhas e badges</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
        </Link>

        <Link href="/complaints">
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-zinc-800/60 group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <MessageSquare className="w-4.5 h-4.5 text-rose-400" />
              </div>
              <div>
                <span className="text-white text-sm font-medium">Bureau de Queixas</span>
                <p className="text-zinc-500 text-xs">Reclama sobre os colegas</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
        </Link>

        <Link href="/reviews">
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-zinc-800/60 group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Newspaper className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <span className="text-white text-sm font-medium">Revista Palestrinha</span>
                <p className="text-zinc-500 text-xs">Notícias e crónicas</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
        </Link>

        {(user.playerType === 'mensalista' || user.role === 'admin' || user.role === 'master') && (
          <>
            <Link href="/hall-of-fame">
              <div className="glass-card rounded-2xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-zinc-800/60 group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Trophy className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-white text-sm font-medium">Hall of Fame</span>
                    <p className="text-zinc-500 text-xs">Banco de Honra</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
            </Link>

            <Link href="/market">
              <div className="glass-card rounded-2xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-zinc-800/60 group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-teal-400" />
                  </div>
                  <div>
                    <span className="text-white text-sm font-medium">Cotação de Mercado</span>
                    <p className="text-zinc-500 text-xs">O teu valor no mercado</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Functional Links */}
      <div className="space-y-2">
        {user.playerType === 'mensalista' && (
          <Link href="/payments">
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-zinc-800/60 group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CreditCard className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-white text-sm font-medium">Pagamentos</span>
                  <p className="text-zinc-500 text-xs">Envia comprovativos MBWay</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
          </Link>
        )}
        <Link href="/coletes">
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-zinc-800/60 group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <Calendar className="w-4.5 h-4.5 text-teal-400" />
              </div>
              <div>
                <span className="text-white text-sm font-medium">Calendário de Coletes</span>
                <p className="text-zinc-500 text-xs">Responsáveis mensais</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
        </Link>
        <Link href="/leaderboard">
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-zinc-800/60 group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Trophy className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <span className="text-white text-sm font-medium">Ranking</span>
                <p className="text-zinc-500 text-xs">Classificação dos jogadores</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
        </Link>
        {(user.role === 'admin' || user.role === 'master') && (
          <Link href="/admin">
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-zinc-800/60 group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <Settings className="w-4.5 h-4.5 text-rose-400" />
                </div>
                <div>
                  <span className="text-white text-sm font-medium">Admin Painel</span>
                  <p className="text-zinc-500 text-xs">Gestão do clube</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
