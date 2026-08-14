import type { Result } from '../domain/result';

const PRODUCTION_VARIABLES = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
] as const;

type Environment = Readonly<Record<string, string | undefined>>;

/** Validates only the variables required by the requested application stage. */
export function validateEnvironment(
  stage: string,
  environment: Environment,
): Result<void, string> {
  if (stage !== 'production') {
    return { ok: true, value: undefined };
  }

  const missing = PRODUCTION_VARIABLES.filter(
    (name) => !environment[name]?.trim(),
  );

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required production variables: ${missing.join(', ')}`,
    };
  }

  return { ok: true, value: undefined };
}
