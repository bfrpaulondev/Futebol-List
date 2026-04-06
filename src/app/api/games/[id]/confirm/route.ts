import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const game = await db.game.findUnique({ where: { id } });
    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    if (game.attendees.length >= game.maxPlayers) {
      return NextResponse.json({ error: 'Jogo está cheio' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const attendee = await db.gameAttendee.create({
      data: {
        gameId: id,
        userId: payload.userId,
        playerType: user.playerType,
        priority: user.playerType === 'mensalista' ? 1 : user.playerType === 'grupo' ? 2 : 3,
      },
    });

    return NextResponse.json({ success: true, attendee });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Já confirmaste presença' }, { status: 409 });
    }
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Erro ao confirmar presença' }, { status: 500 });
  }
}
