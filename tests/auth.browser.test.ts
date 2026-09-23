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
    const user = await db.pool.query<{ id: string }>(`INSERT INTO app_private.admin_users
      (username_display,username_normalized,password_hash,roles,temporary_credential_expires_at)
      VALUES ('browser.admin','browser.admin',$1,ARRAY['admin'],now()+interval '24 hours')
      RETURNING id`,
    [await hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 })]);
    await db.pool.query(`INSERT INTO app_private.admin_forms
      (owner_id, catalog_key, title, description, status, definition_state)
      VALUES ($1, 'PENRISK', 'PENRISK', 'Esta avaliação ajuda a identificar seu risco.', 'unpublished', 'incomplete'),
             ($1, 'QUALIPEN', 'QUALIPEN', 'Esta avaliação ajuda a entender o impacto da doença.', 'unpublished', 'incomplete')`,
    [user.rows[0].id]);
    const base = `http://127.0.0.1:${await freePort()}`;
    app = await startNext(db.url, base);
    browser = await chromium.launch({ headless: true, channel: process.env.AUTH_BROWSER_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${base}/admin`);
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
    await expect(page.getByLabel('Nome de usuário', { exact: true })).toHaveAttribute('maxlength', '64');
    const passwordInput = page.getByLabel('Senha', { exact: true });
    await expect(passwordInput).toHaveAttribute('maxlength', '128');
    await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Ocultar senha', exact: true }).click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.getByLabel('Nome de usuário', { exact: true }).fill('browser.admin');
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/alterar-senha/, { timeout: 30_000 });
    await page.getByLabel('Senha atual', { exact: true }).fill(password);
    await page.getByLabel('Nova senha', { exact: true }).fill('My-new-browser-password-1234');
    await page.getByLabel('Confirme a nova senha', { exact: true }).fill('My-new-browser-password-1234');
    await page.getByRole('button', { name: 'Alterar senha', exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Instrumentos de Avaliação de Câncer de Pênis', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Meus Formulários', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/formularios/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Meus Formulários', exact: true })).toBeVisible();
    await expect(page.getByTestId('form-row')).toHaveCount(2);
    await expect(page.getByText('Não publicado', { exact: true }).first()).toBeVisible();
    await page.getByLabel('Buscar formulários', { exact: true }).fill('PENRISK');
    await expect(page.getByTestId('form-row')).toHaveCount(1);
    await page.getByLabel('Buscar formulários', { exact: true }).fill('');
    await expect(page.getByTestId('form-row')).toHaveCount(2);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, 'admin page must fit a mobile viewport');
    const cookies = await page.context().cookies();
    assert.ok(cookies.find(cookie => cookie.name === 'admin_session' && cookie.httpOnly && cookie.sameSite === 'Strict'));
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    await page.screenshot({ path: path.join('.auth-test', 'admin-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: path.join('.auth-test', 'admin-desktop.png'), fullPage: true });
    await db.pool.query(`
      insert into app_private.admin_forms (owner_id, catalog_key, title, description, status, definition_state)
      select $1, 'BROWSER_EXTRA_' || item, 'Formulário extra ' || item, 'Registro de paginação', 'unpublished', 'incomplete'
        from generate_series(1, 50) as item
    `, [user.rows[0].id]);
    await page.setViewportSize({ width: 375, height: 844 });
    await page.reload();
    await expect(page.getByTestId('form-row')).toHaveCount(6);
    await expect(page.getByText('…', { exact: true })).toBeVisible();
    const manyFormsOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(manyFormsOverflow, false, 'pagination must fit a narrow mobile viewport');
    await page.getByRole('button', { name: 'Página 2', exact: true }).click();
    await expect(page.getByTestId('form-row')).toHaveCount(6);
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
