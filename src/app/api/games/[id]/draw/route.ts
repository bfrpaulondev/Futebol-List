import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

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
          orderBy: { confirmedAt: 'asc' },
        },
      },
    });

    if (!game || game.attendees.length < 2) {
      return NextResponse.json({ error: 'Jogo precisa de pelo menos 2 jogadores confirmados' }, { status: 400 });
    }

    // Shuffle only confirmed attendees
    const shuffled = [...game.attendees].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);

    const teamA = shuffled.slice(0, mid).map((a) => ({
      userId: a.user.id,
      name: a.user.name,
      position: a.user.position,
      overallRating: a.user.overallRating,
      playerType: a.user.playerType,
      avatar: a.user.avatar,
    }));

    const teamB = shuffled.slice(mid).map((a) => ({
      userId: a.user.id,
      name: a.user.name,
      position: a.user.position,
      overallRating: a.user.overallRating,
      playerType: a.user.playerType,
      avatar: a.user.avatar,
    }));

    // Generate AI coach comment using z-ai-web-dev-sdk
    let aiCoachComment = '';
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      const teamANames = teamA.map((p) => p.name).join(', ');
      const teamBNames = teamB.map((p) => p.name).join(', ');
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'És um treinador de futsal português. Dá uma opinião curta e motivadora sobre as equipas formadas (2-3 frases). Responde em português.',
          },
          {
            role: 'user',
            content: `Sorteio de equipas para futsal:\nEquipa Verde: ${teamANames}\nEquipa Azul: ${teamBNames}\nDá uma opinião sobre o equilíbrio das equipas.`,
          },
        ],
      });
      aiCoachComment = completion.choices[0]?.message?.content || '';
    } catch {
      aiCoachComment = 'Bom jogo a todos! Que vença o melhor! ⚽';
    }

    const updated = await db.game.update({
      where: { id },
      data: {
        teamsJson: JSON.stringify({ teamA, teamB }),
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
