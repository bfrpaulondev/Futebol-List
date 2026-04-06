import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';
import { chatCompletion } from '@/lib/openai';

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Only admin or master can trigger palestrinha notifications
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || (user.role !== 'admin' && user.role !== 'master')) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });
    }

    const { event, playerName, details } = await request.json();

    if (!event || !playerName) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const validEvents = ['confirm', 'cancel', 'game_created', 'draw_done', 'payment'];
    if (!validEvents.includes(event)) {
      return NextResponse.json({ error: 'Evento inválido' }, { status: 400 });
    }

    const eventDescriptions: Record<string, string> = {
      confirm: 'Um jogador acabou de confirmar presença para o próximo jogo.',
      cancel: 'Um jogador cancelou a presença no próximo jogo.',
      game_created: 'Um admin acabou de criar um novo jogo.',
      draw_done: 'O sorteio das equipas acabou de ser feito!',
      payment: 'Um pagamento foi registado.',
    };

    const palestrinhaMessage = await chatCompletion([
      {
        role: 'system',
        content: `És o Palestrinha, um mini treinador engraçado e motivador do Society Futebol Nº5 - Futebol Bonfim.
Usas linguagem informal portuguesa (slang), és muito entusiasmado, motivas os jogadores e usas emojis.
Referências frequentes: "Society Futebol Nº5", "Bonfim", "rapaziada", "bora lá", "é para isso".
Gera uma mensagem curta (1-2 frases, máx 200 caracteres) sobre o evento.
Responde APENAS com a mensagem, sem aspas.`,
      },
      {
        role: 'user',
        content: `Evento: ${eventDescriptions[event] || event}\nJogador: ${playerName}\nDetalhes: ${details || ''}`,
      },
    ], 1.0);

    const message = (palestrinhaMessage || '').replace(/^["']|["']$/g, '').trim();

    if (!message) {
      return NextResponse.json({ error: 'Falha ao gerar mensagem' }, { status: 500 });
    }

    // Get all active users with notifications enabled
    const users = await db.user.findMany({
      where: {
        isActive: true,
        notificationsEnabled: true,
      },
      select: { id: true },
    });

    const typeMap: Record<string, string> = {
      confirm: 'game',
      cancel: 'game',
      game_created: 'game',
      draw_done: 'game',
      payment: 'finance',
    };

    const titleMap: Record<string, string> = {
      confirm: '⚽ Confirmado!',
      cancel: '❌ Cancelado',
      game_created: '📅 Novo Jogo!',
      draw_done: '🎲 Sorteio Feito!',
      payment: '💰 Pagamento',
    };

    const now = new Date();
    const notificationsData = users.map((u) => ({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${u.id.slice(0, 6)}`,
      userId: u.id,
      type: typeMap[event] || 'game',
      title: titleMap[event] || '📢 Palestrinha',
      message,
      read: false,
      createdAt: now,
    }));

    await db.notification.createMany({
      data: notificationsData,
    });

    return NextResponse.json({ success: true, message, notifiedCount: users.length });
  } catch (error) {
    console.error('Palestrinha notification error:', error);
    return NextResponse.json({ error: 'Erro ao enviar notificação' }, { status: 500 });
  }
}
