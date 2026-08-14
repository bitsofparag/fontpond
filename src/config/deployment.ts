const PRODUCTION_DOMAIN = 'fontpond.com';

/** Returns the custom domain reserved for the production stage. */
export function deploymentDomain(stage: string): string | undefined {
  return stage === 'production' ? PRODUCTION_DOMAIN : undefined;
}
