import { findFont } from '../domain/fonts';
import { findLayout, type LayoutId } from '../domain/layouts';
import type {
  PreviewSettings,
  PreviewView,
  SheetTheme,
} from './preview-settings';

/** Supported app state restored from a share link. */
export interface ShareLinkState extends PreviewSettings {
  readonly headingId: string;
  readonly bodyId: string;
  readonly layoutId: LayoutId;
}

/** Current state used to create a shared URL. */
export interface ShareUrlState extends ShareLinkState {
  readonly headingIsUploaded: boolean;
  readonly bodyIsUploaded: boolean;
}

/** Result of serializing shareable state. */
export interface ShareUrl {
  readonly url: string;
  readonly omittedLocalFont: boolean;
}

/** Reads only supported values from a share-link query string. */
export function readShareLinkState(search: string): Partial<ShareLinkState> {
  const params = new URLSearchParams(search);
  const headingId = supportedFont(params.get('h'));
  const bodyId = supportedFont(params.get('b'));
  const layoutId = supportedLayout(params.get('l'));
  const sheetTheme = supportedTheme(params.get('t'));
  const previewView = supportedView(params.get('v'));
  return {
    ...(headingId ? { headingId } : {}),
    ...(bodyId ? { bodyId } : {}),
    ...(layoutId ? { layoutId } : {}),
    ...(sheetTheme ? { sheetTheme } : {}),
    ...(previewView ? { previewView } : {}),
  };
}

/** Builds a stable URL and excludes session-only font identifiers. */
export function buildShareUrl(base: string, state: ShareUrlState): ShareUrl {
  const url = new URL(base);
  url.search = '';
  if (!state.headingIsUploaded) url.searchParams.set('h', state.headingId);
  if (!state.bodyIsUploaded) url.searchParams.set('b', state.bodyId);
  url.searchParams.set('l', state.layoutId);
  url.searchParams.set('t', state.sheetTheme);
  url.searchParams.set('v', state.previewView);
  return {
    url: url.toString(),
    omittedLocalFont: state.headingIsUploaded || state.bodyIsUploaded,
  };
}

function supportedFont(value: string | null): string | undefined {
  return value && findFont(value).ok ? value : undefined;
}

function supportedLayout(value: string | null): LayoutId | undefined {
  if (!value) return undefined;
  const layout = findLayout(value);
  return layout.ok ? layout.value.id : undefined;
}

function supportedTheme(value: string | null): SheetTheme | undefined {
  return value === 'light' || value === 'dark' ? value : undefined;
}

function supportedView(value: string | null): PreviewView | undefined {
  return value === 'single' || value === 'split' ? value : undefined;
}
