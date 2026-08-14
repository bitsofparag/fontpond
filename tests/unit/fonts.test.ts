import { describe, expect, it } from 'vitest';

import {
  DEFAULT_FONT_PAIR,
  FONT_CATALOG,
  findFont,
} from '../../src/domain/fonts';

describe('font catalog', () => {
  it('contains unique Google and system font identifiers', () => {
    const ids = FONT_CATALOG.map((font) => font.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(FONT_CATALOG.map((font) => font.source))).toEqual(
      new Set(['google', 'system']),
    );
  });

  it('gives every font a generic fallback', () => {
    const genericFamilies = ['sans-serif', 'serif', 'monospace'];

    for (const font of FONT_CATALOG) {
      expect(
        genericFamilies.some((family) => font.cssStack.endsWith(family)),
      ).toBe(true);
    }
  });

  it('uses catalog fonts for both defaults', () => {
    expect(findFont(DEFAULT_FONT_PAIR.headingId)).toEqual({
      ok: true,
      value: expect.any(Object),
    });
    expect(findFont(DEFAULT_FONT_PAIR.bodyId)).toEqual({
      ok: true,
      value: expect.any(Object),
    });
  });

  it('returns a safe error for an unknown font', () => {
    expect(findFont('missing-font')).toEqual({
      ok: false,
      error: 'Font is unavailable.',
    });
  });
});
