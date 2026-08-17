import { buildShareUrl, type ShareUrlState } from './share-link-state';

/** Header elements used for URL sharing and reset. */
export interface HeaderActions {
  readonly status: HTMLElement;
  readonly copy: HTMLButtonElement;
  readonly reset: HTMLButtonElement;
}

interface HeaderActionOptions {
  readonly currentUrl: () => string;
  readonly readState: () => ShareUrlState | undefined;
  readonly reset: () => void;
  readonly writeText: (value: string) => Promise<void>;
}

/** Finds the complete header action surface. */
export function findHeaderActions(target: Document): HeaderActions | undefined {
  const status = target.querySelector<HTMLElement>('#copy-status');
  const copy = target.querySelector<HTMLButtonElement>('#copy-link');
  const reset = target.querySelector<HTMLButtonElement>('#reset-controls');
  return status && copy && reset ? { status, copy, reset } : undefined;
}

/** Connects copy and reset actions to application state. */
export function bindHeaderActions(
  actions: HeaderActions,
  options: HeaderActionOptions,
): void {
  actions.copy.addEventListener('click', () => {
    void copyLink(actions.status, options);
  });
  actions.reset.addEventListener('click', () => {
    clearCopyStatus(actions);
    options.reset();
  });
}

/** Clears stale sharing feedback after any control change. */
export function clearCopyStatus(actions: HeaderActions): void {
  actions.status.textContent = '';
}

async function copyLink(
  status: HTMLElement,
  options: HeaderActionOptions,
): Promise<void> {
  const state = options.readState();
  if (!state) {
    status.textContent = 'Copy blocked';
    return;
  }
  const shareLink = buildShareUrl(options.currentUrl(), state);
  try {
    await options.writeText(shareLink.url);
    status.textContent = shareLink.omittedLocalFont
      ? 'Copied, minus local font'
      : 'Link copied';
  } catch {
    status.textContent = 'Copy blocked';
  }
}
