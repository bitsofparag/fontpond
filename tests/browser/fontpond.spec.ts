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
  const layouts = page.getByRole('group', { name: 'Preview layout' });

  for (const [id, name] of [
    ['landing-hero', 'Landing hero'],
    ['blog-article', 'Blog article'],
    ['dashboard-card', 'Dashboard'],
    ['pricing-card', 'Pricing'],
  ] as const) {
    const button = layouts.getByRole('button', {
      name: new RegExp(`^${name}`),
    });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(`[data-layout="${id}"]`)).toBeVisible();
  }
});

test('moves through layouts with arrow keys', async ({ page }) => {
  await page.goto('/');
  const landing = page.getByRole('button', { name: /^Landing hero/ });
  const article = page.getByRole('button', { name: /^Blog article/ });

  await landing.focus();
  await landing.press('ArrowDown');

  await expect(article).toBeFocused();
  await expect(article).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-layout="blog-article"]')).toBeVisible();
});

test('switches sheet polarity and compares both themes', async ({ page }) => {
  await page.goto('/');

  const sheet = page.getByRole('group', { name: 'Sheet theme' });
  const view = page.getByRole('group', { name: 'Preview view' });
  await sheet.getByRole('button', { name: 'Dark' }).click();

  await expect(page.getByTestId('preview')).toHaveAttribute(
    'data-sheet-theme',
    'dark',
  );
  await expect(page.locator('.preview-button').first()).toHaveCSS(
    'background-color',
    'rgb(244, 242, 240)',
  );
  await expect(page.locator('.preview-button').first()).toHaveCSS(
    'color',
    'rgb(28, 26, 25)',
  );
  await view.getByRole('button', { name: 'Split' }).click();
  await expect(page.locator('[data-preview-pane]')).toHaveCount(2);
  await expect(page.locator('[data-preview-pane="reversed"]')).toHaveAttribute(
    'data-sheet-theme',
    'light',
  );
  await expect(page.locator('#preview-view-hint')).toHaveText(
    'Same block, both polarities',
  );
});

test('restores, copies, and resets share-link state', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?h=georgia&b=verdana&l=blog-article&t=dark&v=split');

  await expect(page.getByLabel('Heading font')).toHaveValue('georgia');
  await expect(page.getByLabel('Body font')).toHaveValue('verdana');
  await expect(
    page.getByRole('button', { name: /^Blog article/ }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('preview')).toHaveAttribute(
    'data-sheet-theme',
    'dark',
  );
  await expect(page.locator('[data-preview-pane]')).toHaveCount(2);

  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.locator('#copy-status')).toHaveText('Link copied');
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toMatch(/\?h=georgia&b=verdana&l=blog-article&t=dark&v=split$/);

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByLabel('Heading font')).toHaveValue('space-grotesk');
  await expect(page.getByTestId('preview')).toHaveAttribute(
    'data-sheet-theme',
    'light',
  );
  await expect(page.locator('[data-preview-pane]')).toHaveCount(1);
});

test('loads a temporary local font and refreshes its score', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Body font').selectOption('manrope');

  await page
    .getByLabel('Local font')
    .setInputFiles('tests/fixtures/fonts/ApfelGrotezk-Regular.woff2');

  await expect(page.locator('#upload-status')).toHaveText(
    'ApfelGrotezk-Regular is ready for this tab only.',
  );
  await expect(page.locator('#heading-source')).toHaveText(
    'This tab only · sans · 400',
  );
  await expect(page.getByLabel('Heading font')).toHaveValue('uploaded-font-1');
  await expect(
    page.getByLabel('Body font').locator('option[value="uploaded-font-1"]'),
  ).toHaveText('ApfelGrotezk-Regular');
  await expect(page.locator('#score-total')).toHaveText('86');
  await expect(page.locator('#score-notes')).toBeHidden();
  await expect(
    page.locator('[data-uploaded-font="uploaded-font-1"]'),
  ).toContainText('Inferred · 400 · normal');
  const role = page.getByLabel('Role for ApfelGrotezk-Regular');
  await expect(role).toHaveValue('sans');
  await role.selectOption('display');
  await expect(page.locator('#heading-source')).toHaveText(
    'This tab only · display · 400',
  );
  await expect(page.locator('#score-total')).toHaveText('95');
});

test('keeps every uploaded font selectable for the session', async ({
  page,
}) => {
  await page.goto('/');
  const upload = page.getByLabel('Local font');

  await upload.setInputFiles('tests/fixtures/fonts/ApfelGrotezk-Regular.woff2');
  await expect(page.getByLabel('Heading font')).toHaveValue('uploaded-font-1');

  await upload.setInputFiles('tests/fixtures/fonts/ApfelGrotezk-Fett.otf');
  await expect(page.locator('#font-error')).toHaveText('');
  await expect(page.locator('#upload-status')).toHaveText(
    'ApfelGrotezk-Fett is ready for this tab only.',
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
    .getByLabel('Local font')
    .setInputFiles('tests/fixtures/fonts/ApfelGrotezk-LICENSE.txt');

  await expect(page.locator('#font-error')).toHaveText(
    'Choose a WOFF, WOFF2, TTF, or OTF font file.',
  );
  await expect(page.getByLabel('Heading font')).toHaveValue('space-grotesk');
  await expect(page.locator('#upload-status')).toHaveText(
    'That file could not be read as a font.',
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

test('labels the active layout and honors reduced motion', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#layout-description')).toHaveText(
    'Headline, action, image, benefits',
  );

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

test('shows font metadata and accessible score bars', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#heading-source')).toHaveText('Google · sans');
  await expect(page.locator('#body-source')).toHaveText('Google · serif');
  await expect(page.locator('[data-score-bar]')).toHaveCount(5);
  await expect(page.locator('[data-score-bar]').first()).toHaveAttribute(
    'style',
    /width:\s*100%/,
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
