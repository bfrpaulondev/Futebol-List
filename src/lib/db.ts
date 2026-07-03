import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Creates a PrismaClient configured for the active database.
 *
 * Two modes are supported, selected automatically by the DATABASE_URL env var:
 *
 *  1. Turso / libSQL (recommended for serverless/production like Vercel)
 *     - DATABASE_URL starts with "libsql://" or "https://"
 *     - Requires TURSO_AUTH_TOKEN (the Turso access token)
 *     - Data is persisted in the cloud and survives cold starts.
 *
 *  2. Local SQLite (default for local development)
 *     - DATABASE_URL starts with "file:"
 *     - Uses an on-disk SQLite file.
 *     - NOT suitable for serverless platforms (Vercel/Netlify) because the
 *       filesystem is ephemeral and data is lost on every cold start.
 *
 * This automatic detection lets the exact same codebase run locally with a
 * file SQLite database and in production with Turso, just by changing the
 * environment variables. No code changes required.
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || ''
  const isTurso = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://')

  if (isTurso) {
    // Lazy-require the adapter so the local SQLite path doesn't pay the cost
    // and doesn't fail if the optional peer deps are somehow missing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')

    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'production' ? [] : ['query'],
    })
  }

  // Local SQLite mode
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['query'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Returns a short, non-sensitive description of the active database backend.
 * Used by the /api/health endpoint so operators can confirm which mode is
 * running (e.g. to verify Turso is actually being used in production).
 */
export function getDatabaseInfo(): { mode: 'turso' | 'sqlite-local'; url: string } {
  const databaseUrl = process.env.DATABASE_URL || ''
  const isTurso = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://')
  return {
    mode: isTurso ? 'turso' : 'sqlite-local',
    // Mask credentials/auth tokens, show only the scheme + host + path
    url: databaseUrl.replace(/:[^:@/]+@/, ':***@').replace(/authToken=[^&]+/, 'authToken=***'),
  }
}
