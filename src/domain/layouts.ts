import type { Result } from './result';

/** Stable identifiers for preview templates. */
export type LayoutId =
  'landing-hero' | 'blog-article' | 'dashboard-card' | 'pricing-card';

/** Describes one preview template. */
export interface LayoutDefinition {
  readonly id: LayoutId;
  readonly name: string;
  readonly description: string;
}

/** Templates available at the first demo checkpoint. */
export const LAYOUT_CATALOG: readonly LayoutDefinition[] = [
  {
    id: 'landing-hero',
    name: 'Landing Hero',
    description: 'Headline, call to action, image, and benefits',
  },
  {
    id: 'blog-article',
    name: 'Blog Article',
    description: 'Editorial title, metadata, body copy, and pull quote',
  },
  {
    id: 'dashboard-card',
    name: 'Dashboard Card',
    description: 'Metrics, labels, status, and supporting text',
  },
  {
    id: 'pricing-card',
    name: 'Pricing Card',
    description: 'Plan, price, features, and call to action',
  },
];

/** Initial preview template identifier. */
export const DEFAULT_LAYOUT_ID: LayoutId = 'landing-hero';

/** Finds a layout by stable identifier. */
export function findLayout(
  id: string,
): Result<LayoutDefinition, 'Layout is unavailable.'> {
  const layout = LAYOUT_CATALOG.find((candidate) => candidate.id === id);
  return layout
    ? { ok: true, value: layout }
    : { ok: false, error: 'Layout is unavailable.' };
}
