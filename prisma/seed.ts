import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Iniciando seed...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.paymentReceipt.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.coleteSchedule.deleteMany();
  await prisma.gameAttendee.deleteMany();
  await prisma.message.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('123456', 12);

  // Create users
  const bruno = await prisma.user.create({
    data: {
      email: 'bruno@test.com',
      passwordHash: hash,
      name: 'Bruno Paulon',
      playerType: 'mensalista',
      position: 'ALA',
      role: 'admin',
      skillsJson: JSON.stringify({ defense: 7, attack: 8, passing: 7, technique: 8, stamina: 7 }),
      overallRating: 7.4,
      gamesPlayed: 45,
      mvpCount: 8,
      notificationsEnabled: true,
    },
  });

  const joao = await prisma.user.create({
    data: {
      email: 'joao@test.com',
      passwordHash: hash,
      name: 'João Silva',
      playerType: 'mensalista',
      position: 'DEF',
      role: 'admin',
      skillsJson: JSON.stringify({ defense: 8, attack: 5, passing: 6, technique: 6, stamina: 8 }),
      overallRating: 6.6,
      gamesPlayed: 42,
      mvpCount: 3,
      notificationsEnabled: true,
    },
  });

  const pedro = await prisma.user.create({
    data: {
      email: 'pedro@test.com',
      passwordHash: hash,
      name: 'Pedro Costa',
      playerType: 'mensalista',
      position: 'PIVO',
      role: 'admin',
      skillsJson: JSON.stringify({ defense: 6, attack: 8, passing: 7, technique: 7, stamina: 6 }),
      overallRating: 6.8,
      gamesPlayed: 30,
      mvpCount: 5,
      notificationsEnabled: true,
    },
  });

  const ricardo = await prisma.user.create({
    data: {
      email: 'ricardo@test.com',
      passwordHash: hash,
      name: 'Ricardo Santos',
      playerType: 'mensalista',
      position: 'GR',
      role: 'admin',
      skillsJson: JSON.stringify({ defense: 9, attack: 3, passing: 5, technique: 6, stamina: 7 }),
      overallRating: 6.0,
      gamesPlayed: 15,
      mvpCount: 2,
      notificationsEnabled: true,
    },
  });

  const miguel = await prisma.user.create({
    data: {
      email: 'miguel@test.com',
      passwordHash: hash,
      name: 'Miguel Ferreira',
      playerType: 'convidado',
      position: 'ALA',
      role: 'player',
      skillsJson: JSON.stringify({ defense: 5, attack: 7, passing: 6, technique: 7, stamina: 6 }),
      overallRating: 6.2,
      gamesPlayed: 10,
      mvpCount: 1,
      notificationsEnabled: true,
    },
  });

  const andre = await prisma.user.create({
    data: {
      email: 'andré@test.com',
      passwordHash: hash,
      name: 'André Sousa',
      playerType: 'convidado',
      position: 'DEF',
      role: 'player',
      skillsJson: JSON.stringify({ defense: 7, attack: 4, passing: 5, technique: 5, stamina: 7 }),
      overallRating: 5.6,
      gamesPlayed: 8,
      mvpCount: 0,
      notificationsEnabled: true,
    },
  });

  console.log('✅ Utilizadores criados');

  // Create game on upcoming Saturday
  const gameDate = new Date();
  const dayOfWeek = gameDate.getDay();
  const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
  gameDate.setDate(gameDate.getDate() + daysUntilSaturday);
  gameDate.setHours(19, 0, 0, 0);

  // Confirmation deadline: Wednesday 12h (3 days before Saturday)
  const confirmationDeadline = new Date(gameDate);
  confirmationDeadline.setDate(confirmationDeadline.getDate() - 3);
  confirmationDeadline.setHours(12, 0, 0, 0);

  const game = await prisma.game.create({
    data: {
      date: gameDate,
      location: 'Pavilhão Municipal de Setúbal',
      maxPlayers: 12,
      status: 'open',
      confirmationDeadline,
    },
  });

  console.log('✅ Jogo criado');

  // Add attendees (confirmed status)
  await prisma.gameAttendee.createMany({
    data: [
      { gameId: game.id, userId: bruno.id, playerType: 'mensalista', priority: 1, status: 'confirmed' },
      { gameId: game.id, userId: joao.id, playerType: 'mensalista', priority: 1, status: 'confirmed' },
      { gameId: game.id, userId: pedro.id, playerType: 'mensalista', priority: 1, status: 'confirmed' },
    ],
  });

  console.log('✅ Participantes adicionados');

  // Create chat messages
  await prisma.message.createMany({
    data: [
      {
        content: 'Bora jogar! Quem vai no próximo sábado?',
        authorId: bruno.id,
        channel: 'general',
      },
      {
        content: 'Eu vou com certeza! Sempre pronto para o futsal 🔥',
        authorId: joao.id,
        channel: 'general',
      },
      {
        content: 'Confirmo presença. Vamos fazer um bom jogo!',
        authorId: pedro.id,
        channel: 'general',
      },
    ],
  });

  console.log('✅ Mensagens criadas');

  // Create transactions
  await prisma.transaction.createMany({
    data: [
      {
        type: 'entrada',
        amount: 25.0,
        category: 'Mensalidade',
        description: 'Mensalidade - Bruno Paulon',
        isPaid: true,
        paidAt: new Date(),
      },
      {
        type: 'entrada',
        amount: 25.0,
        category: 'Mensalidade',
        description: 'Mensalidade - João Silva',
        isPaid: true,
        paidAt: new Date(),
      },
      {
        type: 'saida',
        amount: 40.0,
        category: 'Instalações',
        description: 'Pagamento do pavilhão',
        isPaid: true,
        paidAt: new Date(),
      },
    ],
  });

  console.log('✅ Transações criadas');

  // Create suggestions
  await prisma.suggestion.createMany({
    data: [
      {
        title: 'Novas Bolas de Futsal',
        description: 'Precisamos de 3 bolas novas para os treinos e jogos. As atuais já estão muito gastas.',
        estimatedCost: 45.0,
        category: 'Equipamento',
        isPriority: true,
        votesJson: JSON.stringify([bruno.id, joao.id]),
        approvalsJson: JSON.stringify([bruno.id]),
        votingOpen: false,
        status: 'em-analise',
        createdById: bruno.id,
      },
      {
        title: 'Coletes Novos',
        description: 'Sugiro comprar coletes de qualidade para facilitar o sorteio de equipas.',
        estimatedCost: 60.0,
        category: 'Equipamento',
        isPriority: false,
        votesJson: JSON.stringify([pedro.id]),
        approvalsJson: JSON.stringify([]),
        votingOpen: false,
        status: 'em-analise',
        createdById: pedro.id,
      },
    ],
  });

  console.log('✅ Sugestões criadas');

  // Create colete schedule for 2025
  const coletePlayers = [bruno, joao, pedro, ricardo];
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const monthsJson: { month: string; monthIndex: number; userId: string; userName: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const player = coletePlayers[i % coletePlayers.length];
    monthsJson.push({
      month: months[i],
      monthIndex: i,
      userId: player.id,
      userName: player.name,
    });
  }

  await prisma.coleteSchedule.create({
    data: {
      year: 2025,
      monthsJson: JSON.stringify(monthsJson),
    },
  });

  console.log('✅ Calendário de coletes criado');

  // Create some ratings
  await prisma.rating.create({
    data: {
      gameId: game.id,
      ratedPlayerId: joao.id,
      raterId: bruno.id,
      scoresJson: JSON.stringify({ defense: 8, attack: 5, passing: 7, technique: 6, stamina: 7 }),
    },
  });

  await prisma.rating.create({
    data: {
      gameId: game.id,
      ratedPlayerId: pedro.id,
      raterId: bruno.id,
      scoresJson: JSON.stringify({ defense: 6, attack: 9, passing: 7, technique: 7, stamina: 6 }),
    },
  });

  await prisma.rating.create({
    data: {
      gameId: game.id,
      ratedPlayerId: bruno.id,
      raterId: joao.id,
      scoresJson: JSON.stringify({ defense: 7, attack: 8, passing: 7, technique: 8, stamina: 7 }),
    },
  });

  console.log('✅ Avaliações criadas');

  // Create sample notification
  await prisma.notification.create({
    data: {
      userId: bruno.id,
      type: 'daily_reminder',
      title: 'Lembrete de Jogo',
      message: 'Não te esqueças de confirmar presença para o próximo jogo de sábado!',
    },
  });

  console.log('✅ Notificações criadas');
  console.log('🎉 Seed completo!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
