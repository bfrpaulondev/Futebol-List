import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Iniciando seed...');

  // Clean existing data
  await prisma.rating.deleteMany();
  await prisma.coleteSchedule.deleteMany();
  await prisma.gameAttendee.deleteMany();
  await prisma.message.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();

  const hash = await Bun.password.hash('123456');

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
      role: 'player',
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
      playerType: 'grupo',
      position: 'PIVO',
      role: 'player',
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
      playerType: 'externo',
      position: 'GR',
      role: 'player',
      skillsJson: JSON.stringify({ defense: 9, attack: 3, passing: 5, technique: 6, stamina: 7 }),
      overallRating: 6.0,
      gamesPlayed: 15,
      mvpCount: 2,
      notificationsEnabled: true,
    },
  });

  console.log('✅ Utilizadores criados');

  // Create game 3 days from now
  const gameDate = new Date();
  gameDate.setDate(gameDate.getDate() + 3);
  gameDate.setHours(19, 0, 0, 0);

  const game = await prisma.game.create({
    data: {
      date: gameDate,
      location: 'Pavilhão Municipal de Setúbal',
      maxPlayers: 12,
      status: 'open',
    },
  });

  console.log('✅ Jogo criado');

  // Add attendees
  await prisma.gameAttendee.createMany({
    data: [
      { gameId: game.id, userId: bruno.id, playerType: 'mensalista', priority: 1 },
      { gameId: game.id, userId: joao.id, playerType: 'mensalista', priority: 1 },
      { gameId: game.id, userId: pedro.id, playerType: 'grupo', priority: 2 },
    ],
  });

  console.log('✅ Participantes adicionados');

  // Create chat messages
  await prisma.message.createMany({
    data: [
      {
        content: 'Bora jogar! Quem vai na próxima quarta?',
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
        status: 'em-analise',
        createdById: pedro.id,
      },
    ],
  });

  console.log('✅ Sugestões criadas');

  // Create colete schedule for 2025
  const coletePlayers = [bruno, joao, pedro]; // mensalistas and grupo
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
