import type { FontDefinition, GoogleFontDefinition } from '../domain/fonts';
import type { Result } from '../domain/result';

type FontLoadState = 'system' | 'loaded' | 'cached';
type FontLoadResult = Result<
  FontLoadState,
  'Selected Google Font could not load.'
>;

/** Builds the Google Fonts stylesheet URL for one curated font. */
export function createGoogleFontHref(font: GoogleFontDefinition): string {
  const family =
    `${font.googleFamily}:wght@${font.weights.join(';')}`.replaceAll(' ', '+');
  return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
}

/** Creates a document-scoped loader that requests each Google Font once. */
export function createGoogleFontLoader(
  target: Document,
): (font: FontDefinition) => Promise<FontLoadResult> {
  return async (font: FontDefinition): Promise<FontLoadResult> => {
    if (font.source === 'system') return { ok: true, value: 'system' };

    const selector = `link[data-font-id="${font.id}"]`;
    if (target.head.querySelector(selector))
      return { ok: true, value: 'cached' };

    return loadStylesheet(target, font);
  };
}

function loadStylesheet(
  target: Document,
  font: GoogleFontDefinition,
): Promise<FontLoadResult> {
  const link = target.createElement('link');
  link.rel = 'stylesheet';
  link.href = createGoogleFontHref(font);
  link.dataset.fontId = font.id;

  return new Promise((resolve) => {
    link.addEventListener(
      'load',
      () => resolve({ ok: true, value: 'loaded' }),
      { once: true },
    );
    link.addEventListener(
      'error',
      () => {
        link.remove();
        resolve({ ok: false, error: 'Selected Google Font could not load.' });
      },
      { once: true },
    );
    target.head.append(link);
  });
}
