import { describe, expect, it } from 'vitest';

import { validateEnvironment } from '../../src/config/environment';

describe('validateEnvironment', () => {
  it('allows local stages without deployment credentials', () => {
    expect(validateEnvironment('development', {})).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it('lists every missing production credential', () => {
    expect(validateEnvironment('production', {})).toEqual({
      ok: false,
      error:
        'Missing required production variables: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN',
    });
  });

  it('accepts non-empty production credentials', () => {
    expect(
      validateEnvironment('production', {
        CLOUDFLARE_ACCOUNT_ID: 'account-id',
        CLOUDFLARE_API_TOKEN: 'api-token',
      }),
    ).toEqual({ ok: true, value: undefined });
  });

  it('rejects whitespace-only production credentials', () => {
    expect(
      validateEnvironment('production', {
        CLOUDFLARE_ACCOUNT_ID: ' ',
        CLOUDFLARE_API_TOKEN: 'api-token',
      }),
    ).toEqual({
      ok: false,
      error: 'Missing required production variables: CLOUDFLARE_ACCOUNT_ID',
    });
  });
});
