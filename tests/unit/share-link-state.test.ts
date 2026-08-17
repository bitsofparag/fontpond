import { describe, expect, it } from 'vitest';

import {
  buildShareUrl,
  readShareLinkState,
} from '../../src/client/share-link-state';

describe('share-link state', () => {
  it('reads supported font, layout, theme, and view values', () => {
    expect(
      readShareLinkState('?h=georgia&b=verdana&l=blog-article&t=dark&v=split'),
    ).toEqual({
      headingId: 'georgia',
      bodyId: 'verdana',
      layoutId: 'blog-article',
      sheetTheme: 'dark',
      previewView: 'split',
    });
  });

  it('ignores unsupported shared values', () => {
    expect(
      readShareLinkState('?h=missing&b=verdana&l=poster&t=sepia&v=grid'),
    ).toEqual({ bodyId: 'verdana' });
  });

  it('builds a stable URL and omits temporary fonts', () => {
    const shareLink = buildShareUrl(
      'https://fontpond.test/old?stale=true#score',
      {
        headingId: 'uploaded-font-1',
        headingIsUploaded: true,
        bodyId: 'verdana',
        bodyIsUploaded: false,
        layoutId: 'pricing-card',
        sheetTheme: 'light',
        previewView: 'single',
      },
    );

    expect(shareLink.url).toBe(
      'https://fontpond.test/old?b=verdana&l=pricing-card&t=light&v=single#score',
    );
    expect(shareLink.omittedLocalFont).toBe(true);
  });
});
