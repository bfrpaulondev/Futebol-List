import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';
import { checkAndAwardBadges, getMarketValueChange, seedBadges } from '@/lib/badges';

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

    const stats = await db.gameStat.findMany({
      where: { gameId: id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, position: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get game stats error:', error);
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
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

    // Check admin or master role
    const currentUser = await db.user.findUnique({ where: { id: payload.userId } });
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'master')) {
      return NextResponse.json({ error: 'Apenas admin pode registar estatísticas' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { stats: gameStats } = body as {
      stats: Array<{
        userId: string;
        goals: number;
        assists: number;
        ownGoals: number;
        team: string;
        isMvp?: boolean;
      }>;
    };

    if (!gameStats || !Array.isArray(gameStats) || gameStats.length === 0) {
      return NextResponse.json({ error: 'Estatísticas inválidas' }, { status: 400 });
    }

    // Verify game exists
    const game = await db.game.findUnique({ where: { id } });
    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    // Count MVPs
    const mvpEntries = gameStats.filter((s) => s.isMvp === true);
    if (mvpEntries.length > 1) {
      return NextResponse.json({ error: 'Só pode haver um MVP por jogo' }, { status: 400 });
    }

    const mvpUserId = mvpEntries.length === 1 ? mvpEntries[0].userId : null;

    // Upsert game stats
    for (const stat of gameStats) {
      await db.gameStat.upsert({
        where: {
          gameId_userId: {
            gameId: id,
            userId: stat.userId,
          },
        },
        create: {
          gameId: id,
          userId: stat.userId,
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          ownGoals: stat.ownGoals || 0,
          team: stat.team || 'A',
          isMvp: stat.isMvp || false,
        },
        update: {
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          ownGoals: stat.ownGoals || 0,
          team: stat.team || 'A',
          isMvp: stat.isMvp || false,
        },
      });

      // Recalculate user totals from all game stats
      const allUserStats = await db.gameStat.findMany({
        where: { userId: stat.userId },
      });

      const totalGoals = allUserStats.reduce((sum, s) => sum + s.goals, 0);
      const totalAssists = allUserStats.reduce((sum, s) => sum + s.assists, 0);
      const gamesCount = allUserStats.length;

      await db.user.update({
        where: { id: stat.userId },
        data: {
          totalGoals,
          totalAssists,
          gamesPlayed: gamesCount,
        },
      });
    }

    // Handle MVP
    if (mvpUserId) {
      // Reset previous MVP for this game
      await db.gameStat.updateMany({
        where: { gameId: id, isMvp: true },
        data: { isMvp: false },
      });

      // Set new MVP
      await db.gameStat.update({
        where: {
          gameId_userId: {
            gameId: id,
            userId: mvpUserId,
          },
        },
        data: { isMvp: true },
      });

      // Update game.mvpId
      await db.game.update({
        where: { id },
        data: { mvpId: mvpUserId },
      });

      // Increment user's mvpCount
      await db.user.update({
        where: { id: mvpUserId },
        data: {
          mvpCount: {
            increment: 1,
          },
        },
      });
    }

    // Check and award badges for all involved players
    await seedBadges();
    const userIds = gameStats.map((s) => s.userId);
    const allNewBadges: any[] = [];
    for (const uid of [...new Set(userIds)]) {
      const newBadges = await checkAndAwardBadges(uid);
      allNewBadges.push(...newBadges);
    }

    // Update market values based on performance
    for (const uid of [...new Set(userIds)]) {
      const user = await db.user.findUnique({ where: { id: uid } });
      if (user) {
        const { newValue, reason } = getMarketValueChange(user);
        if (Math.abs(newValue - user.marketValue) >= 0.05) {
          await db.user.update({
            where: { id: uid },
            data: { marketValue: newValue },
          });
          await db.marketValueEntry.create({
            data: {
              userId: uid,
              value: newValue,
              reason,
            },
          });
        }
      }
    }

    // Increment consecutiveGames for all involved players
    for (const uid of [...new Set(userIds)]) {
      const user = await db.user.findUnique({ where: { id: uid } });
      if (user) {
        const newConsecutive = user.consecutiveGames + 1;
        const newBestStreak = Math.max(user.bestStreak, newConsecutive);
        await db.user.update({
          where: { id: uid },
          data: {
            consecutiveGames: newConsecutive,
            bestStreak: newBestStreak,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      mvpId: mvpUserId,
      newBadges: allNewBadges.length > 0 ? allNewBadges.map((nb: any) => ({
        badge: nb.badge.name,
        earnedAt: nb.earnedAt,
      })) : [],
    });
  } catch (error) {
    console.error('Record game stats error:', error);
    return NextResponse.json({ error: 'Erro ao registar estatísticas' }, { status: 500 });
  }
}
