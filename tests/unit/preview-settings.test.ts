import { beforeEach, describe, expect, it } from 'vitest';

import {
  bindPreviewSettings,
  findPreviewSettings,
} from '../../src/client/preview-settings';

function renderFixture(): void {
  document.body.innerHTML = `
    <div data-sheet-controls>
      <button data-sheet-control="light" aria-pressed="true">Light</button>
      <button data-sheet-control="dark" aria-pressed="false">Dark</button>
    </div>
    <div data-view-controls>
      <button data-view-control="single" aria-pressed="true">Single</button>
      <button data-view-control="split" aria-pressed="false">Split</button>
    </div>
    <span id="preview-view-hint">One sheet at a time</span>
    <div id="preview">
      <div data-preview-pane="primary" data-sheet-theme="light">
        <article data-layout="landing-hero">Preview</article>
      </div>
    </div>
  `;
}

describe('preview settings', () => {
  beforeEach(renderFixture);

  it('starts with one light sheet', () => {
    const references = findPreviewSettings(document);
    if (!references) throw new Error('Preview settings were not found.');

    const controller = bindPreviewSettings(references);

    expect(controller.read()).toEqual({
      sheetTheme: 'light',
      previewView: 'single',
    });
    expect(references.preview.dataset.sheetTheme).toBe('light');
    expect(document.querySelectorAll('[data-preview-pane]')).toHaveLength(1);
  });

  it('switches the primary sheet to dark', () => {
    const references = findPreviewSettings(document);
    if (!references) throw new Error('Preview settings were not found.');
    bindPreviewSettings(references);

    references.sheetButtons[1]?.click();

    expect(references.primaryPane.dataset.sheetTheme).toBe('dark');
    expect(references.sheetButtons[1]?.getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('adds the opposite theme in split view and removes it in single view', () => {
    const references = findPreviewSettings(document);
    if (!references) throw new Error('Preview settings were not found.');
    bindPreviewSettings(references);

    references.viewButtons[1]?.click();

    const reversed = document.querySelector<HTMLElement>(
      '[data-preview-pane="reversed"]',
    );
    expect(reversed?.dataset.sheetTheme).toBe('dark');
    expect(reversed?.querySelector('.reversed-label')?.textContent).toContain(
      'Reversed',
    );
    expect(references.hint.textContent).toBe('Same block, both polarities');

    references.viewButtons[0]?.click();

    expect(document.querySelector('[data-preview-pane="reversed"]')).toBeNull();
    expect(references.hint.textContent).toBe('One sheet at a time');
  });

  it('keeps split panes in opposite themes when the sheet changes', () => {
    const references = findPreviewSettings(document);
    if (!references) throw new Error('Preview settings were not found.');
    bindPreviewSettings(references);

    references.viewButtons[1]?.click();
    references.sheetButtons[1]?.click();

    expect(references.primaryPane.dataset.sheetTheme).toBe('dark');
    expect(
      document.querySelector<HTMLElement>('[data-preview-pane="reversed"]')
        ?.dataset.sheetTheme,
    ).toBe('light');
  });

  it('moves through each segment with arrow keys', () => {
    const references = findPreviewSettings(document);
    if (!references) throw new Error('Preview settings were not found.');
    bindPreviewSettings(references);
    const light = references.sheetButtons[0];
    if (!light) throw new Error('Light control was not found.');

    light.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

    expect(references.sheetButtons[1]).toBe(document.activeElement);
    expect(references.primaryPane.dataset.sheetTheme).toBe('dark');
  });

  it('rejects incomplete setting controls', () => {
    document.querySelector('[data-view-control="split"]')?.remove();

    expect(findPreviewSettings(document)).toBeUndefined();
  });
});
