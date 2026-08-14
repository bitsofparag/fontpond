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

test('loads a temporary local font and refreshes its score', async ({
  page,
}) => {
  await page.goto('/');

  await page
    .getByLabel('Try a local font')
    .setInputFiles('tests/fixtures/fonts/ApfelGrotezk-Regular.woff2');

  await expect(page.locator('#upload-status')).toHaveText(
    'ApfelGrotezk-Regular is ready for this session.',
  );
  await expect(page.locator('#heading-source')).toHaveText(
    'Uploaded this session',
  );
  await expect(page.getByLabel('Heading font')).toHaveValue('uploaded-font-1');
  await expect(
    page.getByLabel('Body font').locator('option[value="uploaded-font-1"]'),
  ).toHaveText('ApfelGrotezk-Regular');
  await expect(page.locator('#score-total')).toHaveText('83');
  await expect(page.locator('#score-notes')).toContainText(
    'Uploaded font metadata is unknown',
  );
});

test('keeps every uploaded font selectable for the session', async ({
  page,
}) => {
  await page.goto('/');
  const upload = page.getByLabel('Try a local font');

  await upload.setInputFiles('tests/fixtures/fonts/ApfelGrotezk-Regular.woff2');
  await expect(page.getByLabel('Heading font')).toHaveValue('uploaded-font-1');

  await upload.setInputFiles('tests/fixtures/fonts/ApfelGrotezk-Fett.otf');
  await expect(page.locator('#font-error')).toHaveText('');
  await expect(page.locator('#upload-status')).toHaveText(
    'ApfelGrotezk-Fett is ready for this session.',
  );
  await expect(page.getByLabel('Heading font')).toHaveValue('uploaded-font-2');
  await expect(
    page.getByLabel('Body font').locator('[data-uploaded-options] option'),
  ).toHaveText(['ApfelGrotezk-Regular', 'ApfelGrotezk-Fett']);

  await page.getByLabel('Body font').selectOption('uploaded-font-1');
  await expect(page.getByTestId('preview')).toHaveCSS(
    '--body-font',
    "'Fontpond Uploaded Font 1', sans-serif",
  );
  await expect(page.getByLabel('Heading font')).toHaveValue('uploaded-font-2');
});

test('keeps the current pair after an invalid local upload', async ({
  page,
}) => {
  await page.goto('/');

  await page
    .getByLabel('Try a local font')
    .setInputFiles('tests/fixtures/fonts/ApfelGrotezk-LICENSE.txt');

  await expect(page.locator('#font-error')).toHaveText(
    'Choose a WOFF, WOFF2, TTF, or OTF font file.',
  );
  await expect(page.getByLabel('Heading font')).toHaveValue('space-grotesk');
  await expect(page.locator('#upload-status')).toHaveText(
    'Upload not applied.',
  );
});

test('explains weaker hierarchy for an identical pair', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Heading font').selectOption('source-serif-4');

  await expect(page.locator('#score-total')).toHaveText('81');
  await expect(page.locator('#score-warnings')).toContainText(
    'Using one font for both roles creates less visual hierarchy.',
  );
});

test('labels sample content and honors reduced motion', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Sample content')).toBeVisible();

  await page.getByLabel('Heading font').selectOption('georgia');
  await expect(page.getByTestId('preview')).toHaveCSS(
    'animation-name',
    'content-settle',
  );
  await expect(page.locator('.score-result')).toHaveCSS(
    'animation-duration',
    '0.32s',
  );

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByLabel('Heading font').selectOption('verdana');
  await expect(page.getByTestId('preview')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.score-result')).toHaveCSS(
    'animation-name',
    'none',
  );
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
