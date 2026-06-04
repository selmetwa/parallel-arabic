<script lang="ts">
	let { data } = $props();
</script>

<section class="px-4 mt-6 sm:px-8 max-w-7xl mx-auto mb-12">
	<div class="text-left mb-6">
		<div class="mb-3">
			<a href="/lessons" class="text-tile-600 hover:text-tile-700 text-sm font-medium flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Lessons
			</a>
		</div>
		<h1 class="text-2xl sm:text-3xl text-text-300 font-bold mb-2 tracking-tight">Structured Lessons</h1>
		<p class="text-text-200 text-base sm:text-lg leading-relaxed max-w-3xl">Choose your dialect or explore foundational topics like alphabet and grammar. Follow a structured learning path organized by modules and topics.</p>
	</div>

	<div class="mb-8">
		<h2 class="text-lg sm:text-xl font-bold text-text-300 mb-3">Foundational Topics</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
			<!-- Alphabet Card -->
			<a 
				href="/lessons/structured/alphabet"
				class="group flex flex-col bg-blue-500 border border-blue-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
			>
				<div class="text-3xl mb-3">🔤</div>
				<h2 class="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-blue-100 transition-colors">
					Alphabet
				</h2>
				<p class="text-white text-base leading-relaxed mb-4 flex-grow opacity-95">
					Master the Arabic alphabet, letter forms, vowels, and pronunciation. Essential for reading and writing in any Arabic dialect.
				</p>
				<div class="flex items-center gap-2 text-blue-100 font-semibold group-hover:gap-4 transition-all">
					<span>Start Learning</span>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</a>
		</div>
	</div>

	<div>
		<h2 class="text-lg sm:text-xl font-bold text-text-300 mb-3">Dialects</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
		<!-- Egyptian Arabic Card -->
		<a 
			href="/lessons/structured/egyptian-arabic"
			class="group flex flex-col bg-tile-400 border border-tile-500 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
		>
			<div class="text-3xl mb-3">🇪🇬</div>
			<h2 class="text-lg sm:text-xl font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors">
				Egyptian Arabic
			</h2>
			<p class="text-text-200 text-base leading-relaxed mb-4 flex-grow">
				Learn Egyptian Arabic through a structured curriculum covering greetings, introductions, daily conversations, and more.
			</p>
			<div class="flex items-center gap-2 text-text-300 font-semibold group-hover:gap-4 transition-all">
				<span>Start Learning</span>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		<!-- Moroccan Darija Card -->
		<a 
			href="/lessons/structured/darija"
			class="group flex flex-col bg-green-500 border border-green-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
		>
			<div class="text-3xl mb-3">🇲🇦</div>
			<h2 class="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-green-700 transition-colors">
				Moroccan Darija
			</h2>
			<p class="text-white text-base leading-relaxed mb-4 flex-grow opacity-95">
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
			class="group flex flex-col bg-purple-500 border border-purple-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
		>
			<div class="text-3xl mb-3">📖</div>
			<h2 class="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-purple-100 transition-colors">
				Modern Standard Arabic
			</h2>
			<p class="text-white text-base leading-relaxed mb-4 flex-grow opacity-95">
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
			class="group flex flex-col bg-orange-500 border border-orange-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
		>
			<div class="text-3xl mb-3">🇱🇧</div>
			<h2 class="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-orange-100 transition-colors">
				Levantine Arabic
			</h2>
			<p class="text-white text-base leading-relaxed mb-4 flex-grow opacity-95">
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
	</div>
</section>

