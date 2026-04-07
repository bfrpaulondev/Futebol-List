import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET() {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const latestReview = await db.weeklyReview.findFirst({
      orderBy: { publishedAt: 'desc' },
    });

    if (!latestReview) {
      return NextResponse.json({
        exists: false,
        message: 'Ainda não existe revisão semanal',
      });
    }

    return NextResponse.json({
      exists: true,
      review: latestReview,
    });
  } catch (error) {
    console.error('Get weekly review error:', error);
    return NextResponse.json({ error: 'Erro ao buscar revisão semanal' }, { status: 500 });
  }
}

export async function POST() {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({ where: { id: payload.userId } });
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'master')) {
      return NextResponse.json({ error: 'Apenas admin pode gerar revisão semanal' }, { status: 403 });
    }

    // Get games from past 7 days
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekGames = await db.game.findMany({
      where: {
        playedAt: {
          gte: weekAgo,
          lte: now,
        },
      },
      include: {
        stats: {
          include: { user: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Aggregate player stats for the week
    const playerStatsMap: Record<string, {
      name: string;
      goals: number;
      assists: number;
      mvpCount: number;
      rating: number;
      gamesCount: number;
      totalRating: number;
    }> = {};

    for (const game of weekGames) {
      for (const stat of game.stats) {
        if (!playerStatsMap[stat.userId]) {
          playerStatsMap[stat.userId] = {
            name: stat.user.name,
            goals: 0,
            assists: 0,
            mvpCount: 0,
            rating: 0,
            gamesCount: 0,
            totalRating: 0,
          };
        }
        const p = playerStatsMap[stat.userId];
        p.goals += stat.goals;
        p.assists += stat.assists;
        if (stat.isMvp) p.mvpCount += 1;
        p.gamesCount += 1;
        p.totalRating += stat.user.overallRating;
      }
    }

    const topPlayers = Object.values(playerStatsMap)
      .map((p) => ({
        name: p.name,
        goals: p.goals,
        assists: p.assists,
        mvpCount: p.mvpCount,
        rating: p.gamesCount > 0 ? Math.round((p.totalRating / p.gamesCount) * 100) / 100 : 0,
      }))
      .sort((a, b) => (b.mvpCount * 3 + b.goals * 1.5) - (a.mvpCount * 3 + a.goals * 1.5))
      .slice(0, 5);

    // Get complaints from past week
    const weekComplaints = await db.complaint.findMany({
      where: {
        createdAt: {
          gte: weekAgo,
          lte: now,
        },
      },
      include: {
        complainant: { select: { name: true } },
        against: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const complaintsData = weekComplaints.map((c) => ({
      description: c.description,
      complainantName: c.complainant.name,
      againstName: c.against.name,
      category: c.category,
    }));

    // Get badges earned in past week
    const weekBadges = await db.userBadge.findMany({
      where: {
        earnedAt: {
          gte: weekAgo,
          lte: now,
        },
      },
      include: {
        user: { select: { name: true } },
        badge: { select: { name: true } },
      },
      orderBy: { earnedAt: 'desc' },
    });

    const badgesData = weekBadges.map((ub) => ({
      playerName: ub.user.name,
      badgeName: ub.badge.name,
    }));

    // Generate review
    const { generateWeeklyReview } = await import('@/lib/palestrinha-ai');
    const reviewContent = await generateWeeklyReview(
      weekGames.map((g) => ({
        id: g.id,
        date: g.date,
        location: g.location,
        scoreA: g.scoreA,
        scoreB: g.scoreB,
        playedAt: g.playedAt,
      })),
      topPlayers,
      complaintsData,
      badgesData
    );

    // Calculate week boundaries
    const weekStart = new Date(weekAgo);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    // Create weekly review
    const review = await db.weeklyReview.create({
      data: {
        weekStart,
        weekEnd,
        content: reviewContent,
        aiContent: reviewContent,
        statsJson: JSON.stringify({
          gamesPlayed: weekGames.length,
          totalGoals: Object.values(playerStatsMap).reduce((sum, p) => sum + p.goals, 0),
          totalAssists: Object.values(playerStatsMap).reduce((sum, p) => sum + p.assists, 0),
          complaintsCount: weekComplaints.length,
          badgesEarned: weekBadges.length,
          topPlayers: topPlayers.slice(0, 3),
        }),
      },
    });

    // Create notification for all users
    const allUsers = await db.user.findMany({
      where: { isActive: true, notificationsEnabled: true },
      select: { id: true },
    });

    if (allUsers.length > 0) {
      const notifDate = new Date();
      await db.notification.createMany({
        data: allUsers.map((u) => ({
          userId: u.id,
          type: 'game',
          title: '📝 Revisão Semanal!',
          message: `Nova revisão semanal do Society Futebol Nº5! ${reviewContent.slice(0, 80)}...`,
          read: false,
          createdAt: notifDate,
        })),
      });

      const { sendPushNotificationBatch } = await import('@/lib/push');
      sendPushNotificationBatch(
        allUsers.map((u) => u.id),
        '📝 Revisão Semanal!',
        'Nova revisão semanal disponível!'
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error('Generate weekly review error:', error);
    return NextResponse.json({ error: 'Erro ao gerar revisão semanal' }, { status: 500 });
  }
}
