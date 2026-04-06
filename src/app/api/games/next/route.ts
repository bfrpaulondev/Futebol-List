import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET() {
  await ensureSeeded();

  try {
    const now = new Date();
    const game = await db.game.findFirst({
      where: {
        date: { gte: now },
        status: { in: ['open', 'confirmed'] },
      },
      orderBy: { date: 'asc' },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                playerType: true,
                position: true,
                overallRating: true,
              },
            },
          },
          orderBy: { confirmedAt: 'asc' },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ game: null });
    }

    // Separate confirmed and waiting
    const confirmed = game.attendees.filter((a) => a.status === 'confirmed');
    const waiting = game.attendees.filter((a) => a.status === 'waiting');

    return NextResponse.json({
      game: {
        ...game,
        attendees: undefined,
        confirmed,
        waiting,
      },
    });
  } catch (error) {
    console.error('Get next game error:', error);
    return NextResponse.json({ error: 'Erro ao buscar jogo' }, { status: 500 });
  }
}
