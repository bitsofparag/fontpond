import type { Result } from '../domain/result';

const DEPLOYMENT_VARIABLES = [
  'CLOUDFLARE_DEFAULT_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
] as const;

type Environment = Readonly<Record<string, string | undefined>>;

/** Validates credentials for every stage that deploys infrastructure. */
export function validateEnvironment(
  stage: string,
  environment: Environment,
): Result<void, string> {
  if (stage === 'development') {
    return { ok: true, value: undefined };
  }

  const missing = DEPLOYMENT_VARIABLES.filter((name) =>
    isMissing(environment[name]),
  );

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required deployment variables: ${missing.join(', ')}`,
    };
  }

  return { ok: true, value: undefined };
}

function isMissing(value: string | undefined): boolean {
  const normalized = value?.trim() ?? '';
  return (
    normalized.length === 0 ||
    /^(your_|changeme$|xxx$|placeholder$)/i.test(normalized)
  );
}
