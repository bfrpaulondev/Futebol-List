import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { gameId, ratedPlayerId, scores } = await request.json();

    if (!gameId || !ratedPlayerId || !scores) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    if (ratedPlayerId === payload.userId) {
      return NextResponse.json({ error: 'Não podes avaliar-te a ti próprio' }, { status: 400 });
    }

    // Only allow rating CONFIRMED attendees (not waiting list)
    const attendee = await db.gameAttendee.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId: ratedPlayerId,
        },
      },
    });

    if (!attendee || attendee.status !== 'confirmed') {
      return NextResponse.json({ error: 'Só podes avaliar jogadores confirmados' }, { status: 400 });
    }

    // Upsert rating
    const rating = await db.rating.upsert({
      where: {
        gameId_raterId_ratedPlayerId: {
          gameId,
          raterId: payload.userId,
          ratedPlayerId,
        },
      },
      create: {
        gameId,
        raterId: payload.userId,
        ratedPlayerId,
        scoresJson: JSON.stringify(scores),
      },
      update: {
        scoresJson: JSON.stringify(scores),
      },
    });

    // Recalculate overall rating for the rated player
    const allRatings = await db.rating.findMany({
      where: { ratedPlayerId },
    });

    if (allRatings.length > 0) {
      const totalScores = { defense: 0, attack: 0, passing: 0, technique: 0, stamina: 0 };
      allRatings.forEach((r) => {
        const s = JSON.parse(r.scoresJson);
        totalScores.defense += s.defense || 0;
        totalScores.attack += s.attack || 0;
        totalScores.passing += s.passing || 0;
        totalScores.technique += s.technique || 0;
        totalScores.stamina += s.stamina || 0;
      });

      const avg = {
        defense: +(totalScores.defense / allRatings.length).toFixed(1),
        attack: +(totalScores.attack / allRatings.length).toFixed(1),
        passing: +(totalScores.passing / allRatings.length).toFixed(1),
        technique: +(totalScores.technique / allRatings.length).toFixed(1),
        stamina: +(totalScores.stamina / allRatings.length).toFixed(1),
      };

      const overall = +(
        (avg.defense + avg.attack + avg.passing + avg.technique + avg.stamina) / 5
      ).toFixed(1);

      await db.user.update({
        where: { id: ratedPlayerId },
        data: {
          skillsJson: JSON.stringify(avg),
          overallRating: overall,
        },
      });
    }

    return NextResponse.json({ rating });
  } catch (error) {
    console.error('Rating error:', error);
    return NextResponse.json({ error: 'Erro ao avaliar' }, { status: 500 });
  }
}
