/** Layout-button elements used by the preview controller. */
export interface LayoutControls {
  group: HTMLElement;
  buttons: readonly HTMLButtonElement[];
}

/** Finds a complete layout button group. */
export function findLayoutControls(
  target: Document,
): LayoutControls | undefined {
  const group = target.querySelector<HTMLElement>('[data-layout-controls]');
  const buttons = [
    ...target.querySelectorAll<HTMLButtonElement>('[data-layout-control]'),
  ];
  return group && buttons.length > 0 ? { group, buttons } : undefined;
}

/** Returns the selected layout identifier. */
export function selectedLayoutId(controls: LayoutControls): string {
  const selected = controls.buttons.find(
    (button) => button.getAttribute('aria-pressed') === 'true',
  );
  return selected?.dataset.layoutControl ?? '';
}

/** Connects pointer and arrow-key selection for the layout group. */
export function bindLayoutControls(
  controls: LayoutControls,
  onSelect: (layoutId: string) => void,
): void {
  setSelection(controls, selectedLayoutId(controls), false);
  controls.buttons.forEach((button, index) => {
    button.addEventListener('click', () =>
      activate(controls, button, onSelect),
    );
    button.addEventListener('keydown', (event) => {
      const target = keyboardTarget(controls.buttons, index, event.key);
      if (!target) return;
      event.preventDefault();
      setSelection(controls, target.dataset.layoutControl ?? '', true);
      onSelect(target.dataset.layoutControl ?? '');
    });
  });
}

function activate(
  controls: LayoutControls,
  button: HTMLButtonElement,
  onSelect: (layoutId: string) => void,
): void {
  const layoutId = button.dataset.layoutControl ?? '';
  setSelection(controls, layoutId, false);
  onSelect(layoutId);
}

function setSelection(
  controls: LayoutControls,
  layoutId: string,
  focus: boolean,
): void {
  for (const button of controls.buttons) {
    const selected = button.dataset.layoutControl === layoutId;
    button.setAttribute('aria-pressed', String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && focus) button.focus();
  }
}

function keyboardTarget(
  buttons: readonly HTMLButtonElement[],
  index: number,
  key: string,
): HTMLButtonElement | undefined {
  if (key === 'Home') return buttons[0];
  if (key === 'End') return buttons.at(-1);
  const offset = ['ArrowRight', 'ArrowDown'].includes(key)
    ? 1
    : ['ArrowLeft', 'ArrowUp'].includes(key)
      ? -1
      : 0;
  if (offset === 0) return undefined;
  return buttons[(index + offset + buttons.length) % buttons.length];
}
