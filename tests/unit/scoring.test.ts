import { describe, expect, it } from 'vitest';

import {
  FONT_CATALOG,
  type UploadedFontDefinition,
} from '../../src/domain/fonts';
import { LAYOUT_CATALOG } from '../../src/domain/layouts';
import { scorePair } from '../../src/domain/scoring';

function font(id: string) {
  const match = FONT_CATALOG.find((item) => item.id === id);
  if (!match) throw new Error(`Missing test font: ${id}`);
  return match;
}
const uploaded: UploadedFontDefinition = {
  id: 'uploaded-font',
  name: 'Apfel Grotezk',
  source: 'uploaded',
  category: 'unknown',
  cssStack: "'Fontpond Uploaded Font', sans-serif",
};

describe('pairing score', () => {
  it('returns five transparent dimensions that sum to a bounded total', () => {
    const result = scorePair({
      heading: font('space-grotesk'),
      body: font('source-serif-4'),
      layoutId: 'landing-hero',
    });

    expect(result.dimensions).toHaveLength(5);
    expect(result.dimensions.reduce((sum, item) => sum + item.score, 0)).toBe(
      result.total,
    );
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.summary).toMatch(/pair/i);
  });

  it('warns when a decorative font is used for body copy', () => {
    const result = scorePair({
      heading: font('space-grotesk'),
      body: font('bebas-neue'),
      layoutId: 'blog-article',
    });

    expect(result.warnings).toContain(
      'Display fonts can make long body copy harder to read.',
    );
    expect(
      result.dimensions.find((item) => item.id === 'readability')?.score,
    ).toBeLessThan(15);
  });

  it('flags identical font pairs with reduced hierarchy', () => {
    const same = font('dm-sans');
    const result = scorePair({
      heading: same,
      body: same,
      layoutId: 'dashboard-card',
    });

    expect(result.warnings).toContain(
      'Using one font for both roles creates less visual hierarchy.',
    );
    expect(
      result.dimensions.find((item) => item.id === 'hierarchy')?.score,
    ).toBeLessThan(15);
  });

  it('explains the uncertainty of a temporary uploaded font', () => {
    const result = scorePair({
      heading: uploaded,
      body: font('georgia'),
      layoutId: 'pricing-card',
    });

    expect(result.notes).toContain(
      'Uploaded font metadata is unknown, so its role needs a visual check.',
    );
    expect(
      result.dimensions.find((item) => item.id === 'fallback')?.score,
    ).toBeLessThan(15);
  });

  it('keeps every catalog and layout combination within score limits', () => {
    for (const heading of FONT_CATALOG) {
      for (const body of FONT_CATALOG) {
        for (const layout of LAYOUT_CATALOG) {
          const result = scorePair({ heading, body, layoutId: layout.id });
          expect(result.total).toBeGreaterThanOrEqual(0);
          expect(result.total).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});
