import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET() {
  await ensureSeeded();

  try {
    const users = await db.user.findMany({
      where: { isActive: true },
      orderBy: { overallRating: 'desc' },
      select: {
        id: true,
        name: true,
        avatar: true,
        playerType: true,
        position: true,
        overallRating: true,
        gamesPlayed: true,
        mvpCount: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Erro ao buscar ranking' }, { status: 500 });
  }
}
