import { describe, expect, it } from 'vitest';

import { resolveBrowserLaunchOptions } from '../../src/config/playwright';

describe('resolveBrowserLaunchOptions', () => {
  it('uses Playwright Chromium when no executable path is set', () => {
    expect(resolveBrowserLaunchOptions(undefined)).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it('uses an absolute Unix browser path', () => {
    expect(
      resolveBrowserLaunchOptions('/usr/bin/brave-browser-stable'),
    ).toEqual({
      ok: true,
      value: { executablePath: '/usr/bin/brave-browser-stable' },
    });
  });

  it('uses an absolute Windows browser path', () => {
    expect(resolveBrowserLaunchOptions('C:\\Browser\\brave.exe')).toEqual({
      ok: true,
      value: { executablePath: 'C:\\Browser\\brave.exe' },
    });
  });

  it('treats an empty path as unset', () => {
    expect(resolveBrowserLaunchOptions('  ')).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it('rejects relative executable paths', () => {
    expect(resolveBrowserLaunchOptions('bin/brave')).toEqual({
      ok: false,
      error: 'PLAYWRIGHT_EXECUTABLE_PATH must be an absolute path',
    });
  });
});
