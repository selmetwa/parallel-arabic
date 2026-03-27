<script>
	let openIndex = $state(null);

	function toggle(i) {
		openIndex = openIndex === i ? null : i;
	}

	const faqs = [
		{
			q: 'Which Arabic dialects does it support?',
			a: 'Parallel Arabic currently supports Egyptian Arabic, Levantine Arabic, Moroccan Darija, and Modern Standard Arabic (Fusha). All four are available across stories, vocabulary, lessons, and review.'
		},
		{
			q: 'Do I need to know any Arabic to get started?',
			a: 'No. Complete beginners can start with the Arabic alphabet lessons, which walk you through reading and writing Arabic script from scratch. Once you have the basics, you can move into vocabulary and stories at your own pace.'
		},
		{
			q: 'How is this different from Duolingo?',
			a: "Duolingo teaches Modern Standard Arabic through fixed, gamified exercises. Parallel Arabic focuses on spoken dialects and lets you generate learning material around your own saved words — so you’re practicing vocabulary that’s actually relevant to you, in the dialect you want to speak."
		},
		{
			q: 'Is there a mobile app?',
			a: 'Yes.... and no Parallel Arabic is a PWA (Progressive Web App) and can be installed as an app on your home screen on iOS and Android. Native IOS and Android apps are coming soon.'
		}
	];
