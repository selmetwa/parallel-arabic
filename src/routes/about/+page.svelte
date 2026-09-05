<script>
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import AppStoreBadge from '$lib/components/AppStoreBadge.svelte';

	/** @typedef {{ title: string; img: string; fullImg?: string; descriptions: string[]; learnMoreLink?: string; group: string }} Card */
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

	/** @type {Card[]} */
	const cards = [
		{
			title: 'Alphabet',
			img: '/images/marketing-alphabet.png',
			fullImg: '/images/features-large/alphabet.png',
			descriptions: ['Learn the Arabic Alphabet with interactive exercises'],
			learnMoreLink: '/alphabet',
			group: 'foundation'
		},
		{
			title: 'Tutor',
			img: '/images/marketing-conversation.png',
			fullImg: '/images/features-large/tutor.png',
			descriptions: [
				'Practice speaking with an AI tutor',
				'Get real-time grammar feedback, and use practice situations to improve your speaking skills'
			],
			learnMoreLink: '/tutor',
			group: 'practice'
		},
		{
			title: 'Short Stories',
			img: '/images/marketing-sentence-reader.png',
			fullImg: '/images/features-large/stories.png',
			descriptions: [
				'Read short stories in arabic alongside the english translation and transliteration of the text'
			],
			learnMoreLink: '/stories',
			group: 'read'
		},
		{
			title: 'Spaced Repetition System',
			img: '/images/marketing-spaced-recall.png',
			fullImg: '/images/features-large/repitition.png',
			descriptions: ['Spaced repetition for your saved words'],
			group: 'retain'
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
			learnMoreLink: '/sentences',
			group: 'practice'
		},
		{
			title: 'Lessons',
			img: '/images/marketing-learning-path.png',
			fullImg: '/images/features-large/lessons.png',
			descriptions: [
				'Learn Arabic with structured lessons, from A1 - C2',
				'Use structured lessons or create your own'
			],
			learnMoreLink: '/lessons',
			group: 'foundation'
		},
		{
			title: 'Speaking',
			img: '/images/marketing-speaking.png',
			fullImg: '/images/features-large/speak.png',
			descriptions: [
				'Practice speaking generated Arabic sentences with instant pronunciation feedback'
			],
			learnMoreLink: '/speak',
			group: 'practice'
		},
		{
			title: 'Game',
			img: '/images/marketing-multiple-choice.png',
			fullImg: '/images/features-large/game.png',
			descriptions: [
				'Play games to learn Arabic, like fill in the blank, multiple choice, and more'
			],
			learnMoreLink: '/learn/game',
			group: 'practice'
		},
		{
			title: 'Import Words',
			img: '/images/marketing-import-words.png',
			fullImg: '/images/features-large/import.png',
			descriptions: [
				'Bring your own words and import them into the app to learn them in context',
				'Paste text or upload .csv files'
			],
			group: 'retain'
		},
		{
			title: 'Vocabulary Table',
			img: '/images/marketing-vocabulary-table.png',
			fullImg: '/images/features-large/all-words.png',
			descriptions: [
				'Keep track of all of your saved words in a table, and then easily import when creating lessons, stories, and practice exercises to learn them in context; not in isolation'
			],
			learnMoreLink: '/review/all-words',
			group: 'retain'
		},
		{
			title: 'Conjugation Drills',
			img: '/images/marketing-conjugation-drill.png',
			fullImg: '/images/features-large/verb-conjugations.png',
			descriptions: ['Practice Arabic verb conjugation with drills and quizzes'],
			learnMoreLink: '/conjugations',
			group: 'practice'
		},
		{
			title: 'Dialect Comparison',
			img: '/images/marketing-dialect-comparison.png',
			fullImg: '/images/features-large/dialect-compare.png',
			descriptions: [
				'Compare how a word or phrase is said across different Arabic dialects side by side'
			],
			group: 'read'
		},
		{
			title: 'On demand definitions',
			img: '/images/marketing-word-detail.png',
			fullImg: '/images/features-large/definition-modal.png',
			descriptions: [
				'Tap any word to see its definition, transliteration, and example usage',
				'Save words straight to your review deck'
			],
			group: 'read'
		}
	];

	// Ordered feature sections. Grouping the thirteen cards gives the page a
	// spine — without it the masonry reads as one undifferentiated wall.
	const groups = [
		{ id: 'foundation', label: 'Foundation', sub: 'start from zero' },
		{ id: 'read', label: 'Read & look up', sub: 'meet real Arabic' },
		{ id: 'practice', label: 'Practice', sub: 'produce it yourself' },
		{ id: 'retain', label: 'Retain', sub: 'make it stick' }
	];

	// Continuous numbering across groups, in render order.
	const numbering = $derived.by(() => {
		/** @type {Record<string, number>} */
		const map = {};
		let n = 0;
		for (const g of groups) {
			for (const c of cards) {
				if (c.group === g.id) map[c.title] = ++n;
			}
		}
		return map;
	});

	/** @param {string} id */
	const cardsIn = (id) => cards.filter((c) => c.group === id);

	const specs = [
		{ label: 'Dialects', value: '4' },
		{ label: 'Lesson levels', value: 'A1–C2' }
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
			a: 'Duolingo teaches Modern Standard Arabic through fixed, gamified exercises. Parallel Arabic focuses on spoken dialects and lets you generate learning material around your own saved words, so you’re practicing vocabulary that’s actually relevant to you, in the dialect you want to speak.'
		},
		{
			q: 'Is there a mobile app?',
			a: 'Yes — Parallel Arabic is on the App Store for iPhone and iPad, free to download. There is no Android app yet, but the site is a Progressive Web App, so on Android and desktop you can install it to your home screen and get the same full-screen experience.'
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

{#snippet sectionHead(/** @type {string} */ label, /** @type {string} */ sub)}
	<div class="mb-5">
		<h2 class="text-xl font-bold text-text-300 sm:text-2xl">{label}</h2>
		<p class="mt-1 text-sm text-text-200">{sub}</p>
	</div>
{/snippet}

<div class="min-h-screen bg-tile-200">
	<!-- ── Hero ────────────────────────────────────────────────────────────── -->
	<header class="relative overflow-hidden border-b border-tile-500">
		<div class="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-14 lg:px-8">
			<h1
				class="reveal max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-text-300 sm:text-5xl lg:text-6xl"
				style="animation-delay: 60ms;"
			>
				Parallel Arabic.
			</h1>

			<p
				class="reveal mt-5 max-w-2xl text-base leading-relaxed text-text-200 sm:text-lg"
				style="animation-delay: 120ms;"
			>
				One app for reading, listening, drilling and speaking a spoken Arabic dialect.
			</p>

			<!-- CTAs and specs share one row on desktop; specs wrap below on mobile. -->
			<div
				class="reveal mt-8 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6"
				style="animation-delay: 180ms;"
			>
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
					<a
						href={resolve('/signup')}
						class="inline-flex items-center justify-center gap-2 rounded-full border-2 border-tile-600 bg-tile-500 px-7 py-3.5 text-base font-semibold text-text-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-tile-600 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 motion-reduce:hover:translate-y-0"
					>
						Start free <span aria-hidden="true">→</span>
					</a>
					<AppStoreBadge
						className="rounded-full border-2 border-tile-600 px-6 py-2.5 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:hover:translate-y-0"
					/>
				</div>

				<dl class="flex items-center gap-6 sm:border-l sm:border-tile-500 sm:pl-6">
					{#each specs as spec (spec.label)}
						<!-- Reversed so the value reads above its label while `dt` stays first in the DOM. -->
						<div class="flex flex-col-reverse gap-1">
							<dt class="text-sm leading-none text-text-200">{spec.label}</dt>
							<dd class="text-xl font-bold tabular-nums leading-none text-text-300">
								{spec.value}
							</dd>
						</div>
					{/each}
				</dl>
			</div>
		</div>
	</header>

	<!-- ── Features, grouped ───────────────────────────────────────────────── -->
	<main class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
		{#each groups as group, gi (group.id)}
			<section class="reveal mb-12 last:mb-0 sm:mb-16" style="animation-delay: {gi * 60}ms;">
				{@render sectionHead(group.label, group.sub)}

				<div class="columns-1 gap-4 sm:columns-2 sm:gap-6">
					{#each cardsIn(group.id) as card (card.title)}
						<article
							class="mb-4 flex w-full break-inside-avoid flex-col overflow-hidden rounded-xl border border-tile-500 bg-tile-300 transition-colors duration-200 hover:border-tile-600 sm:mb-6"
						>
							<button
								type="button"
								onclick={() => openLightbox(card)}
								class="group relative block w-full cursor-zoom-in border-b border-tile-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-text-300 focus-visible:[outline-offset:-2px]"
								aria-label={`View ${card.title} screenshot larger`}
							>
								<img
									src={card.img}
									alt={card.title}
									loading="lazy"
									class="h-auto w-full transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
								/>
								<span
									class="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10"
								></span>
								<span
									class="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
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
										><circle cx="11" cy="11" r="8"></circle><line
											x1="21"
											y1="21"
											x2="16.65"
											y2="16.65"
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

							<div class="flex flex-1 flex-col px-4 py-4">
								<div class="flex items-baseline gap-2.5">
									<span class="text-sm tabular-nums text-text-200" aria-hidden="true"
										>{String(numbering[card.title]).padStart(2, '0')}</span
									>
									<h3 class="text-base font-bold text-text-300 sm:text-lg">{card.title}</h3>
								</div>

								<div class="mt-2 space-y-1.5">
									{#each card.descriptions as description, i (i)}
										<p class="text-sm leading-relaxed text-text-200">{description}</p>
									{/each}
								</div>

								{#if card.learnMoreLink}
									<a
										href={resolve(/** @type {any} */ (card.learnMoreLink))}
										class="mt-3 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-text-300 underline decoration-tile-600 underline-offset-4 transition-colors hover:decoration-text-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
									>
										Try {card.title.toLowerCase()} <span aria-hidden="true">→</span>
									</a>
								{/if}
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/each}
	</main>

	<!-- ── Testimonials ────────────────────────────────────────────────────── -->
	{#snippet quoteCard(/** @type {QuoteSegment[]} */ segments, /** @type {boolean} */ hidden)}
		<figure
			class="w-[280px] flex-shrink-0 rounded-xl border border-tile-500 bg-tile-400 p-5 sm:w-[320px] sm:p-6"
			aria-hidden={hidden}
		>
			<span class="mb-2 block text-4xl leading-none text-text-200" aria-hidden="true">“</span>
			<blockquote class="text-base leading-relaxed text-text-300">
				{#each segments as seg, i (i)}{#if seg.b}<strong class="text-text-200">{seg.t}</strong
						>{:else}{seg.t}{/if}{/each}
			</blockquote>
		</figure>
	{/snippet}

	<section class="overflow-hidden border-y border-tile-500 bg-tile-300 py-12 sm:py-16">
		<div class="mx-auto mb-8 max-w-5xl px-4 sm:px-6 lg:px-8">
			{@render sectionHead('From learners', 'unedited')}
		</div>

		<div class="marquee">
			<div class="marquee__track">
				{#each testimonials as t, i (i)}{@render quoteCard(t, false)}{/each}
				{#each testimonials as t, i (i)}{@render quoteCard(t, true)}{/each}
			</div>
		</div>
	</section>

	<!-- ── FAQ ─────────────────────────────────────────────────────────────── -->
	<section class="py-12 sm:py-16">
		<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
			{@render sectionHead('Questions', 'the ones we get most')}

			<div class="overflow-hidden rounded-xl border border-tile-500 bg-tile-300">
				{#each faqs as faq, i (i)}
					<div class="border-b border-tile-500 last:border-b-0">
						<button
							onclick={() => toggle(i)}
							class="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-tile-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-text-300 focus-visible:[outline-offset:-2px] sm:px-6"
							aria-expanded={openIndex === i}
						>
							<span class="font-semibold text-text-300">{faq.q}</span>
							<span
								class="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border border-tile-600 text-lg leading-none text-text-200"
								aria-hidden="true">{openIndex === i ? '−' : '+'}</span
							>
						</button>
						{#if openIndex === i}
							<div class="px-5 pb-5 sm:px-6" transition:slide={{ duration: 200 }}>
								<p class="max-w-prose leading-relaxed text-text-200">{faq.a}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ── Closing CTA ─────────────────────────────────────────────────────── -->
	<section class="relative overflow-hidden border-t border-tile-500">
		<div class="reveal relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
			<h2 class="text-3xl font-bold leading-tight tracking-tight text-text-300 sm:text-4xl">
				Pick a dialect. Start today.
			</h2>
			<p class="mt-4 text-base text-text-200">
				Free to start, and you can switch dialects whenever you like.
			</p>
			<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<a
					href={resolve('/signup')}
					class="inline-flex items-center justify-center gap-2 rounded-full border-2 border-tile-600 bg-tile-500 px-7 py-3.5 text-base font-semibold text-text-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-tile-600 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 motion-reduce:hover:translate-y-0"
				>
					Start free <span aria-hidden="true">→</span>
				</a>
				<a
					href={resolve('/pricing')}
					class="inline-flex items-center justify-center rounded-full border border-tile-500 px-6 py-3.5 text-base font-medium text-text-200 transition-colors duration-200 hover:border-tile-600 hover:text-text-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
				>
					See pricing
				</a>
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
	@keyframes reveal {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.reveal {
		animation: reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}

	.marquee {
		display: flex;
		overflow: hidden;
		/* Fades the track into the section edges instead of clipping it hard. */
		-webkit-mask-image: linear-gradient(
			to right,
			transparent,
			#000 6rem,
			#000 calc(100% - 6rem),
			transparent
		);
		mask-image: linear-gradient(
			to right,
			transparent,
			#000 6rem,
			#000 calc(100% - 6rem),
			transparent
		);
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
		.reveal {
			animation: none;
		}
	}
</style>
