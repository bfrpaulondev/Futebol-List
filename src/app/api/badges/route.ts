import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';
import { seedBadges } from '@/lib/badges';

export async function GET(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Ensure badges are seeded
    await seedBadges();

    // Get all badges
    const allBadges = await db.badge.findMany({
      orderBy: [{ category: 'asc' }, { tier: 'asc' }],
    });

    // Get user's earned badges
    const userBadges = await db.userBadge.findMany({
      where: { userId: payload.userId },
      include: { badge: true },
    });

    const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));

    const badgesWithStatus = allBadges.map((badge) => ({
      ...badge,
      earned: earnedMap.has(badge.id),
      earnedAt: earnedMap.get(badge.id) || null,
    }));

    return NextResponse.json({ badges: badgesWithStatus });
  } catch (error) {
    console.error('Get badges error:', error);
    return NextResponse.json({ error: 'Erro ao buscar badges' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // POST is reserved for admin to manually award badges
    const currentUser = await db.user.findUnique({ where: { id: payload.userId } });
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'master')) {
      return NextResponse.json({ error: 'Apenas admin pode atribuir badges' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, badgeSlug } = body;

    if (!userId || !badgeSlug) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 });
    }

    const badge = await db.badge.findUnique({ where: { slug: badgeSlug } });
    if (!badge) {
      return NextResponse.json({ error: 'Badge não encontrado' }, { status: 404 });
    }

    const userBadge = await db.userBadge.upsert({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id,
        },
      },
      create: {
        userId,
        badgeId: badge.id,
      },
      update: {},
      include: { badge: true },
    });

    // Create notification for the user
    await db.notification.create({
      data: {
        userId,
        type: 'game',
        title: `🎖️ Novo Badge!`,
        message: `Ganhaste o badge "${badge.name}"! ${badge.description}`,
        read: false,
      },
    });

    return NextResponse.json({ success: true, userBadge });
  } catch (error) {
    console.error('Award badge error:', error);
    return NextResponse.json({ error: 'Erro ao atribuir badge' }, { status: 500 });
  }
}
