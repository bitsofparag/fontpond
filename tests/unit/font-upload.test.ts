import { describe, expect, it } from 'vitest';

import { validateFontFile } from '../../src/domain/font-upload';

describe('font upload validation', () => {
  it.each([
    ['Sample.woff', 'font/woff', 'woff'],
    ['Sample.woff2', 'font/woff2', 'woff2'],
    ['Sample.ttf', 'font/ttf', 'truetype'],
    ['Sample.otf', 'font/otf', 'opentype'],
    ['Sample.otf', 'application/vnd.ms-opentype', 'opentype'],
    [
      'Sample.otf',
      'application/vnd.oasis.opendocument.formula-template',
      'opentype',
    ],
  ])('accepts %s files', (name, type, format) => {
    expect(validateFontFile({ name, type, size: 8 })).toEqual({
      ok: true,
      value: { familyName: 'Sample', format },
    });
  });

  it('accepts a missing MIME type when the extension is supported', () => {
    expect(
      validateFontFile({ name: 'My Font.woff2', type: '', size: 8 }),
    ).toEqual({
      ok: true,
      value: { familyName: 'My Font', format: 'woff2' },
    });
  });

  it.each([
    [
      { name: 'notes.txt', type: 'text/plain', size: 8 },
      'Choose a WOFF, WOFF2, TTF, or OTF font file.',
    ],
    [
      { name: 'fake.woff2', type: 'text/plain', size: 8 },
      'Choose a WOFF, WOFF2, TTF, or OTF font file.',
    ],
    [
      { name: 'empty.woff2', type: 'font/woff2', size: 0 },
      'The font file is empty.',
    ],
    [
      { name: 'large.woff2', type: 'font/woff2', size: 5 * 1024 * 1024 + 1 },
      'The font file is larger than 5 MB.',
    ],
  ])('rejects invalid input with a useful error', (file, error) => {
    expect(validateFontFile(file)).toEqual({ ok: false, error });
  });
});
