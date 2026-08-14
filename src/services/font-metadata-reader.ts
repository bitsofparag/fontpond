import type { Font, FontCollection } from 'fontkit';

import {
  classifyFont,
  fontMetadata,
  type DetectedFontMetadata,
  type UploadedFontStyle,
} from '../domain/font-metadata';
import type { Result } from '../domain/result';

/** Reads safe scoring metadata from one local font file. */
export type FontMetadataReader = (
  file: File,
) => Promise<Result<DetectedFontMetadata, 'Font metadata is unavailable.'>>;

type FontParser = (bytes: Uint8Array) => Promise<Font | FontCollection>;

interface InspectableFont extends Font {
  readonly post?: { readonly isFixedPitch?: boolean | number };
}

/** Creates a handled metadata reader around a font parser. */
export function createFontMetadataReader(
  parse: FontParser = parseWithFontkit,
): FontMetadataReader {
  return async (file) => {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const parsed = await parse(bytes);
      if (isCollection(parsed))
        return { ok: false, error: 'Font metadata is unavailable.' };
      return { ok: true, value: detectedMetadata(parsed as InspectableFont) };
    } catch {
      return { ok: false, error: 'Font metadata is unavailable.' };
    }
  };
}

/** Parses TTF, OTF, WOFF, and WOFF2 metadata in the browser. */
export const readFontMetadata = createFontMetadataReader();

async function parseWithFontkit(
  bytes: Uint8Array,
): Promise<Font | FontCollection> {
  const fontkit = await import('fontkit');
  return fontkit.create(bytes as never);
}

function detectedMetadata(font: InspectableFont): DetectedFontMetadata {
  const os2 = font['OS/2'];
  const tableCategory = classifyFont({
    panose: os2?.panose,
    familyClass: os2?.sFamilyClass,
    isFixedPitch: Boolean(font.post?.isFixedPitch),
  });
  const category =
    tableCategory === 'unknown'
      ? classifyFont({ familyName: font.familyName })
      : tableCategory;
  const weightRange = font.variationAxes?.wght;
  return {
    category,
    metadata: fontMetadata({
      familyName: font.familyName,
      category,
      categorySource:
        tableCategory === 'unknown' && category !== 'unknown'
          ? 'inferred'
          : 'detected',
      weight: os2?.usWeightClass ?? weightRange?.default ?? null,
      style: fontStyle(font),
      ...(weightRange ? { weightRange } : {}),
    }),
  };
}

function fontStyle(font: InspectableFont): UploadedFontStyle {
  if (font['OS/2']?.fsSelection?.oblique) return 'oblique';
  if (font['OS/2']?.fsSelection?.italic || font.italicAngle !== 0)
    return 'italic';
  return 'normal';
}

function isCollection(font: Font | FontCollection): font is FontCollection {
  return 'fonts' in font;
}
