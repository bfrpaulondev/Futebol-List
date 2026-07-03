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

    // Should land on the dashboard
    await expect(page).toHaveURL('http://localhost:3000/');
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
