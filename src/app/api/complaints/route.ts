import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';
import { checkAndAwardBadges, seedBadges } from '@/lib/badges';

export async function GET(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const againstId = searchParams.get('againstId');
    const complainantId = searchParams.get('complainantId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = {};
    if (againstId) where.againstId = againstId;
    if (complainantId) where.complainantId = complainantId;

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        include: {
          complainant: {
            select: { id: true, name: true, avatar: true },
          },
          against: {
            select: { id: true, name: true, avatar: true },
          },
          game: {
            select: { id: true, date: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.complaint.count({ where }),
    ]);

    return NextResponse.json({
      complaints,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    return NextResponse.json({ error: 'Erro ao buscar queixas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { againstId, gameId, description, category } = body;

    if (!againstId || !description || !category) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 });
    }

    const validCategories = ['agressao', 'faltas', 'palavras', 'atraso', 'outro'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 });
    }

    // Can't complain against yourself
    if (againstId === payload.userId) {
      return NextResponse.json({ error: 'Não podes queixar-te de ti próprio!' }, { status: 400 });
    }

    // Verify against user exists
    const againstUser = await db.user.findUnique({
      where: { id: againstId },
    });

    if (!againstUser) {
      return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });
    }

    const complainant = await db.user.findUnique({
      where: { id: payload.userId },
    });

    // Generate Palestrinha's response
    const { generateComplaintResponse } = await import('@/lib/palestrinha-ai');
    const palestrinhaReply = await generateComplaintResponse({
      description,
      category,
      complainantName: complainant?.name || 'Desconhecido',
      againstName: againstUser.name,
      againstComplaintsCount: againstUser.complaintsReceived,
    });

    // Create complaint
    const complaint = await db.complaint.create({
      data: {
        gameId: gameId || null,
        complainantId: payload.userId,
        againstId,
        description,
        category,
        palestrinhaReply,
      },
      include: {
        complainant: { select: { id: true, name: true, avatar: true } },
        against: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update user counts
    await db.user.update({
      where: { id: payload.userId },
      data: { complaintsFiled: { increment: 1 } },
    });

    await db.user.update({
      where: { id: againstId },
      data: { complaintsReceived: { increment: 1 } },
    });

    // Check badges for both users
    await seedBadges();
    await checkAndAwardBadges(payload.userId);
    await checkAndAwardBadges(againstId);

    // Create notification for the against player
    await db.notification.create({
      data: {
        userId: againstId,
        type: 'game',
        title: '📋 Nova Queixa',
        message: `${complainant?.name || 'Alguém'} apresentou uma queixa contra ti no Bureau! ${palestrinhaReply.slice(0, 60)}...`,
        read: false,
      },
    });

    // Send push notification
    const { sendPushNotification } = await import('@/lib/push');
    sendPushNotification(
      againstId,
      '📋 Nova Queixa',
      `${complainant?.name || 'Alguém'} apresentou uma queixa contra ti!`
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error('File complaint error:', error);
    return NextResponse.json({ error: 'Erro ao registar queixa' }, { status: 500 });
  }
}
