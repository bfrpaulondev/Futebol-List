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

    // Find next upcoming game (future date, not played yet)
    const now = new Date();
    const upcomingGame = await db.game.findFirst({
      where: {
        date: { gte: now },
        playedAt: null,
        status: { in: ['open', 'confirmed'] },
      },
      include: {
        attendees: {
          where: { status: 'confirmed' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                position: true,
                totalGoals: true,
                totalAssists: true,
                mvpCount: true,
                consecutiveGames: true,
                gamesPlayed: true,
                overallRating: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    if (!upcomingGame) {
      return NextResponse.json({
        exists: false,
        message: 'Nenhum jogo agendado',
      });
    }

    // Find last played game
    const lastPlayedGame = await db.game.findFirst({
      where: {
        playedAt: { not: null },
      },
      include: {
        stats: {
          include: { user: true },
        },
      },
      orderBy: { playedAt: 'desc' },
    });

    // Get all player stats for motivation
    const allPlayerStats = upcomingGame.attendees.map((a) => a.user);

    // Generate pre-game summary
    const { generatePreGameSummary } = await import('@/lib/palestrinha-ai');
    const summary = await generatePreGameSummary(
      lastPlayedGame,
      upcomingGame,
      allPlayerStats
    );

    const dateStr = new Date(upcomingGame.date).toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    return NextResponse.json({
      exists: true,
      game: {
        id: upcomingGame.id,
        date: upcomingGame.date,
        dateFormatted: dateStr,
        location: upcomingGame.location,
        confirmedPlayers: upcomingGame.attendees.length,
      },
      summary,
      lastGame: lastPlayedGame ? {
        id: lastPlayedGame.id,
        scoreA: lastPlayedGame.scoreA,
        scoreB: lastPlayedGame.scoreB,
        playedAt: lastPlayedGame.playedAt,
      } : null,
    });
  } catch (error) {
    console.error('Get pre-game summary error:', error);
    return NextResponse.json({ error: 'Erro ao buscar resumo pré-jogo' }, { status: 500 });
  }
}
