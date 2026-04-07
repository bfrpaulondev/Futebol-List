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

    if (payload.role !== 'admin' && payload.role !== 'master') {
      return NextResponse.json({ error: 'Apenas admin pode alterar tipo' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { playerType } = body;

    if (!playerType || !['mensalista', 'convidado'].includes(playerType)) {
      return NextResponse.json({ error: 'Tipo inválido. Use "mensalista" ou "convidado"' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Don't allow changing type of other admins/masters (except by master)
    if (payload.role !== 'master' && (targetUser.role === 'admin' || targetUser.role === 'master')) {
      return NextResponse.json({ error: 'Não podes alterar o tipo de outro admin' }, { status: 403 });
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { playerType },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        playerType: updatedUser.playerType,
        role: updatedUser.role,
        position: updatedUser.position,
      },
    });
  } catch (error) {
    console.error('Update playerType error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar tipo' }, { status: 500 });
  }
}
