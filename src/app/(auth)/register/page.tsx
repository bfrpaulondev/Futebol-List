'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [playerType, setPlayerType] = useState('convidado');
  const [position, setPosition] = useState('ALA');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, playerType, position }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta');
        setLoading(false);
        return;
      }

      setUser(data.user);
      window.location.href = '/';
    } catch {
      setError('Erro de ligação');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Area */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-3xl">⚽</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Futebol Bonfim</h1>
          <p className="text-zinc-500 mt-1 text-sm">Cria a tua conta</p>
        </div>

        {/* Register Card */}
        <Card className="glass-card shadow-xl shadow-black/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center text-white">Criar Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300 text-sm">Nome</Label>
                <Input
                  id="name"
                  placeholder="O teu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-800/80 border-zinc-700/50 text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="o.teu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-800/80 border-zinc-700/50 text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300 text-sm">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-800/80 border-zinc-700/50 text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Tipo</Label>
                  <Select value={playerType} onValueChange={setPlayerType}>
                    <SelectTrigger className="bg-zinc-800/80 border-zinc-700/50 text-white transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="mensalista" className="text-white">Mensalista</SelectItem>
                      <SelectItem value="convidado" className="text-white">Convidado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Posição</Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger className="bg-zinc-800/80 border-zinc-700/50 text-white transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20">
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

              {error && (
                <p className="text-rose-400 text-sm text-center bg-rose-500/10 py-2 px-3 rounded-lg">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full btn-gradient-animated hover:opacity-90 text-white font-semibold py-5 transition-all duration-200 shadow-lg shadow-emerald-500/20"
              >
                {loading ? 'A criar...' : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-zinc-500 text-sm">
                Já tens conta?{' '}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200">
                  Entrar
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
