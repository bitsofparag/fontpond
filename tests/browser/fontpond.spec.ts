import { expect, test } from '@playwright/test';

test('changes heading and body fonts independently', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByLabel('Heading font')).toBeVisible();
  await expect(page.getByLabel('Body font')).toBeVisible();
  await page.getByLabel('Heading font').selectOption('georgia');
  await page.getByLabel('Body font').selectOption('verdana');

  await expect(page.getByTestId('preview')).toHaveCSS(
    '--heading-font',
    'Georgia, serif',
  );
  await expect(page.getByTestId('preview')).toHaveCSS(
    '--body-font',
    'Verdana, sans-serif',
  );
});

test('switches among all four layouts', async ({ page }) => {
  await page.goto('/');
  const layout = page.getByLabel('Layout');

  for (const id of [
    'landing-hero',
    'blog-article',
    'dashboard-card',
    'pricing-card',
  ]) {
    await layout.selectOption(id);
    await expect(page.locator(`[data-layout="${id}"]`)).toBeVisible();
  }
});

test('fits the landing layout within a full HD viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );

  expect(overflow).toBeLessThanOrEqual(0);
});

test('fits the landing layout within a 1440 by 900 viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );

  expect(overflow).toBeLessThanOrEqual(0);
});
