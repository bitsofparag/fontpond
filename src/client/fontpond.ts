import {
  findFont,
  type FontDefinition,
  type UploadedFontDefinition,
} from '../domain/fonts';
import { findLayout, type LayoutId } from '../domain/layouts';
import type { Result } from '../domain/result';
import { scorePair } from '../domain/scoring';
import { createGoogleFontLoader } from '../services/google-font-loader';
import {
  createBrowserFontAdapter,
  createLocalFontManager,
  type LocalFontManager,
} from '../services/local-font-loader';
import {
  findScoreReferences,
  renderScore,
  type ScoreReferences,
} from './score-renderer';

type LoadState = 'system' | 'uploaded' | 'loaded' | 'cached';

/** Loads one selected font and returns a handled result. */
export type FontLoader = (
  font: FontDefinition,
) => Promise<Result<LoadState, 'Selected Google Font could not load.'>>;

interface UiReferences {
  heading: HTMLSelectElement;
  body: HTMLSelectElement;
  layout: HTMLSelectElement;
  upload: HTMLInputElement;
  uploadStatus: HTMLElement;
  headingSource: HTMLElement;
  bodySource: HTMLElement;
  error: HTMLElement;
  pairLabel: HTMLElement;
  preview: HTMLElement;
  layouts: readonly HTMLElement[];
  score: ScoreReferences;
}

interface PreviewState {
  heading: FontDefinition;
  body: FontDefinition;
  layoutId: LayoutId;
}

interface RuntimeState {
  uploaded: Map<string, UploadedFontDefinition>;
}

/** Connects Fontpond controls, temporary uploads, scoring, and preview. */
export async function startFontpond(
  target: Document,
  loadFont: FontLoader = createGoogleFontLoader(target),
  localFonts: LocalFontManager = createLocalFontManager(
    createBrowserFontAdapter(target),
  ),
): Promise<Result<void, string>> {
  const references = findReferences(target);
  if (!references.ok) return references;

  const runtime: RuntimeState = { uploaded: new Map() };
  bindControls(references.value, runtime, loadFont, localFonts);
  target.defaultView?.addEventListener('pagehide', () => localFonts.dispose(), {
    once: true,
  });
  return updatePreview(references.value, runtime, loadFont);
}

function findReferences(
  target: Document,
): Result<UiReferences, 'Fontpond controls are unavailable.'> {
  const get = <T extends Element>(selector: string) =>
    target.querySelector<T>(selector);
  const heading = get<HTMLSelectElement>('#heading-font');
  const body = get<HTMLSelectElement>('#body-font');
  const layout = get<HTMLSelectElement>('#layout');
  const upload = get<HTMLInputElement>('#local-font');
  const layouts = [...target.querySelectorAll<HTMLElement>('[data-layout]')];
  const simple = {
    uploadStatus: get<HTMLElement>('#upload-status'),
    headingSource: get<HTMLElement>('#heading-source'),
    bodySource: get<HTMLElement>('#body-source'),
    error: get<HTMLElement>('#font-error'),
    pairLabel: get<HTMLElement>('#pair-label'),
    preview: get<HTMLElement>('#preview'),
  };
  const score = findScoreReferences(target);
  if (
    !heading ||
    !body ||
    !layout ||
    !upload ||
    !score ||
    layouts.length === 0 ||
    Object.values(simple).some((element) => !element)
  ) {
    return { ok: false, error: 'Fontpond controls are unavailable.' };
  }
  return {
    ok: true,
    value: {
      heading,
      body,
      layout,
      upload,
      layouts,
      score,
      ...simple,
    } as UiReferences,
  };
}

function bindControls(
  references: UiReferences,
  runtime: RuntimeState,
  loadFont: FontLoader,
  localFonts: LocalFontManager,
): void {
  for (const control of [
    references.heading,
    references.body,
    references.layout,
  ]) {
    control.addEventListener(
      'change',
      () => void updatePreview(references, runtime, loadFont),
    );
  }
  references.upload.addEventListener('change', () => {
    void handleUpload(references, runtime, loadFont, localFonts);
  });
}

async function handleUpload(
  references: UiReferences,
  runtime: RuntimeState,
  loadFont: FontLoader,
  localFonts: LocalFontManager,
): Promise<void> {
  const file = references.upload.files?.[0];
  if (!file) return;
  references.uploadStatus.textContent = 'Loading font...';
  const loaded = await localFonts.load(file);
  if (!loaded.ok) {
    references.uploadStatus.textContent = 'Upload not applied.';
    showError(references.error, loaded.error);
    return;
  }
  runtime.uploaded.set(loaded.value.id, loaded.value);
  addUploadedOption(references.heading, loaded.value);
  addUploadedOption(references.body, loaded.value);
  references.heading.value = loaded.value.id;
  references.uploadStatus.textContent = `${loaded.value.name} is ready for this session.`;
  await updatePreview(references, runtime, loadFont);
}

function addUploadedOption(
  select: HTMLSelectElement,
  font: UploadedFontDefinition,
): void {
  [...select.options].find((option) => option.value === font.id)?.remove();
  let group = select.querySelector<HTMLOptGroupElement>(
    '[data-uploaded-options]',
  );
  if (!group) {
    group = select.ownerDocument.createElement('optgroup');
    group.label = 'Uploaded this session';
    group.dataset.uploadedOptions = '';
    select.prepend(group);
  }
  const option = select.ownerDocument.createElement('option');
  option.value = font.id;
  option.textContent = font.name;
  group.append(option);
}

async function updatePreview(
  references: UiReferences,
  runtime: RuntimeState,
  loadFont: FontLoader,
): Promise<Result<void, string>> {
  const state = readState(references, runtime);
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

function readState(
  references: UiReferences,
  runtime: RuntimeState,
): Result<PreviewState, string> {
  const heading = runtimeFont(references.heading.value, runtime.uploaded);
  if (!heading.ok) return heading;
  const body = runtimeFont(references.body.value, runtime.uploaded);
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

function runtimeFont(
  id: string,
  uploaded: ReadonlyMap<string, UploadedFontDefinition>,
): Result<FontDefinition, 'Font is unavailable.'> {
  const font = uploaded.get(id);
  return font ? { ok: true, value: font } : findFont(id);
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
  references.headingSource.textContent = sourceLabel(state.heading);
  references.bodySource.textContent = sourceLabel(state.body);
  for (const layout of references.layouts)
    layout.hidden = layout.dataset.layout !== state.layoutId;
  renderScore(references.score, scorePair(state));
  animateUpdate(references);
}

function animateUpdate(references: UiReferences): void {
  const scoreResult =
    references.score.total.closest<HTMLElement>('.score-result');
  for (const surface of [references.preview, scoreResult]) {
    if (!surface) continue;
    surface.classList.remove('is-updating');
    surface.ownerDocument.defaultView?.requestAnimationFrame(() => {
      surface.classList.add('is-updating');
    });
  }
}

function sourceLabel(font: FontDefinition): string {
  if (font.source === 'google') return 'Google Font';
  if (font.source === 'system') return 'System Font';
  return 'Uploaded this session';
}

function showError(
  errorElement: HTMLElement,
  message: string,
): Result<void, string> {
  errorElement.textContent = message;
  errorElement.hidden = false;
  return { ok: false, error: message.replace(' A fallback is shown.', '') };
}
