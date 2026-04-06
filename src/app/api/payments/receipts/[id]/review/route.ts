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
    if (!user || (user.role !== 'admin' && user.role !== 'master')) {
      return NextResponse.json({ error: 'Apenas admin pode rever recibos' }, { status: 403 });
    }

    const { id } = await params;
    const receipt = await db.paymentReceipt.findUnique({ where: { id } });
    if (!receipt) {
      return NextResponse.json({ error: 'Comprovativo não encontrado' }, { status: 404 });
    }

    if (receipt.status !== 'pending') {
      return NextResponse.json({ error: 'Este comprovativo já foi revisto' }, { status: 400 });
    }

    const { status, note } = await request.json();

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Status inválido. Use approved ou rejected.' }, { status: 400 });
    }

    const updated = await db.paymentReceipt.update({
      where: { id },
      data: {
        status,
        reviewedById: payload.userId,
        reviewNote: note || null,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        reviewer: {
          select: { id: true, name: true },
        },
      },
    });

    // Create notification for the user about the review
    const notificationType = status === 'approved' ? 'payment_approved' : 'payment_rejected';
    const notificationTitle = status === 'approved' ? 'Comprovativo Aprovado' : 'Comprovativo Rejeitado';
    const notificationMessage = status === 'approved'
      ? `O teu comprovativo de pagamento para ${receipt.month}/${receipt.year} foi aprovado.`
      : `O teu comprovativo para ${receipt.month}/${receipt.year} foi rejeitado.${note ? ` Motivo: ${note}` : ''}`;

    await db.notification.create({
      data: {
        userId: receipt.userId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
      },
    });

    return NextResponse.json({ receipt: updated });
  } catch (error) {
    console.error('Review receipt error:', error);
    return NextResponse.json({ error: 'Erro ao rever comprovativo' }, { status: 500 });
  }
}
