import adapterVercel from '@sveltejs/adapter-vercel';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Use static adapter for mobile builds, vercel for web
const adapter = process.env.CAPACITOR === 'true' 
  ? adapterStatic({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    })
  : adapterVercel();

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors

  kit: {
    adapter: adapter,
    csrf: {
      checkOrigin: false,
    }
  },
  preprocess: [vitePreprocess({})]
};

export default config;