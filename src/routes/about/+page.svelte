<script>
	import { resolve } from '$app/paths';
	import AppStoreBadge from '$lib/components/AppStoreBadge.svelte';

	/**
	 * Every in-app link the page makes, narrow enough for `resolve()` to type-check.
	 * @typedef {'/stories' | '/tutor' | '/lessons' | '/alphabet' | '/sentences' | '/conjugations'
	 *   | '/learn/game' | '/speak' | '/review/all-words' | '/egyptian-arabic' | '/levantine'
	 *   | '/darija' | '/fusha'} Route
	 */
	/** @typedef {{ ar: string; tr: string; en: string }} Word */
	/** @typedef {{ label: string; native: string; note: string; href: Route; words: Word[] }} Dialect */
	/** @typedef {{ title: string; img: string; w: number; h: number; alt: string }} Shot */
	/** @typedef {Shot & { num: string; verb: string; body: string; href?: Route; cta?: string; chat?: boolean }} Step */
	/** @typedef {Shot & { body: string; href?: Route; cta?: string; focus?: string }} Feature */
	/** @typedef {{ t: string; b?: boolean }} QuoteSegment */

	// ── Hero demo: one sentence in all four dialects ──────────────────────────
	// Word order is reading order; the row is laid out right-to-left.
	/** @type {Dialect[]} */
	const dialects = [
		{
			label: 'Egyptian',
			native: 'المصري',
			note: 'About 100 million speakers, and the most widely understood dialect.',
			href: '/egyptian-arabic',
			words: [
				{ ar: 'عايز', tr: "'ayez", en: 'I want' },
				{ ar: 'أتعلّم', tr: "at'allem", en: 'to learn' },
				{ ar: 'عربي', tr: "'arabi", en: 'Arabic' }
			]
		},
		{
			label: 'Levantine',
			native: 'الشامي',
			note: 'About 40 million speakers in Syria, Lebanon, Jordan and Palestine.',
			href: '/levantine',
			words: [
				{ ar: 'بدّي', tr: 'baddi', en: 'I want' },
				{ ar: 'إتعلّم', tr: "et'allam", en: 'to learn' },
				{ ar: 'عربي', tr: "'arabi", en: 'Arabic' }
			]
		},
		{
			label: 'Moroccan',
			native: 'الدارجة',
			note: 'About 30 million speakers in Morocco.',
			href: '/darija',
			words: [
				{ ar: 'بغيت', tr: 'bghit', en: 'I want' },
				{ ar: 'نتعلّم', tr: "nt'allem", en: 'to learn' },
				{ ar: 'العربية', tr: "l'arbiya", en: 'Arabic' }
			]
		},
		{
			label: 'Fusha',
			native: 'الفصحى',
			note: 'Modern Standard Arabic, the shared language of news, books and formal speech.',
			href: '/fusha',
			words: [
				{ ar: 'أريد', tr: 'ureed', en: 'I want' },
				{ ar: 'أن', tr: 'an', en: 'to' },
				{ ar: 'أتعلّم', tr: "ata'allam", en: 'learn' },
				{ ar: 'العربيّة', tr: "al-'arabiyya", en: 'Arabic' }
			]
		}
	];

	const CYCLE_MS = 3600;

	let active = $state(0);
	let autoplay = $state(true);
	let paused = $state(false);
	let inView = $state(false);
	const current = $derived(dialects[active]);

	// On phones the demo sits below the fold, so it only starts cycling once it
	// is on screen, and never under reduced motion. It pauses under the pointer
	// or keyboard focus, and stops for good after one lap or the first click.
	/** @param {HTMLElement} node */
	function cycleWhenVisible(node) {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const observer = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting), {
			threshold: 0.6
		});
		observer.observe(node);
		return { destroy: () => observer.disconnect() };
	}

	$effect(() => {
		if (!autoplay || paused || !inView) return;
		const next = (active + 1) % dialects.length;
		const timer = setTimeout(() => {
			active = next;
			if (next === 0) autoplay = false;
		}, CYCLE_MS);
		return () => clearTimeout(timer);
	});

	/** @param {number} i */
	function pick(i) {
		active = i;
		autoplay = false;
	}

	// ── Screenshot lightbox ───────────────────────────────────────────────────
	/** @type {HTMLDialogElement} */
	let dialog;
	/** @type {Shot | null} */
	let shot = $state(null);

	/** @param {Shot} s */
	function enlarge(s) {
		shot = s;
		dialog.showModal();
	}

	// Rounded-down floors, not live counts: 1,602 accounts and 21,527 saved words
	// in the database on 2026-09-25.
	const stats = [
		{ value: '1,500+', label: 'learners' },
		{ value: '4', label: 'dialects' },
		{ value: 'A1–C2', label: 'lesson levels' }
	];

	/** @type {Step[]} */
	const steps = [
		{
			num: '١',
			verb: 'Read',
			title: 'Stories written for your level',
			body: 'Graded stories in your dialect, with the English and transliteration lined up under every word. Turn either one off as your reading gets stronger.',
			href: '/stories',
			cta: 'Browse stories',
			img: '/images/features-large/stories.png',
			w: 1532,
			h: 534,
			alt: 'A story sentence with the English meaning and transliteration above each Arabic word'
		},
		{
			num: '٢',
			verb: 'Tap',
			title: 'Tap any word you don’t know',
			body: 'See what it means in that sentence, its root, and how the other dialects say it. One more tap saves it.',
			img: '/images/features-large/definition-modal.png',
			w: 701,
			h: 773,
			alt: 'The definition card for صغير, showing its meaning, its root and how it is used in context'
		},
		{
			num: '٣',
			verb: 'Play',
			title: 'Turn new words into quick games',
			body: 'Multiple choice, listening and speaking rounds, from a topic or from your own saved words. You can play without an account; sign in and the words you miss come back for review.',
			href: '/learn/game',
			cta: 'Play a round',
			img: '/images/features-large/game.png',
			w: 649,
			h: 818,
			alt: 'A fill-in-the-blank question in Egyptian Arabic'
		},
		{
			num: '٤',
			verb: 'Talk',
			title: 'Then use them in a real conversation',
			body: 'The AI Tutor role-plays everyday situations in your dialect, like ordering at a café, catching a taxi or asking about prices. It talks back and corrects your grammar as you go.',
			href: '/tutor',
			cta: 'Start a conversation',
			chat: true,
			img: '/images/features-large/tutor.png',
			w: 2376,
			h: 814,
			alt: 'A conversation with the AI Tutor, with each Arabic word glossed in English'
		}
	];

	/** @type {Feature[]} */
	const features = [
		{
			title: 'Structured lessons',
			body: 'Step-by-step lessons from A1 to C2, or create your own around the words you need.',
			href: '/lessons',
			cta: 'Start a lesson',
			img: '/images/features-large/lessons.png',
			w: 637,
			h: 1195,
			alt: 'A lesson path through Greetings, Basics, Nationality and Family'
		},
		{
			title: 'Spaced-repetition review',
			body: 'Saved words come back right before you’d forget them. The ones you struggle with return sooner.',
			img: '/images/features-large/repitition.png',
			w: 1568,
			h: 1228,
			alt: 'A review card for ايوه, meaning yes, with Easy, Medium and Hard buttons'
		},
		{
			title: 'Pronunciation practice',
			body: 'Say a sentence out loud and get instant feedback on how close you were.',
			href: '/speak',
			cta: 'Practice speaking',
			img: '/images/features-large/speak.png',
			w: 1202,
			h: 957,
			alt: 'Speaking practice scoring a spoken Arabic sentence at 100 percent'
		},
		{
			title: 'Alphabet',
			body: 'The 28 letters, their forms and how they connect, with audio and exercises.',
			href: '/alphabet',
			cta: 'Learn the letters',
			img: '/images/features-large/alphabet.png',
			w: 1204,
			h: 1120,
			alt: 'The letter ب with its name, its sound and an example word'
		},
		{
			title: 'Writing practice',
			body: 'Type sentences on a built-in Arabic keyboard, put scrambled words in order, or trace them letter by letter.',
			href: '/sentences',
			cta: 'Practice writing',
			img: '/images/features-large/sentences.png',
			w: 1238,
			h: 868,
			alt: 'Tracing an Arabic sentence on the built-in keyboard'
		},
		{
			title: 'Conjugation drills',
			body: 'Drill verb forms by typing or quiz until they come without thinking.',
			href: '/conjugations',
			cta: 'Drill verbs',
			img: '/images/features-large/verb-conjugations.png',
			w: 841,
			h: 747,
			alt: 'A past-tense conjugation quiz for “I went”'
		},
		{
			title: 'Dialect comparison',
			body: 'See how any word or phrase is said in all four dialects, side by side.',
			img: '/images/features-large/dialect-compare.png',
			w: 787,
			h: 653,
			alt: 'One word compared across Egyptian, Levantine, Moroccan and Fusha'
		},
		{
			title: 'Import your words',
			body: 'Paste a list or upload a CSV. Give the Arabic, the English or both, and the rest is filled in for you.',
			img: '/images/features-large/import.png',
			w: 783,
			h: 1113,
			alt: 'Pasting a word list to import, with Egyptian Arabic selected'
		},
		{
			title: 'Vocabulary table',
			body: 'Every saved word in one place, ready to pull into lessons, stories and practice.',
			href: '/review/all-words',
			cta: 'See your words',
			img: '/images/features-large/all-words.png',
			w: 1305,
			h: 616,
			// Wide enough that a centred crop would cut off the Arabic column.
			focus: 'left top',
			alt: 'A table of saved words with their English, transliteration and review status'
		}
	];

	/** @type {QuoteSegment[][]} */
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
	const [featuredQuote, ...quotes] = testimonials;

	const freePlan = [
		'The alphabet, with audio',
		'Starter vocabulary and quizzes',
		'Speaking practice with feedback',
		'Your own word bank'
	];
	const proPlan = [
		'Every lesson, story and dialect',
		'The AI Tutor',
		'Spaced-repetition review',
		'Unlimited sentence mining',
		'Anki decks for every dialect'
	];

	const faqs = [
		{
			q: 'Which Arabic dialects does it support?',
			a: 'Parallel Arabic currently supports Egyptian Arabic, Levantine Arabic, Moroccan Darija, and Modern Standard Arabic (Fusha). All four are available across stories, vocabulary, lessons, and review.'
		},
		{
			q: 'Which dialect should I learn?',
			a: 'The one spoken by the people you want to talk to. Egyptian is the most widely understood, thanks to Egyptian film and TV. Levantine is spoken in Syria, Lebanon, Jordan and Palestine, Darija in Morocco, and Fusha is the Arabic of news, books and formal writing. You can switch dialects at any time.'
		},
		{
			q: 'Do I need to know any Arabic to get started?',
			a: 'No. Complete beginners can start with the Arabic alphabet lessons, which walk you through reading and writing Arabic script from scratch. Once you have the basics, you can move into vocabulary and stories at your own pace.'
		},
		{
			q: 'How is this different from Duolingo?',
			a: 'Duolingo teaches Modern Standard Arabic through fixed, gamified exercises. Parallel Arabic focuses on spoken dialects and builds stories, lessons and practice around the words you save, so you’re learning vocabulary that matters to you, in the dialect you want to speak.'
		},
		{
			q: 'How much does it cost?',
			a: 'You can start for free, with no card needed. The free plan includes the alphabet, a starter set of vocabulary with quizzes, speaking practice and your own word bank. Pro is $10 a month and unlocks every lesson, story and dialect, the AI Tutor, spaced-repetition review and unlimited sentence mining.'
		},
		{
			q: 'Is there a mobile app?',
			a: 'Yes — Parallel Arabic is on the App Store for iPhone and iPad, free to download. There is no Android app yet, but the site is a Progressive Web App, so on Android and desktop you can install it to your home screen and get the same full-screen experience.'
		}
	];
