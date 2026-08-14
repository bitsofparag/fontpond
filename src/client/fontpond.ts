import { findFont, type FontDefinition } from '../domain/fonts';
import { findLayout, type LayoutId } from '../domain/layouts';
import type { Result } from '../domain/result';
import { createGoogleFontLoader } from '../services/google-font-loader';

type LoadState = 'system' | 'loaded' | 'cached';

/** Loads one selected font and returns a handled result. */
export type FontLoader = (
  font: FontDefinition,
) => Promise<Result<LoadState, 'Selected Google Font could not load.'>>;

interface UiReferences {
  heading: HTMLSelectElement;
  body: HTMLSelectElement;
  layout: HTMLSelectElement;
  error: HTMLElement;
  pairLabel: HTMLElement;
  preview: HTMLElement;
  layouts: readonly HTMLElement[];
}

interface PreviewState {
  heading: FontDefinition;
  body: FontDefinition;
  layoutId: LayoutId;
}

/** Connects Fontpond controls to the preview. */
export async function startFontpond(
  target: Document,
  loadFont: FontLoader = createGoogleFontLoader(target),
): Promise<Result<void, string>> {
  const references = findReferences(target);
  if (!references.ok) return references;

  bindControls(references.value, loadFont);
  return updatePreview(references.value, loadFont);
}

function findReferences(
  target: Document,
): Result<UiReferences, 'Fontpond controls are unavailable.'> {
  const heading = target.querySelector<HTMLSelectElement>('#heading-font');
  const body = target.querySelector<HTMLSelectElement>('#body-font');
  const layout = target.querySelector<HTMLSelectElement>('#layout');
  const error = target.querySelector<HTMLElement>('#font-error');
  const pairLabel = target.querySelector<HTMLElement>('#pair-label');
  const preview = target.querySelector<HTMLElement>('#preview');
  const layouts = [...target.querySelectorAll<HTMLElement>('[data-layout]')];

  if (
    !heading ||
    !body ||
    !layout ||
    !error ||
    !pairLabel ||
    !preview ||
    layouts.length === 0
  ) {
    return { ok: false, error: 'Fontpond controls are unavailable.' };
  }
  return {
    ok: true,
    value: { heading, body, layout, error, pairLabel, preview, layouts },
  };
}

function bindControls(references: UiReferences, loadFont: FontLoader): void {
  for (const control of [
    references.heading,
    references.body,
    references.layout,
  ]) {
    control.addEventListener(
      'change',
      () => void updatePreview(references, loadFont),
    );
  }
}

async function updatePreview(
  references: UiReferences,
  loadFont: FontLoader,
): Promise<Result<void, string>> {
  const state = readState(references);
  if (!state.ok) return showError(references.error, state.error);

  renderState(references, state.value);
  const loaded = await Promise.all([
    loadFont(state.value.heading),
    loadFont(state.value.body),
  ]);
  const failure = loaded.find((result) => !result.ok);
  if (failure && !failure.ok)
    return showError(references.error, `${failure.error} A fallback is shown.`);

  references.error.hidden = true;
  references.error.textContent = '';
  return { ok: true, value: undefined };
}

function readState(references: UiReferences): Result<PreviewState, string> {
  const heading = findFont(references.heading.value);
  if (!heading.ok) return heading;
  const body = findFont(references.body.value);
  if (!body.ok) return body;
  const layout = findLayout(references.layout.value);
  if (!layout.ok) return layout;
  return {
    ok: true,
    value: {
      heading: heading.value,
      body: body.value,
      layoutId: layout.value.id,
    },
  };
}

function renderState(references: UiReferences, state: PreviewState): void {
  references.preview.style.setProperty(
    '--heading-font',
    state.heading.cssStack,
  );
  references.preview.style.setProperty('--body-font', state.body.cssStack);
  references.preview.setAttribute(
    'aria-label',
    `${state.heading.name} headings with ${state.body.name} body text`,
  );
  references.pairLabel.textContent = `${state.heading.name} with ${state.body.name}`;
  for (const layout of references.layouts)
    layout.hidden = layout.dataset.layout !== state.layoutId;
}

function showError(
  errorElement: HTMLElement,
  message: string,
): Result<void, string> {
  errorElement.textContent = message;
  errorElement.hidden = false;
  return { ok: false, error: message.replace(' A fallback is shown.', '') };
}
