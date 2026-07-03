import { test, expect } from '@playwright/test';

/**
 * E2E tests for Futebol Bonfim - Society Nº5
 * Validates the core user flow: auth redirect -> login -> dashboard -> navigation.
 */

const DEMO_EMAIL = 'bruno@test.com';
const DEMO_PASSWORD = '123456';

test.describe('Authentication & core flow', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Futebol Bonfim' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
  });

  test('user can log in and sees the dashboard', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/login');
    await page.getByLabel('Email').fill(DEMO_EMAIL);
    await page.getByLabel('Senha').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Should land on the dashboard (allow extra time: first login may trigger
    // DB auto-seeding on a fresh database, which takes a few seconds)
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /Jogo da Semana/i })).toBeVisible({ timeout: 20_000 });

    // Bottom navigation should be present
    await expect(page.getByRole('link', { name: /Equipas/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Chat/i })).toBeVisible();

    // No critical console errors (ignore React DevTools hint)
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('DevTools') && !e.includes('Download the React')
    );
    expect(criticalErrors).toEqual([]);
  });

  test('authenticated user can navigate to Teams page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill(DEMO_EMAIL);
    await page.getByLabel('Senha').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');

    // Navigate to teams
    await page.goto('/teams');
    await expect(page).toHaveURL(/\/teams/);
    await expect(page.getByRole('heading', { name: /Equipas/i })).toBeVisible({ timeout: 15_000 });
  });

  test('authenticated user can navigate to Chat page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(DEMO_EMAIL);
    await page.getByLabel('Senha').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');

    await page.goto('/chat');
    await expect(page).toHaveURL(/\/chat/);
  });

  test('refresh on dashboard keeps the session (cookie persistence)', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(DEMO_EMAIL);
    await page.getByLabel('Senha').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');

    // Refresh the page - should still be on dashboard (cookie-based session)
    await page.reload();
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByRole('heading', { name: /Jogo da Semana/i })).toBeVisible({ timeout: 15_000 });
  });

  test('user can log out and log back in (no stale cookie)', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill(DEMO_EMAIL);
    await page.getByLabel('Senha').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByRole('heading', { name: /Jogo da Semana/i })).toBeVisible({ timeout: 15_000 });

    // Logout via API (the profile page has a logout button, but calling the
    // API directly is the most reliable way to test the cookie lifecycle)
    await page.request.post('/api/auth/logout');

    // Verify the session is gone
    const meRes = await page.request.get('/api/auth/me');
    expect(meRes.status()).toBe(401);

    // Navigate to / -> should redirect to /login (middleware sees no cookie)
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);

    // Log back in - this is the regression that previously failed in production
    await page.getByLabel('Email').fill(DEMO_EMAIL);
    await page.getByLabel('Senha').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByRole('heading', { name: /Jogo da Semana/i })).toBeVisible({ timeout: 15_000 });
  });

  test('user can register a new account and log in with it', async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@test.com`;

    await page.goto('/register');
    await page.getByLabel('Nome').fill('E2E Test User');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Senha').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Criar Conta' }).click();

    // Should land on the dashboard after register
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Jogo da Semana/i })).toBeVisible({ timeout: 15_000 });

    // Logout
    await page.request.post('/api/auth/logout');

    // Log back in with the newly created account
    await page.goto('/login');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Senha').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByRole('heading', { name: /Jogo da Semana/i })).toBeVisible({ timeout: 15_000 });
  });

  test('chat message persists after being sent', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill(DEMO_EMAIL);
    await page.getByLabel('Senha').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');

    // Send a chat message via the API
    const uniqueContent = `E2E-chat-${Date.now()}`;
    const sendRes = await page.request.post('/api/chat/messages', {
      data: { content: uniqueContent, type: 'text' },
    });
    expect(sendRes.ok()).toBeTruthy();

    // Fetch messages and verify the sent one is present
    const getRes = await page.request.get('/api/chat/messages');
    expect(getRes.ok()).toBeTruthy();
    const body = await getRes.json();
    const found = body.messages.some((m: { content: string }) => m.content === uniqueContent);
    expect(found).toBeTruthy();
  });

  test('health endpoint reports the database backend', async ({ page }) => {
    const res = await page.request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.database.reachable).toBe(true);
    // In local dev the mode is sqlite-local; in production with Turso it would be 'turso'
    expect(['sqlite-local', 'turso']).toContain(body.database.mode);
  });
});

test.describe('Mobile viewport', () => {
  test('dashboard renders correctly on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(DEMO_EMAIL);
    await page.getByLabel('Senha').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');

    await expect(page.getByRole('heading', { name: /Jogo da Semana/i })).toBeVisible({ timeout: 20_000 });
    // Bottom nav present on mobile
    await expect(page.getByRole('link', { name: /Equipas/i })).toBeVisible();
  });
});