</script>

{#snippet check()}
	<svg
		class="check"
		viewBox="0 0 20 20"
		fill="none"
		stroke="currentColor"
		stroke-width="2.25"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"><path d="m4.5 10.5 3.5 3.5 7.5-8" /></svg
	>
{/snippet}

{#snippet heading(/** @type {string} */ kicker, /** @type {string} */ title)}
	<p class="kicker">{kicker}</p>
	<h2 class="title">{title}</h2>
{/snippet}

{#snippet quote(/** @type {QuoteSegment[]} */ segments)}
	{#each segments as seg, i (i)}{#if seg.b}<strong class="hl">{seg.t}</strong
			>{:else}{seg.t}{/if}{/each}
{/snippet}

<!--
	The exchange from the tutor screenshot, rebuilt as text: the screenshot is so
	wide that its words shrink to a few pixels in a half-width column. Spans only,
	because it renders inside a button.
-->
{#snippet tutorChat()}
	<span class="chat">
		<span class="chat-scene">Practicing: Introducing yourself</span>
		<span class="bubble bubble--you">
			<span class="bubble-who">You</span>
			<span class="bubble-ar" lang="ar" dir="rtl">انا اسمي شريف</span>
			<span class="bubble-tr">ana ismi Sherif</span>
			<span class="bubble-en">My name is Sherif.</span>
		</span>
		<span class="bubble bubble--tutor">
			<span class="bubble-who">Tutor</span>
			<span class="bubble-ar" lang="ar" dir="rtl">مساء الخير يا شريف! أنا اسمي سارة. تشرفنا!</span>
			<span class="bubble-tr">Masa' el-kheir ya Sherif! Ana ismi Sara. Tasharrafna!</span>
			<span class="bubble-en">Good evening, Sherif! My name is Sara. Nice to meet you!</span>
		</span>
	</span>
{/snippet}

{#snippet startCta(/** @type {string} */ extra)}
	<a href={resolve('/signup')} class="cta {extra}">
		Start learning free <span class="cta-arrow" aria-hidden="true">→</span>
	</a>
{/snippet}

<div class="about">
	<!-- ── Hero ────────────────────────────────────────────────────────────── -->
	<header class="hero">
		<div class="hero-grid mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div>
				<p class="kicker reveal">Egyptian · Levantine · Moroccan · Fusha</p>
				<h1 class="hero-title reveal" style="animation-delay: 60ms;">
					Learn the Arabic people <span class="hl">actually speak.</span>
				</h1>
				<p class="lede reveal" style="animation-delay: 120ms;">
					Parallel Arabic teaches the dialects spoken in Cairo, Beirut and Casablanca, with Modern
					Standard Arabic alongside. Read stories at your level, tap any word you don’t know, and
					practice it until it’s yours.
				</p>

				<div
					class="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
					style="animation-delay: 180ms;"
				>
					{@render startCta('')}
					<AppStoreBadge
						className="justify-center rounded-full border-2 border-tile-600 px-6 py-2.5 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
					/>
				</div>

				<ul class="assurances reveal" style="animation-delay: 240ms;">
					<li>{@render check()}Free to start</li>
					<li>{@render check()}No card needed</li>
					<li>{@render check()}Web, iPhone and iPad</li>
				</ul>
			</div>

			<div class="demo-stack reveal" style="animation-delay: 200ms;">
				<div
					class="demo"
					role="group"
					aria-label="The same sentence in four Arabic dialects"
					style="--cycle: {CYCLE_MS}ms;"
					use:cycleWhenVisible
					onpointerenter={() => (paused = true)}
					onpointerleave={() => (paused = false)}
					onfocusin={() => (paused = true)}
					onfocusout={() => (paused = false)}
				>
					<p class="demo-label">One sentence, four dialects</p>
					<div class="demo-tabs" role="group" aria-label="Dialect">
						{#each dialects as d, i (d.label)}
							<button
								type="button"
								class="demo-tab"
								class:is-active={i === active}
								class:is-timing={i === active && autoplay && !paused && inView}
								aria-pressed={i === active}
								onclick={() => pick(i)}>{d.label}</button
							>
						{/each}
					</div>

					<div class="demo-read" aria-live={autoplay ? 'off' : 'polite'}>
						<p class="demo-en">I want to learn Arabic.</p>
						{#key active}
							<p class="demo-words" dir="rtl" aria-hidden="true">
								{#each current.words as w, i (i)}
									<span class="word" style="--i: {i};">
										<span class="word-tr" dir="ltr">{w.tr}</span>
										<span class="word-en" dir="ltr">{w.en}</span>
										<span class="word-ar" lang="ar">{w.ar}</span>
									</span>
								{/each}
							</p>
							<p class="sr-only">
								In {current.label} Arabic:
								<span lang="ar">{current.words.map((w) => w.ar).join(' ')}</span>
							</p>
							<p class="demo-note">
								<span class="demo-native" lang="ar">{current.native}</span>
								{current.note}
							</p>
						{/key}
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- ── Numbers ─────────────────────────────────────────────────────────── -->
	<section class="stats" aria-label="Parallel Arabic in numbers">
		<!-- Reversed so each value reads above its label while `dt` stays first in the DOM. -->
		<dl class="stats-grid mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			{#each stats as stat (stat.label)}
				<div class="stat">
					<dt>{stat.label}</dt>
					<dd>{stat.value}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<!-- ── Why dialects ────────────────────────────────────────────────────── -->
	<section class="section">
		<div class="why mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="rise">
				{@render heading('Why dialects', 'Fusha is what you read. Dialect is what you hear.')}
				<p class="body mt-5">
					Modern Standard Arabic is the language of news, books and formal speech. Everyday life,
					from family dinners to taxi rides, happens in dialect, and the most common words are often
					completely different.
				</p>
				<p class="body mt-4">
					So Parallel Arabic starts with the dialect you want to speak. Fusha is never far away:
					compare any word across all four dialects in one tap.
				</p>
			</div>

			<figure class="contrast rise">
				<div class="contrast-row">
					<p class="contrast-label">In the textbook <span>· Fusha</span></p>
					<p class="contrast-ar contrast-ar--faded" lang="ar" dir="rtl">ماذا تريد الآن؟</p>
					<p class="contrast-tr">maadha tureed al-aan?</p>
				</div>
				<div class="contrast-row contrast-row--street">
					<p class="contrast-label">In Cairo <span>· Egyptian</span></p>
					<p class="contrast-ar" lang="ar" dir="rtl">عايز إيه دلوقتي؟</p>
					<p class="contrast-tr">'ayez eh delwa'ti?</p>
				</div>
				<figcaption class="contrast-caption">
					Both mean “What do you want now?” <strong class="hl">Not one word is the same.</strong>
				</figcaption>
			</figure>
		</div>
	</section>

	<!-- ── How it works ────────────────────────────────────────────────────── -->
	<section class="section">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="rise max-w-2xl">
				{@render heading('How it works', 'Every word you meet becomes one you can use.')}
				<p class="body mt-5">
					Meet a word in a story, save it with a tap, practice it in a game, then use it in
					conversation with the AI Tutor.
				</p>
			</div>

			<ol class="steps">
				{#each steps as step, i (step.verb)}
					<li class="step rise">
						<div class="step-copy">
							<span class="step-num" aria-hidden="true">{step.num}</span>
							<p class="step-verb">Step {i + 1} · {step.verb}</p>
							<h3 class="step-title">{step.title}</h3>
							<p class="body mt-3">{step.body}</p>
							{#if step.href}
								<a href={resolve(step.href)} class="link mt-5">
									{step.cta} <span aria-hidden="true">→</span>
								</a>
							{/if}
						</div>
						<button
							type="button"
							class="stage"
							onclick={() => enlarge(step)}
							aria-label={`Enlarge screenshot: ${step.alt}`}
						>
							{#if step.chat}
								{@render tutorChat()}
							{:else}
								<img
									src={step.img}
									width={step.w}
									height={step.h}
									alt=""
									loading="lazy"
									decoding="async"
								/>
							{/if}
						</button>
					</li>
				{/each}
			</ol>

			<div class="mid-cta rise">
				<p>Start with a free account. No card needed.</p>
				<div class="mid-cta-actions">
					{@render startCta('')}
					<!-- The games need no account, so they're the lowest-commitment way in. -->
					<a href={resolve('/learn/game')} class="link">Or play a game first</a>
				</div>
			</div>
		</div>
	</section>

	<!-- ── Everything else ─────────────────────────────────────────────────── -->
	<section class="section section--band">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="rise max-w-2xl">
				{@render heading('Also inside', 'One app instead of five.')}
				<p class="body mt-5">
					Lessons, flashcards, graded reading, verb drills and conversation practice usually mean
					five different apps. Here they live side by side, built around the words you save.
				</p>
			</div>

			<ul class="features">
				{#each features as f (f.title)}
					<li class="rise">
						<article class="feature">
							<button
								type="button"
								class="feature-shot"
								onclick={() => enlarge(f)}
								aria-label={`Enlarge screenshot: ${f.alt}`}
							>
								<img
									src={f.img}
									width={f.w}
									height={f.h}
									alt=""
									loading="lazy"
									decoding="async"
									style:object-position={f.focus}
								/>
							</button>
							<div class="feature-body">
								<h3>{f.title}</h3>
								<p>{f.body}</p>
								{#if f.href}
									<a href={resolve(f.href)} class="link mt-auto pt-4">
										{f.cta} <span aria-hidden="true">→</span>
									</a>
								{/if}
							</div>
						</article>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- ── Testimonials ────────────────────────────────────────────────────── -->
	<section class="section">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="rise">{@render heading('From learners', 'In their own words.')}</div>

			<figure class="featured rise">
				<blockquote>{@render quote(featuredQuote)}</blockquote>
				<figcaption>High-school French teacher, Southern California</figcaption>
			</figure>

			<div class="quotes">
				{#each quotes as q, i (i)}
					<figure class="quote rise">
						<blockquote>{@render quote(q)}</blockquote>
					</figure>
				{/each}
			</div>
			<p class="fine-print">Every quote is unedited.</p>
		</div>
	</section>

	<!-- ── Pricing ─────────────────────────────────────────────────────────── -->
	<section class="section">
		<div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
			<div class="centered rise mx-auto max-w-2xl">
				{@render heading('Pricing', 'Start free. Go Pro when you’re ready.')}
			</div>

			<div class="plans">
				<article class="plan rise">
					<h3 class="plan-name">Free</h3>
					<p class="plan-price">$0</p>
					<ul class="plan-list">
						{#each freePlan as item (item)}
							<li>{@render check()}{item}</li>
						{/each}
					</ul>
					{@render startCta('w-full')}
				</article>

				<article class="plan plan--pro rise">
					<h3 class="plan-name">Pro</h3>
					<p class="plan-price">$10<span>/month</span></p>
					<p class="plan-note">Everything in Free, plus:</p>
					<ul class="plan-list">
						{#each proPlan as item (item)}
							<li>{@render check()}{item}</li>
						{/each}
					</ul>
					<p class="plan-note">About the price of a single tutoring lesson.</p>
					<a href={resolve('/pricing')} class="btn-quiet">
						See everything in Pro <span aria-hidden="true">→</span>
					</a>
				</article>
			</div>
		</div>
	</section>

	<!-- ── FAQ ─────────────────────────────────────────────────────────────── -->
	<section class="section">
		<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
			<div class="rise">{@render heading('Questions', 'Before you start')}</div>

			<!-- Native <details> keeps every answer in the server-rendered HTML. -->
			<div class="faqs">
				{#each faqs as faq (faq.q)}
					<details class="faq" name="about-faq">
						<summary>
							<span>{faq.q}</span>
							<span class="faq-icon" aria-hidden="true"></span>
						</summary>
						<p>{faq.a}</p>
					</details>
				{/each}
			</div>
			<p class="fine-print">
				More answers on the <a href={resolve('/faq')} class="link">FAQ page</a>.
			</p>
		</div>
	</section>

	<!-- ── Closing CTA ─────────────────────────────────────────────────────── -->
	<section class="px-4 pb-6 sm:px-6 lg:px-8">
		<div class="finale rise">
			<h2 class="finale-title">Pick a dialect. Start today.</h2>
			<p class="finale-sub">Free to start, and you can switch dialects whenever you like.</p>

			<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
				{@render startCta('cta--light')}
				<AppStoreBadge
					className="justify-center rounded-full border border-white/30 !bg-white/10 px-6 py-2.5 !text-white hover:!bg-white/20 focus-visible:!outline-white"
				/>
			</div>

			<nav class="explore" aria-label="Explore a dialect">
				<span>Or look around first:</span>
				<ul>
					{#each dialects as d (d.label)}
						<li><a href={resolve(d.href)}>{d.label}</a></li>
					{/each}
				</ul>
			</nav>
		</div>
	</section>
</div>

<dialog bind:this={dialog} class="lightbox" aria-label="Screenshot" onclose={() => (shot = null)}>
	<!-- First in the DOM so it takes focus when the dialog opens. -->
	<button type="button" class="lightbox-close" aria-label="Close" onclick={() => dialog.close()}>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg
		>
	</button>
	<button
		type="button"
		class="lightbox-backdrop"
		tabindex="-1"
		aria-label="Close"
		onclick={() => dialog.close()}
	></button>
	{#if shot}
		<figure>
			<img src={shot.img} width={shot.w} height={shot.h} alt={shot.alt} />
			<figcaption>{shot.title}</figcaption>
		</figure>
	{/if}
</dialog>

<style>
	/* ── Tokens ─────────────────────────────────────────────────────────────
	   Everything derives from the theme variables so light, dim and dark all
	   work. --hl is the highlighter stroke; --accent the one saturated colour. */
	.about {
		--accent: var(--brand);
		--hl: hsl(43 100% 60% / 0.55);
		overflow-x: clip;
	}
	:global([color-scheme='dark']) .about,
	:global([color-scheme='dim']) .about {
		--accent: hsl(200 60% 62%);
		--hl: hsl(43 90% 55% / 0.3);
	}

	/* ── Type ──────────────────────────────────────────────────────────────── */
	.kicker {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text2);
	}
	.kicker::before {
		content: '';
		flex-shrink: 0;
		width: 1.75rem;
		height: 2px;
		border-radius: 2px;
		background: var(--accent);
	}
	.centered {
		text-align: center;
	}
	.centered .kicker {
		justify-content: center;
	}

	.title {
		margin-top: 0.9rem;
		font-size: clamp(1.9rem, 1.35rem + 2.2vw, 3rem);
		font-weight: 600;
		line-height: 1.06;
		letter-spacing: -0.03em;
		color: var(--text1);
		text-wrap: balance;
	}

	.body {
		max-width: 38rem;
		font-size: 1.0625rem;
		line-height: 1.65;
		color: var(--text2);
		text-wrap: pretty;
	}

	.hl {
		background-image: linear-gradient(var(--hl), var(--hl));
		background-repeat: no-repeat;
		background-position: 0 88%;
		background-size: 100% 0.32em;
		-webkit-box-decoration-break: clone;
		box-decoration-break: clone;
	}

	.link {
		display: inline-block;
		width: fit-content;
		font-weight: 600;
		color: var(--text1);
		text-decoration: underline;
		text-decoration-color: var(--tile6);
		text-decoration-thickness: 2px;
		text-underline-offset: 5px;
		transition: text-decoration-color 0.2s ease;
	}
	.link:hover {
		text-decoration-color: var(--accent);
	}

	.fine-print {
		margin-top: 1.5rem;
		font-size: 0.875rem;
		color: var(--text2);
	}

	a:focus-visible,
	button:focus-visible,
	summary:focus-visible {
		outline: 2px solid var(--text1);
		outline-offset: 3px;
	}

	/* ── Buttons ───────────────────────────────────────────────────────────
	   The primary action is inverted ink, so it is the highest-contrast thing
	   on the page in every theme. The bottom lip matches the app's tiles. */
	.cta {
		--lip: color-mix(in srgb, var(--text1) 70%, #000);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
		border-radius: 999px;
		padding: 1rem 1.75rem;
		font-size: 1.0625rem;
		font-weight: 600;
		line-height: 1.2;
		background: var(--text1);
		color: var(--tile1);
		box-shadow:
			0 4px 0 var(--lip),
			0 14px 28px -12px color-mix(in srgb, var(--text1) 60%, transparent);
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.18s ease;
	}
	.cta:hover {
		transform: translateY(-2px);
		box-shadow:
			0 6px 0 var(--lip),
			0 20px 32px -12px color-mix(in srgb, var(--text1) 60%, transparent);
	}
	.cta:active {
		transform: translateY(3px);
		box-shadow: 0 1px 0 var(--lip);
	}
	.cta-arrow {
		transition: transform 0.2s ease;
	}
	.cta:hover .cta-arrow {
		transform: translateX(3px);
	}
	.cta--light {
		--lip: hsl(200 35% 70%);
		background: #fff;
		color: var(--brand);
		box-shadow:
			0 4px 0 var(--lip),
			0 18px 36px -14px rgb(0 0 0 / 0.45);
	}
	.cta--light:focus-visible {
		outline-color: #fff;
	}

	.btn-quiet {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		border-radius: 999px;
		border: 2px solid var(--tile6);
		padding: 0.9rem 1.5rem;
		font-weight: 600;
		color: var(--text1);
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease;
	}
	.btn-quiet:hover {
		border-color: var(--text1);
		background: color-mix(in srgb, var(--text1) 6%, transparent);
	}

	.check {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		color: var(--accent);
	}

	/* ── Hero ──────────────────────────────────────────────────────────────── */
	.hero {
		position: relative;
		isolation: isolate;
		overflow: hidden;
	}
	/* Ruled lines, like an exercise book. Parallel lines, literally. */
	.hero-lines {
		position: absolute;
		inset: 0;
		z-index: -1;
		background-image: repeating-linear-gradient(
			to bottom,
			transparent 0 calc(2.75rem - 1px),
			var(--tile4) calc(2.75rem - 1px) 2.75rem
		);
		-webkit-mask-image: radial-gradient(ellipse 75% 65% at 25% 30%, #000 10%, transparent 70%);
		mask-image: radial-gradient(ellipse 75% 65% at 25% 30%, #000 10%, transparent 70%);
		opacity: 0.6;
	}
	.hero-glyph {
		position: absolute;
		right: -2rem;
		bottom: -6rem;
		z-index: -1;
		font-family: 'Rakkas', serif;
		font-size: clamp(14rem, 30vw, 30rem);
		line-height: 1;
		color: var(--text1);
		opacity: 0.04;
		pointer-events: none;
		user-select: none;
	}
	.hero-grid {
		display: grid;
		align-items: center;
		gap: 3.5rem;
		padding-top: 2.5rem;
		padding-bottom: 4.5rem;
	}
	@media (min-width: 640px) {
		.hero-grid {
			padding-top: 4rem;
			padding-bottom: 5.5rem;
		}
	}
	/* Two columns only at xl: below that the desktop sidebar leaves too little room. */
	@media (min-width: 1280px) {
		.hero-grid {
			grid-template-columns: 1.05fr 1fr;
			gap: 3.5rem;
			padding-top: 5rem;
			padding-bottom: 6.5rem;
		}
	}

	.hero-title {
		margin-top: 1.1rem;
		font-size: clamp(2.5rem, 1.6rem + 3.6vw, 4.25rem);
		font-weight: 600;
		line-height: 1.02;
		color: var(--text1);
		text-wrap: balance;
	}
	.hero-title .hl {
		animation: ink-in 0.9s 0.5s cubic-bezier(0.65, 0, 0.35, 1) backwards;
	}
	@keyframes ink-in {
		from {
			background-size: 0% 0.32em;
		}
	}

	.lede {
		margin-top: 1.5rem;
		max-width: 36rem;
		font-size: clamp(1.0625rem, 1rem + 0.35vw, 1.25rem);
		line-height: 1.6;
		color: var(--text2);
		text-wrap: pretty;
	}

	.assurances {
		margin-top: 1.25rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		font-size: 0.875rem;
		color: var(--text2);
	}
	.assurances li {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	/* ── Hero demo ─────────────────────────────────────────────────────────
	   Two offset cards behind the demo hint at the other dialects. They live on
	   the wrapper so they paint beneath the card, not over its background. */
	.demo-stack {
		position: relative;
		isolation: isolate;
		width: 100%;
		max-width: 36rem;
	}
	.demo-stack::before,
	.demo-stack::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 1.5rem;
		border: 1px solid var(--tile5);
	}
	.demo-stack::before {
		z-index: -1;
		background: var(--tile4);
		transform: translateY(0.75rem) scale(0.955);
	}
	.demo-stack::after {
		z-index: -2;
		background: var(--tile5);
		transform: translateY(1.5rem) scale(0.91);
	}

	.demo {
		container-type: inline-size;
		border-radius: 1.5rem;
		border: 1px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem;
		box-shadow: 0 30px 60px -30px hsl(200 40% 10% / 0.45);
	}
	@media (min-width: 640px) {
		.demo {
			padding: 1.25rem;
		}
	}
	.demo-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text2);
	}

	.demo-tabs {
		margin-top: 0.6rem;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.25rem;
		border-radius: 1rem;
		background: var(--tile4);
		padding: 0.25rem;
	}
	.demo-tab {
		position: relative;
		overflow: hidden;
		border-radius: 0.8rem;
		padding: 0.55rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			color 0.2s ease;
	}
	.demo-tab:hover {
		color: var(--text1);
		background: color-mix(in srgb, var(--tile6) 40%, transparent);
	}
	.demo-tab.is-active {
		background: var(--text1);
		color: var(--tile1);
	}
	/* Countdown to the next dialect while the demo is cycling on its own. */
	.demo-tab.is-timing::after {
		content: '';
		position: absolute;
		right: 20%;
		bottom: 0.3rem;
		left: 20%;
		height: 2px;
		border-radius: 2px;
		background: color-mix(in srgb, var(--tile1) 60%, transparent);
		transform-origin: left;
		animation: countdown var(--cycle) linear both;
	}
	@keyframes countdown {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}
	@container (min-width: 25rem) {
		.demo-tabs {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			border-radius: 999px;
		}
		.demo-tab {
			border-radius: 999px;
		}
	}

	.demo-read {
		margin-top: 1rem;
		border-radius: 1rem;
		background: var(--tile2);
		padding: 1.5rem 0.75rem 1.1rem;
		text-align: center;
	}
	.demo-en {
		font-size: 1.0625rem;
		color: var(--text2);
	}
	.demo-words {
		margin-top: 1.1rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem clamp(0.9rem, 4cqi, 1.75rem);
	}
	.word {
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: word-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
		animation-delay: calc(var(--i) * 80ms);
	}
	.word-tr {
		font-size: 0.8125rem;
		font-style: italic;
		color: var(--text2);
	}
	.word-en {
		margin-top: 0.1rem;
		font-size: 0.875rem;
		color: var(--text2);
	}
	.word-ar {
		margin-top: 0.15rem;
		font-size: clamp(1.75rem, 8cqi, 2.9rem);
		font-weight: 600;
		line-height: 1.35;
		color: var(--text1);
	}
	@keyframes word-in {
		from {
			opacity: 0;
			transform: translateY(10px);
			filter: blur(4px);
		}
	}
	/* Room for the longest note, so switching dialects doesn't nudge the page. */
	.demo-note {
		margin-top: 1.25rem;
		min-height: 3.6rem;
		border-top: 1px solid var(--tile4);
		padding: 0.9rem 0.5rem 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text2);
		text-wrap: pretty;
		animation: fade-in 0.4s ease backwards;
	}
	@container (max-width: 24rem) {
		.demo-note {
			min-height: 4.9rem;
		}
	}
	.demo-native {
		margin-inline-end: 0.35rem;
		font-weight: 600;
		color: var(--text1);
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	/* ── Numbers ───────────────────────────────────────────────────────────── */
	.stats {
		border-block: 1px solid var(--tile4);
		background: var(--tile3);
	}
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(1, minmax(0, 1fr));
	}
	.stat {
		display: flex;
		flex-direction: column-reverse;
		gap: 0.35rem;
		padding: 1.5rem 0.25rem;
	}
	.stat dd {
		font-size: clamp(1.75rem, 1.3rem + 1.6vw, 2.5rem);
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--text1);
		font-variant-numeric: tabular-nums;
	}
	.stat dt {
		font-size: 0.875rem;
		color: var(--text2);
	}
	@media (max-width: 639px) {
		.stat:nth-child(n + 3) {
			border-top: 1px solid var(--tile4);
		}
	}
	@media (min-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
		.stat {
			padding-block: 1.75rem;
		}
		.stat + .stat {
			border-left: 1px solid var(--tile4);
			padding-left: 1.5rem;
		}
	}

	/* ── Sections ──────────────────────────────────────────────────────────── */
	.section {
		padding-block: clamp(4rem, 3rem + 5vw, 7rem);
	}
	.section--band {
		border-block: 1px solid var(--tile4);
		background: var(--tile3);
	}

	/* ── Why dialects ──────────────────────────────────────────────────────── */
	.why {
		display: grid;
		align-items: center;
		gap: 2.5rem;
	}
	@media (min-width: 1280px) {
		.why {
			grid-template-columns: 1fr 1fr;
			gap: 4rem;
		}
	}
	.contrast {
		overflow: hidden;
		border-radius: 1.5rem;
		border: 1px solid var(--tile5);
		background: var(--tile3);
	}
	.contrast-row {
		padding: 1.25rem 1.5rem 1.4rem;
	}
	.contrast-row--street {
		border-top: 1px dashed var(--tile5);
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}
	.contrast-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text2);
	}
	.contrast-label span {
		font-weight: 400;
	}
	.contrast-ar {
		margin-top: 0.4rem;
		font-size: clamp(2rem, 1.4rem + 2.6vw, 3.25rem);
		font-weight: 600;
		line-height: 1.3;
		color: var(--text1);
	}
	.contrast-ar--faded {
		font-weight: 400;
		color: var(--text2);
	}
	.contrast-tr {
		margin-top: 0.1rem;
		text-align: right;
		font-style: italic;
		color: var(--text2);
	}
	.contrast-caption {
		border-top: 1px solid var(--tile5);
		padding: 1rem 1.5rem;
		font-size: 0.9375rem;
		line-height: 1.55;
		color: var(--text1);
	}
	.contrast-caption strong {
		font-weight: 600;
	}

	/* ── How it works ──────────────────────────────────────────────────────── */
	.steps {
		margin-top: 3.5rem;
		display: grid;
		gap: clamp(4rem, 3rem + 4vw, 6.5rem);
	}
	.step {
		display: grid;
		align-items: center;
		gap: 2rem;
	}
	@media (min-width: 1280px) {
		.step {
			grid-template-columns: 5fr 7fr;
			gap: 4rem;
		}
		.step:nth-child(even) {
			grid-template-columns: 7fr 5fr;
		}
		.step:nth-child(even) .step-copy {
			order: 2;
		}
	}
	.step-num {
		display: block;
		font-family: 'Rakkas', serif;
		font-size: 4.5rem;
		line-height: 1;
		color: var(--accent);
	}
	.step-verb {
		margin-top: 0.9rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text2);
	}
	.step-title {
		margin-top: 0.35rem;
		font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2.1rem);
		font-weight: 600;
		line-height: 1.12;
		letter-spacing: -0.025em;
		color: var(--text1);
		text-wrap: balance;
	}

	/* A soft stage for each screenshot, standing in for the heavy framed PNGs. */
	.stage {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 15rem;
		overflow: hidden;
		border-radius: 1.75rem;
		border: 1px solid var(--tile5);
		background: radial-gradient(
				90% 80% at 15% 10%,
				color-mix(in srgb, var(--tile1) 55%, transparent),
				transparent 60%
			),
			linear-gradient(155deg, var(--tile3), var(--tile5));
		padding: clamp(1.25rem, 4vw, 3rem);
		cursor: zoom-in;
	}
	.stage img {
		width: auto;
		height: auto;
		max-width: 100%;
		max-height: 25rem;
		border-radius: 0.9rem;
		box-shadow:
			0 1px 2px hsl(200 30% 10% / 0.1),
			0 24px 48px -18px hsl(200 40% 8% / 0.45);
		transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.stage:hover img {
		transform: translateY(-4px) scale(1.012);
	}

	/* ── Tutor chat preview ─────────────────────────────────────────────────── */
	.chat {
		display: grid;
		gap: 0.75rem;
		width: 100%;
		max-width: 30rem;
		transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.stage:hover .chat {
		transform: translateY(-4px);
	}
	.chat-scene {
		justify-self: center;
		border-radius: 999px;
		background: var(--tile4);
		padding: 0.3rem 0.85rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text2);
	}
	.bubble {
		display: grid;
		max-width: 90%;
		border-radius: 1.25rem;
		padding: 0.75rem 1rem 0.85rem;
		box-shadow:
			0 1px 2px hsl(200 30% 10% / 0.1),
			0 16px 32px -18px hsl(200 40% 8% / 0.45);
	}
	.bubble--you {
		justify-self: end;
		border-bottom-right-radius: 0.35rem;
		background: var(--text1);
		color: var(--tile1);
		text-align: right;
	}
	.bubble--tutor {
		justify-self: start;
		border-bottom-left-radius: 0.35rem;
		background: var(--tile2);
		color: var(--text1);
		text-align: left;
	}
	.bubble-who {
		font-size: 0.75rem;
		font-weight: 600;
		opacity: 0.7;
	}
	.bubble-ar {
		margin-top: 0.15rem;
		font-size: clamp(1.25rem, 1rem + 1vw, 1.6rem);
		font-weight: 600;
		line-height: 1.5;
		text-align: right;
	}
	.bubble-tr {
		font-size: 0.875rem;
		font-style: italic;
		opacity: 0.8;
	}
	.bubble-en {
		margin-top: 0.1rem;
		font-size: 0.875rem;
		opacity: 0.8;
	}

	.mid-cta {
		margin-top: clamp(4rem, 3rem + 4vw, 6rem);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		border-radius: 1.5rem;
		border: 1px dashed var(--tile6);
		padding: 2rem 1.5rem;
		text-align: center;
	}
	.mid-cta p {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text1);
	}
	.mid-cta-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
	@media (min-width: 640px) {
		.mid-cta {
			flex-direction: row;
			justify-content: space-between;
			padding: 1.5rem 1.5rem 1.5rem 2rem;
			text-align: left;
		}
	}
	/* Side by side only when the headline and both actions fit on one row. */
	@media (min-width: 1024px) {
		.mid-cta-actions {
			flex-direction: row;
			gap: 1.5rem;
		}
	}

	/* ── Everything else ───────────────────────────────────────────────────── */
	.features {
		margin-top: 3rem;
		display: grid;
		gap: 1rem;
	}
	@media (min-width: 640px) {
		.features {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.25rem;
		}
	}
	@media (min-width: 1280px) {
		.features {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	.features li {
		display: flex;
	}
	.feature {
		display: flex;
		flex: 1;
		flex-direction: column;
		overflow: hidden;
		border-radius: 1.25rem;
		border: 1px solid var(--tile5);
		background: var(--tile2);
		transition:
			transform 0.25s ease,
			border-color 0.25s ease,
			box-shadow 0.25s ease;
	}
	.feature:hover {
		transform: translateY(-3px);
		border-color: var(--tile6);
		box-shadow: 0 18px 36px -20px hsl(200 40% 10% / 0.4);
	}
	.feature-shot {
		position: relative;
		display: block;
		aspect-ratio: 16 / 10;
		overflow: hidden;
		border-bottom: 1px solid var(--tile5);
		background: var(--tile4);
		cursor: zoom-in;
	}
	.feature-shot img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center top;
		transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.feature:hover .feature-shot img {
		transform: scale(1.04);
	}
	.feature-body {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 1.1rem 1.25rem 1.3rem;
	}
	.feature-body h3 {
		font-size: 1.0625rem;
		font-weight: 600;
		color: var(--text1);
	}
	.feature-body p {
		margin-top: 0.35rem;
		font-size: 0.9375rem;
		line-height: 1.55;
		color: var(--text2);
	}

	/* ── Testimonials ──────────────────────────────────────────────────────── */
	.featured {
		margin-top: 2.5rem;
		max-width: 56rem;
	}
	.featured blockquote {
		font-size: clamp(1.35rem, 1.05rem + 1.3vw, 2.1rem);
		line-height: 1.35;
		letter-spacing: -0.015em;
		color: var(--text1);
		text-wrap: pretty;
	}
	.featured blockquote::before {
		content: '“';
		display: block;
		height: 2.25rem;
		font-family: 'Rakkas', serif;
		font-size: 5rem;
		line-height: 1;
		color: var(--accent);
	}
	.featured figcaption {
		margin-top: 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.65rem;
		font-size: 0.9375rem;
		color: var(--text2);
	}
	.featured figcaption::before {
		content: '';
		width: 1.75rem;
		height: 2px;
		border-radius: 2px;
		background: var(--tile6);
	}
	.featured strong,
	.quote strong {
		font-weight: 600;
	}
	.quotes {
		margin-top: 3rem;
		columns: 1;
		column-gap: 1rem;
	}
	@media (min-width: 640px) {
		.quotes {
			columns: 2;
		}
	}
	@media (min-width: 1280px) {
		.quotes {
			columns: 3;
		}
	}
	.quote {
		margin-bottom: 1rem;
		break-inside: avoid;
		border-radius: 1.1rem;
		border: 1px solid var(--tile5);
		background: var(--tile3);
		padding: 1.25rem 1.35rem;
		font-size: 0.975rem;
		line-height: 1.6;
		color: var(--text1);
	}

	/* ── Pricing ───────────────────────────────────────────────────────────── */
	.plans {
		margin-top: 3rem;
		display: grid;
		gap: 1rem;
	}
	@media (min-width: 768px) {
		.plans {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.25rem;
		}
	}
	.plan {
		display: flex;
		flex-direction: column;
		border-radius: 1.5rem;
		border: 1px solid var(--tile5);
		background: var(--tile3);
		padding: 1.75rem;
	}
	.plan--pro {
		border: 2px solid var(--text1);
		background: linear-gradient(160deg, var(--tile3), var(--tile4));
	}
	.plan-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text2);
	}
	.plan-price {
		margin-top: 0.5rem;
		font-size: 3rem;
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.04em;
		color: var(--text1);
	}
	.plan-price span {
		margin-left: 0.25rem;
		font-size: 1rem;
		font-weight: 400;
		letter-spacing: 0;
		color: var(--text2);
	}
	.plan-note {
		margin-top: 1.25rem;
		font-size: 0.9375rem;
		color: var(--text2);
	}
	.plan-list {
		margin-block: 1.25rem 1.75rem;
		display: grid;
		gap: 0.6rem;
		color: var(--text1);
	}
	.plan-note + .plan-list {
		margin-top: 0.75rem;
	}
	.plan-list + .plan-note {
		margin-top: auto;
		margin-bottom: 1rem;
	}
	.plan-list li {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
	}
	.plan-list .check {
		transform: translateY(0.15rem);
	}
	.plan .cta {
		margin-top: auto;
	}

	/* ── FAQ ───────────────────────────────────────────────────────────────── */
	.faqs {
		margin-top: 2rem;
		border-top: 1px solid var(--tile5);
	}
	.faq {
		border-bottom: 1px solid var(--tile5);
	}
	.faq summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.25rem 0.25rem;
		font-size: 1.0625rem;
		font-weight: 600;
		color: var(--text1);
		list-style: none;
		cursor: pointer;
	}
	.faq summary::-webkit-details-marker {
		display: none;
	}
	.faq-icon {
		position: relative;
		flex-shrink: 0;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 999px;
		border: 1.5px solid var(--tile6);
		transition:
			transform 0.25s ease,
			background-color 0.2s ease;
	}
	.faq-icon::before,
	.faq-icon::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0.7rem;
		height: 1.5px;
		background: var(--text2);
		transform: translate(-50%, -50%);
	}
	.faq-icon::after {
		transform: translate(-50%, -50%) rotate(90deg);
	}
	.faq[open] .faq-icon {
		transform: rotate(45deg);
		background: var(--tile4);
	}
	.faq p {
		max-width: 42rem;
		padding: 0 0.25rem 1.4rem;
		line-height: 1.65;
		color: var(--text2);
	}

	/* ── Closing CTA ───────────────────────────────────────────────────────
	   Always the brand blue, in every theme — the one saturated block on the
	   page, reserved for the last ask. */
	.finale {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		max-width: 72rem;
		margin-inline: auto;
		border-radius: 2rem;
		background: var(--brand);
		padding: clamp(3.5rem, 2.5rem + 5vw, 6.5rem) 1.5rem;
		text-align: center;
		color: #fff;
	}
	.finale-lines {
		position: absolute;
		inset: 0;
		z-index: -1;
		background-image: repeating-linear-gradient(
			to bottom,
			transparent 0 calc(2.75rem - 1px),
			rgb(255 255 255 / 0.08) calc(2.75rem - 1px) 2.75rem
		);
		-webkit-mask-image: radial-gradient(ellipse at 50% 40%, #000 20%, transparent 75%);
		mask-image: radial-gradient(ellipse at 50% 40%, #000 20%, transparent 75%);
	}
	.yalla {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
	}
	.yalla-tr {
		font-size: 0.95rem;
		font-style: italic;
		color: rgb(255 255 255 / 0.7);
	}
	.yalla-en {
		font-size: 0.95rem;
		color: rgb(255 255 255 / 0.85);
	}
	.yalla-ar {
		margin-top: 0.25rem;
		font-family: 'Rakkas', serif;
		font-size: clamp(4.5rem, 3rem + 7vw, 8.5rem);
		line-height: 1.1;
	}
	.finale-title {
		margin-top: 1.25rem;
		font-size: clamp(2rem, 1.4rem + 2.8vw, 3.5rem);
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.035em;
		text-wrap: balance;
	}
	.finale-sub {
		margin-top: 1rem;
		font-size: 1.125rem;
		color: rgb(255 255 255 / 0.8);
	}
	.explore {
		margin-top: 2.5rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.6rem 1rem;
		font-size: 0.9375rem;
		color: rgb(255 255 255 / 0.75);
	}
	.explore ul {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
	}
	.explore a {
		display: inline-block;
		border-radius: 999px;
		border: 1px solid rgb(255 255 255 / 0.3);
		padding: 0.35rem 0.9rem;
		color: #fff;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease;
	}
	.explore a:hover {
		border-color: rgb(255 255 255 / 0.6);
		background: rgb(255 255 255 / 0.12);
	}
	.explore a:focus-visible {
		outline-color: #fff;
	}

	/* ── Lightbox ──────────────────────────────────────────────────────────── */
	.lightbox {
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		overflow: hidden;
		border: 0;
		background: transparent;
		padding: 0;
	}
	.lightbox[open] {
		display: grid;
		place-items: center;
	}
	.lightbox::backdrop {
		background: rgb(6 12 16 / 0.86);
		-webkit-backdrop-filter: blur(4px);
		backdrop-filter: blur(4px);
	}
	:global(html:has(dialog.lightbox[open])) {
		overflow: hidden;
	}
	.lightbox-backdrop {
		position: absolute;
		inset: 0;
		cursor: zoom-out;
	}
	.lightbox-close {
		position: absolute;
		top: max(1rem, env(safe-area-inset-top));
		right: 1rem;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 999px;
		border: 1px solid rgb(255 255 255 / 0.25);
		background: rgb(255 255 255 / 0.12);
		color: #fff;
		transition: background-color 0.2s ease;
	}
	.lightbox-close:hover {
		background: rgb(255 255 255 / 0.22);
	}
	.lightbox-close:focus-visible {
		outline-color: #fff;
	}
	.lightbox-close svg {
		width: 1.25rem;
		height: 1.25rem;
	}
	/* The figure lets clicks through to the backdrop button; only the image catches them. */
	.lightbox figure {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		pointer-events: none;
	}
	.lightbox img {
		width: auto;
		height: auto;
		max-width: min(calc(100vw - 2rem), 80rem);
		max-height: 84dvh;
		border-radius: 1rem;
		box-shadow: 0 40px 80px -20px rgb(0 0 0 / 0.6);
		pointer-events: auto;
		animation: zoom-in 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.lightbox figcaption {
		font-size: 0.875rem;
		font-weight: 600;
		color: rgb(255 255 255 / 0.9);
	}
	@keyframes zoom-in {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
	}

	/* ── Motion ────────────────────────────────────────────────────────────
	   The hero animates on load. Everything below rises as it scrolls into
	   view, where scroll-driven animations are supported; elsewhere it simply
	   appears. The global reduced-motion rule in app.css covers the rest. */
	.reveal {
		animation: reveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}
	@keyframes reveal {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
	}
	@supports (animation-timeline: view()) {
		@media (prefers-reduced-motion: no-preference) {
			.rise {
				animation: rise linear both;
				animation-timeline: view();
				animation-range: entry 0% entry 9rem;
			}
		}
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(1.75rem);
		}
	}
</style>
