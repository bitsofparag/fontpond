import { describe, expect, it, vi } from 'vitest';

import type { UploadedFontDefinition } from '../../src/domain/fonts';
import { addUploadedFontControl } from '../../src/client/uploaded-font-controls';

const uploaded: UploadedFontDefinition = {
  id: 'uploaded-font-1',
  name: 'Apfel Grotezk',
  source: 'uploaded',
  category: 'sans',
  cssStack: "'Fontpond Uploaded Font 1', sans-serif",
  metadata: {
    familyName: 'Apfel Grotezk',
    categorySource: 'detected',
    weight: 400,
    style: 'normal',
  },
};

describe('uploaded font controls', () => {
  it('shows detected metadata and applies a corrected role', () => {
    document.body.innerHTML = '<div id="uploaded-fonts" hidden></div>';
    const container = document.querySelector<HTMLElement>('#uploaded-fonts');
    if (!container) throw new Error('Missing uploaded font container.');
    const changed = vi.fn();

    addUploadedFontControl(container, uploaded, changed);
    const role = document.querySelector<HTMLSelectElement>(
      '[data-uploaded-font-category="uploaded-font-1"]',
    );
    expect(container.hidden).toBe(false);
    expect(container.textContent).toContain('Detected · 400 · normal');
    expect(role?.value).toBe('sans');

    if (!role) throw new Error('Missing uploaded font role control.');
    role.value = 'serif';
    role.dispatchEvent(new Event('change'));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'serif',
        cssStack: "'Fontpond Uploaded Font 1', serif",
        metadata: expect.objectContaining({ categorySource: 'chosen' }),
      }),
    );
  });

  it('asks for a role when metadata is unavailable', () => {
    document.body.innerHTML = '<div id="uploaded-fonts" hidden></div>';
    const container = document.querySelector<HTMLElement>('#uploaded-fonts');
    if (!container) throw new Error('Missing uploaded font container.');
    const unknown: UploadedFontDefinition = {
      ...uploaded,
      category: 'unknown',
      metadata: {
        familyName: null,
        categorySource: 'unknown',
        weight: null,
        style: 'normal',
      },
    };

    addUploadedFontControl(container, unknown, vi.fn());

    expect(container.textContent).toContain('Metadata unavailable');
    expect(container.textContent).toContain('Choose a role to improve checks.');
  });

  it('states when the role came from the family name', () => {
    document.body.innerHTML = '<div id="uploaded-fonts" hidden></div>';
    const container = document.querySelector<HTMLElement>('#uploaded-fonts');
    if (!container) throw new Error('Missing uploaded font container.');

    addUploadedFontControl(
      container,
      {
        ...uploaded,
        metadata: { ...uploaded.metadata, categorySource: 'inferred' },
      },
      vi.fn(),
    );

    expect(container.textContent).toContain(
      'Inferred from the font name. Change if wrong.',
    );
  });
});
