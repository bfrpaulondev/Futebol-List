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

    return NextResponse.json({ game });
  } catch (error) {
    console.error('Get next game error:', error);
    return NextResponse.json({ error: 'Erro ao buscar jogo' }, { status: 500 });
  }
}
