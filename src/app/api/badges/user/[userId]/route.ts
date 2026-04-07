import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';
import { seedBadges } from '@/lib/badges';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { userId } = await params;

    await seedBadges();

    const userBadges = await db.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: { earnedAt: 'desc' },
    });

    return NextResponse.json({ badges: userBadges });
  } catch (error) {
    console.error('Get user badges error:', error);
    return NextResponse.json({ error: 'Erro ao buscar badges do utilizador' }, { status: 500 });
  }
}
