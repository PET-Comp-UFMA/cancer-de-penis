import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { hash } from '@node-rs/argon2';
import { freePort, startNext, startPostgres } from './helpers/postgres';

test('browser: temporary login, required password change, logout and mobile layout', { timeout: 180_000 }, async () => {
  const db = await startPostgres();
  let app: Awaited<ReturnType<typeof startNext>> | undefined;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    await promisify(execFile)(process.execPath, ['--import', 'tsx', 'scripts/db-migrate.ts'], {
      windowsHide: true, env: { ...process.env, DATABASE_URL: db.url, DATABASE_ADMIN_URL: db.url, DATABASE_SSL: 'false' },
    });
    const password = 'Temporary-browser-test-1234';
    await db.pool.query(`INSERT INTO app_private.admin_users
      (username_display,username_normalized,password_hash,roles,temporary_credential_expires_at)
      VALUES ('browser.admin','browser.admin',$1,ARRAY['admin'],now()+interval '24 hours')`,
    [await hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 })]);
    const base = `http://127.0.0.1:${await freePort()}`;
    app = await startNext(db.url, base);
    browser = await chromium.launch({ headless: true, channel: process.env.AUTH_BROWSER_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${base}/admin/formularios`);
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
    await page.getByLabel('Nome de usuário', { exact: true }).fill('browser.admin');
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/alterar-senha/, { timeout: 30_000 });
    await page.getByLabel('Senha atual', { exact: true }).fill(password);
    await page.getByLabel('Nova senha', { exact: true }).fill('My-new-browser-password-1234');
    await page.getByLabel('Confirme a nova senha', { exact: true }).fill('My-new-browser-password-1234');
    await page.getByRole('button', { name: 'Alterar senha', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/formularios/, { timeout: 30_000 });
    await expect(page.getByText('A gestão de formulários será disponibilizada na próxima etapa.')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, 'admin page must fit a mobile viewport');
    const cookies = await page.context().cookies();
    assert.ok(cookies.find(cookie => cookie.name === 'admin_session' && cookie.httpOnly && cookie.sameSite === 'Strict'));
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    await page.screenshot({ path: path.join('.auth-test', 'admin-mobile.png'), fullPage: true });
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: path.join('.auth-test', 'login-desktop.png'), fullPage: true });
    await page.goto(`${base}/admin/formularios`);
    await expect(page).toHaveURL(/\/admin\/login/);
  } finally {
    await browser?.close();
    await app?.stop();
    await db.stop();
  }
});
