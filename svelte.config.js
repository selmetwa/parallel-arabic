// import adapter from '@sveltejs/adapter-vercel';
// import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// /** @type {import('@sveltejs/kit').Config} */
// const config = {
//   // Consult https://kit.svelte.dev/docs/integrations#preprocessors
//   // for more information about preprocessors

//   kit: {
//     // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
//     // If your environment is not supported or you settled on a specific environment, switch out the adapter.
//     // See https://kit.svelte.dev/docs/adapters for more information about adapters.
//     adapter: adapter(),
//     csrf: {
//       checkOrigin: false,
//     },
//     serviceWorker: {
//       register: false  // Disable SvelteKit's service worker registration (handled by vite-pwa plugin)
//     }
//   },
//   preprocess: [vitePreprocess({})]
// };

// export default config;

import adapterVercel from '@sveltejs/adapter-vercel';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isCapacitor = process.env.CAPACITOR === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: isCapacitor 
      ? adapterStatic({
          pages: 'build',
          assets: 'build',
          fallback: 'index.html', // SPA fallback for client-side routing
          precompress: false,
          strict: false // Allow non-prerendered routes
        })
      : adapterVercel(),
    csrf: {
      checkOrigin: false,
    },
    serviceWorker: {
      register: false
    }
  },
  preprocess: [vitePreprocess({})]
};

export default config;