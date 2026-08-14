import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  bindLayoutControls,
  findLayoutControls,
  selectedLayoutId,
} from '../../src/client/layout-controls';

function renderFixture(): void {
  document.body.innerHTML = `
    <div role="group" aria-label="Preview layout" data-layout-controls>
      <button type="button" data-layout-control="landing-hero" aria-pressed="true">Landing hero</button>
      <button type="button" data-layout-control="blog-article" aria-pressed="false">Blog article</button>
      <button type="button" data-layout-control="dashboard-card" aria-pressed="false">Dashboard</button>
    </div>
  `;
}

describe('layout controls', () => {
  beforeEach(renderFixture);

  it('selects a clicked layout and reports the change', () => {
    const controls = findLayoutControls(document);
    const onSelect = vi.fn();
    if (!controls) throw new Error('Layout controls were not found.');
    bindLayoutControls(controls, onSelect);

    controls.buttons[1]?.click();

    expect(selectedLayoutId(controls)).toBe('blog-article');
    expect(controls.buttons[1]?.getAttribute('aria-pressed')).toBe('true');
    expect(onSelect).toHaveBeenCalledWith('blog-article');
  });

  it('moves through layouts with arrow keys and wraps at the edge', () => {
    const controls = findLayoutControls(document);
    if (!controls) throw new Error('Layout controls were not found.');
    bindLayoutControls(controls, vi.fn());
    const first = controls.buttons[0];
    if (!first) throw new Error('First layout control was not found.');

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    expect(selectedLayoutId(controls)).toBe('dashboard-card');
    expect(document.activeElement).toBe(controls.buttons[2]);
  });

  it('supports Home and End while ignoring unrelated keys', () => {
    const controls = findLayoutControls(document);
    const onSelect = vi.fn();
    if (!controls) throw new Error('Layout controls were not found.');
    bindLayoutControls(controls, onSelect);
    const middle = controls.buttons[1];
    const last = controls.buttons[2];
    if (!middle || !last) throw new Error('Layout controls are incomplete.');

    middle.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));

    expect(selectedLayoutId(controls)).toBe('landing-hero');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('returns an empty id when no layout is selected', () => {
    const controls = findLayoutControls(document);
    if (!controls) throw new Error('Layout controls were not found.');
    controls.buttons.forEach((button) =>
      button.setAttribute('aria-pressed', 'false'),
    );

    expect(selectedLayoutId(controls)).toBe('');
  });

  it('rejects missing and empty layout groups', () => {
    expect(
      findLayoutControls(document.implementation.createHTMLDocument()),
    ).toBeUndefined();
    document
      .querySelectorAll('[data-layout-control]')
      .forEach((button) => button.remove());

    expect(findLayoutControls(document)).toBeUndefined();
  });
});
