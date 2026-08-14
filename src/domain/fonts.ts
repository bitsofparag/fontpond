import type { Result } from './result';

/** Describes how a font is supplied to the preview. */
export type FontSource = 'google' | 'system' | 'uploaded';

/** Groups fonts by their intended typographic role. */
export type FontCategory = 'sans' | 'serif' | 'display' | 'mono' | 'unknown';

interface BaseFontDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: FontCategory;
  readonly cssStack: string;
}

/** Describes one curated Google Font. */
export interface GoogleFontDefinition extends BaseFontDefinition {
  readonly source: 'google';
  readonly googleFamily: string;
  readonly weights: readonly number[];
}

/** Describes one browser or operating-system font stack. */
export interface SystemFontDefinition extends BaseFontDefinition {
  readonly source: 'system';
}

/** Describes a browser-loaded font that lasts for the current page session. */
export interface UploadedFontDefinition extends BaseFontDefinition {
  readonly source: 'uploaded';
}

/** Describes a font that can be selected for the preview. */
export type FontDefinition =
  GoogleFontDefinition | SystemFontDefinition | UploadedFontDefinition;

/** Curated fonts available at the first demo checkpoint. */
export const FONT_CATALOG: readonly FontDefinition[] = [
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    source: 'google',
    category: 'sans',
    cssStack: "'Space Grotesk', sans-serif",
    googleFamily: 'Space Grotesk',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'dm-sans',
    name: 'DM Sans',
    source: 'google',
    category: 'sans',
    cssStack: "'DM Sans', sans-serif",
    googleFamily: 'DM Sans',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'manrope',
    name: 'Manrope',
    source: 'google',
    category: 'sans',
    cssStack: "'Manrope', sans-serif",
    googleFamily: 'Manrope',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'source-serif-4',
    name: 'Source Serif 4',
    source: 'google',
    category: 'serif',
    cssStack: "'Source Serif 4', serif",
    googleFamily: 'Source Serif 4',
    weights: [400, 600, 700],
  },
  {
    id: 'lora',
    name: 'Lora',
    source: 'google',
    category: 'serif',
    cssStack: "'Lora', serif",
    googleFamily: 'Lora',
    weights: [400, 500, 600, 700],
  },
  {
    id: 'bebas-neue',
    name: 'Bebas Neue',
    source: 'google',
    category: 'display',
    cssStack: "'Bebas Neue', sans-serif",
    googleFamily: 'Bebas Neue',
    weights: [400],
  },
  {
    id: 'system-ui',
    name: 'System UI',
    source: 'system',
    category: 'sans',
    cssStack: 'system-ui, sans-serif',
  },
  {
    id: 'arial',
    name: 'Arial',
    source: 'system',
    category: 'sans',
    cssStack: 'Arial, sans-serif',
  },
  {
    id: 'helvetica',
    name: 'Helvetica',
    source: 'system',
    category: 'sans',
    cssStack: 'Helvetica, Arial, sans-serif',
  },
  {
    id: 'verdana',
    name: 'Verdana',
    source: 'system',
    category: 'sans',
    cssStack: 'Verdana, sans-serif',
  },
  {
    id: 'georgia',
    name: 'Georgia',
    source: 'system',
    category: 'serif',
    cssStack: 'Georgia, serif',
  },
  {
    id: 'times-new-roman',
    name: 'Times New Roman',
    source: 'system',
    category: 'serif',
    cssStack: "'Times New Roman', serif",
  },
  {
    id: 'sans-stack',
    name: 'Common Sans Stack',
    source: 'system',
    category: 'sans',
    cssStack: 'Arial, Helvetica, sans-serif',
  },
  {
    id: 'serif-stack',
    name: 'Common Serif Stack',
    source: 'system',
    category: 'serif',
    cssStack: 'Georgia, Times, serif',
  },
  {
    id: 'mono-stack',
    name: 'Common Mono Stack',
    source: 'system',
    category: 'mono',
    cssStack: 'ui-monospace, monospace',
  },
];

/** Initial heading and body font identifiers. */
export const DEFAULT_FONT_PAIR = {
  headingId: 'space-grotesk',
  bodyId: 'source-serif-4',
} as const;

/** Finds a font by stable identifier. */
export function findFont(
  id: string,
): Result<FontDefinition, 'Font is unavailable.'> {
  const font = FONT_CATALOG.find((candidate) => candidate.id === id);
  return font
    ? { ok: true, value: font }
    : { ok: false, error: 'Font is unavailable.' };
}
