import { DEFAULT_FONT_PAIR, type FontDefinition } from '../domain/fonts';
import { DEFAULT_LAYOUT_ID } from '../domain/layouts';
import {
  bindHeaderActions,
  clearCopyStatus,
  findHeaderActions,
} from './header-actions';
import {
  selectLayout,
  selectedLayoutId,
  type LayoutControls,
} from './layout-controls';
import {
  bindPreviewSettings,
  DEFAULT_PREVIEW_SETTINGS,
  findPreviewSettings,
} from './preview-settings';
import { readShareLinkState, type ShareUrlState } from './share-link-state';

/** Controls whose values can be restored and shared. */
export interface ShareLinkControlReferences {
  readonly heading: HTMLSelectElement;
  readonly body: HTMLSelectElement;
  readonly layout: LayoutControls;
}

interface ShareLinkControllerOptions {
  readonly findFont: (id: string) => FontDefinition | undefined;
  readonly onReset: () => void;
}

/** Share-link boundary returned to the main app controller. */
export interface ShareLinkController {
  clearStatus(): void;
}

/** Restores URL state and connects copy and reset controls. */
export function bindShareLinkController(
  target: Document,
  controls: ShareLinkControlReferences,
  options: ShareLinkControllerOptions,
): ShareLinkController | undefined {
  const previewReferences = findPreviewSettings(target);
  const headerActions = findHeaderActions(target);
  if (!previewReferences || !headerActions) return undefined;
  const initial = readShareLinkState(target.defaultView?.location.search ?? '');
  applyInitialState(controls, initial);
  const preview = bindPreviewSettings(
    previewReferences,
    {
      sheetTheme: initial.sheetTheme ?? DEFAULT_PREVIEW_SETTINGS.sheetTheme,
      previewView: initial.previewView ?? DEFAULT_PREVIEW_SETTINGS.previewView,
    },
    () => clearCopyStatus(headerActions),
  );
  bindHeaderActions(headerActions, {
    currentUrl: () => target.defaultView?.location.href ?? '',
    readState: () => shareState(controls, preview.read(), options.findFont),
    reset: () => {
      resetControls(controls);
      preview.set(DEFAULT_PREVIEW_SETTINGS);
      options.onReset();
    },
    writeText: (value) => writeClipboard(target, value),
  });
  return { clearStatus: () => clearCopyStatus(headerActions) };
}

function applyInitialState(
  controls: ShareLinkControlReferences,
  state: ReturnType<typeof readShareLinkState>,
): void {
  if (state.headingId) controls.heading.value = state.headingId;
  if (state.bodyId) controls.body.value = state.bodyId;
  if (state.layoutId) selectLayout(controls.layout, state.layoutId);
}

function resetControls(controls: ShareLinkControlReferences): void {
  controls.heading.value = DEFAULT_FONT_PAIR.headingId;
  controls.body.value = DEFAULT_FONT_PAIR.bodyId;
  selectLayout(controls.layout, DEFAULT_LAYOUT_ID);
}

function shareState(
  controls: ShareLinkControlReferences,
  preview: Pick<ShareUrlState, 'sheetTheme' | 'previewView'>,
  findFont: ShareLinkControllerOptions['findFont'],
): ShareUrlState | undefined {
  const heading = findFont(controls.heading.value);
  const body = findFont(controls.body.value);
  if (!heading || !body) return undefined;
  return {
    headingId: heading.id,
    headingIsUploaded: heading.source === 'uploaded',
    bodyId: body.id,
    bodyIsUploaded: body.source === 'uploaded',
    layoutId: selectedLayoutId(controls.layout) as ShareUrlState['layoutId'],
    ...preview,
  };
}

function writeClipboard(target: Document, value: string): Promise<void> {
  const clipboard = target.defaultView?.navigator.clipboard;
  return clipboard
    ? clipboard.writeText(value)
    : Promise.reject(new Error('Clipboard access is unavailable.'));
}
