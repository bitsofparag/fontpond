// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      home: 'cloudflare',
      name: 'fontpond',
      providers: {
        cloudflare: '6.15.0',
      },
      removal: input?.stage === 'production' ? 'retain' : 'remove',
    };
  },
  async run() {
    const { deploymentDomain } = await import('./src/config/deployment');
    const site = new sst.cloudflare.Astro('FontpondWeb', {
      buildCommand: 'just build',
      domain: deploymentDomain($app.stage),
    });

    return { url: site.url };
  },
});
