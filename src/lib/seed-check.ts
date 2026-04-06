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
  const sql = `
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "phone" TEXT,
      "congregation" TEXT,
      "playerType" TEXT NOT NULL DEFAULT 'convidado',
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
      "confirmationDeadline" DATETIME,
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
      "playerType" TEXT NOT NULL DEFAULT 'convidado',
      "priority" INTEGER NOT NULL DEFAULT 2,
      "status" TEXT NOT NULL DEFAULT 'confirmed',
      "confirmedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "arrivedAt" DATETIME,
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
      "approvalsJson" TEXT NOT NULL DEFAULT '[]',
      "votingOpen" BOOLEAN NOT NULL DEFAULT 0,
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
    CREATE TABLE IF NOT EXISTS "PaymentReceipt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "month" INTEGER NOT NULL,
      "year" INTEGER NOT NULL,
      "amount" REAL NOT NULL,
      "imageData" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "reviewedById" TEXT,
      "reviewNote" TEXT,
      "reviewedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "PaymentReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "PaymentReceipt_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "read" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  const statements = sql.split(';').filter(s => s.trim().length > 0);
  for (const stmt of statements) {
    try {
      await db.$executeRawUnsafe(stmt.trim());
    } catch (e: any) {
      if (!e.message?.includes('already exists') && !e.message?.includes('duplicate')) {
        console.warn('Table creation warning:', e.message);
      }
    }
  }
}

async function seedDatabase() {
  try {
    await ensureTables();
    const userCount = await db.user.count();
    if (userCount > 0) return;
  } catch (e) {
    try {
      await ensureTables();
    } catch {
      return;
    }
  }

  console.log('🌱 Auto-seeding database...');

  const hash = await hashPassword('123456');

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
    const user = await db.user.create({
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

  // Create Palestrinha bot user
  try {
    await db.user.create({
      data: {
        email: 'palestrinha-bot@futebolbonfim.pt',
        passwordHash: await hashPassword('no-login-bot'),
        name: 'Palestrinha',
        playerType: 'mensalista',
        position: 'TREINADOR',
        role: 'player',
        skillsJson: '{}',
        overallRating: 0,
        gamesPlayed: 0,
        mvpCount: 0,
        notificationsEnabled: false,
      },
    });
    console.log('✅ Palestrinha bot criado');
  } catch {
    // Bot already exists
  }

  // Create game on upcoming Saturday
  const gameDate = new Date();
  const dayOfWeek = gameDate.getDay();
  const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
  gameDate.setDate(gameDate.getDate() + daysUntilSaturday);
  gameDate.setHours(19, 0, 0, 0);

  // Confirmation deadline: Wednesday 12h before game
  const confirmationDeadline = new Date(gameDate);
  confirmationDeadline.setDate(confirmationDeadline.getDate() - 3);
  confirmationDeadline.setHours(12, 0, 0, 0);

  const game = await db.game.create({
    data: {
      date: gameDate,
      location: 'Pavilhão Municipal de Setúbal',
      maxPlayers: 12,
      status: 'open',
      confirmationDeadline,
    },
  });

  console.log('✅ Jogo criado');

  // Create some sample transactions
  await db.transaction.createMany({
    data: [
      { type: 'saida', amount: 40.0, category: 'Instalações', description: 'Pagamento do pavilhão', isPaid: true, paidAt: new Date() },
    ],
  });

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

  await db.coleteSchedule.create({
    data: { year: 2026, monthsJson: JSON.stringify(monthsJson) },
  });

  console.log('✅ Calendário de coletes criado');
  console.log('🎉 Auto-seed complete!');
}
