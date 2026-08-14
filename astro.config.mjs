import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';
import { env } from 'node:process';

export default defineConfig({
  adapter: cloudflare({
    configPath: env.SST_WRANGLER_PATH,
  }),
  devToolbar: {
    enabled: false,
  },
  output: 'server',
});
