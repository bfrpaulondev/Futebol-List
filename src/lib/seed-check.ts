import { db } from '@/lib/db';
import { hashPassword } from './auth';

let _seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  // Prevent concurrent seeding
  if (_seedPromise) {
    await _seedPromise;
    return;
  }

  _seedPromise = seedDatabase();
  try {
    await _seedPromise;
  } finally {
    _seedPromise = null;
  }
}

async function ensureTables() {
  // Create tables via raw SQL if they don't exist (handles fresh SQLite on Vercel)
  const sql = `
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "phone" TEXT,
      "playerType" TEXT NOT NULL DEFAULT 'grupo',
      "position" TEXT NOT NULL DEFAULT 'ALA',
      "avatar" TEXT,
      "role" TEXT NOT NULL DEFAULT 'player',
      "skillsJson" TEXT NOT NULL DEFAULT '{}',
      "overallRating" REAL NOT NULL DEFAULT 5.0,
      "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
      "mvpCount" INTEGER NOT NULL DEFAULT 0,
      "notificationsEnabled" BOOLEAN NOT NULL DEFAULT 1,
      "isActive" BOOLEAN NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Game" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "date" DATETIME NOT NULL,
      "location" TEXT NOT NULL DEFAULT 'Pavilhão Municipal',
      "maxPlayers" INTEGER NOT NULL DEFAULT 12,
      "status" TEXT NOT NULL DEFAULT 'open',
      "teamsJson" TEXT NOT NULL DEFAULT '{}',
      "scoreA" INTEGER NOT NULL DEFAULT 0,
      "scoreB" INTEGER NOT NULL DEFAULT 0,
      "aiCoachComment" TEXT,
      "ratingsOpen" BOOLEAN NOT NULL DEFAULT 0,
      "ratingsCloseAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "GameAttendee" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "gameId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "playerType" TEXT NOT NULL DEFAULT 'grupo',
      "priority" INTEGER NOT NULL DEFAULT 2,
      "confirmedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GameAttendee_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "GameAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "GameAttendee_gameId_userId_key" ON "GameAttendee"("gameId", "userId");
    CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "content" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'text',
      "channel" TEXT NOT NULL DEFAULT 'general',
      "authorId" TEXT NOT NULL,
      "isDeleted" BOOLEAN NOT NULL DEFAULT 0,
      "readByJson" TEXT NOT NULL DEFAULT '[]',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "Transaction" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "type" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "category" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "isPaid" BOOLEAN NOT NULL DEFAULT 0,
      "paidAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Suggestion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "estimatedCost" REAL NOT NULL,
      "category" TEXT NOT NULL,
      "isPriority" BOOLEAN NOT NULL DEFAULT 0,
      "votesJson" TEXT NOT NULL DEFAULT '[]',
      "status" TEXT NOT NULL DEFAULT 'em-analise',
      "createdById" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Suggestion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "Rating" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "gameId" TEXT NOT NULL,
      "ratedPlayerId" TEXT NOT NULL,
      "raterId" TEXT NOT NULL,
      "scoresJson" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Rating_gameId_raterId_ratedPlayerId_key" UNIQUE ("gameId", "raterId", "ratedPlayerId"),
      CONSTRAINT "Rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Rating_ratedPlayerId_fkey" FOREIGN KEY ("ratedPlayerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "ColeteSchedule" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "year" INTEGER NOT NULL,
      "monthsJson" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
  `;

  // Execute each statement separately (SQLite limitation)
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  for (const stmt of statements) {
    try {
      await db.$executeRawUnsafe(stmt.trim());
    } catch (e: any) {
      // Ignore "already exists" and other benign errors
      if (!e.message?.includes('already exists') && !e.message?.includes('duplicate')) {
        console.warn('Table creation warning:', e.message);
      }
    }
  }
}

