import type { UploadedFontDefinition } from '../domain/fonts';
import {
  validateFontFile,
  type UploadedFontFormat,
} from '../domain/font-upload';
import type { Result } from '../domain/result';

const INTERNAL_FAMILY_PREFIX = 'Fontpond Uploaded Font';

/** Browser operations used to load and release temporary font resources. */
export interface LocalFontAdapter<Face = object> {
  createObjectURL(file: File): string;
  revokeObjectURL(url: string): void;
  loadFace(
    url: string,
    format: UploadedFontFormat,
    family: string,
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
    const url = adapter.createObjectURL(file);
    try {
      const face = await adapter.loadFace(url, validated.value.format, family);
      adapter.addFace(face);
      active.push({ face, url });
      return {
        ok: true,
        value: uploadedDefinition(
          validated.value.familyName,
          fontSequence,
          family,
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
    loadFace: async (url, format, family) => {
      const face = new FontFace(family, `url(${url}) format('${format}')`);
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
): UploadedFontDefinition {
  return {
    id: `uploaded-font-${sequence}`,
    name,
    source: 'uploaded',
    category: 'unknown',
    cssStack: `'${family}', sans-serif`,
  };
}
