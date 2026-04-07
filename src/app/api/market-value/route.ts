import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';
import { getMarketValueChange } from '@/lib/badges';

export async function GET(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Get specific user market value
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          avatar: true,
          position: true,
          marketValue: true,
          totalGoals: true,
          totalAssists: true,
          mvpCount: true,
          overallRating: true,
          gamesPlayed: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
      }

      // Get market value history (last 10)
      const history = await db.marketValueEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Calculate potential next value
      const { newValue, reason } = getMarketValueChange(user);

      return NextResponse.json({
        user,
        history,
        projected: { value: newValue, reason },
      });
    }

    // Get all users sorted by market value desc
    const users = await db.user.findMany({
      where: {
        isActive: true,
        role: { not: 'player' } ? undefined : undefined, // All active users
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        position: true,
        marketValue: true,
        totalGoals: true,
        totalAssists: true,
        mvpCount: true,
        overallRating: true,
        gamesPlayed: true,
      },
      orderBy: { marketValue: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get market value error:', error);
    return NextResponse.json({ error: 'Erro ao buscar valores de mercado' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Admin only
    const currentUser = await db.user.findUnique({ where: { id: payload.userId } });
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'master')) {
      return NextResponse.json({ error: 'Apenas admin pode atualizar valores' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, value, reason } = body;

    if (!userId || value === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 });
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Create market value entry
    await db.marketValueEntry.create({
      data: {
        userId,
        value: numValue,
        reason: reason || 'Atualização manual',
      },
    });

    // Update user's market value
    const updated = await db.user.update({
      where: { id: userId },
      data: { marketValue: numValue },
      select: {
        id: true,
        name: true,
        marketValue: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    console.error('Update market value error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar valor de mercado' }, { status: 500 });
  }
}
