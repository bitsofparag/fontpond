import { beforeEach, describe, expect, it, vi } from 'vitest';

import { startFontpond, type FontLoader } from '../../src/client/fontpond';

function renderFixture(): void {
  document.body.innerHTML = `
    <select id="heading-font"><option value="space-grotesk">Space Grotesk</option><option value="georgia">Georgia</option></select>
    <select id="body-font"><option value="source-serif-4">Source Serif 4</option><option value="verdana">Verdana</option></select>
    <select id="layout"><option value="landing-hero">Landing Hero</option><option value="blog-article">Blog Article</option></select>
    <p id="font-error" hidden></p>
    <p id="pair-label"></p>
    <div id="preview"><section data-layout="landing-hero"></section><section data-layout="blog-article" hidden></section></div>
  `;
}

const successfulLoader: FontLoader = async () => ({
  ok: true,
  value: 'loaded',
});

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Test fixture is missing ${selector}.`);
  return element;
}

describe('Fontpond browser wiring', () => {
  beforeEach(renderFixture);

  it('applies independent default fonts and loads both selections', async () => {
    const load = vi.fn(successfulLoader);

    await expect(startFontpond(document, load)).resolves.toEqual({
      ok: true,
      value: undefined,
    });
    expect(
      document
        .querySelector<HTMLElement>('#preview')
        ?.style.getPropertyValue('--heading-font'),
    ).toBe("'Space Grotesk', sans-serif");
    expect(
      document
        .querySelector<HTMLElement>('#preview')
        ?.style.getPropertyValue('--body-font'),
    ).toBe("'Source Serif 4', serif");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('updates a font and layout after control changes', async () => {
    await startFontpond(document, successfulLoader);
    const heading = requireElement<HTMLSelectElement>('#heading-font');
    const layout = requireElement<HTMLSelectElement>('#layout');

    heading.value = 'georgia';
    heading.dispatchEvent(new Event('change'));
    layout.value = 'blog-article';
    layout.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(
        document
          .querySelector<HTMLElement>('#preview')
          ?.style.getPropertyValue('--heading-font'),
      ).toBe('Georgia, serif');
      expect(
        document.querySelector<HTMLElement>('[data-layout="blog-article"]')
          ?.hidden,
      ).toBe(false);
    });
  });

  it('shows a safe inline message when a font fails to load', async () => {
    const failedLoader: FontLoader = async () => ({
      ok: false,
      error: 'Selected Google Font could not load.',
    });

    await expect(startFontpond(document, failedLoader)).resolves.toEqual({
      ok: false,
      error: 'Selected Google Font could not load.',
    });
    expect(document.querySelector<HTMLElement>('#font-error')?.hidden).toBe(
      false,
    );
    expect(document.querySelector('#font-error')?.textContent).toBe(
      'Selected Google Font could not load. A fallback is shown.',
    );
  });

  it('returns a safe error when required markup is missing', async () => {
    document.body.innerHTML = '';

    await expect(startFontpond(document, successfulLoader)).resolves.toEqual({
      ok: false,
      error: 'Fontpond controls are unavailable.',
    });
  });
});
