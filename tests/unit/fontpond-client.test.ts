import { beforeEach, describe, expect, it, vi } from 'vitest';

import { startFontpond, type FontLoader } from '../../src/client/fontpond';
import type { UploadedFontDefinition } from '../../src/domain/fonts';
import type { LocalFontManager } from '../../src/services/local-font-loader';

function renderFixture(): void {
  document.body.innerHTML = `
    <select id="heading-font"><option value="space-grotesk">Space Grotesk</option><option value="georgia">Georgia</option></select>
    <span id="heading-source"></span>
    <select id="body-font"><option value="source-serif-4">Source Serif 4</option><option value="verdana">Verdana</option></select>
    <span id="body-source"></span>
    <div role="group" aria-label="Preview layout" data-layout-controls>
      <button type="button" data-layout-control="landing-hero" data-description="Headline, action, image, benefits" aria-pressed="true">Landing hero</button>
      <button type="button" data-layout-control="blog-article" data-description="Title, metadata, long copy, pull quote" aria-pressed="false">Blog article</button>
    </div>
    <input id="local-font" type="file">
    <p id="upload-status"></p>
    <div id="uploaded-fonts" hidden></div>
    <p id="font-error" hidden></p>
    <p id="pair-label"><span id="heading-name"></span><span id="body-name"></span></p>
    <p id="layout-description"></p>
    <div data-sheet-controls>
      <button data-sheet-control="light" aria-pressed="true">Light</button>
      <button data-sheet-control="dark" aria-pressed="false">Dark</button>
    </div>
    <div data-view-controls>
      <button data-view-control="single" aria-pressed="true">Single</button>
      <button data-view-control="split" aria-pressed="false">Split</button>
    </div>
    <span id="preview-view-hint"></span>
    <div id="preview"><div data-preview-pane="primary"><section data-layout="landing-hero"></section><section data-layout="blog-article" hidden></section></div></div>
    <output id="score-total"></output>
    <p id="score-summary"></p>
    <div id="score-dimensions">
      ${['readability', 'hierarchy', 'contrast', 'fallback', 'pairing'].map((id) => `<div data-score-dimension="${id}"><span data-score-value></span><div class="score-bar"><span data-score-bar></span></div><p data-score-explanation></p></div>`).join('')}
    </div>
    <section data-score-guidance><ul id="score-warnings"></ul></section>
    <section data-score-guidance><ul id="score-notes"></ul></section>
  `;
}

const successfulLoader: FontLoader = async () => ({
  ok: true,
  value: 'loaded',
});

const uploadedFont: UploadedFontDefinition = {
  id: 'uploaded-font',
  name: 'Apfel Grotezk',
  source: 'uploaded',
  category: 'unknown',
  cssStack: "'Fontpond Uploaded Font', sans-serif",
  metadata: {
    familyName: null,
    categorySource: 'unknown',
    weight: null,
    style: 'normal',
  },
};
const secondUploadedFont: UploadedFontDefinition = {
  id: 'uploaded-font-2',
  name: 'Commit Mono',
  source: 'uploaded',
  category: 'unknown',
  cssStack: "'Fontpond Uploaded Font 2', sans-serif",
  metadata: {
    familyName: null,
    categorySource: 'unknown',
    weight: null,
    style: 'normal',
  },
};

