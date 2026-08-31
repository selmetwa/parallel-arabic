<script lang="ts">
	import AppStoreBadge from '$lib/components/AppStoreBadge.svelte';
</script>

<section class="min-h-screen bg-tile-300 py-12">
	<div class="mx-auto max-w-4xl px-4 sm:px-8">
		<!-- Header -->
		<header class="mb-12 text-center">
			<h1 class="mb-6 text-3xl font-bold leading-tight text-text-300 sm:text-4xl lg:text-5xl">
				Get Parallel Arabic on Your Phone
			</h1>
			<p class="mb-8 text-lg leading-relaxed text-text-200 sm:text-xl">
				There is a native app for iPhone and iPad, free on the App Store. On Android and desktop,
				install the web app to your home screen and it behaves the same way.
			</p>
			<AppStoreBadge
				className="px-6 py-3 border-2 border-tile-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
			/>
		</header>

		<!-- Benefits Section -->
		<section class="mb-12">
			<h2 class="mb-6 text-2xl font-bold text-text-300 sm:text-3xl">Why Install the App?</h2>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 shadow-lg">
					<div class="mb-4 text-4xl">📱</div>
					<h3 class="mb-3 text-xl font-bold text-text-300">Quick Access</h3>
					<p class="leading-relaxed text-text-200">
						Access Parallel Arabic directly from your home screen, just like a native app.
					</p>
				</div>

				<div class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 shadow-lg">
					<div class="mb-4 text-4xl">⚡</div>
					<h3 class="mb-3 text-xl font-bold text-text-300">Faster Loading</h3>
					<p class="leading-relaxed text-text-200">
						Enjoy faster load times and smoother performance with cached content.
					</p>
				</div>

				<div class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 shadow-lg">
					<div class="mb-4 text-4xl">🔔</div>
					<h3 class="mb-3 text-xl font-bold text-text-300">App-Like Experience</h3>
					<p class="leading-relaxed text-text-200">
						Full-screen experience without browser bars, optimized for mobile learning.
					</p>
				</div>

				<div class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 shadow-lg">
					<div class="mb-4 text-4xl">💾</div>
					<h3 class="mb-3 text-xl font-bold text-text-300">Faster Performance</h3>
					<p class="leading-relaxed text-text-200">
						Cached assets load instantly, giving you a smoother and faster learning experience.
					</p>
				</div>
			</div>
		</section>

		<!-- Installation Instructions -->
		<section class="mb-12">
			<h2 class="mb-4 text-2xl font-bold text-text-300 sm:text-3xl">On Android and desktop</h2>
			<p class="mb-8 leading-relaxed text-text-200">
				There is no Android app yet. Installing the web app to your home screen gives you the same
				full-screen experience, an icon, and faster loading.
			</p>

			<!-- Android (Chrome) -->
			<div class="mb-6 rounded-lg border-2 border-tile-600 bg-tile-500 p-6 shadow-lg">
				<div class="mb-4 flex items-center gap-4">
					<div class="text-4xl">🤖</div>
					<h3 class="text-2xl font-bold text-text-300">Android (Chrome)</h3>
				</div>
				<ol class="list-inside list-decimal space-y-3 text-text-200">
					<li>Open <strong class="text-text-300">Chrome</strong> browser on your Android device</li>
					<li>Navigate to <strong class="text-text-300">parallel-arabic.com</strong></li>
					<li>
						Tap the <strong class="text-text-300">menu</strong> button (three dots) in the top right
						corner
					</li>
					<li>
						Tap <strong class="text-text-300">"Install app"</strong> or
						<strong class="text-text-300">"Add to Home screen"</strong>
					</li>
					<li>Confirm by tapping <strong class="text-text-300">"Install"</strong> in the popup</li>
					<li>The Parallel Arabic app will be installed and appear on your home screen!</li>
				</ol>
			</div>

			<!-- Desktop (Chrome/Edge) -->
			<div class="mb-6 rounded-lg border-2 border-tile-600 bg-tile-500 p-6 shadow-lg">
				<div class="mb-4 flex items-center gap-4">
					<div class="text-4xl">💻</div>
					<h3 class="text-2xl font-bold text-text-300">Desktop (Chrome/Edge)</h3>
				</div>
				<ol class="list-inside list-decimal space-y-3 text-text-200">
					<li>
						Open <strong class="text-text-300">Chrome</strong> or
						<strong class="text-text-300">Edge</strong> browser
					</li>
					<li>Navigate to <strong class="text-text-300">parallel-arabic.com</strong></li>
					<li>
						Look for the <strong class="text-text-300">install icon</strong> in the address bar (usually
						a "+" or download icon)
					</li>
					<li>
						Click the install icon and select <strong class="text-text-300">"Install"</strong>
					</li>
					<li>
						Alternatively, click the menu (three dots) → <strong class="text-text-300"
							>"Install Parallel Arabic"</strong
						>
					</li>
					<li>The app will open in its own window, separate from your browser!</li>
				</ol>
			</div>

			<!-- Other Browsers -->
			<div class="rounded-lg border-2 border-tile-600 bg-tile-500 p-6 shadow-lg">
				<div class="mb-4 flex items-center gap-4">
					<div class="text-4xl">🌐</div>
					<h3 class="text-2xl font-bold text-text-300">Other Browsers</h3>
				</div>
				<p class="mb-4 leading-relaxed text-text-200">
					If you're using a different browser, you can still add Parallel Arabic to your home
					screen:
				</p>
				<ul class="list-inside list-disc space-y-2 text-text-200">
					<li>
						<strong class="text-text-300">Firefox (Android):</strong> Menu → "Install" or "Add to Home
						screen"
					</li>
					<li>
						<strong class="text-text-300">Samsung Internet:</strong> Menu → "Add page to" → "Home screen"
					</li>
					<li>
						<strong class="text-text-300">Other browsers:</strong> Look for "Add to Home screen" or "Install"
						in the menu
					</li>
				</ul>
			</div>
		</section>

		<!-- Troubleshooting -->
		<section class="mb-12">
			<h2 class="mb-6 text-2xl font-bold text-text-300 sm:text-3xl">Troubleshooting</h2>
			<div class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 shadow-lg">
				<div class="space-y-4 text-text-200">
					<div>
						<h4 class="mb-2 text-lg font-bold text-text-300">I don't see the install option</h4>
						<p class="leading-relaxed">
							Make sure you're using a supported browser — Chrome on Android, Chrome or Edge on
							desktop. Some browsers do not support installing web apps. On iPhone and iPad,
							download the app from the App Store instead.
						</p>
					</div>
					<div>
						<h4 class="mb-2 text-lg font-bold text-text-300">Does the app work offline?</h4>
						<p class="leading-relaxed">
							Parallel Arabic requires an internet connection to function. The app caches static
							assets for faster loading, but you'll need internet access to access lessons, stories,
							and other content.
						</p>
					</div>
					<div>
						<h4 class="mb-2 text-lg font-bold text-text-300">I want to uninstall</h4>
						<p class="leading-relaxed">
							On mobile: Long-press the app icon and select "Remove" or "Delete". On desktop:
							Right-click the app icon and select "Uninstall" or remove it from your applications
							folder.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- CTA -->
		<section class="text-center">
			<p class="mb-6 text-lg text-text-200">Ready to take your Arabic learning on the go?</p>
			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
				<a
					href="/signup"
					class="inline-block border-2 border-tile-600 bg-tile-500 px-8 py-4 text-lg font-semibold text-text-300 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-tile-600 hover:shadow-xl"
				>
					Get Started Free →
				</a>
				<AppStoreBadge
					className="px-6 py-3 border-2 border-tile-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
				/>
			</div>
		</section>
	</div>
</section>
