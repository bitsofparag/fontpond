/** Supported preview sheet polarities. */
export type SheetTheme = 'light' | 'dark';

/** Supported preview comparison modes. */
export type PreviewView = 'single' | 'split';

/** Theme and comparison state owned by the preview column. */
export interface PreviewSettings {
  readonly sheetTheme: SheetTheme;
  readonly previewView: PreviewView;
}

/** Elements needed to control sheet theme and comparison mode. */
export interface PreviewSettingReferences {
  preview: HTMLElement;
  primaryPane: HTMLElement;
  hint: HTMLElement;
  sheetButtons: readonly HTMLButtonElement[];
  viewButtons: readonly HTMLButtonElement[];
}

/** Mutable preview settings boundary for future URL and reset wiring. */
export interface PreviewSettingsController {
  read(): PreviewSettings;
  set(settings: PreviewSettings): void;
}

const DEFAULT_SETTINGS: PreviewSettings = {
  sheetTheme: 'light',
  previewView: 'single',
};

/** Finds a complete preview settings surface. */
export function findPreviewSettings(
  target: Document,
): PreviewSettingReferences | undefined {
  const preview = target.querySelector<HTMLElement>('#preview');
  const primaryPane = target.querySelector<HTMLElement>(
    '[data-preview-pane="primary"]',
  );
  const hint = target.querySelector<HTMLElement>('#preview-view-hint');
  const sheetButtons = buttons(target, '[data-sheet-control]');
  const viewButtons = buttons(target, '[data-view-control]');
  return preview &&
    primaryPane &&
    hint &&
    sheetButtons.length === 2 &&
    viewButtons.length === 2
    ? { preview, primaryPane, hint, sheetButtons, viewButtons }
    : undefined;
}

/** Connects preview setting controls and returns a state boundary. */
export function bindPreviewSettings(
  references: PreviewSettingReferences,
  initial: PreviewSettings = DEFAULT_SETTINGS,
): PreviewSettingsController {
  let settings = initial;
  const set = (next: PreviewSettings): void => {
    settings = next;
    renderSettings(references, settings);
  };
  bindSegment(references.sheetButtons, 'sheetControl', (value) => {
    if (value === 'light' || value === 'dark')
      set({ ...settings, sheetTheme: value });
  });
  bindSegment(references.viewButtons, 'viewControl', (value) => {
    if (value === 'single' || value === 'split')
      set({ ...settings, previewView: value });
  });
  set(initial);
  return { read: () => settings, set };
}

function buttons(target: Document, selector: string): HTMLButtonElement[] {
  return [...target.querySelectorAll<HTMLButtonElement>(selector)];
}

function bindSegment(
  controls: readonly HTMLButtonElement[],
  dataKey: 'sheetControl' | 'viewControl',
  onSelect: (value: string) => void,
): void {
  controls.forEach((button, index) => {
    button.addEventListener('click', () =>
      onSelect(button.dataset[dataKey] ?? ''),
    );
    button.addEventListener('keydown', (event) => {
      const target = keyboardTarget(controls, index, event.key);
      if (!target) return;
      event.preventDefault();
      target.focus();
      onSelect(target.dataset[dataKey] ?? '');
    });
  });
}

function keyboardTarget(
  controls: readonly HTMLButtonElement[],
  index: number,
  key: string,
): HTMLButtonElement | undefined {
  if (key === 'Home') return controls[0];
  if (key === 'End') return controls.at(-1);
  const offset = ['ArrowRight', 'ArrowDown'].includes(key)
    ? 1
    : ['ArrowLeft', 'ArrowUp'].includes(key)
      ? -1
      : 0;
  return offset === 0
    ? undefined
    : controls[(index + offset + controls.length) % controls.length];
}

function renderSettings(
  references: PreviewSettingReferences,
  settings: PreviewSettings,
): void {
  references.preview.dataset.sheetTheme = settings.sheetTheme;
  references.primaryPane.dataset.sheetTheme = settings.sheetTheme;
  references.primaryPane.setAttribute(
    'aria-label',
    `${capitalize(settings.sheetTheme)} sheet preview`,
  );
  selectButton(references.sheetButtons, settings.sheetTheme);
  selectButton(references.viewButtons, settings.previewView);
  renderReversedPane(references, settings);
  references.hint.textContent =
    settings.previewView === 'split'
      ? 'Same block, both polarities'
      : 'One sheet at a time';
}

function selectButton(
  controls: readonly HTMLButtonElement[],
  value: string,
): void {
  for (const button of controls) {
    const selected = Object.values(button.dataset).includes(value);
    button.setAttribute('aria-pressed', String(selected));
    button.tabIndex = selected ? 0 : -1;
  }
}

function renderReversedPane(
  references: PreviewSettingReferences,
  settings: PreviewSettings,
): void {
  references.preview
    .querySelector<HTMLElement>('[data-preview-pane="reversed"]')
    ?.remove();
  if (settings.previewView === 'single') return;
  const reversed = references.primaryPane.cloneNode(true) as HTMLElement;
  const theme = oppositeTheme(settings.sheetTheme);
  reversed.dataset.previewPane = 'reversed';
  reversed.dataset.sheetTheme = theme;
  reversed.setAttribute('aria-label', `${capitalize(theme)} sheet preview`);
  reversed.prepend(reversedLabel(references.preview.ownerDocument));
  references.preview.append(reversed);
}

function reversedLabel(target: Document): HTMLElement {
  const band = target.createElement('header');
  band.className = 'reversed-label';
  const label = target.createElement('span');
  label.textContent = 'Reversed';
  const rule = target.createElement('span');
  rule.setAttribute('aria-hidden', 'true');
  band.append(label, rule);
  return band;
}

function oppositeTheme(theme: SheetTheme): SheetTheme {
  return theme === 'light' ? 'dark' : 'light';
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
