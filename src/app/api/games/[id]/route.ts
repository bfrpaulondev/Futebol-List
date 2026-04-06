import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();

  try {
    const { id } = await params;
    const game = await db.game.findUnique({
      where: { id },
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
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch (error) {
    console.error('Get game error:', error);
    return NextResponse.json({ error: 'Erro ao buscar jogo' }, { status: 500 });
  }
}
