import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

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

const screens = [
  ['01-dashboard.png', '/dashboard'],
  ['02-operacoes.png', '/dashboard/operations'],
  ['03-cpr-documentos.png', '/dashboard/cpr'],
  ['04-campo-producao.png', '/dashboard/farms'],
  ['05-mercado-cotacoes.png', '/dashboard/quotes'],
  ['06-perfil-seguranca.png', '/dashboard/settings'],
];

for (const [filename, route] of screens) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.locator('main').waitFor({ state: 'visible' }).catch(() => {});
  await page.waitForTimeout(2_000);
  await page.screenshot({
    path: path.join(outputDir, filename),
    fullPage: false,
    animations: 'disabled',
  });
}

await browser.close();
