import { describe, expect, it } from 'vitest';

import { validateEnvironment } from '../../src/config/environment';

describe('validateEnvironment', () => {
  it('allows local development without deployment credentials', () => {
    expect(validateEnvironment('development', {})).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it('lists every missing production credential', () => {
    expect(validateEnvironment('production', {})).toEqual({
      ok: false,
      error:
        'Missing required deployment variables: CLOUDFLARE_DEFAULT_ACCOUNT_ID, CLOUDFLARE_API_TOKEN',
    });
  });

  it('accepts non-empty production credentials', () => {
    expect(
      validateEnvironment('production', {
        CLOUDFLARE_DEFAULT_ACCOUNT_ID: 'account-id',
        CLOUDFLARE_API_TOKEN: 'api-token',
      }),
    ).toEqual({ ok: true, value: undefined });
  });

  it('rejects whitespace-only production credentials', () => {
    expect(
      validateEnvironment('production', {
        CLOUDFLARE_DEFAULT_ACCOUNT_ID: ' ',
        CLOUDFLARE_API_TOKEN: 'api-token',
      }),
    ).toEqual({
      ok: false,
      error:
        'Missing required deployment variables: CLOUDFLARE_DEFAULT_ACCOUNT_ID',
    });
  });

  it('requires credentials for non-production deployment stages', () => {
    expect(validateEnvironment('preview', {})).toEqual({
      ok: false,
      error:
        'Missing required deployment variables: CLOUDFLARE_DEFAULT_ACCOUNT_ID, CLOUDFLARE_API_TOKEN',
    });
  });

  it('rejects documented placeholder credentials', () => {
    expect(
      validateEnvironment('production', {
        CLOUDFLARE_DEFAULT_ACCOUNT_ID: 'your_cloudflare_account_id',
        CLOUDFLARE_API_TOKEN: 'your_cloudflare_api_token',
      }),
    ).toEqual({
      ok: false,
      error:
        'Missing required deployment variables: CLOUDFLARE_DEFAULT_ACCOUNT_ID, CLOUDFLARE_API_TOKEN',
    });
  });
});
