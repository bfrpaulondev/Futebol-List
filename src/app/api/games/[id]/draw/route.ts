import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';
import { chatCompletion } from '@/lib/openai';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PlayerInfo {
  userId: string;
  name: string;
  position: string;
  overallRating: number;
  playerType: string;
  avatar: string | null;
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

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas admin pode sortear' }, { status: 403 });
    }

    const { id } = await params;
    const game = await db.game.findUnique({
      where: { id },
      include: {
        attendees: {
          where: { status: 'confirmed' },
          include: { user: true },
        },
      },
    });

    if (!game || game.attendees.length < 2) {
      return NextResponse.json({ error: 'Jogo precisa de pelo menos 2 jogadores confirmados' }, { status: 400 });
    }

    // Separate goalkeepers from field players
    const goalkeepers = game.attendees.filter((a) => a.user.position === 'GR');
    const fieldPlayers = game.attendees.filter((a) => a.user.position !== 'GR');

    const shuffledGKs = shuffle(goalkeepers);
    const shuffledField = shuffle(fieldPlayers);

    const teamA: PlayerInfo[] = [];
    const teamB: PlayerInfo[] = [];

    // Helper to build player info
    const toPlayer = (a: typeof game.attendees[0], overridePos?: string): PlayerInfo => ({
      userId: a.user.id,
      name: a.user.name,
      position: overridePos || a.user.position,
      overallRating: a.user.overallRating,
      playerType: a.user.playerType,
      avatar: a.user.avatar,
    });

    // GK logic
    if (shuffledGKs.length >= 2) {
      // Pick 2 GKs, randomly assign A or B
      const [gk1, gk2] = shuffledGKs;
      if (Math.random() < 0.5) {
        teamA.push(toPlayer(gk1));
        teamB.push(toPlayer(gk2));
      } else {
        teamB.push(toPlayer(gk1));
        teamA.push(toPlayer(gk2));
      }
    } else if (shuffledGKs.length === 1) {
      // 1 GK goes to Team A
      teamA.push(toPlayer(shuffledGKs[0]));
      // Best rated field player from team B pool becomes GK
      // We'll assign after shuffling field players
    }
    // If 0 GKs, 2 random field players will become GKs later

    // Distribute field players alternately: A, B, A, B...
    const remainingField = [...shuffledField];
    let turnA = teamA.length <= teamB.length; // start with the smaller team

    // If we have 0 GKs, first 2 field players become GKs
    if (shuffledGKs.length === 0) {
      if (remainingField.length >= 2) {
        const gkA = remainingField.shift()!;
        const gkB = remainingField.shift()!;
        // Randomly assign which GK goes to which team
        if (Math.random() < 0.5) {
          teamA.push(toPlayer(gkA, 'GR'));
          teamB.push(toPlayer(gkB, 'GR'));
        } else {
          teamB.push(toPlayer(gkA, 'GR'));
          teamA.push(toPlayer(gkB, 'GR'));
        }
      }
    }

    // If only 1 GK, assign best rated field player to Team B as GK
    if (shuffledGKs.length === 1 && remainingField.length > 0) {
      // Sort remaining field by rating desc, pick the best for GK on Team B
      remainingField.sort((a, b) => b.user.overallRating - a.user.overallRating);
      const gkB = remainingField.shift()!;
      teamB.push(toPlayer(gkB, 'GR'));
    }

    // Re-shuffle remaining field players for fairness
    const finalRemaining = shuffle(remainingField);

    // Fill teams alternately, cap at 6 per team
    let idx = 0;
    while (idx < finalRemaining.length && (teamA.length < 6 || teamB.length < 6)) {
      const p = finalRemaining[idx];
      if (teamA.length < teamB.length) {
        teamA.push(toPlayer(p));
      } else if (teamB.length < teamA.length) {
        teamB.push(toPlayer(p));
      } else {
        // Equal: alternate starting with A
        if (teamA.length < 6) {
          teamA.push(toPlayer(p));
        } else if (teamB.length < 6) {
          teamB.push(toPlayer(p));
        }
      }
      idx++;
    }

    // Reserves: remaining players beyond 6v6
    const reserves: PlayerInfo[] = [];
    while (idx < finalRemaining.length) {
      reserves.push(toPlayer(finalRemaining[idx]));
      idx++;
    }

    // Generate AI coach commentary
    let aiCoachComment = '';
    try {
      const teamANames = teamA.map((p) => `${p.name} (${p.position})`).join(', ');
      const teamBNames = teamB.map((p) => `${p.name} (${p.position})`).join(', ');
      const reserveNames = reserves.length > 0
        ? `Suplentes: ${reserves.map((p) => p.name).join(', ')}`
        : '';

      aiCoachComment = await chatCompletion([
        {
          role: 'system',
          content:
            'És um treinador de futsal português apaixonado. Dá uma opinião curta e motivadora sobre as equipas formadas (3-4 frases). Menciona nomes de jogadores e posições. Sê entusiasmado mas realista. Responde em português de Portugal.',
        },
        {
          role: 'user',
          content: `Sorteio de equipas para futsal 6v6:\nEquipa Verde: ${teamANames}\nEquipa Azul: ${teamBNames}\n${reserveNames}\nDá uma opinião sobre o equilíbrio das equipas e destaca aspetos táticos.`,
        },
      ], 0.9);
    } catch {
      aiCoachComment = 'Bom jogo a todos! Que vença o melhor! ⚽';
    }

    const teamsData = {
      teamA,
      teamB,
      reserves: reserves.length > 0 ? reserves : undefined,
    };

    const updated = await db.game.update({
      where: { id },
      data: {
        teamsJson: JSON.stringify(teamsData),
        aiCoachComment,
        status: 'confirmed',
      },
    });

    return NextResponse.json({ success: true, game: updated });
  } catch (error) {
    console.error('Draw error:', error);
    return NextResponse.json({ error: 'Erro ao sortear equipas' }, { status: 500 });
  }
}
