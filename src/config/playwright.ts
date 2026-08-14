import type { Result } from '../domain/result';

type BrowserLaunchOptions = Readonly<{ executablePath: string }>;

const WINDOWS_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/;

function isAbsolutePath(path: string): boolean {
  return (
    path.startsWith('/') ||
    path.startsWith('\\\\') ||
    WINDOWS_ABSOLUTE_PATH.test(path)
  );
}

/** Resolves an optional browser executable while keeping Playwright Chromium as the default. */
export function resolveBrowserLaunchOptions(
  executablePath: string | undefined,
): Result<BrowserLaunchOptions | undefined, string> {
  const normalizedPath = executablePath?.trim();

  if (!normalizedPath) {
    return { ok: true, value: undefined };
  }

  if (!isAbsolutePath(normalizedPath)) {
    return {
      ok: false,
      error: 'PLAYWRIGHT_EXECUTABLE_PATH must be an absolute path',
    };
  }

  return { ok: true, value: { executablePath: normalizedPath } };
}
