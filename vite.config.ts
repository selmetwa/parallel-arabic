import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.png', 'icons/icon.png'],
			manifest: {
				name: 'Parallel Arabic',
				short_name: 'Parallel Arabic',
				description: 'Master Arabic dialects through real practice',
				theme_color: '#2d3748',
				background_color: '#1a1a2e',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: '/icons/icon.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/icons/icon.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				],
				shortcuts: [
					{
						name: 'Lessons',
						short_name: 'Lessons',
						description: 'View your lessons',
						url: '/lessons',
						icons: [{ src: '/icons/icon.png', sizes: '192x192' }]
					},
					{
						name: 'Review',
						short_name: 'Review',
						description: 'Review vocabulary',
						url: '/review',
						icons: [{ src: '/icons/icon.png', sizes: '192x192' }]
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				]
			},
			devOptions: {
				enabled: true,
				type: 'module'
			}
		})
	],
  server: {
    watch: {
      usePolling: true,
    },
    host: true
  },
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});