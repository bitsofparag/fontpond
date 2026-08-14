import { beforeEach, describe, expect, it } from 'vitest';

import {
  findScoreReferences,
  renderScore,
} from '../../src/client/score-renderer';
import { FONT_CATALOG } from '../../src/domain/fonts';
import { scorePair } from '../../src/domain/scoring';

function pairingScore() {
  const heading = FONT_CATALOG.find((font) => font.id === 'space-grotesk');
  const body = FONT_CATALOG.find((font) => font.id === 'source-serif-4');
  if (!heading || !body) throw new Error('Score test fonts are unavailable.');
  return scorePair({ heading, body, layoutId: 'landing-hero' });
}

describe('score renderer', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <output id="score-total"></output>
      <p id="score-summary"></p>
      <div id="score-dimensions">
        <section data-score-dimension="readability"></section>
      </div>
      <section data-score-guidance><ul id="score-warnings"></ul></section>
      <section data-score-guidance><ul id="score-notes"></ul></section>
    `;
  });

  it('finds a complete score panel and safely skips optional row markup', () => {
    const references = findScoreReferences(document);
    if (!references) throw new Error('Complete score fixture was not found.');

    renderScore(references, pairingScore());

    expect(references.total.textContent).toBe('97');
    expect(
      references.warnings.closest<HTMLElement>('[data-score-guidance]')?.hidden,
    ).toBe(true);
  });

  it('rejects incomplete score markup', () => {
    document.querySelector('#score-notes')?.remove();

    expect(findScoreReferences(document)).toBeUndefined();
  });

  it('updates score-bar width and review level', () => {
    const row = document.querySelector<HTMLElement>(
      '[data-score-dimension="readability"]',
    );
    if (!row) throw new Error('Readability row was not found.');
    row.innerHTML = `
      <span data-score-value></span>
      <div class="score-bar"><span data-score-bar></span></div>
      <p data-score-explanation></p>
    `;
    const references = findScoreReferences(document);
    if (!references) throw new Error('Complete score fixture was not found.');

    renderScore(references, pairingScore());

    const bar = row.querySelector<HTMLElement>('[data-score-bar]');
    expect(bar?.style.width).toBe('100%');
    expect(bar?.dataset.scoreLevel).toBe('strong');
  });
});
