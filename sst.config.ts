import './.sst/platform/config.d.ts';

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
    new sst.cloudflare.Astro('FontpondWeb');
  },
});
