import { NextResponse } from 'next/server';
import { db, getDatabaseInfo } from '@/lib/db';

/**
 * Health check endpoint.
 *
 * Returns the active database backend (Turso vs local SQLite) and a lightweight
 * connectivity probe. This lets operators confirm in production that the app is
 * actually connected to Turso (persistent) and not falling back to an ephemeral
 * local SQLite file.
 *
 * No authentication required, no sensitive data exposed.
 */
export async function GET() {
  const info = getDatabaseInfo();
  let dbReachable = false;
  let userCount: number | null = null;
  let dbError: string | null = null;

  try {
    userCount = await db.user.count();
    dbReachable = true;
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  // Flag a known-bad production configuration: local SQLite in production mode.
  // On Vercel/Netlify this loses all data on every cold start.
  const isProduction = process.env.NODE_ENV === 'production';
  const warning =
    isProduction && info.mode === 'sqlite-local'
      ? 'WARNING: running with local SQLite in production. Data WILL be lost on every cold start. Set DATABASE_URL to a Turso/libSQL URL (libsql://...) and TURSO_AUTH_TOKEN to persist data in serverless environments. See README.md "Deploy" section.'
      : null;

  return NextResponse.json({
    status: dbReachable ? 'ok' : 'degraded',
    database: {
      mode: info.mode,
      url: info.url,
      reachable: dbReachable,
      userCount,
      error: dbError,
    },
    warning,
    timestamp: new Date().toISOString(),
  });
}
