import type { Result } from './result';

/** Browser font formats accepted by the temporary upload flow. */
export type UploadedFontFormat = 'woff' | 'woff2' | 'truetype' | 'opentype';

/** Safe font metadata derived from a selected file. */
export interface ValidatedFontFile {
  readonly familyName: string;
  readonly format: UploadedFontFormat;
}

const MAX_FONT_BYTES = 5 * 1024 * 1024;
const FORMATS: Readonly<Record<string, UploadedFontFormat>> = {
  woff: 'woff',
  woff2: 'woff2',
  ttf: 'truetype',
  otf: 'opentype',
};
const FONT_MIME_TYPES = new Set([
  'application/font-sfnt',
  'application/font-woff',
  'application/vnd.ms-opentype',
  'application/vnd.oasis.opendocument.formula-template',
  'application/x-font-opentype',
  'application/x-font-ttf',
  'application/x-font-woff',
  'font/otf',
  'font/sfnt',
  'font/ttf',
  'font/woff',
  'font/woff2',
]);

/** Validates upload size, extension, MIME type, and display name. */
export function validateFontFile(
  file: Pick<File, 'name' | 'type' | 'size'>,
): Result<ValidatedFontFile, string> {
  if (file.size === 0) return { ok: false, error: 'The font file is empty.' };
  if (file.size > MAX_FONT_BYTES)
    return { ok: false, error: 'The font file is larger than 5 MB.' };

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const format = FORMATS[extension];
  if (!format || (file.type !== '' && !FONT_MIME_TYPES.has(file.type))) {
    return {
      ok: false,
      error: 'Choose a WOFF, WOFF2, TTF, or OTF font file.',
    };
  }

  const familyName = file.name.slice(0, -(extension.length + 1)).trim();
  return {
    ok: true,
    value: { familyName: familyName || 'Uploaded Font', format },
  };
}
