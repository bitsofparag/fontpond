import type { FontCategory } from './fonts';

/** Records how uploaded font metadata was obtained. */
export type FontMetadataSource = 'detected' | 'inferred' | 'chosen' | 'unknown';

/** Style values accepted by the FontFace API. */
export type UploadedFontStyle = 'normal' | 'italic' | 'oblique';

/** Metadata retained with one page-session font. */
export interface UploadedFontMetadata {
  readonly familyName: string | null;
  readonly categorySource: FontMetadataSource;
  readonly weight: number | null;
  readonly style: UploadedFontStyle;
  readonly weightRange?: { readonly min: number; readonly max: number };
}

/** Category and metadata read from one font file. */
export interface DetectedFontMetadata {
  readonly category: FontCategory;
  readonly metadata: UploadedFontMetadata;
}

interface ClassificationInput {
  readonly panose?: readonly number[];
  readonly familyClass?: number;
  readonly isFixedPitch?: boolean;
  readonly familyName?: string | null;
}

interface MetadataInput {
  readonly familyName: string | null;
  readonly category: FontCategory;
  readonly weight: number | null;
  readonly style: UploadedFontStyle;
  readonly categorySource?: 'detected' | 'inferred';
  readonly weightRange?: { readonly min: number; readonly max: number };
}

/** Classifies a font from OpenType PANOSE and family-class evidence. */
export function classifyFont(input: ClassificationInput): FontCategory {
  if (input.isFixedPitch || input.panose?.[3] === 9) return 'mono';
  const serifStyle = input.panose?.[0] === 2 ? input.panose[1] : undefined;
  if (serifStyle && serifStyle >= 2 && serifStyle <= 10) return 'serif';
  if (serifStyle && serifStyle >= 11 && serifStyle <= 15) return 'sans';

  const family = ((input.familyClass ?? 0) >>> 8) & 0xff;
  if (family >= 1 && family <= 7) return 'serif';
  if (family === 8) return 'sans';
  if (family === 9) return 'display';
  return categoryFromName(input.familyName);
}

/** Normalizes metadata before it enters application state. */
export function fontMetadata(input: MetadataInput): UploadedFontMetadata {
  const weight = input.weight === null ? null : clampWeight(input.weight);
  const weightRange = input.weightRange
    ? orderedRange(input.weightRange.min, input.weightRange.max)
    : undefined;
  return {
    familyName: input.familyName?.trim() || null,
    categorySource:
      input.category === 'unknown'
        ? 'unknown'
        : (input.categorySource ?? 'detected'),
    weight,
    style: input.style,
    ...(weightRange ? { weightRange } : {}),
  };
}

function categoryFromName(name: string | null | undefined): FontCategory {
  const normalized = name?.toLowerCase() ?? '';
  if (/\b(mono|monospace|code)\b/.test(normalized)) return 'mono';
  if (/\b(sans|grotesk|grotezk|grotesque|gothic)\b/.test(normalized))
    return 'sans';
  if (/\bserif\b/.test(normalized)) return 'serif';
  if (/\b(display|decorative|ornament|script|blackletter)\b/.test(normalized))
    return 'display';
  return 'unknown';
}

function clampWeight(weight: number): number {
  return Math.min(1000, Math.max(1, Math.round(weight)));
}

function orderedRange(
  first: number,
  second: number,
): { readonly min: number; readonly max: number } {
  return {
    min: clampWeight(Math.min(first, second)),
    max: clampWeight(Math.max(first, second)),
  };
}
