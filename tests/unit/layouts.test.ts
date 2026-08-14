import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LAYOUT_ID,
  LAYOUT_CATALOG,
  findLayout,
} from '../../src/domain/layouts';

describe('layout catalog', () => {
  it('contains the four MVP layouts', () => {
    expect(LAYOUT_CATALOG.map((layout) => layout.id)).toEqual([
      'landing-hero',
      'blog-article',
      'dashboard-card',
      'pricing-card',
    ]);
  });

  it('uses an available default layout', () => {
    expect(findLayout(DEFAULT_LAYOUT_ID)).toEqual({
      ok: true,
      value: expect.any(Object),
    });
  });

  it('returns a safe error for an unknown layout', () => {
    expect(findLayout('missing-layout')).toEqual({
      ok: false,
      error: 'Layout is unavailable.',
    });
  });
});
