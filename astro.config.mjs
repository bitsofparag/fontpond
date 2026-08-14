import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';
import process from 'node:process';

export default defineConfig({
  adapter: cloudflare({
    configPath: process.env.SST_WRANGLER_PATH,
  }),
  devToolbar: {
    enabled: false,
  },
  output: 'server',
});