function localManager(
  result: Awaited<ReturnType<LocalFontManager['load']>> = {
    ok: true,
    value: uploadedFont,
  },
): LocalFontManager {
  return { load: vi.fn(async () => result), dispose: vi.fn() };
}

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
    expect(document.querySelector('#heading-source')?.textContent).toBe(
      'Google · sans',
    );
    expect(document.querySelector('#score-total')?.textContent).toBe('97');
  });

  it('updates a font and layout after control changes', async () => {
    await startFontpond(document, successfulLoader);
    const heading = requireElement<HTMLSelectElement>('#heading-font');
    const layout = requireElement<HTMLButtonElement>(
      '[data-layout-control="blog-article"]',
    );

    heading.value = 'georgia';
    heading.dispatchEvent(new Event('change'));
    layout.click();

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

  it('updates both panes when the layout changes in split view', async () => {
    await startFontpond(document, successfulLoader);
    requireElement<HTMLButtonElement>('[data-view-control="split"]').click();
    requireElement<HTMLButtonElement>(
      '[data-layout-control="blog-article"]',
    ).click();

    await vi.waitFor(() => {
      const articles = [
        ...document.querySelectorAll<HTMLElement>(
          '[data-layout="blog-article"]',
        ),
      ];
      const landing = [
        ...document.querySelectorAll<HTMLElement>(
          '[data-layout="landing-hero"]',
        ),
      ];
      expect(articles).toHaveLength(2);
      expect(articles.every((layout) => !layout.hidden)).toBe(true);
      expect(landing.every((layout) => layout.hidden)).toBe(true);
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

  it('loads a temporary font into both selectors and applies it to headings', async () => {
    const manager = localManager();
    await startFontpond(document, successfulLoader, manager);
    const upload = requireElement<HTMLInputElement>('#local-font');
    const file = new File([new Uint8Array([1])], 'Apfel.woff2', {
      type: 'font/woff2',
    });
    Object.defineProperty(upload, 'files', { value: [file] });

    upload.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(requireElement<HTMLSelectElement>('#heading-font').value).toBe(
        'uploaded-font',
      );
      expect(document.querySelector('#heading-source')?.textContent).toBe(
        'This tab only · unknown',
      );
      expect(document.querySelector('#upload-status')?.textContent).toBe(
        'Apfel Grotezk is ready for this tab only.',
      );
      expect(document.querySelector('#score-total')?.textContent).not.toBe(
        '97',
      );
    });
    expect(
      document.querySelectorAll('option[value="uploaded-font"]'),
    ).toHaveLength(2);
  });

  it('keeps earlier uploads selectable after another font is loaded', async () => {
    const firstUploadedFont: UploadedFontDefinition = {
      ...uploadedFont,
      id: 'uploaded-font-1',
      cssStack: "'Fontpond Uploaded Font 1', sans-serif",
    };
    const manager: LocalFontManager = {
      load: vi
        .fn()
        .mockResolvedValueOnce({ ok: true, value: firstUploadedFont })
        .mockResolvedValueOnce({ ok: true, value: secondUploadedFont }),
      dispose: vi.fn(),
    };
    await startFontpond(document, successfulLoader, manager);
    const upload = requireElement<HTMLInputElement>('#local-font');
    Object.defineProperty(upload, 'files', {
      configurable: true,
      value: [new File(['first'], 'Apfel.woff2', { type: 'font/woff2' })],
    });
    upload.dispatchEvent(new Event('change'));
    await vi.waitFor(() =>
      expect(requireElement<HTMLSelectElement>('#heading-font').value).toBe(
        'uploaded-font-1',
      ),
    );

    Object.defineProperty(upload, 'files', {
      configurable: true,
      value: [new File(['second'], 'Commit.otf', { type: 'font/otf' })],
    });
    upload.dispatchEvent(new Event('change'));
    await vi.waitFor(() =>
      expect(requireElement<HTMLSelectElement>('#heading-font').value).toBe(
        'uploaded-font-2',
      ),
    );

    expect(
      [
        ...document.querySelectorAll<HTMLOptionElement>(
          '[data-uploaded-options] option',
        ),
      ].map((option) => option.value),
    ).toEqual([
      'uploaded-font-1',
      'uploaded-font-2',
      'uploaded-font-1',
      'uploaded-font-2',
    ]);
    const body = requireElement<HTMLSelectElement>('#body-font');
    body.value = 'uploaded-font-1';
    body.dispatchEvent(new Event('change'));
    await vi.waitFor(() =>
      expect(
        requireElement<HTMLElement>('#preview').style.getPropertyValue(
          '--body-font',
        ),
      ).toBe("'Fontpond Uploaded Font 1', sans-serif"),
    );
  });

  it('keeps the current pair when a local upload fails', async () => {
    const manager = localManager({
      ok: false,
      error: 'The font file is empty.',
    });
    await startFontpond(document, successfulLoader, manager);
    const upload = requireElement<HTMLInputElement>('#local-font');
    Object.defineProperty(upload, 'files', {
      value: [new File([], 'empty.woff2', { type: 'font/woff2' })],
    });

    upload.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(document.querySelector('#font-error')?.textContent).toBe(
        'The font file is empty.',
      );
      expect(document.querySelector('#upload-status')?.textContent).toBe(
        'That file could not be read as a font.',
      );
    });
    expect(requireElement<HTMLSelectElement>('#heading-font').value).toBe(
      'space-grotesk',
    );
  });

  it('gives a smaller-file recovery step for oversized uploads', async () => {
    const manager = localManager({
      ok: false,
      error: 'The font file is larger than 5 MB.',
    });
    await startFontpond(document, successfulLoader, manager);
    const upload = requireElement<HTMLInputElement>('#local-font');
    Object.defineProperty(upload, 'files', {
      value: [new File(['large'], 'large.woff2', { type: 'font/woff2' })],
    });

    upload.dispatchEvent(new Event('change'));

    await vi.waitFor(() =>
      expect(document.querySelector('#upload-status')?.textContent).toBe(
        'That file is over 5 MB. Try a smaller one.',
      ),
    );
  });

  it('disposes the temporary font when the page session ends', async () => {
    const manager = localManager();
    await startFontpond(document, successfulLoader, manager);

    window.dispatchEvent(new Event('pagehide'));

    expect(manager.dispose).toHaveBeenCalledTimes(1);
  });

  it('returns a safe error when required markup is missing', async () => {
    document.body.innerHTML = '';

    await expect(startFontpond(document, successfulLoader)).resolves.toEqual({
      ok: false,
      error: 'Fontpond controls are unavailable.',
    });
  });
});