async function seedDatabase() {
  try {
    // Ensure tables exist first
    await ensureTables();

    // Check if already seeded
    const userCount = await db.user.count();
    if (userCount > 0) return;
  } catch (e) {
    // If count fails, try creating tables
    try {
      await ensureTables();
    } catch {
      return;
    }
  }

  console.log('🌱 Auto-seeding database...');

  const hash = await hashPassword('123456');

  // Create users
  const bruno = await db.user.create({
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

  const joao = await db.user.create({
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

  const pedro = await db.user.create({
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

  const ricardo = await db.user.create({
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

  // Create game 3 days from now
  const gameDate = new Date();
  gameDate.setDate(gameDate.getDate() + 3);
  gameDate.setHours(19, 0, 0, 0);

  const game = await db.game.create({
    data: {
      date: gameDate,
      location: 'Pavilhão Municipal de Setúbal',
      maxPlayers: 12,
      status: 'open',
    },
  });

  // Add attendees
  await db.gameAttendee.createMany({
    data: [
      { gameId: game.id, userId: bruno.id, playerType: 'mensalista', priority: 1 },
      { gameId: game.id, userId: joao.id, playerType: 'mensalista', priority: 1 },
      { gameId: game.id, userId: pedro.id, playerType: 'grupo', priority: 2 },
    ],
  });

  // Create chat messages
  await db.message.createMany({
    data: [
      { content: 'Bora jogar! Quem vai na próxima quarta?', authorId: bruno.id, channel: 'general' },
      { content: 'Eu vou com certeza! Sempre pronto para o futsal 🔥', authorId: joao.id, channel: 'general' },
      { content: 'Confirmo presença. Vamos fazer um bom jogo!', authorId: pedro.id, channel: 'general' },
    ],
  });

  // Create transactions
  await db.transaction.createMany({
    data: [
      { type: 'entrada', amount: 25.0, category: 'Mensalidade', description: 'Mensalidade - Bruno Paulon', isPaid: true, paidAt: new Date() },
      { type: 'entrada', amount: 25.0, category: 'Mensalidade', description: 'Mensalidade - João Silva', isPaid: true, paidAt: new Date() },
      { type: 'saida', amount: 40.0, category: 'Instalações', description: 'Pagamento do pavilhão', isPaid: true, paidAt: new Date() },
    ],
  });

  // Create suggestions
  await db.suggestion.createMany({
    data: [
      {
        title: 'Novas Bolas de Futsal',
        description: 'Precisamos de 3 bolas novas para os treinos e jogos. As atuais já estão muito gastas.',
        estimatedCost: 45.0, category: 'Equipamento', isPriority: true,
        votesJson: JSON.stringify([bruno.id, joao.id]),
        status: 'em-analise', createdById: bruno.id,
      },
      {
        title: 'Coletes Novos',
        description: 'Sugiro comprar coletes de qualidade para facilitar o sorteio de equipas.',
        estimatedCost: 60.0, category: 'Equipamento', isPriority: false,
        votesJson: JSON.stringify([pedro.id]),
        status: 'em-analise', createdById: pedro.id,
      },
    ],
  });

  // Create colete schedule
  const coletePlayers = [bruno, joao, pedro];
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const monthsJson = months.map((month, i) => ({
    month,
    monthIndex: i,
    userId: coletePlayers[i % coletePlayers.length].id,
    userName: coletePlayers[i % coletePlayers.length].name,
  }));

  await db.coleteSchedule.create({
    data: { year: 2025, monthsJson: JSON.stringify(monthsJson) },
  });

  // Create ratings
  await db.rating.createMany({
    data: [
      { gameId: game.id, ratedPlayerId: joao.id, raterId: bruno.id, scoresJson: JSON.stringify({ defense: 8, attack: 5, passing: 7, technique: 6, stamina: 7 }) },
      { gameId: game.id, ratedPlayerId: pedro.id, raterId: bruno.id, scoresJson: JSON.stringify({ defense: 6, attack: 9, passing: 7, technique: 7, stamina: 6 }) },
      { gameId: game.id, ratedPlayerId: bruno.id, raterId: joao.id, scoresJson: JSON.stringify({ defense: 7, attack: 8, passing: 7, technique: 8, stamina: 7 }) },
    ],
  });

  console.log('🎉 Auto-seed complete!');
}
