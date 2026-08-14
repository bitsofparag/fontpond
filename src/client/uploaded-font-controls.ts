import {
  isFontCategory,
  withUploadedFontCategory,
  type FontCategory,
  type UploadedFontDefinition,
} from '../domain/fonts';

const CATEGORIES: readonly FontCategory[] = [
  'sans',
  'serif',
  'display',
  'mono',
  'unknown',
];

/** Adds one uploaded font to a selector without replacing earlier entries. */
export function addUploadedFontOption(
  select: HTMLSelectElement,
  font: UploadedFontDefinition,
): void {
  select.querySelector(`option[value="${font.id}"]`)?.remove();
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

/** Adds an accessible category correction control for an uploaded font. */
export function addUploadedFontControl(
  container: HTMLElement,
  font: UploadedFontDefinition,
  onChange: (font: UploadedFontDefinition) => void,
): void {
  container.querySelector(`[data-uploaded-font="${font.id}"]`)?.remove();
  const row = container.ownerDocument.createElement('section');
  row.className = 'uploaded-font';
  row.dataset.uploadedFont = font.id;
  const name = textElement(row, 'strong', font.name);
  const metadata = textElement(row, 'small', metadataText(font));
  const label = textElement(row, 'label', 'Font role');
  const select = categorySelect(row, font);
  const hint = textElement(row, 'p', hintText(font));
  label.htmlFor = select.id;
  row.append(name, metadata, label, select, hint);
  select.addEventListener('change', () => {
    if (!isFontCategory(select.value)) return;
    const updated = withUploadedFontCategory(font, select.value);
    metadata.textContent = metadataText(updated);
    hint.textContent = 'Role chosen for this tab.';
    onChange(updated);
  });
  container.append(row);
  container.hidden = false;
}

function categorySelect(
  row: HTMLElement,
  font: UploadedFontDefinition,
): HTMLSelectElement {
  const select = row.ownerDocument.createElement('select');
  select.id = `uploaded-font-category-${font.id}`;
  select.className = 'input metadata-input';
  select.dataset.uploadedFontCategory = font.id;
  select.setAttribute('aria-label', `Role for ${font.name}`);
  for (const category of CATEGORIES) {
    const option = row.ownerDocument.createElement('option');
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    option.selected = category === font.category;
    select.append(option);
  }
  return select;
}

function metadataText(font: UploadedFontDefinition): string {
  if (font.metadata.categorySource === 'unknown') return 'Metadata unavailable';
  const source = {
    chosen: 'Chosen',
    detected: 'Detected',
    inferred: 'Inferred',
  }[font.metadata.categorySource];
  return `${source} · ${font.metadata.weight ?? 'weight unknown'} · ${font.metadata.style}`;
}

function hintText(font: UploadedFontDefinition): string {
  if (font.metadata.categorySource === 'unknown')
    return 'Choose a role to improve checks.';
  if (font.metadata.categorySource === 'inferred')
    return 'Inferred from the font name. Change if wrong.';
  return 'Detected from font data. Change if wrong.';
}

function textElement<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement,
  tag: K,
  text: string,
): HTMLElementTagNameMap[K] {
  const element = parent.ownerDocument.createElement(tag);
  element.textContent = text;
  return element;
}
