import { beforeEach, describe, expect, it } from 'vitest';

import {
  FONT_CATALOG,
  type FontDefinition,
  type UploadedFontDefinition,
} from '../../src/domain/fonts';
import { createGoogleFontLoader } from '../../src/services/google-font-loader';

function requireFont(source: FontDefinition['source']): FontDefinition {
  const font = FONT_CATALOG.find((candidate) => candidate.source === source);
  if (!font) throw new Error(`Test catalog has no ${source} font.`);
  return font;
}

const googleFont = requireFont('google');
const systemFont = requireFont('system');
const uploadedFont: UploadedFontDefinition = {
  id: 'uploaded-font',
  name: 'Temporary font',
  source: 'uploaded',
  category: 'unknown',
  cssStack: "'Fontpond Uploaded Font', sans-serif",
};

describe('Google font loader', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('does not create a request for a system font', async () => {
    const load = createGoogleFontLoader(document);

    await expect(load(systemFont)).resolves.toEqual({
      ok: true,
      value: 'system',
    });
    expect(document.head.querySelectorAll('link')).toHaveLength(0);
  });

  it('does not create a request for an uploaded font', async () => {
    const load = createGoogleFontLoader(document);

    await expect(load(uploadedFont)).resolves.toEqual({
      ok: true,
      value: 'uploaded',
    });
    expect(document.head.querySelectorAll('link')).toHaveLength(0);
  });

  it('loads only the selected Google font', async () => {
    const load = createGoogleFontLoader(document);
    const result = load(googleFont);
    const link =
      document.head.querySelector<HTMLLinkElement>('link[data-font-id]');

    expect(link?.dataset.fontId).toBe(googleFont?.id);
    expect(link?.href).toContain('fonts.googleapis.com/css2');
    link?.dispatchEvent(new Event('load'));
    await expect(result).resolves.toEqual({ ok: true, value: 'loaded' });
  });

  it('does not request the same Google font twice', async () => {
    const load = createGoogleFontLoader(document);
    const first = load(googleFont);
    document.head.querySelector('link')?.dispatchEvent(new Event('load'));
    await first;

    await expect(load(googleFont)).resolves.toEqual({
      ok: true,
      value: 'cached',
    });
    expect(document.head.querySelectorAll('link[data-font-id]')).toHaveLength(
      1,
    );
  });

  it('removes a failed request and returns a safe error', async () => {
    const load = createGoogleFontLoader(document);
    const result = load(googleFont);
    document.head.querySelector('link')?.dispatchEvent(new Event('error'));

    await expect(result).resolves.toEqual({
      ok: false,
      error: 'Selected Google Font could not load.',
    });
    expect(document.head.querySelectorAll('link[data-font-id]')).toHaveLength(
      0,
    );
  });
});
