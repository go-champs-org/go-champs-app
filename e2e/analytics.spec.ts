import { test, expect } from './fixtures';

test('[analyticsDisabledOnWeb] web/PWA never sends analytics while navigating, including builds containing an API key', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', (request) => {
    if (/(^|\.)amplitude\.com$/.test(new URL(request.url()).hostname)) analyticsRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByText('Copa Classificação', { exact: true })).toBeVisible();
  await page.getByText('Copa Classificação', { exact: true }).click();
  await expect(page.getByText('Tabela de classificação')).toBeVisible();
  await page.goBack();
  await page.getByRole('tab', { name: /Perfil/ }).click();
  await expect(page.getByRole('button', { name: /Entrar$/ })).toBeVisible();
  await page.waitForTimeout(1500);
  expect(analyticsRequests).toEqual([]);
});
