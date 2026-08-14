import type { FontCategory, FontDefinition } from './fonts';
import type { LayoutId } from './layouts';

/** Identifiers for the five visible score dimensions. */
export type ScoreDimensionId =
  'readability' | 'hierarchy' | 'contrast' | 'fallback' | 'pairing';

/** One explained contribution to the 100-point pairing score. */
export interface ScoreDimension {
  readonly id: ScoreDimensionId;
  readonly label: string;
  readonly score: number;
  readonly max: number;
  readonly explanation: string;
}

/** Complete deterministic feedback for a font pair and preview layout. */
export interface PairingScore {
  readonly total: number;
  readonly summary: string;
  readonly dimensions: readonly ScoreDimension[];
  readonly warnings: readonly string[];
  readonly notes: readonly string[];
}

interface ScoreInput {
  readonly heading: FontDefinition;
  readonly body: FontDefinition;
  readonly layoutId: LayoutId;
}

/** Scores a pairing from explicit font metadata and the selected content layout. */
export function scorePair(input: ScoreInput): PairingScore {
  const dimensions = [
    readability(input.body.category, input.layoutId),
    hierarchy(input.heading, input.body),
    dimension(
      'contrast',
      'Contrast',
      20,
      20,
      'Preview colors meet the app contrast target.',
    ),
    fallback(input.heading, input.body),
    pairing(input.heading, input.body),
  ];
  const total = dimensions.reduce((sum, item) => sum + item.score, 0);
  return {
    total,
    summary: summaryFor(total),
    dimensions,
    warnings: warningsFor(input.heading, input.body),
    notes: notesFor(input.heading, input.body),
  };
}

function readability(
  category: FontCategory,
  layoutId: LayoutId,
): ScoreDimension {
  const base = { sans: 25, serif: 25, mono: 16, display: 8, unknown: 15 }[
    category
  ];
  const longCopyPenalty =
    layoutId === 'blog-article' && !['sans', 'serif'].includes(category)
      ? 3
      : 0;
  const score = base - longCopyPenalty;
  return dimension(
    'readability',
    'Readability',
    score,
    25,
    readabilityText(category),
  );
}

function hierarchy(
  heading: FontDefinition,
  body: FontDefinition,
): ScoreDimension {
  let score = 15;
  let explanation = 'The roles differ enough to guide the eye.';
  if (heading.id === body.id) {
    score = 11;
    explanation =
      'One family needs stronger size and weight changes to separate roles.';
  } else if (heading.category === 'display' && readable(body.category)) {
    score = 20;
    explanation =
      'A display heading and readable body create clear role separation.';
  } else if (heading.category !== body.category && !unknown(heading, body)) {
    score = 19;
    explanation = 'Different font categories create clear role separation.';
  } else if (unknown(heading, body)) {
    score = 14;
    explanation = 'The uploaded font role needs a visual hierarchy check.';
  }
  return dimension('hierarchy', 'Hierarchy', score, 20, explanation);
}

function fallback(
  heading: FontDefinition,
  body: FontDefinition,
): ScoreDimension {
  const reliability = { system: 15, google: 13, uploaded: 9 } as const;
  const score = Math.floor(
    (reliability[heading.source] + reliability[body.source]) / 2,
  );
  const explanation =
    score === 15
      ? 'System stacks remain available without a network request.'
      : score >= 13
        ? 'Generic fallbacks protect the preview if a web font fails.'
        : 'The uploaded font is temporary, with sans-serif as its fallback.';
  return dimension('fallback', 'Fallback', score, 15, explanation);
}

function pairing(
  heading: FontDefinition,
  body: FontDefinition,
): ScoreDimension {
  let score = 16;
  let explanation = 'The categories provide a workable balance.';
  if (heading.id === body.id) {
    score = 12;
    explanation = 'A single family is cohesive but offers less contrast.';
  } else if (body.category === 'display') {
    score = 7;
    explanation = 'Display faces are a poor fit for sustained body copy.';
  } else if (unknown(heading, body)) {
    score = 13;
    explanation =
      'Unknown uploaded metadata limits automatic pairing guidance.';
  } else if (new Set([heading.category, body.category]).size === 1) {
    score = 15;
    explanation = 'Similar categories feel cohesive but less distinctive.';
  } else if (
    new Set([heading.category, body.category]).has('serif') &&
    new Set([heading.category, body.category]).has('sans')
  ) {
    score = 20;
    explanation =
      'Serif and sans roles create a proven complementary contrast.';
  } else if (heading.category === 'display' && readable(body.category)) {
    score = 19;
    explanation = 'Expressive headings pair well with restrained body copy.';
  }
  return dimension('pairing', 'Pairing', score, 20, explanation);
}

function warningsFor(heading: FontDefinition, body: FontDefinition): string[] {
  const warnings: string[] = [];
  if (body.category === 'display')
    warnings.push('Display fonts can make long body copy harder to read.');
  if (heading.id === body.id)
    warnings.push(
      'Using one font for both roles creates less visual hierarchy.',
    );
  if (body.category === 'mono')
    warnings.push('Monospaced body copy can slow reading in longer passages.');
  return warnings;
}

function notesFor(heading: FontDefinition, body: FontDefinition): string[] {
  return unknown(heading, body)
    ? ['Uploaded font metadata is unknown, so its role needs a visual check.']
    : [];
}

function readabilityText(category: FontCategory): string {
  if (readable(category))
    return 'The body category supports comfortable reading.';
  if (category === 'display')
    return 'The body category is designed for short display text.';
  if (category === 'mono')
    return 'Monospaced letters are clear but dense in long copy.';
  return 'Uploaded font readability needs a visual check.';
}

function readable(category: FontCategory): boolean {
  return category === 'sans' || category === 'serif';
}

function unknown(...fonts: FontDefinition[]): boolean {
  return fonts.some((font) => font.category === 'unknown');
}

function summaryFor(total: number): string {
  if (total >= 90) return 'Strong pair with clear roles.';
  if (total >= 75) return 'Promising pair with minor tradeoffs.';
  if (total >= 60) return 'Usable pair that needs a visual review.';
  return 'Risky pair. Review the warnings before using it.';
}

function dimension(
  id: ScoreDimensionId,
  label: string,
  score: number,
  max: number,
  explanation: string,
): ScoreDimension {
  return { id, label, score, max, explanation };
}
