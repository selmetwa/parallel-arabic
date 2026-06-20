<script>
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';

	/** @typedef {{ title: string; img: string; fullImg?: string; descriptions: string[]; learnMoreLink?: string }} Card */
	/** @typedef {{ t: string; b?: boolean }} QuoteSegment */

	/** @type {Card | null} */
	let lightbox = $state(null);

	/** @param {Card} card */
	function openLightbox(card) {
		lightbox = card;
	}

	function closeLightbox() {
		lightbox = null;
	}


	/** @type {number | null} */
	let openIndex = $state(null);

	/** @param {number} i */
	function toggle(i) {
		openIndex = openIndex === i ? null : i;
	}

	/** @param {KeyboardEvent} event */
	function handleKeydown(event) {
		if (event.key === 'Escape') closeLightbox();
	}

	const cards = [
		{
			title: 'Alphabet',
			img: '/images/marketing-alphabet.png',
			fullImg: '/images/features-large/alphabet.png',
			descriptions: ['Learn the Arabic Alphabet with interactive exercises'],
			learnMoreLink: '/alphabet-new'
		},
		{
			title: 'Tutor',
			img: '/images/marketing-conversation.png',
			fullImg: '/images/features-large/tutor.png',
			descriptions: [
				'Practice speaking with an AI tutor',
				'Get real-time grammar feedback, and use practice situations to improve your speaking skills'
			],
			learnMoreLink: '/tutor'
		},
		{
			title: 'Short Stories',
			img: '/images/marketing-sentence-reader.png',
			fullImg: '/images/features-large/stories.png',
			descriptions: [
				'Read short stories in arabic alongside the english translation and transliteration of the text'
			],
			learnMoreLink: '/stories'
		},
		{
			title: 'Spaced Repetition System',
			img: '/images/marketing-spaced-recall.png',
			fullImg: '/images/features-large/repitition.png',
			descriptions: ['Spaced repetition for your saved words']
		},
		{
			title: 'Writing Practice',
			img: '/images/marketing-writing-practice.png',
			fullImg: '/images/features-large/sentences.png',
			descriptions: [
				'Practice arabic sentences with instant feedback in one of three modes',
				"Writing: Type out Arabic sentences using a custom virtual Arabic keyboard, or your device's native keyboard.",
				'Matching: Drag and drop Arabic words into the correct order to form a sentence.',
				'Tracing: Same as writing, but with the letters laid out for you'
			],
			learnMoreLink: '/sentences'
		},
		{
			title: 'Lessons',
			img: '/images/marketing-learning-path.png',
			fullImg: '/images/features-large/lessons.png',
			descriptions: [
				'Learn Arabic with structured lessons, from A1 - C2',
				'Use structured lessons or create your own'
			],
			learnMoreLink: '/lessons'
		},
		{
			title: 'Speaking',
			img: '/images/marketing-speaking.png',
			fullImg: '/images/features-large/speak.png',
			descriptions: [
				'Practice speaking generated Arabic sentences with instant pronunciation feedback'
			],
			learnMoreLink: '/speak'
		},
		{
			title: 'Game',
			img: '/images/marketing-multiple-choice.png',
			fullImg: '/images/features-large/game.png',
			descriptions: [
				'Play games to learn Arabic, like fill in the blank, multiple choice, and more'
			],
			learnMoreLink: '/learn/game'
		},
		{
			title: 'Import Words',
			img: '/images/marketing-import-words.png',
			fullImg: '/images/features-large/import.png',
			descriptions: [
				'Bring your own words and import them into the app to learn them in context',
				'Paste text or upload .csv files'
			]
		},
		{
			title: 'Vocabulary Table',
			img: '/images/marketing-vocabulary-table.png',
			fullImg: '/images/features-large/all-words.png',
			descriptions: [
				'Keep track of all of your saved words in a table, and then easily import when creating lessons, stories, and practice exercises to learn them in context; not in isolation'
			],
			learnMoreLink: '/review/all-words'
		},
		{
			title: 'Conjugation Drills',
			img: '/images/marketing-conjugation-drill.png',
			fullImg: '/images/features-large/verb-conjugations.png',
			descriptions: ['Practice Arabic verb conjugation with drills and quizzes'],
			learnMoreLink: '/conjugations'
		},
		{
			title: 'Dialect Comparison',
			img: '/images/marketing-dialect-comparison.png',
			fullImg: '/images/features-large/dialect-compare.png',
			descriptions: ['Compare how a word or phrase is said across different Arabic dialects side by side']
		},
		{
			title: 'On demand definitions',
			img: '/images/marketing-word-detail.png',
			fullImg: '/images/features-large/definition-modal.png',
			descriptions: [
				'Tap any word to see its definition, transliteration, and example usage',
				'Save words straight to your review deck'
			]
		}
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
			a: "Duolingo teaches Modern Standard Arabic through fixed, gamified exercises. Parallel Arabic focuses on spoken dialects and lets you generate learning material around your own saved words, so you’re practicing vocabulary that’s actually relevant to you, in the dialect you want to speak."
		},
		{
			q: 'Is there a mobile app?',
			a: 'Yes.... and no Parallel Arabic is a PWA (Progressive Web App) and can be installed as an app on your home screen on iOS and Android. Native IOS and Android apps are coming soon.'
		}
	];

	const testimonials = [
		[
			{ t: 'After only a day, I love Parallel Arabic.', b: true },
			{
				t: ' As a language teacher — I teach French at a huge public high school in Southern California — and an absolute language nut who speaks seven other languages besides Arabic, I can tell how much thought went into this.'
			}
		],
		[
			{
				t: 'Wow this is perfect for what I need currently. The stories section in particular is a great idea as '
			},
			{ t: "I can't find any graded stories for practice.", b: true },
			{ t: ' Thank you so much for this :)' }
		],
		[{ t: 'This is great! As someone outgrowing Duolingo this is perfect.', b: true }],
		[
			{ t: 'I love it! This is something I have been ' },
			{ t: 'searching for ages', b: true },
			{ t: ' :) thank you so much' }
		],
		[
			{ t: "Have tried many of the 'apps' and " },
			{ t: 'this is the closest one to doing what I want!', b: true },
			{
				t: " Very useful and comprehensive app, everything's very useful — I love the interlinear format for the stories."
			}
		],
		[
			{ t: "Even though I'm a beginner, " },
			{ t: "your AI is the best I've tried among all the apps!", b: true },
			{ t: ' The others are always weird in their answers and pronounce the words weirdly.' }
		],
		[
			{ t: 'Stories UI is really good!', b: true },
			{
				t: ' The large, readable font, easy switching of transliteration and English, and interactive click-to-define are all really excellent.'
			}
		],
		[
			{ t: 'I really like the website and find it very useful. For me ' },
			{ t: "it's better than a lot of other platforms", b: true },
			{ t: " — it's well thought out and has a lot of features." }
		]
	];
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-tile-200">
	<main
		class="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:gap-16 sm:px-6 sm:py-16 lg:px-8"
	>
		<!-- Hero -->
		<header class="flex flex-col items-center gap-3 text-center sm:gap-4">
			<div
				class="h-20 w-20 rounded-2xl border border-tile-500 bg-tile-300 sm:h-32 sm:w-32 sm:rounded-3xl"
			>
				<img
					src="/icons/icon-trans.png"
					alt="Parallel Arabic Logo"
					class="h-full w-auto object-contain p-2"
					fetchpriority="high"
				/>
			</div>
			<h1 class="text-2xl font-bold text-text-300 sm:text-4xl">Parallel Arabic</h1>
			<h2 class="text-base font-medium text-text-200 sm:text-2xl">
				Learn and practice Arabic Dialects
			</h2>
			<a
				href={resolve('/signup')}
				class="mt-2 inline-flex items-center gap-2 rounded-full border-2 border-tile-600 bg-tile-500 px-7 py-3.5 text-base font-semibold text-text-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-tile-600 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
			>
				Start now <span aria-hidden="true">→</span>
			</a>
		</header>

		<!-- Feature Cards — CSS columns masonry -->
		<section class="columns-1 gap-4 sm:columns-2 sm:gap-6">
			{#each cards as card (card.title)}
				<article
					class="mb-4 flex w-full break-inside-avoid flex-col overflow-hidden rounded-xl border border-tile-500 bg-tile-300 sm:mb-6"
				>
					<button
						type="button"
						onclick={() => openLightbox(card)}
						class="group relative block w-full cursor-zoom-in border-b border-tile-500"
						aria-label={`View ${card.title} screenshot larger`}
					>
						<img
							src={card.img}
							alt={card.title}
							class="h-auto w-full transition-transform duration-300 group-hover:scale-[1.02]"
						/>
						<span
							class="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10"
						></span>
						<span
							class="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"
								></line><line x1="11" y1="8" x2="11" y2="14"></line><line
									x1="8"
									y1="11"
									x2="14"
									y2="11"
								></line></svg
							>
							Expand
						</span>
					</button>
					<div class="flex-1 space-y-2 px-4 py-4">
						<p class="text-base font-semibold text-text-300 sm:text-lg">{card.title}</p>
						<div class="space-y-1.5">
							{#each card.descriptions as description, i (i)}
								<p class="text-sm leading-relaxed text-text-200 sm:text-base">{description}</p>
							{/each}
						</div>
					</div>
					{#if card.learnMoreLink}
						<a
							href={resolve(/** @type {any} */ (card.learnMoreLink))}
							class="px-4 pb-4 text-sm text-blue-600 underline transition-colors hover:text-blue-700 sm:text-base"
							>Learn more</a
						>
					{/if}
				</article>
			{/each}
		</section>
	</main>

	{#snippet quoteCard(/** @type {QuoteSegment[]} */ segments, /** @type {boolean} */ hidden)}
		<figure
			class="w-[280px] flex-shrink-0 rounded-xl bg-tile-400 p-5 shadow-sm sm:w-[320px] sm:p-6"
			aria-hidden={hidden}
		>
			<span class="mb-2 block text-4xl leading-none text-text-200" aria-hidden="true">“</span>
			<blockquote class="text-base leading-relaxed text-text-300">
				{#each segments as seg, i (i)}{#if seg.b}<strong class="text-text-200">{seg.t}</strong
						>{:else}{seg.t}{/if}{/each}
			</blockquote>
		</figure>
	{/snippet}

	<section class="overflow-hidden border-y border-tile-500 bg-tile-200 py-10 sm:py-14">
			<h2 class="mx-auto text-center text-2xl sm:text-4xl font-bold text-text-300 tracking-tight mb-8 sm:mb-10">What our users say</h2>

		<div class="marquee">
			<div class="marquee__track">
				{#each testimonials as t, i (i)}{@render quoteCard(t, false)}{/each}
				{#each testimonials as t, i (i)}{@render quoteCard(t, true)}{/each}
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

{#if lightbox}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
		role="dialog"
		aria-modal="true"
		aria-label={`${lightbox.title} screenshot`}
	>
		<button
			type="button"
			onclick={closeLightbox}
			class="absolute inset-0 cursor-zoom-out bg-black/85 backdrop-blur-sm"
			aria-label="Close image preview"
			tabindex="-1"
		></button>

		<div class="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3">
			<button
				type="button"
				onclick={closeLightbox}
				class="absolute right-0 top-0 z-20 grid h-10 w-10 place-items-center rounded-full border border-tile-500 bg-tile-300 text-text-300 shadow-lg transition-colors hover:bg-tile-400"
				aria-label="Close image preview"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"
					></line></svg
				>
			</button>

			<img
				src={lightbox.fullImg ?? lightbox.img}
				alt={lightbox.title}
				class="max-h-[92vh] w-auto max-w-[96vw] rounded-xl border border-tile-500 shadow-2xl"
			/>
			<p class="text-sm font-medium text-white/90">{lightbox.title}</p>
		</div>
	</div>
{/if}

<style>
	.marquee {
		display: flex;
		overflow: hidden;
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
