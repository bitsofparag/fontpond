import type { PairingScore } from '../domain/scoring';

/** Score-panel elements needed for live updates. */
export interface ScoreReferences {
  total: HTMLElement;
  summary: HTMLElement;
  dimensions: HTMLElement;
  warnings: HTMLElement;
  notes: HTMLElement;
}

/** Finds the complete score panel or returns undefined for incomplete markup. */
export function findScoreReferences(
  target: Document,
): ScoreReferences | undefined {
  const total = target.querySelector<HTMLElement>('#score-total');
  const summary = target.querySelector<HTMLElement>('#score-summary');
  const dimensions = target.querySelector<HTMLElement>('#score-dimensions');
  const warnings = target.querySelector<HTMLElement>('#score-warnings');
  const notes = target.querySelector<HTMLElement>('#score-notes');
  return total && summary && dimensions && warnings && notes
    ? { total, summary, dimensions, warnings, notes }
    : undefined;
}

/** Renders numeric dimensions plus current notes and warnings. */
export function renderScore(
  references: ScoreReferences,
  score: PairingScore,
): void {
  references.total.textContent = String(score.total);
  references.summary.textContent = score.summary;
  for (const dimension of score.dimensions) {
    const row = references.dimensions.querySelector<HTMLElement>(
      `[data-score-dimension="${dimension.id}"]`,
    );
    if (!row) continue;
    updateDimension(row, dimension);
  }
  renderList(references.warnings, score.warnings);
  renderList(references.notes, score.notes);
}

function updateDimension(
  row: HTMLElement,
  dimension: PairingScore['dimensions'][number],
): void {
  const value = row.querySelector<HTMLElement>('[data-score-value]');
  const explanation = row.querySelector<HTMLElement>(
    '[data-score-explanation]',
  );
  const meter = row.querySelector<HTMLMeterElement>('meter');
  if (value) value.textContent = `${dimension.score}/${dimension.max}`;
  if (explanation) explanation.textContent = dimension.explanation;
  if (meter) {
    meter.max = dimension.max;
    meter.value = dimension.score;
  }
}

function renderList(element: HTMLElement, items: readonly string[]): void {
  element.replaceChildren(
    ...items.map((item) => {
      const entry = element.ownerDocument.createElement('li');
      entry.textContent = item;
      return entry;
    }),
  );
  element.hidden = items.length === 0;
  const guidance = element.closest<HTMLElement>('[data-score-guidance]');
  if (guidance) guidance.hidden = items.length === 0;
}
