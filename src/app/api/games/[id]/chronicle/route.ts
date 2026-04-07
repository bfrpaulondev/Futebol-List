import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';
import { checkAndAwardBadges, seedBadges } from '@/lib/badges';

export async function GET(
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

    const game = await db.game.findUnique({
      where: { id },
      select: {
        chronicle: true,
        chronicleAi: true,
        playedAt: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      chronicle: game.chronicle,
      chronicleAi: game.chronicleAi,
      playedAt: game.playedAt,
    });
  } catch (error) {
    console.error('Get chronicle error:', error);
    return NextResponse.json({ error: 'Erro ao buscar crónica' }, { status: 500 });
  }
}

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

    const currentUser = await db.user.findUnique({ where: { id: payload.userId } });
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'master')) {
      return NextResponse.json({ error: 'Apenas admin pode gerar crónicas' }, { status: 403 });
    }

    const { id } = await params;

    const game = await db.game.findUnique({
      where: { id },
    });

    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    // Get game stats
    const stats = await db.gameStat.findMany({
      where: { gameId: id },
      include: { user: true },
    });

    const players = stats.map((s) => ({
      id: s.user.id,
      name: s.user.name,
      position: s.user.position,
      overallRating: s.user.overallRating,
    }));

    const statsData = stats.map((s) => ({
      userId: s.userId,
      goals: s.goals,
      assists: s.assists,
      ownGoals: s.ownGoals,
      team: s.team,
      isMvp: s.isMvp,
    }));

    // Import dynamically to avoid circular deps
    const { generatePostGameChronicle } = await import('@/lib/palestrinha-ai');

    const chronicle = await generatePostGameChronicle(
      {
        id: game.id,
        date: game.date,
        location: game.location,
        scoreA: game.scoreA,
        scoreB: game.scoreB,
        teamsJson: game.teamsJson,
        aiCoachComment: game.aiCoachComment,
        stats: statsData,
      },
      players
    );

    // Update game
    const updated = await db.game.update({
      where: { id },
      data: {
        chronicle,
        chronicleAi: chronicle,
        playedAt: game.playedAt || new Date(),
      },
    });

    // Create notification for all active users
    const allUsers = await db.user.findMany({
      where: { isActive: true, notificationsEnabled: true },
      select: { id: true },
    });

    if (allUsers.length > 0) {
      const now = new Date();
      await db.notification.createMany({
        data: allUsers.map((user) => ({
          userId: user.id,
          type: 'game',
          title: '📰 Crónica Disponível!',
          message: `A crónica do jogo já está pronta! ${chronicle.slice(0, 80)}...`,
          read: false,
          createdAt: now,
        })),
      });

      // Send push notifications in background
      const { sendPushNotificationBatch } = await import('@/lib/push');
      sendPushNotificationBatch(
        allUsers.map((u) => u.id),
        '📰 Crónica Disponível!',
        'A crónica do jogo já está pronta!'
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      chronicle,
      game: updated,
    });
  } catch (error) {
    console.error('Generate chronicle error:', error);
    return NextResponse.json({ error: 'Erro ao gerar crónica' }, { status: 500 });
  }
}
