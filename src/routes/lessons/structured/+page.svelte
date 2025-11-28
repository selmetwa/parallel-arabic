<script lang="ts">
	let { data } = $props();
</script>

<section class="px-4 mt-12 sm:px-8 max-w-7xl mx-auto mb-20">
	<div class="text-left mb-12">
		<div class="mb-4">
			<a href="/lessons" class="text-tile-600 hover:text-tile-700 text-sm font-medium flex items-center gap-2 mb-4">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Lessons
			</a>
		</div>
		<h1 class="text-4xl sm:text-5xl text-text-300 font-bold mb-4 tracking-tight">Structured Lessons</h1>
		<p class="text-text-200 text-lg sm:text-xl leading-relaxed opacity-90 max-w-3xl">Choose your dialect and follow a structured learning path organized by modules and topics.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
		<!-- Egyptian Arabic Card -->
		<a 
			href="/lessons/structured/egyptian-arabic"
			class="group flex flex-col bg-gradient-to-br from-tile-400 to-tile-500 border-2 border-tile-600 rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-tile-400"
		>
			<div class="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🇪🇬</div>
			<h2 class="text-3xl font-bold text-text-300 mb-4 group-hover:text-text-200 transition-colors">
				Egyptian Arabic
			</h2>
			<p class="text-text-200 text-lg leading-relaxed mb-6 flex-grow">
				Learn Egyptian Arabic through a structured curriculum covering greetings, introductions, daily conversations, and more.
			</p>
			<div class="flex items-center gap-2 text-tile-700 font-semibold group-hover:gap-4 transition-all">
				<span>Start Learning</span>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		<!-- Moroccan Darija Card -->
		<a 
			href="/lessons/structured/darija"
			class="group flex flex-col bg-gradient-to-br from-green-400 to-green-500 border-2 border-green-600 rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-green-400"
		>
			<div class="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🇲🇦</div>
			<h2 class="text-3xl font-bold text-white mb-4 group-hover:text-green-100 transition-colors">
				Moroccan Darija
			</h2>
			<p class="text-white text-lg leading-relaxed mb-6 flex-grow opacity-95">
				Master Moroccan Darija with structured lessons designed to help you communicate effectively in Morocco.
			</p>
			<div class="flex items-center gap-2 text-green-900 font-semibold group-hover:gap-4 transition-all">
				<span>Start Learning</span>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		<!-- Modern Standard Arabic (MSA) Card -->
		<a 
			href="/lessons/structured/msa"
			class="group flex flex-col bg-gradient-to-br from-purple-400 to-purple-500 border-2 border-purple-600 rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-purple-400"
		>
			<div class="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">📖</div>
			<h2 class="text-3xl font-bold text-white mb-4 group-hover:text-purple-100 transition-colors">
				Modern Standard Arabic
			</h2>
			<p class="text-white text-lg leading-relaxed mb-6 flex-grow opacity-95">
				Learn Modern Standard Arabic (Fusha) through a comprehensive curriculum covering formal Arabic used in media and literature.
			</p>
			<div class="flex items-center gap-2 text-purple-900 font-semibold group-hover:gap-4 transition-all">
				<span>Start Learning</span>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		<!-- Levantine Arabic Card -->
		<a 
			href="/lessons/structured/levantine"
			class="group flex flex-col bg-gradient-to-br from-orange-400 to-orange-500 border-2 border-orange-600 rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-orange-400"
		>
			<div class="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🌍</div>
			<h2 class="text-3xl font-bold text-white mb-4 group-hover:text-orange-100 transition-colors">
				Levantine Arabic
			</h2>
			<p class="text-white text-lg leading-relaxed mb-6 flex-grow opacity-95">
				Explore Levantine Arabic spoken in Syria, Lebanon, Jordan, and Palestine through structured lessons.
			</p>
			<div class="flex items-center gap-2 text-orange-900 font-semibold group-hover:gap-4 transition-all">
				<span>Start Learning</span>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</a>
	</div>
</section>

