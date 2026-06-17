<!-- Hallmark · genre: playful · macrostructure: Bento Grid · theme: project (HSL hue-200, theme-aware) · enrichment: none · nav/footer: layout-owned (skipped) -->
<!-- Hallmark · pre-emit critique: P4 H4 E4 S4 R4 V4 -->
<script>
	import { slide } from 'svelte/transition';

	/** @typedef {{ t: string; b?: boolean }} QuoteSegment */

	/** @type {number | null} */
	let openIndex = $state(null);

	/** @param {number} i */
	function toggle(i) {
		openIndex = openIndex === i ? null : i;
	}

	// Testimonials — each is an array of text segments; `b: true` renders bold.
	const testimonials = [
		[
			{ t: 'After only a day, I love Parallel Arabic.', b: true },
			{ t: ' As a language teacher — I teach French at a huge public high school in Southern California — and an absolute language nut who speaks seven other languages besides Arabic, I can tell how much thought went into this.' }
		],
		[
			{ t: 'Wow this is perfect for what I need currently. The stories section in particular is a great idea as ' },
			{ t: "I can't find any graded stories for practice.", b: true },
			{ t: ' Thank you so much for this :)' }
		],
		[
			{ t: 'This is great! As someone outgrowing Duolingo this is perfect.', b: true }
		],
		[
			{ t: 'I love it! This is something I have been ' },
			{ t: 'searching for ages', b: true },
			{ t: ' :) thank you so much' }
		],
		[
			{ t: "Have tried many of the 'apps' and " },
			{ t: 'this is the closest one to doing what I want!', b: true },
			{ t: " Very useful and comprehensive app, everything's very useful — I love the interlinear format for the stories." }
		],
		[
			{ t: "Even though I'm a beginner, " },
			{ t: "your AI is the best I've tried among all the apps!", b: true },
			{ t: ' The others are always weird in their answers and pronounce the words weirdly.' }
		],
		[
			{ t: 'Stories UI is really good!', b: true },
			{ t: ' The large, readable font, easy switching of transliteration and English, and interactive click-to-define are all really excellent.' }
		],
		[
			{ t: 'I really like the website and find it very useful. For me ' },
			{ t: "it's better than a lot of other platforms", b: true },
			{ t: " — it's well thought out and has a lot of features." }
		]
	];

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

