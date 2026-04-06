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

  // Create the 12 mensalistas
  const players = [
    { email: 'carlos@test.com', name: 'Carlos', congregation: 'Baixa da Banheira', position: 'ALA' },
    { email: 'mirko@test.com', name: 'Mirko', congregation: 'Monte Belo', position: 'ALA' },
    { email: 'rodrigo@test.com', name: 'Rodrigo', congregation: 'Setúbal Bonfim', position: 'DEF' },
    { email: 'edson@test.com', name: 'Edson', congregation: 'Setúbal Bonfim', position: 'ALA' },
    { email: 'douglas@test.com', name: 'Douglas', congregation: 'Setúbal Bonfim', position: 'PIVO' },
    { email: 'evandro@test.com', name: 'Evandro', congregation: 'Baixa da Banheira', position: 'DEF' },
    { email: 'bruno@test.com', name: 'Bruno', congregation: 'Setúbal Bonfim', position: 'ALA' },
    { email: 'ruben@test.com', name: 'Rúben', congregation: 'Palmela', position: 'GR' },
    { email: 'brenon@test.com', name: 'Brenon', congregation: 'Setúbal Bonfim', position: 'PIVO' },
    { email: 'gabriel@test.com', name: 'Gabriel', congregation: 'Setúbal Norte', position: 'ALA' },
    { email: 'david@test.com', name: 'David', congregation: 'Setúbal Bonfim', position: 'DEF' },
    { email: 'jesse@test.com', name: 'Jessé', congregation: 'Setúbal Bonfim', position: 'ALA' },
  ];

  const createdUsers = [];
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const user = await prisma.user.create({
      data: {
        email: p.email,
        passwordHash: hash,
        name: p.name,
        congregation: p.congregation,
        playerType: 'mensalista',
        position: p.position,
        role: i === 2 || i === 3 ? 'admin' : i === 6 ? 'master' : i === 10 ? 'admin' : 'player', // Rodrigo(2), Edson(3), David(10)=admin; Bruno(6)=master
        skillsJson: JSON.stringify({ defense: 6, attack: 6, passing: 6, technique: 6, stamina: 6 }),
        overallRating: 5.0,
        gamesPlayed: 0,
        mvpCount: 0,
        notificationsEnabled: true,
      },
    });
    createdUsers.push(user);
  }

  console.log('✅ 12 mensalistas criados');

  // Create game on upcoming Saturday
  const gameDate = new Date();
  const dayOfWeek = gameDate.getDay();
  const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
  gameDate.setDate(gameDate.getDate() + daysUntilSaturday);
  gameDate.setHours(19, 0, 0, 0);

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

  // Create colete schedule for 2026
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const monthsJson = months.map((month, i) => ({
    month,
    monthIndex: i,
    userId: createdUsers[i % createdUsers.length].id,
    userName: createdUsers[i % createdUsers.length].name,
  }));

  await prisma.coleteSchedule.create({
    data: { year: 2026, monthsJson: JSON.stringify(monthsJson) },
  });

  console.log('✅ Calendário de coletes criado');
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
