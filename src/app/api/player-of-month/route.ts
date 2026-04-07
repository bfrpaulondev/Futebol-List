import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Mês inválido' }, { status: 400 });
    }

    const playerOfMonth = await db.playerOfMonth.findUnique({
      where: {
        month_year: { month, year },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            position: true,
            marketValue: true,
          },
        },
      },
    });

    if (!playerOfMonth) {
      // Calculate from game stats
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Get games played this month
      const gamesThisMonth = await db.game.findMany({
        where: {
          playedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          stats: {
            include: { user: true },
          },
        },
      });

      if (gamesThisMonth.length === 0) {
        return NextResponse.json({
          exists: false,
          message: `Sem dados para ${getMonthName(month)} ${year}`,
          month,
          year,
        });
      }

      // Aggregate stats per player
      const playerAgg: Record<string, {
        name: string;
        userId: string;
        mvpCount: number;
        totalGoals: number;
        totalAssists: number;
        gamesPlayed: number;
        totalRating: number;
        ratingCount: number;
      }> = {};

      for (const game of gamesThisMonth) {
        for (const stat of game.stats) {
          if (!playerAgg[stat.userId]) {
            playerAgg[stat.userId] = {
              name: stat.user.name,
              userId: stat.userId,
              mvpCount: 0,
              totalGoals: 0,
              totalAssists: 0,
              gamesPlayed: 0,
              totalRating: 0,
              ratingCount: 0,
            };
          }
          const agg = playerAgg[stat.userId];
          agg.totalGoals += stat.goals;
          agg.totalAssists += stat.assists;
          agg.gamesPlayed += 1;
          if (stat.isMvp) agg.mvpCount += 1;
          agg.totalRating += stat.user.overallRating;
          agg.ratingCount += 1;
        }
      }

      // Find best player by composite score
      let bestPlayer: any = null;
      let bestScore = -1;

      for (const [userId, agg] of Object.entries(playerAgg)) {
        const score = agg.mvpCount * 3 + agg.totalGoals * 1.5 + agg.totalAssists + agg.gamesPlayed * 0.5;
        if (score > bestScore) {
          bestScore = score;
          bestPlayer = { userId, ...agg };
        }
      }

      if (!bestPlayer) {
        return NextResponse.json({
          exists: false,
          message: `Sem dados para ${getMonthName(month)} ${year}`,
          month,
          year,
        });
      }

      return NextResponse.json({
        exists: false,
        suggested: {
          userId: bestPlayer.userId,
          name: bestPlayer.name,
          month,
          year,
          mvpCount: bestPlayer.mvpCount,
          avgRating: bestPlayer.ratingCount > 0 ? bestPlayer.totalRating / bestPlayer.ratingCount : 0,
          gamesPlayed: bestPlayer.gamesPlayed,
          goals: bestPlayer.totalGoals,
        },
        month,
        year,
        gamesPlayed: gamesThisMonth.length,
      });
    }

    return NextResponse.json({
      exists: true,
      playerOfMonth: {
        id: playerOfMonth.id,
        userId: playerOfMonth.userId,
        user: playerOfMonth.user,
        month: playerOfMonth.month,
        year: playerOfMonth.year,
        mvpCount: playerOfMonth.mvpCount,
        avgRating: playerOfMonth.avgRating,
        gamesPlayed: playerOfMonth.gamesPlayed,
        goals: playerOfMonth.goals,
        speech: playerOfMonth.speech,
        createdAt: playerOfMonth.createdAt,
      },
      month,
      year,
    });
  } catch (error) {
    console.error('Get player of month error:', error);
    return NextResponse.json({ error: 'Erro ao buscar jogador do mês' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({ where: { id: payload.userId } });
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'master')) {
      return NextResponse.json({ error: 'Apenas admin pode definir jogador do mês' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, month, year } = body;

    if (!userId || !month || !year) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (m < 1 || m > 12 || isNaN(y)) {
      return NextResponse.json({ error: 'Mês ou ano inválido' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, totalGoals: true, totalAssists: true, mvpCount: true, overallRating: true, gamesPlayed: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Calculate stats for this month
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);

    const gamesThisMonth = await db.game.findMany({
      where: {
        playedAt: { gte: startDate, lte: endDate },
      },
      include: {
        stats: { where: { userId } },
      },
    });

    let mvpCount = 0;
    let totalRating = 0;
    let gamesPlayed = 0;
    let goals = 0;

    for (const game of gamesThisMonth) {
      const stat = game.stats[0];
      if (stat) {
        gamesPlayed += 1;
        mvpCount += stat.isMvp ? 1 : 0;
        goals += stat.goals;
        totalRating += user.overallRating;
      }
    }

    const avgRating = gamesPlayed > 0 ? Math.round((totalRating / gamesPlayed) * 100) / 100 : user.overallRating;

    // Generate speech
    const { generatePlayerOfMonthSpeech } = await import('@/lib/palestrinha-ai');
    const speech = await generatePlayerOfMonthSpeech(user.name, {
      month: m,
      year: y,
      mvpCount,
      avgRating,
      gamesPlayed,
      goals,
    });

    // Upsert player of month
    const playerOfMonth = await db.playerOfMonth.upsert({
      where: {
        month_year: { month: m, year: y },
      },
      create: {
        userId,
        month: m,
        year: y,
        mvpCount,
        avgRating,
        gamesPlayed,
        goals,
        speech,
      },
      update: {
        userId,
        mvpCount,
        avgRating,
        gamesPlayed,
        goals,
        speech,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, position: true },
        },
      },
    });

    // Create notification for all users
    const allUsers = await db.user.findMany({
      where: { isActive: true, notificationsEnabled: true },
      select: { id: true },
    });

    if (allUsers.length > 0) {
      const now = new Date();
      await db.notification.createMany({
        data: allUsers.map((u) => ({
          userId: u.id,
          type: 'game',
          title: '🏆 Jogador do Mês!',
          message: `${user.name} é o Jogador do Mês de ${getMonthName(m)} ${y}! ${speech.slice(0, 80)}...`,
          read: false,
          createdAt: now,
        })),
      });

      const { sendPushNotificationBatch } = await import('@/lib/push');
      sendPushNotificationBatch(
        allUsers.map((u) => u.id),
        '🏆 Jogador do Mês!',
        `${user.name} é o Jogador do Mês!`
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      playerOfMonth,
    });
  } catch (error) {
    console.error('Set player of month error:', error);
    return NextResponse.json({ error: 'Erro ao definir jogador do mês' }, { status: 500 });
  }
}

function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return months[month - 1] || '';
}
