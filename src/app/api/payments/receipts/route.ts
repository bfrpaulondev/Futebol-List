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

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Convidados cannot access receipts
    if (user.playerType === 'convidado') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Admin: return all receipts. Mensalista: return only own receipts
    const whereClause = user.role === 'admin' ? {} : { userId: payload.userId };

    const receipts = await db.paymentReceipt.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        reviewer: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ receipts });
  } catch (error) {
    console.error('Get receipts error:', error);
    return NextResponse.json({ error: 'Erro ao buscar recibos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Only mensalistas can upload receipts
    if (user.playerType !== 'mensalista') {
      return NextResponse.json({ error: 'Apenas mensalistas podem enviar comprovativos' }, { status: 403 });
    }

    const { month, year, amount, imageData } = await request.json();

    if (!month || !year || !amount || !imageData) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Mês inválido' }, { status: 400 });
    }

    const receipt = await db.paymentReceipt.create({
      data: {
        userId: payload.userId,
        month,
        year,
        amount,
        imageData,
        status: 'pending',
      },
    });

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('Create receipt error:', error);
    return NextResponse.json({ error: 'Erro ao enviar comprovativo' }, { status: 500 });
  }
}
