import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  createFontMetadataReader,
  readFontMetadata,
} from '../../src/services/font-metadata-reader';

const inputFile = () =>
  new File(['font'], 'font.woff2', { type: 'font/woff2' });

function parsedFont(selection: { italic?: boolean; oblique?: boolean } = {}) {
  return {
    familyName: 'Variable Sans',
    italicAngle: 0,
    post: { isFixedPitch: 0 },
    variationAxes: {
      wght: { name: 'Weight', min: 100, default: 400, max: 900 },
    },
    'OS/2': {
      panose: [2, 11, 5, 3],
      sFamilyClass: 8 << 8,
      usWeightClass: 400,
      fsSelection: {
        italic: selection.italic ?? false,
        oblique: selection.oblique ?? false,
      },
    },
  };
}

describe('font metadata reader', () => {
  it('infers Apfel Grotezk as a 400-weight sans face', async () => {
    const bytes = await readFile(
      resolve('tests/fixtures/fonts/ApfelGrotezk-Regular.woff2'),
    );
    const file = new File([bytes], 'ApfelGrotezk-Regular.woff2', {
      type: 'font/woff2',
    });

    await expect(readFontMetadata(file)).resolves.toEqual({
      ok: true,
      value: {
        category: 'sans',
        metadata: expect.objectContaining({
          categorySource: 'inferred',
          familyName: 'Apfel Grotezk',
          weight: 400,
          style: 'normal',
        }),
      },
    });
  });

  it('returns a handled error for data that is not a font', async () => {
    const file = new File(['not a font'], 'broken.woff2', {
      type: 'font/woff2',
    });

    await expect(readFontMetadata(file)).resolves.toEqual({
      ok: false,
      error: 'Font metadata is unavailable.',
    });
  });

  it('rejects font collections without leaking parser detail', async () => {
    const reader = createFontMetadataReader(
      async () => ({ fonts: [] }) as never,
    );

    await expect(reader(inputFile())).resolves.toEqual({
      ok: false,
      error: 'Font metadata is unavailable.',
    });
  });

  it('reads variable weight ranges and oblique style', async () => {
    const reader = createFontMetadataReader(
      async () => parsedFont({ oblique: true }) as never,
    );

    await expect(reader(inputFile())).resolves.toEqual({
      ok: true,
      value: {
        category: 'sans',
        metadata: {
          familyName: 'Variable Sans',
          categorySource: 'detected',
          weight: 400,
          style: 'oblique',
          weightRange: { min: 100, max: 900 },
        },
      },
    });
  });

  it('reads italic style without a variable axis', async () => {
    const font = { ...parsedFont({ italic: true }), variationAxes: {} };
    const reader = createFontMetadataReader(async () => font as never);

    const result = await reader(inputFile());

    expect(result.ok && result.value.metadata.style).toBe('italic');
  });
});
