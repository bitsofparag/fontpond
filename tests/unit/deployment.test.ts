import { describe, expect, it } from 'vitest';

import { deploymentDomain } from '../../src/config/deployment';

describe('deploymentDomain', () => {
  it('assigns the public domain only to production', () => {
    expect(deploymentDomain('production')).toBe('fontpond.com');
  });

  it.each(['development', 'preview', 'pr-42'])(
    'leaves the %s stage on its generated Worker URL',
    (stage) => {
      expect(deploymentDomain(stage)).toBeUndefined();
    },
  );
});
