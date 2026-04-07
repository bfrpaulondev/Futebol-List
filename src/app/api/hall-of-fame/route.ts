import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';
import { chatCompletion } from '@/lib/openai';

/**
 * Generate a Palestrinha bio for a player for Hall of Fame display.
 */
async function generatePalestrinhaBio(player: {
  name: string;
  position: string;
  totalGoals: number;
  totalAssists: number;
  mvpCount: number;
  gamesPlayed: number;
  overallRating: number;
  bestStreak: number;
}): Promise<string> {
  try {
    const bio = await chatCompletion([
      {
        role: 'system',
        content: `És o Palestrinha, comentador do Society Futebol Nº5 - Futebol Bonfim.
Gera uma bio curta e engraçada (máx 150 caracteres) para o Hall da Fama.
Usa slang pt-PT, emojis, e destaca os atributos do jogador de forma exagerada e engraçada.`,
      },
      {
        role: 'user',
        content: `Jogador: ${player.name}
Posição: ${player.position}
Golos: ${player.totalGoals} | Assistências: ${player.totalAssists}
MVPs: ${player.mvpCount} | Jogos: ${player.gamesPlayed}
Rating: ${player.overallRating} | Melhor racha: ${player.bestStreak} jogos`,
      },
    ], 1.1);

    return (bio || '').trim().slice(0, 150);
  } catch {
    return `${player.name} - A lenda do ${player.position}! ⚽`;
  }
}

export async function GET() {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Get top users for each category (active users only, excluding bot)
    const activeUsers = await db.user.findMany({
      where: {
        isActive: true,
        id: { not: 'user-palestrinha-bot' },
      },
    });

    if (activeUsers.length === 0) {
      return NextResponse.json({
        mvpLeader: null,
        streakLeader: null,
        presenceLeader: null,
        goalsLeader: null,
        assistsLeader: null,
        top3: [],
      });
    }

    // Sort for each category
    const sortedByMvp = [...activeUsers].sort((a, b) => b.mvpCount - a.mvpCount);
    const sortedByStreak = [...activeUsers].sort((a, b) => b.bestStreak - a.bestStreak);
    const sortedByPresence = [...activeUsers].sort((a, b) => b.gamesPlayed - a.gamesPlayed);
    const sortedByGoals = [...activeUsers].sort((a, b) => b.totalGoals - a.totalGoals);
    const sortedByAssists = [...activeUsers].sort((a, b) => b.totalAssists - a.totalAssists);

    const mvpLeader = sortedByMvp[0]?.mvpCount > 0 ? sortedByMvp[0] : null;
    const streakLeader = sortedByStreak[0]?.bestStreak > 0 ? sortedByStreak[0] : null;
    const presenceLeader = sortedByPresence[0]?.gamesPlayed > 0 ? sortedByPresence[0] : null;
    const goalsLeader = sortedByGoals[0]?.totalGoals > 0 ? sortedByGoals[0] : null;
    const assistsLeader = sortedByAssists[0]?.totalAssists > 0 ? sortedByAssists[0] : null;

    // Top 3 overall: composite score (weighted)
    const scored = activeUsers.map((u) => {
      const score =
        u.mvpCount * 3 +
        u.totalGoals * 1.5 +
        u.totalAssists * 1.0 +
        u.gamesPlayed * 0.5 +
        u.bestStreak * 0.8 +
        u.overallRating * 0.5;
      return { ...u, compositeScore: score };
    });

    scored.sort((a, b) => b.compositeScore - a.compositeScore);
    const top3 = scored.slice(0, 3).filter((u) => u.compositeScore > 0);

    // Generate Palestrinha bios for top 3
    const top3WithBios = await Promise.all(
      top3.map(async (player) => {
        // Check if we have a cached bio in user.skillsJson
        let skills: any = {};
        try {
          skills = JSON.parse(player.skillsJson);
        } catch {
          skills = {};
        }

        let bio = skills.hallOfFameBio;
        if (!bio) {
          bio = await generatePalestrinhaBio(player);
          // Cache it
          try {
            const updatedSkills = { ...skills, hallOfFameBio: bio };
            await db.user.update({
              where: { id: player.id },
              data: { skillsJson: JSON.stringify(updatedSkills) },
            });
          } catch {
            // Ignore cache failure
          }
        }

        return {
          user: {
            id: player.id,
            name: player.name,
            avatar: player.avatar,
            position: player.position,
            marketValue: player.marketValue,
            totalGoals: player.totalGoals,
            totalAssists: player.totalAssists,
            mvpCount: player.mvpCount,
            gamesPlayed: player.gamesPlayed,
            bestStreak: player.bestStreak,
            overallRating: player.overallRating,
            compositeScore: player.compositeScore,
          },
          bio,
        };
      })
    );

    // Select fields for leaders
    const selectLeader = (u: any) => u ? {
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      position: u.position,
    } : null;

    return NextResponse.json({
      mvpLeader: mvpLeader ? { ...selectLeader(mvpLeader), value: mvpLeader.mvpCount } : null,
      streakLeader: streakLeader ? { ...selectLeader(streakLeader), value: streakLeader.bestStreak } : null,
      presenceLeader: presenceLeader ? { ...selectLeader(presenceLeader), value: presenceLeader.gamesPlayed } : null,
      goalsLeader: goalsLeader ? { ...selectLeader(goalsLeader), value: goalsLeader.totalGoals } : null,
      assistsLeader: assistsLeader ? { ...selectLeader(assistsLeader), value: assistsLeader.totalAssists } : null,
      top3: top3WithBios,
    });
  } catch (error) {
    console.error('Get hall of fame error:', error);
    return NextResponse.json({ error: 'Erro ao buscar Hall da Fama' }, { status: 500 });
  }
}
