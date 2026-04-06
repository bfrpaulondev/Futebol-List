import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Only admins can create games
    if (payload.role !== 'admin' && payload.role !== 'master') {
      return NextResponse.json({ error: 'Acesso negado. Apenas admins podem criar jogos.' }, { status: 403 });
    }

    const { date, location, confirmationDeadline } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Data do jogo é obrigatória' }, { status: 400 });
    }

    const gameDate = new Date(date);
    if (isNaN(gameDate.getTime())) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }

    // Parse deadline if provided
    let deadline = null;
    if (confirmationDeadline) {
      deadline = new Date(confirmationDeadline);
      if (isNaN(deadline.getTime())) {
        return NextResponse.json({ error: 'Data de prazo inválida' }, { status: 400 });
      }
    }

    const game = await db.game.create({
      data: {
        date: gameDate,
        location: location || 'Pavilhão Municipal de Setúbal',
        maxPlayers: 12,
        status: 'open',
        confirmationDeadline: deadline,
      },
    });

    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error('Create game error:', error);
    return NextResponse.json({ error: 'Erro ao criar jogo' }, { status: 500 });
  }
}
