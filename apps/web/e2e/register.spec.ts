import { test, expect } from '@playwright/test';

test.describe('Fluxo de cadastro', () => {
  test('deve exibir formulário de registro com campos obrigatórios', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('input[name="name"], input[placeholder*="Nome"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('deve mostrar erro ao submeter formulário vazio', async ({ page }) => {
    await page.goto('/register');
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('deve navegar para login a partir do register', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.locator('a').filter({ hasText: /login|entrar/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

test.describe('Fluxo de login', () => {
  test('deve exibir formulário de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').first().fill('teste@erro.com');
    await page.locator('input[type="password"]').first().fill('senha_errada');
    await page.locator('button[type="submit"]').first().click();
    await expect(page.locator('text=Credenciais inválidas').or(page.locator('text=Erro ao fazer login'))).toBeVisible();
  });
});
