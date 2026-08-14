import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createBrowserFontAdapter,
  createLocalFontManager,
} from '../../src/services/local-font-loader';

function fontFile(name = 'Apfel.woff2'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'font/woff2' });
}

function runtime(loadSucceeds = true) {
  const faces: Array<{ family: string }> = [];
  return {
    faces,
    adapter: {
      createObjectURL: vi.fn((file: File) => `blob:${file.name}`),
      revokeObjectURL: vi.fn(),
      loadFace: vi.fn(async (_url: string, _format: string, family: string) => {
        if (!loadSucceeds) throw new Error('bad font');
        const face = { family };
        faces.push(face);
        return face;
      }),
      addFace: vi.fn(),
      removeFace: vi.fn(),
    },
  };
}

describe('local font manager', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads a supported font with a generic fallback', async () => {
    const fake = runtime();
    const manager = createLocalFontManager(fake.adapter);

    await expect(manager.load(fontFile())).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({
        id: 'uploaded-font-1',
        name: 'Apfel',
        source: 'uploaded',
        category: 'unknown',
        cssStack: "'Fontpond Uploaded Font 1', sans-serif",
      }),
    });
    expect(fake.adapter.addFace).toHaveBeenCalledWith(fake.faces[0]);
  });

  it('keeps every loaded font until the session is disposed', async () => {
    const fake = runtime();
    const manager = createLocalFontManager(fake.adapter);
    const first = await manager.load(fontFile('First.woff2'));
    const second = await manager.load(fontFile('Second.woff2'));

    expect(first).toEqual({
      ok: true,
      value: expect.objectContaining({
        id: 'uploaded-font-1',
        cssStack: "'Fontpond Uploaded Font 1', sans-serif",
      }),
    });
    expect(second).toEqual({
      ok: true,
      value: expect.objectContaining({
        id: 'uploaded-font-2',
        cssStack: "'Fontpond Uploaded Font 2', sans-serif",
      }),
    });
    expect(fake.adapter.removeFace).not.toHaveBeenCalled();
    expect(fake.adapter.revokeObjectURL).not.toHaveBeenCalled();

    manager.dispose();

    expect(fake.adapter.removeFace).toHaveBeenCalledTimes(2);
    expect(fake.adapter.revokeObjectURL).toHaveBeenCalledWith(
      'blob:First.woff2',
    );
    expect(fake.adapter.revokeObjectURL).toHaveBeenCalledWith(
      'blob:Second.woff2',
    );
  });

  it('rejects invalid input before allocating browser resources', async () => {
    const fake = runtime();
    const manager = createLocalFontManager(fake.adapter);
    const invalid = new File(['notes'], 'notes.txt', { type: 'text/plain' });

    await expect(manager.load(invalid)).resolves.toEqual({
      ok: false,
      error: 'Choose a WOFF, WOFF2, TTF, or OTF font file.',
    });
    expect(fake.adapter.createObjectURL).not.toHaveBeenCalled();
  });

  it('revokes a candidate URL when the browser rejects the font', async () => {
    const fake = runtime(false);
    const manager = createLocalFontManager(fake.adapter);

    await expect(manager.load(fontFile())).resolves.toEqual({
      ok: false,
      error: 'This font could not be loaded. Try another file.',
    });
    expect(fake.adapter.revokeObjectURL).toHaveBeenCalledWith(
      'blob:Apfel.woff2',
    );
    expect(fake.adapter.addFace).not.toHaveBeenCalled();
  });

  it('disposes the active session font', async () => {
    const fake = runtime();
    const manager = createLocalFontManager(fake.adapter);
    await manager.load(fontFile());

    manager.dispose();

    expect(fake.adapter.removeFace).toHaveBeenCalledWith(fake.faces[0]);
    expect(fake.adapter.revokeObjectURL).toHaveBeenCalledWith(
      'blob:Apfel.woff2',
    );
  });

  it('connects the production adapter to browser font APIs', async () => {
    const file = fontFile();
    const createObjectURL = vi.fn(() => 'blob:browser-font');
    const revokeObjectURL = vi.fn();
    const add = vi.fn();
    const remove = vi.fn();
    class FakeFontFace {
      constructor(
        readonly family: string,
        readonly source: string,
      ) {}

      async load() {
        return this;
      }
    }
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.stubGlobal('FontFace', FakeFontFace);
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { add, delete: remove },
    });
    const adapter = createBrowserFontAdapter(document);

    expect(adapter.createObjectURL(file)).toBe('blob:browser-font');
    const face = await adapter.loadFace(
      'blob:browser-font',
      'woff2',
      'Fontpond Uploaded Font 7',
    );
    adapter.addFace(face);
    adapter.removeFace(face);
    adapter.revokeObjectURL('blob:browser-font');

    expect(face).toMatchObject({
      family: 'Fontpond Uploaded Font 7',
      source: "url(blob:browser-font) format('woff2')",
    });
    expect(add).toHaveBeenCalledWith(face);
    expect(remove).toHaveBeenCalledWith(face);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:browser-font');
  });
});
