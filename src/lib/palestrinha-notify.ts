import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/openai';

export type PalestrinhaEvent = 'confirm' | 'cancel' | 'game_created' | 'draw_done' | 'payment';

const EVENT_PROMPTS: Record<PalestrinhaEvent, string> = {
  confirm: 'Um jogador acabou de confirmar presença para o próximo jogo.',
  cancel: 'Um jogador cancelou a presença no próximo jogo.',
  game_created: 'Um admin acabou de criar um novo jogo.',
  draw_done: 'O sorteio das equipas acabou de ser feito!',
  payment: 'Um pagamento foi registado.',
};

export async function sendPalestrinhaNotification(
  event: PalestrinhaEvent,
  playerName: string,
  details: string
): Promise<void> {
  try {
    const eventDescription = EVENT_PROMPTS[event] || event;

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
        content: `Evento: ${eventDescription}\nJogador: ${playerName}\nDetalhes: ${details}`,
      },
    ], 1.0);

    const message = (palestrinhaMessage || '').replace(/^["']|["']$/g, '').trim();

    if (!message) return;

    // Get all active users
    const users = await db.user.findMany({
      where: {
        isActive: true,
        notificationsEnabled: true,
      },
      select: { id: true },
    });

    if (users.length === 0) return;

    const typeMap: Record<PalestrinhaEvent, string> = {
      confirm: 'game',
      cancel: 'game',
      game_created: 'game',
      draw_done: 'game',
      payment: 'finance',
    };

    const titleMap: Record<PalestrinhaEvent, string> = {
      confirm: '⚽ Confirmado!',
      cancel: '❌ Cancelado',
      game_created: '📅 Novo Jogo!',
      draw_done: '🎲 Sorteio Feito!',
      payment: '💰 Pagamento',
    };

    // Create notifications for all users in batch
    const now = new Date();
    const notificationsData = users.map((user) => ({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${user.id.slice(0, 6)}`,
      userId: user.id,
      type: typeMap[event],
      title: titleMap[event],
      message,
      read: false,
      createdAt: now,
    }));

    await db.notification.createMany({
      data: notificationsData,
    });
  } catch (error) {
    console.error('Palestrinha notification error:', error);
    // Don't throw - notification failures shouldn't break the main flow
  }
}