<div class="min-h-screen bg-tile-300">
	<!-- Hero — left-biased, asymmetric (was centered two-column) -->
	<header>
		<div class="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-24">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
				<div class="lg:col-span-7">
					<h1 class="text-4xl sm:text-6xl font-bold text-text-300 tracking-tight leading-[1.08] mb-6">
						Learn what is actually spoken
					</h1>
					<p class="text-text-200 text-lg sm:text-xl leading-relaxed max-w-xl mb-8">
						Learning Arabic is hard. Most apps teach Fusha — when what you actually want is to have real conversations with Egyptians, Lebanese, or Moroccans.
					</p>
					<a
						href="/signup"
						class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold bg-tile-500 border-2 border-tile-600 text-text-300 transition-all duration-200 hover:bg-tile-600 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
					>
						Start now <span aria-hidden="true">→</span>
					</a>
				</div>
				<div class="lg:col-span-5">
					<img
						src="/images/features/map.png"
						class="w-full h-auto rounded-2xl"
						alt="Parallel Arabic vocabulary map"
					/>
				</div>
			</div>
		</div>
	</header>

	{#snippet quoteCard(/** @type {QuoteSegment[]} */ segments, /** @type {boolean} */ hidden)}
		<figure
			class="flex-shrink-0 w-[280px] sm:w-[320px] bg-tile-400 rounded-xl p-5 sm:p-6 shadow-sm"
			aria-hidden={hidden}
		>
			<span class="block text-4xl leading-none text-text-200 mb-2" aria-hidden="true">“</span>
			<blockquote class="text-text-300 text-base leading-relaxed"
				>{#each segments as seg, i (i)}{#if seg.b}<strong class="text-text-200">{seg.t}</strong>{:else}{seg.t}{/if}{/each}</blockquote
			>
		</figure>
	{/snippet}

	<!-- Testimonials — infinite horizontal marquee -->
	<section class="py-10 sm:py-14 bg-tile-200 border-y border-tile-500 overflow-hidden">
		<div class="max-w-6xl mx-auto px-4 sm:px-8 mb-6 sm:mb-8">
			<h2 class="text-2xl sm:text-4xl font-bold text-text-300 tracking-tight">What our users say</h2>
		</div>
		<div class="marquee">
			<div class="marquee__track">
				{#each testimonials as t, i (i)}{@render quoteCard(t, false)}{/each}
				{#each testimonials as t, i (i)}{@render quoteCard(t, true)}{/each}
			</div>
		</div>
	</section>

	<!-- Features — irregular bento grid (was 8 identical full-width cards) -->
	<section class="py-14 sm:py-20 bg-tile-200 border-t border-tile-500">
		<div class="max-w-6xl mx-auto px-4 sm:px-8">
			<div class="max-w-2xl mb-10 sm:mb-12">
				<h2 class="text-2xl sm:text-4xl font-bold text-text-300 tracking-tight mb-3">
					Built around dialects, from the ground up
				</h2>
				<p class="text-text-200 text-base sm:text-lg leading-relaxed">
					Here’s what that looks like in practice — seven ways to read, practice, and remember the Arabic you actually want to speak.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5">
				<!-- Short Stories (flagship) -->
				<article class="md:col-span-2 lg:col-span-4 min-w-0 flex flex-col bg-tile-400 border border-tile-500 rounded-xl p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0">
					<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Short Stories</h3>
					<p class="text-text-200 leading-relaxed">
						Practice reading Arabic in context. Click any word to instantly see its translation, transliteration, and pronunciation. Generate your own stories on any topic — Egyptian street food, Levantine pop culture, whatever interests you.
					</p>
					<img
						src="/images/features/stories.png"
						alt="Short Stories feature"
						class="w-full h-auto rounded-lg mt-5 border border-tile-500"
					/>
				</article>

				<!-- Lessons -->
				<article class="md:col-span-1 lg:col-span-2 min-w-0 flex flex-col bg-tile-400 border border-tile-500 rounded-xl p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0">
					<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Lessons</h3>
					<p class="text-text-200 leading-relaxed">
						Explore 50+ structured lessons per dialect covering vocabulary, grammar, and phrases — or use AI to generate lessons on any topic you're interested in.
					</p>
					<img
						src="/images/features/lessons.png"
						alt="Lessons feature"
						class="w-full h-auto rounded-lg mt-5 border border-tile-500"
					/>
				</article>

				<!-- Sentence Practice -->
				<article class="md:col-span-1 lg:col-span-3 min-w-0 flex flex-col bg-tile-400 border border-tile-500 rounded-xl p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0">
					<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Sentence Practice</h3>
					<p class="text-text-200 leading-relaxed mb-4">
						See your saved words used naturally in sentences. Two practice modes:
					</p>
					<ul class="text-text-200 space-y-2 text-sm">
						<li class="flex items-start gap-2"><span class="text-text-300 font-semibold flex-shrink-0">Writing —</span> Type out Arabic sentences using a custom virtual Arabic keyboard, or your device's native keyboard.</li>
						<li class="flex items-start gap-2"><span class="text-text-300 font-semibold flex-shrink-0">Matching —</span> Drag and drop Arabic words into the correct order to form a sentence.</li>
					</ul>
					<img
						src="/images/features/sentence-writing.png"
						alt="Sentence writing practice"
						class="w-full h-auto rounded-lg mt-5 border border-tile-500"
					/>
				</article>

				<!-- Spaced Repetition -->
				<article class="md:col-span-1 lg:col-span-3 min-w-0 flex flex-col bg-tile-400 border border-tile-500 rounded-xl p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0">
					<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Spaced Repetition</h3>
					<p class="text-text-200 leading-relaxed">
						Review your saved words on a schedule proven to build long-term retention — and each session pulls from the words you’ve actually saved.
					</p>
					<img
						src="/images/features/reviews.png"
						alt="Spaced repetition reviews"
						class="w-full h-auto rounded-lg mt-5 border border-tile-500"
					/>
				</article>

				<!-- Vocabulary Map (text-only — quieter band) -->
				<article class="md:col-span-1 lg:col-span-2 min-w-0 flex flex-col bg-tile-400 border border-tile-500 rounded-xl p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0">
					<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Vocabulary Map</h3>
					<p class="text-text-200 leading-relaxed">
						Save words and watch your Arabic vocabulary grow visually over time. See at a glance how much you know across all four dialects.
					</p>
				</article>

				<!-- Click to Define (text-only) -->
				<article class="md:col-span-1 lg:col-span-2 min-w-0 flex flex-col bg-tile-400 border border-tile-500 rounded-xl p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0">
					<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Click to Define</h3>
					<p class="text-text-200 leading-relaxed">
						Click on any word anywhere in the app for a detailed breakdown: meaning, transliteration, dialect variant, native audio, and example usage.
					</p>
				</article>

				<!-- Compare Dialects (full-width closer) -->
				<article class="md:col-span-2 lg:col-span-6 min-w-0 bg-tile-400 border border-tile-500 rounded-xl p-6 sm:p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0">
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
						<div>
							<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Compare Dialects</h3>
							<p class="text-text-200 leading-relaxed">
								See how the same word or phrase differs across Egyptian, Levantine, Darija, and Modern Standard Arabic — side by side. Useful for anyone learning multiple dialects or curious about regional differences.
							</p>
						</div>
						<img
							src="/images/features/compare-dialects.png"
							alt="Compare dialects"
							class="w-full h-auto rounded-lg border border-tile-500"
						/>
					</div>
				</article>
			</div>
		</div>
	</section>

	<!-- How It Works — numbered spine (was 4 identical heavy cards) -->
	<section class="py-14 sm:py-20 bg-tile-300">
		<div class="max-w-3xl mx-auto px-4 sm:px-8">
			<div class="mb-10 sm:mb-14">
				<h2 class="text-2xl sm:text-4xl font-bold text-text-300 tracking-tight mb-3">How Parallel Arabic works</h2>
				<p class="text-text-200 text-base sm:text-lg leading-relaxed">
					A simple loop: learn words, see them in context, make them stick.
				</p>
			</div>

			<ol class="relative border-l-2 border-tile-500 ml-5 sm:ml-6 space-y-12 sm:space-y-14">
				<!-- Step 1 -->
				<li class="relative pl-8 sm:pl-12">
					<span class="absolute -left-[1.15rem] sm:-left-[1.4rem] top-0 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-tile-500 border-2 border-tile-600 text-text-300 font-bold text-base sm:text-lg">1</span>
					<p class="text-xs text-text-200 uppercase tracking-[0.14em] mb-1">Skip this step if you're not a beginner!</p>
					<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Master the foundations first</h3>
					<p class="text-text-200 text-sm sm:text-base mb-3 italic">
						Arabic script looks intimidating, and you're unsure where to even begin with a language that reads right-to-left…
					</p>
					<p class="text-text-300 text-base sm:text-lg leading-relaxed">
						<strong>Start with the Arabic alphabet and structured lessons</strong> that introduce essential vocabulary and grammar patterns across all four dialects. Every word you learn gets saved to your personal deck, ready for review and practice.
					</p>
				</li>

				<!-- Step 2 -->
				<li class="relative pl-8 sm:pl-12">
					<span class="absolute -left-[1.15rem] sm:-left-[1.4rem] top-0 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-tile-500 border-2 border-tile-600 text-text-300 font-bold text-base sm:text-lg">2</span>
					<p class="text-xs text-text-200 uppercase tracking-[0.14em] mb-1">Immerse yourself in authentic Arabic</p>
					<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Read stories, tap any word</h3>
					<p class="text-text-200 text-sm sm:text-base mb-3 italic">
						Textbook Arabic feels disconnected from how people actually speak. You want to understand real conversations, not just formal phrases…
					</p>
					<p class="text-text-300 text-base sm:text-lg leading-relaxed">
						<strong>Dive into stories written in Egyptian, Levantine, Moroccan Darija, or Modern Standard Arabic.</strong> Tap any word to instantly see its meaning, transliteration, and pronunciation. Every sentence comes with native audio. Save words directly to your deck as you go.
					</p>
				</li>

				<!-- Step 3 -->
				<li class="relative pl-8 sm:pl-12">
					<span class="absolute -left-[1.15rem] sm:-left-[1.4rem] top-0 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-tile-500 border-2 border-tile-600 text-text-300 font-bold text-base sm:text-lg">3</span>
					<p class="text-xs text-text-200 uppercase tracking-[0.14em] mb-1">Your content, your way</p>
					<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Generate content from your own words</h3>
					<p class="text-text-200 text-sm sm:text-base mb-3 italic">
						Generic language apps bore you. The same repetitive exercises, the same irrelevant topics…
					</p>
					<p class="text-text-300 text-base sm:text-lg leading-relaxed mb-5">
						<strong>Use AI to generate custom stories and practice sentences built around the words you're actually studying.</strong> Want to practice Egyptian street food vocab? Levantine soccer slang? Generate it instantly. Your words, your context — not someone else's curriculum.
					</p>
					<div class="border-t border-tile-500 pt-4">
						<p class="text-sm text-text-200 font-medium mb-3">Your saved words include:</p>
						<ul class="text-sm text-text-200 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
							<li class="flex items-center gap-2"><span aria-hidden="true">✓</span> Arabic script with transliteration</li>
							<li class="flex items-center gap-2"><span aria-hidden="true">✓</span> Native audio pronunciation</li>
							<li class="flex items-center gap-2"><span aria-hidden="true">✓</span> English translation and context</li>
							<li class="flex items-center gap-2"><span aria-hidden="true">✓</span> Example sentences in your chosen dialect</li>
						</ul>
					</div>
				</li>

				<!-- Step 4 -->
				<li class="relative pl-8 sm:pl-12">
					<span class="absolute -left-[1.15rem] sm:-left-[1.4rem] top-0 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-tile-500 border-2 border-tile-600 text-text-300 font-bold text-base sm:text-lg">4</span>
					<p class="text-xs text-text-200 uppercase tracking-[0.14em] mb-1">Make it stick</p>
					<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-3">Review your words with spaced repetition</h3>
					<p class="text-text-200 text-sm sm:text-base mb-3 italic">
						You've studied Arabic before but the words just don't stick. A week later, you've forgotten everything…
					</p>
					<p class="text-text-300 text-base sm:text-lg leading-relaxed">
						<strong>Review your saved words with spaced repetition</strong> — the method that schedules reviews at exactly the right time. Unlike a plain flashcard app, <strong>each session generates fresh stories and practice sentences using your saved words</strong>, so you encounter them in different contexts rather than the same card over and over.
					</p>
				</li>
			</ol>

			<div class="mt-12 pl-8 sm:pl-12 ml-5 sm:ml-6">
				<a
					href="/signup"
					class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold bg-tile-500 border-2 border-tile-600 text-text-300 transition-all duration-200 hover:bg-tile-600 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
				>
					Start learning free <span aria-hidden="true">→</span>
				</a>
			</div>
		</div>
	</section>

	<!-- Pricing — softened (was heavy bordered cards) -->
	<section class="py-14 sm:py-20 bg-tile-300">
		<div class="max-w-5xl mx-auto px-4 sm:px-8">
			<div class="max-w-2xl mb-10 sm:mb-12">
				<h2 class="text-2xl sm:text-4xl font-bold text-text-300 tracking-tight mb-3">Choose your path</h2>
				<p class="text-text-200 text-base sm:text-lg leading-relaxed">
					Start learning for free, forever. Upgrade anytime for unlimited AI-generated content and advanced features.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start">
				<!-- Free Plan -->
				<div class="bg-tile-400 rounded-2xl p-7 sm:p-8 shadow-sm flex flex-col">
					<div class="mb-6">
						<h3 class="text-2xl font-bold text-text-300 mb-1">Free Forever</h3>
						<p class="text-text-200 text-sm">Everything you need to get started</p>
					</div>

					<ul class="space-y-3 mb-8 flex-grow">
						<li class="flex items-start gap-3"><span class="text-lg flex-shrink-0" aria-hidden="true">✓</span><span class="text-text-200">All featured stories with native audio</span></li>
						<li class="flex items-start gap-3"><span class="text-lg flex-shrink-0" aria-hidden="true">✓</span><span class="text-text-200">Interactive sentence practice</span></li>
						<li class="flex items-start gap-3"><span class="text-lg flex-shrink-0" aria-hidden="true">✓</span><span class="text-text-200">Complete alphabet lessons</span></li>
						<li class="flex items-start gap-3"><span class="text-lg flex-shrink-0" aria-hidden="true">✓</span><span class="text-text-200">Verb conjugation practice</span></li>
						<li class="flex items-start gap-3"><span class="text-lg flex-shrink-0" aria-hidden="true">✓</span><span class="text-text-200">Basic spaced repetition</span></li>
					</ul>

					<a
						href="/signup"
						class="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-semibold bg-tile-500 border-2 border-tile-600 text-text-300 transition-all duration-200 hover:bg-tile-600 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
					>
						Start free <span aria-hidden="true">→</span>
					</a>
					<p class="text-center text-xs text-text-200 mt-3">No credit card required</p>
				</div>

				<!-- Premium Plan -->
				<div class="bg-tile-500 rounded-2xl p-7 sm:p-8 shadow-md flex flex-col relative ring-2 ring-tile-600">
					<div class="absolute -top-3 left-7">
						<span class="bg-tile-600 text-text-300 text-xs font-bold px-4 py-1 rounded-full shadow-sm">MOST POPULAR</span>
					</div>

					<div class="mb-6">
						<h3 class="text-2xl font-bold text-text-300 mb-1">Premium</h3>
						<p class="text-text-200 text-sm">Go deeper, faster</p>
					</div>

					<ul class="space-y-3 mb-8 flex-grow">
						<li class="flex items-start gap-3"><span class="text-lg flex-shrink-0" aria-hidden="true">✓</span><span class="text-text-200"><strong class="text-text-300">Everything in Free</strong></span></li>
						<li class="flex items-start gap-3"><span class="text-lg flex-shrink-0" aria-hidden="true">✓</span><span class="text-text-200"><strong class="text-text-300">Unlimited AI-generated stories</strong> (create custom content)</span></li>
						<li class="flex items-start gap-3"><span class="text-lg flex-shrink-0" aria-hidden="true">✓</span><span class="text-text-200"><strong class="text-text-300">Unlimited AI tutor conversations</strong> with real-time feedback</span></li>
						<li class="flex items-start gap-3"><span class="text-lg flex-shrink-0" aria-hidden="true">✓</span><span class="text-text-200"><strong class="text-text-300">Advanced spaced repetition</strong> with Anki export</span></li>
						<li class="flex items-start gap-3"><span class="text-lg flex-shrink-0" aria-hidden="true">✓</span><span class="text-text-200"><strong class="text-text-300">Pronunciation assessment</strong> for speaking practice</span></li>
						<li class="flex items-start gap-3"><span class="text-lg flex-shrink-0" aria-hidden="true">✓</span><span class="text-text-200">Priority support</span></li>
					</ul>

					<a
						href="/pricing"
						class="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-semibold bg-tile-600 border-2 border-tile-600 text-text-300 transition-all duration-200 hover:bg-tile-700 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
					>
						See pricing <span aria-hidden="true">→</span>
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ — smooth accordion (logic preserved) -->
	<section class="py-14 sm:py-20 bg-tile-200 border-t border-tile-500">
		<div class="max-w-3xl mx-auto px-4 sm:px-8">
			<h2 class="text-2xl sm:text-4xl font-bold text-text-300 tracking-tight mb-8 sm:mb-10">Frequently asked questions</h2>
			<div class="space-y-3">
				{#each faqs as faq, i (i)}
					<div class="bg-tile-400 rounded-xl overflow-hidden">
						<button
							onclick={() => toggle(i)}
							class="w-full text-left px-5 sm:px-6 py-4 flex items-center justify-between gap-4 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
							aria-expanded={openIndex === i}
						>
							<span class="text-text-300 font-semibold">{faq.q}</span>
							<span class="text-text-200 text-2xl leading-none flex-shrink-0" aria-hidden="true">{openIndex === i ? '−' : '+'}</span>
						</button>
						{#if openIndex === i}
							<div class="px-5 sm:px-6 pb-5" transition:slide={{ duration: 200 }}>
								<p class="text-text-200 leading-relaxed">{faq.a}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>
</div>

<style>
	.marquee {
		display: flex;
		overflow: hidden;
		-webkit-mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
		mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
	}

	.marquee__track {
		display: flex;
		align-items: stretch;
		gap: 1rem;
		width: max-content;
		padding: 0 0.5rem;
		animation: marquee-scroll 55s linear infinite;
	}

	.marquee:hover .marquee__track,
	.marquee:focus-within .marquee__track {
		animation-play-state: paused;
	}

	@keyframes marquee-scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.marquee {
			-webkit-mask-image: none;
			mask-image: none;
			overflow-x: auto;
		}
		.marquee__track {
			animation: none;
		}
	}
</style>
