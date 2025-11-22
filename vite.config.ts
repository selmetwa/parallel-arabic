import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			strategies: 'generateSW',
			workbox: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest}'],
				navigateFallback: '/',
				navigateFallbackDenylist: [/^\/api\//],
				runtimeCaching: [
					{
						urlPattern: ({ url }) => url.pathname.startsWith('/'),
						handler: 'NetworkFirst',
						options: {
							cacheName: 'pages-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
							}
						}
					}
				]
			},
			manifest: {
				name: 'Parallel Arabic',
				short_name: 'Parallel Arabic',
				description: 'Master Arabic dialects through real practice',
				start_url: '/',
				display: 'standalone',
				background_color: '#B2C3CB',
				theme_color: '#365463',
				orientation: 'portrait-primary',
				icons: [
					{
						src: '/icons/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icons/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icons/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: '/icons/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				],
				screenshots: [
					{
						src: '/screenshots/desktop.png',
						sizes: '1280x720',
						type: 'image/png',
						form_factor: 'wide',
						label: 'Parallel Arabic Desktop View'
					},
					{
						src: '/screenshots/mobile.png',
						sizes: '390x844',
						type: 'image/png',
						form_factor: 'narrow',
						label: 'Parallel Arabic Mobile View'
					}
				],
				categories: ['education', 'lifestyle'],
				shortcuts: [
					{
						name: 'Lessons',
						short_name: 'Lessons',
						description: 'View your lessons',
						url: '/lessons',
						icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
					},
					{
						name: 'Review',
						short_name: 'Review',
						description: 'Review vocabulary',
						url: '/review',
						icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
					},
					{
						name: 'Tutor',
						short_name: 'Tutor',
						description: 'Practice with tutor',
						url: '/tutor',
						icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
					},
					{
						name: 'Stories',
						short_name: 'Stories',
						description: 'Read Arabic stories',
						url: '/stories',
						icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
					}
				]
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