import type { UploadedFontDefinition } from '../domain/fonts';
import type { UploadedFontMetadata } from '../domain/font-metadata';
import {
  validateFontFile,
  type UploadedFontFormat,
} from '../domain/font-upload';
import type { Result } from '../domain/result';
import {
  readFontMetadata,
  type FontMetadataReader,
} from './font-metadata-reader';

const INTERNAL_FAMILY_PREFIX = 'Fontpond Uploaded Font';

/** Browser operations used to load and release temporary font resources. */
export interface LocalFontAdapter<Face = object> {
  createObjectURL(file: File): string;
  revokeObjectURL(url: string): void;
  loadFace(
    url: string,
    format: UploadedFontFormat,
    family: string,
    metadata: UploadedFontMetadata,
  ): Promise<Face>;
  addFace(face: Face): void;
  removeFace(face: Face): void;
}

/** Owns page-session fonts and their browser resources. */
export interface LocalFontManager {
  load(file: File): Promise<Result<UploadedFontDefinition, string>>;
  dispose(): void;
}

/** Creates a manager that retains temporary fonts until the page session ends. */
export function createLocalFontManager<Face>(
  adapter: LocalFontAdapter<Face>,
  metadataReader: FontMetadataReader = readFontMetadata,
): LocalFontManager {
  const active: Array<{ face: Face; url: string }> = [];
  let sequence = 0;

  function dispose(): void {
    for (const font of active) {
      adapter.removeFace(font.face);
      adapter.revokeObjectURL(font.url);
    }
    active.length = 0;
  }

  async function load(
    file: File,
  ): Promise<Result<UploadedFontDefinition, string>> {
    const validated = validateFontFile(file);
    if (!validated.ok) return validated;

    const fontSequence = ++sequence;
    const family = `${INTERNAL_FAMILY_PREFIX} ${fontSequence}`;
    const detected = await metadataReader(file);
    const category = detected.ok ? detected.value.category : 'unknown';
    const metadata = detected.ok ? detected.value.metadata : unknownMetadata();
    const url = adapter.createObjectURL(file);
    try {
      const face = await adapter.loadFace(
        url,
        validated.value.format,
        family,
        metadata,
      );
      adapter.addFace(face);
      active.push({ face, url });
      return {
        ok: true,
        value: uploadedDefinition(
          validated.value.familyName,
          fontSequence,
          family,
          category,
          metadata,
        ),
      };
    } catch {
      adapter.revokeObjectURL(url);
      return {
        ok: false,
        error: 'This font could not be loaded. Try another file.',
      };
    }
  }

  return { load, dispose };
}

/** Creates the production adapter backed by FontFace and document.fonts. */
export function createBrowserFontAdapter(
  target: Document,
): LocalFontAdapter<FontFace> {
  return {
    createObjectURL: (file) => URL.createObjectURL(file),
    revokeObjectURL: (url) => URL.revokeObjectURL(url),
    loadFace: async (url, format, family, metadata) => {
      const face = new FontFace(family, `url(${url}) format('${format}')`, {
        weight: fontWeightDescriptor(metadata),
        style: metadata.style,
      });
      return face.load();
    },
    addFace: (face) => target.fonts.add(face),
    removeFace: (face) => target.fonts.delete(face),
  };
}

function uploadedDefinition(
  name: string,
  sequence: number,
  family: string,
  category: UploadedFontDefinition['category'],
  metadata: UploadedFontMetadata,
): UploadedFontDefinition {
  return {
    id: `uploaded-font-${sequence}`,
    name,
    source: 'uploaded',
    category,
    cssStack: `'${family}', ${genericFallback(category)}`,
    metadata,
  };
}

function unknownMetadata(): UploadedFontMetadata {
  return {
    familyName: null,
    categorySource: 'unknown',
    weight: null,
    style: 'normal',
  };
}

function fontWeightDescriptor(metadata: UploadedFontMetadata): string {
  return metadata.weightRange
    ? `${metadata.weightRange.min} ${metadata.weightRange.max}`
    : String(metadata.weight ?? 400);
}

function genericFallback(category: UploadedFontDefinition['category']): string {
  if (category === 'serif') return 'serif';
  if (category === 'mono') return 'monospace';
  return 'sans-serif';
}
