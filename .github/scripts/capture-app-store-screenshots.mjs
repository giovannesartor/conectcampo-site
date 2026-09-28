import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const baseUrl = process.env.APP_BASE_URL || 'https://app.conectcampo.digital';
const email = process.env.APP_REVIEW_EMAIL;
const password = process.env.APP_REVIEW_PASSWORD;

if (!email || !password) {
  throw new Error('APP_REVIEW_EMAIL and APP_REVIEW_PASSWORD are required.');
}

const outputDir = path.resolve('app-store-screenshots');
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 428, height: 926 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: 'pt-BR',
  timezoneId: 'America/Sao_Paulo',
  colorScheme: 'light',
});

const page = await context.newPage();
page.setDefaultTimeout(20_000);

await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
await page.locator('#email').fill(email);
await page.locator('#password').fill(password);
await page.getByRole('button', { name: 'Entrar', exact: true }).click();
await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
await page.getByRole('heading', { name: 'Seu campo, em dia.' }).waitFor();

// Runs on GitHub only; no local server, build, simulator or test is required.
for (const width of [320, 375, 393, 428, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 926 });
  const size = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  assert.ok(size.content <= size.viewport + 1, `Dashboard overflow at ${width}: ${JSON.stringify(size)}`);
}
await page.setViewportSize({ width: 393, height: 852 });
await page.getByLabel('Sacas', { exact: true }).fill('100');
await page.getByLabel('R$ por saca', { exact: true }).fill('128,50');
await page.getByText(/12.850,00/).waitFor();
await page.getByLabel('Sacas', { exact: true }).fill('');
await page.getByLabel('R$ por saca', { exact: true }).fill('');
await page.setViewportSize({ width: 428, height: 926 });

const screens = [
  ['01-dashboard.png', '/dashboard'],
  ['02-operacoes.png', '/dashboard/operations'],
  ['03-cpr-documentos.png', '/dashboard/cpr'],
  ['04-campo-producao.png', '/dashboard/farms'],
  ['05-mercado-cotacoes.png', '/dashboard/quotes'],
  ['06-perfil-seguranca.png', '/dashboard/settings'],
  ['07-assinaturas.png', '/dashboard/subscription'],
];

for (const [filename, route] of screens) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.locator('main').waitFor({ state: 'visible' }).catch(() => {});
  await page.waitForTimeout(2_000);
  assert.ok(page.url().includes('/dashboard'), `Unexpected redirect from ${route}`);
  const size = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  assert.ok(size.content <= size.viewport + 1, `Horizontal overflow on ${route}: ${JSON.stringify(size)}`);
  await page.screenshot({
    path: path.join(outputDir, filename),
    fullPage: false,
    animations: 'disabled',
  });
}

const tablet = await browser.newContext({
  viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo',
  colorScheme: 'light', storageState: await context.storageState(),
});
const tabletPage = await tablet.newPage();
await tabletPage.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
await tabletPage.getByRole('heading', { name: 'Seu campo, em dia.' }).waitFor();
await tabletPage.waitForTimeout(2_000);
await tabletPage.screenshot({ path: path.join(outputDir, 'ipad-dashboard.png'), fullPage: false, animations: 'disabled' });

await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
await page.getByRole('heading', { name: 'Seu campo, em dia.' }).waitFor();
await page.getByRole('button', { name: 'Carregar cotações', exact: true }).click();
const market = page.frameLocator('iframe[title="Cotações de Soja — Notícias Agrícolas"]');
await market.getByRole('columnheader', { name: /Soja - Mercado Físico/ }).waitFor({ timeout: 30000 });
await page.getByRole('heading', { name: 'Seu dia no campo' }).scrollIntoViewIfNeeded();
await page.screenshot({ path: path.join(outputDir, '08-widgets.png'), fullPage: false, animations: 'disabled' });
await page.getByRole('button', { name: 'Milho', exact: true }).click();
await page.frameLocator('iframe[title="Cotações de Milho — Notícias Agrícolas"]').getByRole('columnheader', { name: /Milho - Mercado Físico/ }).waitFor({ timeout: 30000 });

await browser.close();
