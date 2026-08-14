import { describe, expect, it } from 'vitest';

import { classifyFont, fontMetadata } from '../../src/domain/font-metadata';
import {
  isFontCategory,
  withUploadedFontCategory,
  type UploadedFontDefinition,
} from '../../src/domain/fonts';

const uploaded: UploadedFontDefinition = {
  id: 'uploaded-font-1',
  name: 'Test',
  source: 'uploaded',
  category: 'sans',
  cssStack: "'Fontpond Uploaded Font 1', sans-serif",
  metadata: {
    familyName: 'Test',
    categorySource: 'detected',
    weight: 400,
    style: 'normal',
  },
};

describe('uploaded font metadata', () => {
  it('detects serif and sans categories from Latin PANOSE data', () => {
    expect(classifyFont({ panose: [2, 4, 5, 3] })).toBe('serif');
    expect(classifyFont({ panose: [2, 11, 5, 3] })).toBe('sans');
  });

  it('prefers fixed-pitch evidence over family classification', () => {
    expect(
      classifyFont({
        isFixedPitch: true,
        panose: [2, 11, 5, 9],
        familyClass: 8 << 8,
      }),
    ).toBe('mono');
  });

  it('falls back to the OpenType family class', () => {
    expect(classifyFont({ familyClass: 8 << 8 })).toBe('sans');
    expect(classifyFont({ familyClass: 3 << 8 })).toBe('serif');
    expect(classifyFont({ familyClass: 9 << 8 })).toBe('display');
  });

  it('uses conservative family-name hints when tables are unclassified', () => {
    expect(classifyFont({ familyName: 'Apfel Grotezk' })).toBe('sans');
    expect(classifyFont({ familyName: 'Commit Mono' })).toBe('mono');
    expect(classifyFont({ familyName: 'Canela Serif' })).toBe('serif');
  });

  it('keeps incomplete metadata unknown', () => {
    expect(classifyFont({ panose: [0, 0] })).toBe('unknown');
  });

  it('normalizes weight, style, and variable weight boundaries', () => {
    expect(
      fontMetadata({
        familyName: 'Apfel Grotezk',
        category: 'sans',
        weight: 1200,
        style: 'italic',
        weightRange: { min: 900, max: 100 },
      }),
    ).toEqual({
      familyName: 'Apfel Grotezk',
      categorySource: 'detected',
      weight: 1000,
      style: 'italic',
      weightRange: { min: 100, max: 900 },
    });
  });

  it('validates and applies user-selected category fallbacks', () => {
    expect(isFontCategory('mono')).toBe(true);
    expect(isFontCategory('handwritten')).toBe(false);
    expect(withUploadedFontCategory(uploaded, 'mono')).toMatchObject({
      category: 'mono',
      cssStack: "'Fontpond Uploaded Font 1', monospace",
      metadata: { categorySource: 'chosen' },
    });
    expect(withUploadedFontCategory(uploaded, 'display').cssStack).toBe(
      "'Fontpond Uploaded Font 1', sans-serif",
    );
  });
});