</script>
<section class="min-h-screen bg-tile-300">
	<!-- Hero Section -->
	<header>
		<div class="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
				<div class="text-left">
					<h1 class="text-3xl sm:text-5xl text-text-300 font-bold mb-4 tracking-tight leading-[40px] sm:leading-[60px]">
						Learn what is actually spoken
					</h1>
					<p class="text-left text-text-200 text-base sm:text-lg mb-4 max-w-2xl mx-auto">
						Learning Arabic is hard. Most apps teach Fusha — when what you actually want is to have real conversations with Egyptians, Lebanese, or Moroccans.
					</p>
					<div class="space-y-3">
						<a
							href="/signup"
							class="inline-block px-8 py-4 text-lg font-semibold bg-tile-500 border-2 border-tile-600 text-text-300 hover:bg-tile-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
						>
							Start Now
						</a>

					</div>
				</div>
				<div class="flex justify-center lg:justify-end">
					<img src="/images/features/map.png" class="max-w-full h-auto opacity-90" alt="Parallel Arabic vocabulary map" />
				</div>
			</div>
		</div>
	</header>

		<!-- Feature Cards Section -->
		<section class="py-12 sm:py-20 bg-tile-200 border-y border-tile-600">
			<div class="max-w-6xl mx-auto px-4 sm:px-8">
				<!-- <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-4 text-center">Learn what is actually spoken</h2>
				<p class="text-center text-text-200 text-base sm:text-lg mb-4 max-w-2xl mx-auto">
					Learning Arabic is hard. Most apps teach Fusha — when what you actually want is to have real conversations with Egyptians, Lebanese, or Moroccans.
				</p> -->
				<p class="text-center text-text-200 text-base sm:text-lg mb-12 max-w-2xl mx-auto">
					Parallel Arabic is built around dialects from the ground up. Here’s what that looks like in practice:
				</p>
	
				<div class="space-y-6">
	
					<!-- Lessons -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="flex flex-col md:flex-row">
							<div class="flex-1 p-6 sm:p-8 flex flex-col justify-center">
								<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Lessons</h3>
								<p class="text-text-200 leading-relaxed">
									Explore 50+ structured lessons per dialect covering vocabulary, grammar, and phrases — or use AI to generate lessons on any topic you're interested in.
								</p>
							</div>
							<div class="md:w-1/2 flex-shrink-0">
								<img src="/images/features/lessons.png" alt="Lessons feature" class="w-full h-full object-cover object-top" />
							</div>
						</div>
					</div>
	
					<!-- Vocabulary -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="flex flex-col md:flex-row">
							<div class="flex-1 p-6 sm:p-8 flex flex-col justify-center">
								<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Vocabulary</h3>
								<p class="text-text-200 leading-relaxed">
									Over 20,000 vocabulary words across Egyptian, Levantine, Moroccan Darija, and Modern Standard Arabic — each with native speaker audio.
								</p>
							</div>
						<div class="md:w-1/2 flex-shrink-0">
							<img src="/images/features/vocab.png" alt="Vocabulary feature" class="w-full h-full object-contain object-top" />
						</div>
						</div>
					</div>
	
					<!-- Short Stories -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="flex flex-col md:flex-row">
							<div class="flex-1 p-6 sm:p-8 flex flex-col justify-center">
								<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Short Stories</h3>
								<p class="text-text-200 leading-relaxed">
									Practice reading Arabic in context. Click any word to instantly see its translation, transliteration, and pronunciation. Generate your own stories on any topic — Egyptian street food, Levantine pop culture, whatever interests you.
								</p>
							</div>
							<div class="md:w-1/2 flex-shrink-0">
								<img src="/images/features/stories.png" alt="Short Stories feature" class="w-full h-full object-cover object-top" />
							</div>
						</div>
					</div>
	
					<!-- Sentence Practice -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="flex flex-col md:flex-row">
							<div class="flex-1 p-6 sm:p-8 flex flex-col justify-center">
								<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Sentence Practice</h3>
								<p class="text-text-200 leading-relaxed mb-4">
									See your saved words used naturally in sentences. Two practice modes:
								</p>
								<ul class="text-text-200 space-y-2 text-sm">
									<li class="flex items-start gap-2"><span class="text-text-300 font-semibold flex-shrink-0">Writing —</span> Type out Arabic sentences using a custom virtual Arabic keyboard, or your device's native keyboard.</li>
									<li class="flex items-start gap-2"><span class="text-text-300 font-semibold flex-shrink-0">Matching —</span> Drag and drop Arabic words into the correct order to form a sentence.</li>
								</ul>
							</div>
							<div class="md:w-1/2 flex-shrink-0 flex flex-col">
								<img src="/images/features/sentence-writing.png" alt="Sentence writing practice" class="w-full object-cover object-top flex-1" />
								<img src="/images/features/sentence-matching.png" alt="Sentence matching practice" class="w-full object-cover object-top flex-1 border-t-2 border-tile-600" />
							</div>
						</div>
					</div>
	
					<!-- Spaced Repetition -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="flex flex-col md:flex-row">
							<div class="flex-1 p-6 sm:p-8 flex flex-col justify-center">
								<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Spaced Repetition</h3>
								<p class="text-text-200 leading-relaxed">
									Review your saved words on a schedule proven to build long-term retention.
								</p>
							</div>
							<div class="md:w-1/2 flex-shrink-0">
								<img src="/images/features/reviews.png" alt="Spaced repetition reviews" class="w-full h-full object-cover object-top" />
							</div>
						</div>
					</div>
	
					<!-- Vocabulary Map -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="flex flex-col md:flex-row">
							<div class="flex-1 p-6 sm:p-8 flex flex-col justify-center">
								<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Vocabulary Map</h3>
								<p class="text-text-200 leading-relaxed">
									Save words and watch your Arabic vocabulary grow visually over time. See at a glance how much you know across all four dialects.
								</p>
							</div>
							<div class="md:w-1/2 flex-shrink-0">
								<img src="/images/features/map.png" alt="Vocabulary map" class="w-full h-full object-cover object-top" />
							</div>
						</div>
					</div>
	
					<!-- Verb Conjugations -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="flex flex-col md:flex-row">
							<div class="flex-1 p-6 sm:p-8 flex flex-col justify-center">
								<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Verb Conjugations</h3>
								<p class="text-text-200 leading-relaxed">
									Practice Arabic verbs in past, present, future, and negated forms — in your chosen dialect. One of the most important (and most skipped) parts of learning Arabic.
								</p>
							</div>
							<div class="md:w-1/2 flex-shrink-0">
								<img src="/images/features/verb-conjugations.png" alt="Verb conjugations" class="w-full h-full object-cover object-top" />
							</div>
						</div>
					</div>
	
					<!-- Click to Define -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="flex flex-col md:flex-row">
							<div class="flex-1 p-6 sm:p-8 flex flex-col justify-center">
								<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Click to Define</h3>
								<p class="text-text-200 leading-relaxed">
									Click on any word anywhere in the app for a detailed breakdown: meaning, transliteration, dialect variant, native audio, and example usage.
								</p>
							</div>
							<div class="md:w-1/2 flex-shrink-0">
								<img src="/images/features/click-to-define.png" alt="Click to define" class="w-full h-full object-cover object-top" />
							</div>
						</div>
					</div>
	
					<!-- Compare Dialects -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="flex flex-col md:flex-row">
							<div class="flex-1 p-6 sm:p-8 flex flex-col justify-center">
								<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Compare Dialects</h3>
								<p class="text-text-200 leading-relaxed">
									See how the same word or phrase differs across Egyptian, Levantine, Darija, and Modern Standard Arabic — side by side. Useful for anyone learning multiple dialects or curious about regional differences.
								</p>
							</div>
							<div class="md:w-1/2 flex-shrink-0">
								<img src="/images/features/compare-dialects.png" alt="Compare dialects" class="w-full h-full object-cover object-top" />
							</div>
						</div>
					</div>
	
				</div>
			</div>
		</section>

	<!-- How It Works Section -->
	<section class="py-12 sm:py-20 bg-tile-200 border-y border-tile-600">
		<div class="max-w-5xl mx-auto px-4 sm:px-8">
			<h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-4 text-center">How Parallel Arabic Works</h2>
			<p class="text-center text-text-200 text-base sm:text-lg mb-12 max-w-2xl mx-auto">
				A simple loop: learn words, see them in context, make them stick
			</p>
			
			<div class="space-y-8">
				<!-- Step 1 -->
				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 sm:p-8 shadow-lg">
					<div class="flex items-start gap-4 sm:gap-6">
						<div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-tile-600 rounded-full flex items-center justify-center">
							<span class="text-xl sm:text-2xl font-bold text-text-300">1</span>
						</div>
						<div class="flex-1">
							<p class="text-xs text-text-200 uppercase tracking-wide mb-1">Skip this step if you're not a beginner!</p>
							<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Master the foundations first</h3>
							<p class="text-text-200 text-sm sm:text-base mb-4 italic">
								Arabic script looks intimidating, and you're unsure where to even begin with a language that reads right-to-left…
							</p>
							<p class="text-text-300 text-base sm:text-lg leading-relaxed">
								<strong>Start with the Arabic alphabet and structured lessons</strong> that introduce essential vocabulary and grammar patterns across all four dialects. Every word you learn gets saved to your personal deck, ready for review and practice.
							</p>
						</div>
					</div>
				</div>

				<!-- Step 2 -->
				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 sm:p-8 shadow-lg">
					<div class="flex items-start gap-4 sm:gap-6">
						<div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-tile-600 rounded-full flex items-center justify-center">
							<span class="text-xl sm:text-2xl font-bold text-text-300">2</span>
						</div>
						<div class="flex-1">
							<p class="text-xs text-text-200 uppercase tracking-wide mb-1">Immerse yourself in authentic Arabic</p>
							<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Read stories, tap any word</h3>
							<p class="text-text-200 text-sm sm:text-base mb-4 italic">
								Textbook Arabic feels disconnected from how people actually speak. You want to understand real conversations, not just formal phrases…
							</p>
							<p class="text-text-300 text-base sm:text-lg leading-relaxed">
								<strong>Dive into stories written in Egyptian, Levantine, Moroccan Darija, or Modern Standard Arabic.</strong> Tap any word to instantly see its meaning, transliteration, and pronunciation. Every sentence comes with native audio. Save words directly to your deck as you go.
							</p>
						</div>
					</div>
				</div>

				<!-- Step 3 -->
				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 sm:p-8 shadow-lg">
					<div class="flex items-start gap-4 sm:gap-6">
						<div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-tile-600 rounded-full flex items-center justify-center">
							<span class="text-xl sm:text-2xl font-bold text-text-300">3</span>
						</div>
						<div class="flex-1">
							<p class="text-xs text-text-200 uppercase tracking-wide mb-1">Your content, your way</p>
							<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Generate content from your own words</h3>
							<p class="text-text-200 text-sm sm:text-base mb-4 italic">
								Generic language apps bore you. The same repetitive exercises, the same irrelevant topics…
							</p>
							<p class="text-text-300 text-base sm:text-lg leading-relaxed mb-4">
								<strong>Use AI to generate custom stories and practice sentences built around the words you're actually studying.</strong> Want to practice Egyptian street food vocab? Levantine soccer slang? Generate it instantly. Your words, your context — not someone else's curriculum.
							</p>
							<div class="bg-tile-500 rounded-lg p-4 border border-tile-600">
								<p class="text-sm text-text-200 font-medium mb-2">Your saved words include:</p>
								<ul class="text-sm text-text-200 space-y-1">
									<li class="flex items-center gap-2"><span>✓</span> Arabic script with transliteration</li>
									<li class="flex items-center gap-2"><span>✓</span> Native audio pronunciation</li>
									<li class="flex items-center gap-2"><span>✓</span> English translation and context</li>
									<li class="flex items-center gap-2"><span>✓</span> Example sentences in your chosen dialect</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				<!-- Step 4 -->
				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 sm:p-8 shadow-lg">
					<div class="flex items-start gap-4 sm:gap-6">
						<div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-tile-600 rounded-full flex items-center justify-center">
							<span class="text-xl sm:text-2xl font-bold text-text-300">4</span>
						</div>
						<div class="flex-1">
							<p class="text-xs text-text-200 uppercase tracking-wide mb-1">Make it stick</p>
							<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Review your words with spaced repetition</h3>
							<p class="text-text-200 text-sm sm:text-base mb-4 italic">
								You've studied Arabic before but the words just don't stick. A week later, you've forgotten everything…
							</p>
							<p class="text-text-300 text-base sm:text-lg leading-relaxed">
								<strong>Review your saved words with spaced repetition</strong> — the method that schedules reviews at exactly the right time. Unlike a plain flashcard app, <strong>each session generates fresh stories and practice sentences using your saved words</strong>, so you encounter them in different contexts rather than the same card over and over.
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- CTA -->
			<div class="text-center mt-12">
				<a
					href="/signup"
					class="inline-block px-8 py-4 text-lg font-semibold bg-tile-500 border-2 border-tile-600 text-text-300 hover:bg-tile-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
				>
					Start Learning Free →
				</a>
			</div>
		</div>
	</section>

	<!-- Testimonials Section -->
	<section class="py-12 sm:py-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-8">
			<h2 class="text-2xl sm:text-3xl font-bold text-text-300 text-left mb-8">What Our Learners Say</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<article class="bg-tile-400 border-2 border-tile-600 p-6 shadow-lg flex flex-col h-full">
					<p class="text-text-300 text-base leading-relaxed flex-grow">
						"Wow this is perfect for what I need currently. The stories section in particular is a great idea as <strong class="text-text-200">I can't find any graded stories for practice</strong>. Thank you so much for this :)"
					</p>
				</article>

				<article class="bg-tile-400 border-2 border-tile-600 p-6 shadow-lg flex flex-col h-full">
					<p class="text-text-300 text-base leading-relaxed flex-grow">
						"<strong class="text-text-200">This is great! As someone outgrowing Duolingo this is perfect.</strong>"
					</p>
				</article>

				<article class="bg-tile-400 border-2 border-tile-600 p-6 shadow-lg flex flex-col h-full">
					<p class="text-text-300 text-base leading-relaxed flex-grow">
						"I love it! This is something I have been <strong class="text-text-200">searching for ages</strong> :) thank you so much"
					</p>
				</article>
			</div>
		</div>
	</section>



	<!-- Free vs Premium Section -->
	<section class="py-12 sm:py-16 bg-tile-200 border-y border-tile-600">
		<div class="max-w-6xl mx-auto px-4 sm:px-8">
			<h2 class="text-2xl sm:text-3xl font-bold text-text-300 text-center mb-4">Choose Your Path</h2>
			<p class="text-center text-text-200 text-base sm:text-lg mb-10 max-w-2xl mx-auto">
				Start learning for free, forever. Upgrade anytime for unlimited AI-generated content and advanced features.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Free Plan -->
				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-8 shadow-lg flex flex-col">
					<div class="mb-6">
						<h3 class="text-2xl font-bold text-text-300 mb-2">Free Forever</h3>
						<p class="text-text-200 text-sm">Everything you need to get started</p>
					</div>

					<ul class="space-y-3 mb-8 flex-grow">
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200">All featured stories with native audio</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200">20,000+ vocabulary words across all dialects</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200">Interactive sentence practice</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200">Complete alphabet lessons</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200">Verb conjugation practice</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200">Basic spaced repetition</span>
						</li>
					</ul>

					<a
						href="/signup"
						class="w-full text-center px-6 py-4 text-lg font-semibold bg-tile-500 border-2 border-tile-600 text-text-300 hover:bg-tile-600 transition-all duration-300 shadow-md"
					>
						Start Free - No Credit Card →
					</a>
				</div>

				<!-- Premium Plan -->
				<div class="bg-tile-500 border-2 border-tile-600 rounded-lg p-8 shadow-lg flex flex-col relative">
					<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
						<span class="bg-tile-600 text-text-300 text-xs font-bold px-4 py-1 rounded-full shadow-md">MOST POPULAR</span>
					</div>

					<div class="mb-6">
						<h3 class="text-2xl font-bold text-text-300 mb-2">Premium</h3>
						<p class="text-text-200 text-sm">Go deeper, faster</p>
					</div>

					<ul class="space-y-3 mb-8 flex-grow">
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200"><strong class="text-text-300">Everything in Free</strong></span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200"><strong class="text-text-300">Unlimited AI-generated stories</strong> (create custom content)</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200"><strong class="text-text-300">Unlimited AI tutor conversations</strong> with real-time feedback</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200"><strong class="text-text-300">Advanced spaced repetition</strong> with Anki export</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200"><strong class="text-text-300">Pronunciation assessment</strong> for speaking practice</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="text-lg flex-shrink-0">✓</span>
							<span class="text-text-200">Priority support</span>
						</li>
					</ul>

					<a
						href="/pricing"
						class="w-full text-center px-6 py-4 text-lg font-semibold bg-tile-600 border-2 border-tile-600 text-text-300 hover:bg-tile-700 transition-all duration-300 shadow-md"
					>
						See Pricing →
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	<section class="py-12 sm:py-16 bg-tile-300 border-y border-tile-600">
		<div class="max-w-3xl mx-auto px-4 sm:px-8">
			<h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-8 text-center">Frequently asked questions</h2>
			<div class="space-y-2">
				{#each faqs as faq, i (i)}
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg overflow-hidden">
						<button
							onclick={() => toggle(i)}
							class="w-full text-left px-6 py-4 flex items-center justify-between gap-4 cursor-pointer"
						>
							<span class="text-text-300 font-semibold">{faq.q}</span>
							<span class="text-text-200 text-xl flex-shrink-0">{openIndex === i ? '−' : '+'}</span>
						</button>
						{#if openIndex === i}
							<div class="px-6 pb-5">
								<p class="text-text-200 leading-relaxed">{faq.a}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

</section>
