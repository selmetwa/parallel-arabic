<script lang="ts">
	import { letters } from '$lib/constants/alphabet';
	import {
		egyptianLetters,
		articulationGroups,
		sixKickingLetters,
		egyptianNotes,
		longVowels,
		specialShapes,
		hamzaForms,
		type Articulation
	} from '$lib/constants/egyptian-alphabet';
	import cn from 'classnames';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { goto, replaceState } from '$app/navigation';
	import { page as appState } from '$app/state';
	import { resolve } from '$app/paths';
	import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
	import ListeningExercise from './components/ListeningExercise.svelte';
	import WritingExercise from './components/WritingExercise.svelte';
	import SpeakingExercise from './components/SpeakingExercise.svelte';
	import { practiceLetters, practiceWords } from './components/practice-data';

	const totalPages = 5;

	// --- URL-synced state so a refresh keeps your place ---
	// NB: query params can't be read at render time on a prerendered page, so we
	// read them client-side in onMount and only start writing the URL afterwards.
	function clampInt(raw: string | null, min: number, max: number, fallback: number) {
		const n = raw === null ? NaN : parseInt(raw, 10);
		if (Number.isNaN(n)) return fallback;
		return Math.min(max, Math.max(min, n));
	}

	let hydrated = $state(false);
	let page = $state(0);

	const formSlots = [
		{ key: 'isolated', label: 'Isolated', context: 'stands alone' },
		{ key: 'start', label: 'Initial', context: 'starts a word' },
		{ key: 'middle', label: 'Medial', context: 'between letters' },
		{ key: 'end', label: 'Final', context: 'ends a word' }
	] as const;

	type FormKey = (typeof formSlots)[number]['key'];

	// Merge positional forms (from alphabet.ts) with the Egyptian-dialect fields by key.
	const lettersByKey = new Map(letters.map((l) => [l.key, l]));
	const mergedLetters = egyptianLetters.map((e) => {
		const base = lettersByKey.get(e.key)!;
		return { ...base, ...e };
	});
	type MergedLetter = (typeof mergedLetters)[number];

	function formValue(letter: MergedLetter, key: FormKey) {
		return letter[key];
	}

	function hasTwoForms(letter: MergedLetter) {
		return !letter.start || !letter.middle;
	}

	function hasEgyptianDistinction(letter: MergedLetter) {
		return letter.englishSound !== letter.egyptianSound;
	}

	function playAudio(letter: string) {
		const audio = new Audio(`/letters/audios/${letter}.mp3`);
		audio.play();
	}

	// Lesson 1 presentation: immersive single-card deck vs. the full grid.
	let lesson1View = $state<'cards' | 'all'>('cards');
	let cardIndex = $state(0);
	let cardDirection = $state(1);
	let pointerStartX = $state<number | null>(null);
	const currentLetter = $derived(mergedLetters[cardIndex]);

	function nextCard() {
		if (cardIndex < mergedLetters.length - 1) {
			cardDirection = 1;
			cardIndex += 1;
		}
	}

	function prevCard() {
		if (cardIndex > 0) {
			cardDirection = -1;
			cardIndex -= 1;
		}
	}

	function onCardPointerDown(event: PointerEvent) {
		pointerStartX = event.clientX;
	}

	function onCardPointerUp(event: PointerEvent) {
		if (pointerStartX === null) return;
		const dx = event.clientX - pointerStartX;
		pointerStartX = null;
		if (dx < -50) nextCard();
		else if (dx > 50) prevCard();
	}

	function onLesson1Keydown(event: KeyboardEvent) {
		if (page !== 0 || lesson1View !== 'cards') return;
		if (event.key === 'ArrowRight') nextCard();
		else if (event.key === 'ArrowLeft') prevCard();
	}

	let selectedArticulation = $state<Articulation>('throat');
	const selectedGroup = $derived(
		articulationGroups.find((g) => g.id === selectedArticulation) ?? articulationGroups[0]
	);

	// Restore place from the URL once, client-side (avoids prerender + hydration issues).
	onMount(() => {
		const p = appState.url.searchParams;
		page = clampInt(p.get('lesson'), 1, totalPages, 1) - 1;
		lesson1View = p.get('view') === 'all' ? 'all' : 'cards';
		cardIndex = clampInt(p.get('card'), 1, mergedLetters.length, 1) - 1;
		const group = p.get('group');
		if (articulationGroups.some((g) => g.id === group)) {
			selectedArticulation = group as Articulation;
		}
		hydrated = true;
	});

	// Persist the current place in the URL via shallow routing (no reload, no scroll jump).
	$effect(() => {
		if (!hydrated) return;
		const sp = new URLSearchParams();
		if (page > 0) sp.set('lesson', String(page + 1));
		if (page === 0) {
			if (lesson1View === 'all') sp.set('view', 'all');
			else if (cardIndex > 0) sp.set('card', String(cardIndex + 1));
		}
		if (page === 1 && selectedArticulation !== 'throat') sp.set('group', selectedArticulation);

		const next = sp.toString();
		const current = appState.url.search.replace(/^\?/, '');
		if (next !== current) {
			const url = new URL(appState.url);
			url.search = next;
			replaceState(url, {});
		}
	});

	const sixKickingGlyphs = $derived(
		sixKickingLetters.map((key) => lettersByKey.get(key)!).filter(Boolean)
	);

	function nextPage() {
		if (page === totalPages - 1) {
			goto(resolve('/alphabet'));
			return;
		}
		page += 1;
	}

	function previousPage() {
		page -= 1;
	}
</script>

<svelte:window onkeydown={onLesson1Keydown} />

{#snippet dialectAudio(msaText: string, egyptianText?: string | null)}
	<span class="inline-flex flex-wrap items-center gap-1.5 align-middle">
		<span
			class="inline-flex items-center gap-1 rounded-full border border-tile-500 bg-tile-200 py-0.5 pl-1 pr-2"
		>
			<InlineAudioButton text={msaText} dialect="fusha" />
			<span class="text-[0.6rem] font-semibold uppercase tracking-wide text-text-200">MSA</span>
		</span>
		{#if egyptianText}
			<span
				class="inline-flex items-center gap-1 rounded-full border border-green-600/40 bg-green-500/10 py-0.5 pl-1 pr-2"
			>
				<InlineAudioButton text={egyptianText} dialect="egyptian-arabic" />
				<span class="text-[0.6rem] font-semibold uppercase tracking-wide text-green-700">EG</span>
			</span>
		{/if}
	</span>
{/snippet}

<section class="min-h-screen bg-tile-200">
	<!-- Header with Navigation -->
	<header class="sticky top-0 z-10 border-b border-tile-500 bg-tile-200">
		<div class="mx-auto max-w-7xl px-3 py-4 sm:px-8">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2">
						{#each Array(totalPages) as _, i (i)}
							<button
								onclick={() => (page = i)}
								class={cn(
									'h-3 w-3 rounded-full transition-all duration-300',
									page === i
										? 'scale-110 bg-text-300'
										: 'border border-tile-600 bg-tile-500 hover:bg-tile-400'
								)}
								aria-label="Go to lesson {i + 1}"
							></button>
						{/each}
					</div>
					<span class="hidden text-sm text-text-200 sm:block">
						Lesson {page + 1} of {totalPages}
					</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<div class="py-8 sm:py-2">
		<div class="mx-auto px-3 sm:px-8">
			{#if page === 0}
				<!-- Lesson 1: The 28 letters, Egyptian sounds -->
				<div class="mb-2">
					<div class="mb-2 max-w-3xl">
						<div
							class="mb-3 inline-flex items-center gap-2 rounded-full border border-tile-500 bg-tile-400 px-3 py-1.5 text-xs text-text-200"
						>
							<span>Lesson 1</span>
						</div>
						<h1 class="mb-3 text-2xl font-bold leading-tight text-text-300 sm:text-3xl">
							The 28 letters
						</h1>

					</div>

					<div class="mb-4 flex justify-end">
						<button
							type="button"
							onclick={() => (lesson1View = lesson1View === 'cards' ? 'all' : 'cards')}
							class="flex items-center gap-2 rounded-full border border-tile-500 bg-tile-400 px-4 py-2 text-sm font-semibold text-text-300 transition-colors hover:bg-tile-500 active:scale-95"
						>
							{#if lesson1View === 'cards'}
								<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" />
								</svg>
								<span>View all</span>
							{:else}
								<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path d="M5 3h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
								</svg>
								<span>Card view</span>
							{/if}
						</button>
					</div>

					{#if lesson1View === 'all'}
						<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
							{#each mergedLetters as letter (letter.key)}
								<div class="rounded-xl border border-tile-500 bg-tile-300 p-4 shadow-sm">
									<div class="flex items-stretch gap-4">
										<button
											onclick={() => playAudio(letter.key)}
											aria-label={`Play pronunciation for ${letter.letterName}`}
											class="group relative flex aspect-square w-20 flex-none cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-tile-500 bg-tile-200 text-4xl text-text-300 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-text-200 hover:bg-tile-400 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 active:scale-95"
										>
											<span class="relative z-10 text-4xl">{letter.isolated}</span>
											<div
												class="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-green-400 opacity-0 transition-opacity group-hover:opacity-100"
											></div>
										</button>

										<div class="min-w-0 flex-1">
											<div class="mb-1 flex flex-wrap items-center gap-2">
												<span class="font-semibold text-text-300">{letter.letterName}</span>
												<!-- <span class="text-sm text-text-200">· {letter.franco}</span> -->
												{#if hasEgyptianDistinction(letter)}
													<span
														class="rounded-full border border-green-600/40 bg-green-500/15 px-2 py-0.5 text-[0.65rem] font-semibold text-green-700"
													>
														Egyptian
													</span>
												{/if}
											</div>

											<div
												class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-200"
											>
												<span
													>English: <span class="font-medium text-text-300"
														>{letter.englishSound}</span
													></span
												>
												{#if hasEgyptianDistinction(letter)}
													<span class="text-green-700">
														Egyptian: <span class="font-medium">{letter.egyptianSound}</span>
													</span>
												{/if}
											</div>

											<p class="text-sm text-text-300">
												<span class="text-lg" dir="rtl">{letter.exampleArabic}</span>
												<span class="text-text-200"
													>— {letter.exampleFranco} ({letter.meaning})</span
												>
											</p>
											<div class="mt-1.5">
												{@render dialectAudio(
													letter.exampleArabic,
													hasEgyptianDistinction(letter)
														? (letter.exampleArabicEgyptian ?? letter.exampleArabic)
														: null
												)}
											</div>
											<p class="mt-1 text-xs italic text-text-200">{letter.notes}</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<!-- Tinder-style single-card deck -->
						<div
							class="relative mx-auto h-[calc(100vh-320px)] min-h-[460px] w-full max-w-xl touch-pan-y select-none lg:max-h-[680px]"
							role="group"
							aria-roledescription="carousel"
							aria-label="Letter cards — swipe or use the arrows to navigate"
							onpointerdown={onCardPointerDown}
							onpointerup={onCardPointerUp}
						>
							{#key cardIndex}
								<div
									in:fly={{ x: cardDirection * 320, duration: 250 }}
									out:fly={{ x: cardDirection * -320, duration: 250 }}
									class="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border border-tile-500 bg-tile-300 p-6 text-center shadow-md sm:gap-5 sm:p-8"
								>
									<button
										onclick={() => playAudio(currentLetter.key)}
										aria-label={`Play pronunciation for ${currentLetter.letterName}`}
										class="group relative flex aspect-square w-44 flex-none cursor-pointer items-center justify-center rounded-3xl border border-tile-500 bg-tile-200 leading-none text-text-300 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-text-200 hover:bg-tile-400 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 active:scale-95 sm:w-56"
									>
										<span class="relative z-10 text-[6.5rem] leading-none sm:text-[8.5rem]"
											>{currentLetter.isolated}</span
										>
										<div
											class="absolute right-2 top-2 h-2.5 w-2.5 animate-pulse rounded-full bg-green-400 opacity-0 transition-opacity group-hover:opacity-100"
										></div>
									</button>

									<div class="flex flex-wrap items-center justify-center gap-2">
										<h2 class="text-3xl font-bold text-text-300 sm:text-4xl">
											{currentLetter.letterName}
										</h2>
										{#if hasEgyptianDistinction(currentLetter)}
											<span
												class="rounded-full border border-green-600/40 bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-700"
											>
												Egyptian
											</span>
										{/if}
									</div>

									<div
										class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-base text-text-200"
									>
										<span>
											English: <span class="font-medium text-text-300"
												>{currentLetter.englishSound}</span
											>
										</span>
										{#if hasEgyptianDistinction(currentLetter)}
											<span class="text-green-700">
												Egyptian: <span class="font-medium">{currentLetter.egyptianSound}</span>
											</span>
										{/if}
									</div>

									<div class="space-y-2">
										<p class="text-text-300">
											<span class="text-2xl" dir="rtl">{currentLetter.exampleArabic}</span>
											<span class="text-text-200">
												— {currentLetter.exampleFranco} ({currentLetter.meaning})
											</span>
										</p>
										<div class="flex justify-center">
											{@render dialectAudio(
												currentLetter.exampleArabic,
												hasEgyptianDistinction(currentLetter)
													? (currentLetter.exampleArabicEgyptian ?? currentLetter.exampleArabic)
													: null
											)}
										</div>
										<p class="text-sm italic text-text-200">{currentLetter.notes}</p>
									</div>

									<p class="text-xs text-text-200">
										Tap the letter to hear it · swipe or use ← → to move
									</p>
								</div>
							{/key}
						</div>

						<!-- Deck navigation -->
						<div class="mt-4 flex items-center justify-center gap-6">
							<button
								type="button"
								onclick={prevCard}
								disabled={cardIndex === 0}
								aria-label="Previous letter"
								class="flex h-12 w-12 items-center justify-center rounded-full border border-tile-500 bg-tile-400 text-2xl font-bold text-text-300 shadow-sm transition-all hover:bg-tile-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
							>
								‹
							</button>
							<span class="text-sm font-semibold text-text-200">
								{cardIndex + 1} / {mergedLetters.length}
							</span>
							<button
								type="button"
								onclick={nextCard}
								disabled={cardIndex === mergedLetters.length - 1}
								aria-label="Next letter"
								class="flex h-12 w-12 items-center justify-center rounded-full border border-tile-500 bg-tile-400 text-2xl font-bold text-text-300 shadow-sm transition-all hover:bg-tile-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
							>
								›
							</button>
						</div>
					{/if}
				</div>
			{/if}

			{#if page === 1}
				<!-- Lesson 2: Articulation points -->
				<div class="mb-8">
					<div class="mb-6 max-w-3xl">
						<div
							class="mb-3 inline-flex items-center gap-2 rounded-full border border-tile-500 bg-tile-400 px-3 py-1.5 text-xs text-text-200"
						>
							<span>Lesson 2</span>
						</div>
						<h1 class="mb-3 text-2xl font-bold leading-tight text-text-300 sm:text-3xl">
							Where the sounds come from
						</h1>
						<p class="mb-4 text-base leading-relaxed text-text-200">
							A handy way to group the letters is by where in the mouth they are made. Pick a group
							to highlight its letters — the <span class="font-semibold text-text-300">throat</span>
							sounds (ح ع غ خ ق ء) are the ones English speakers find hardest.
						</p>
					</div>

					<div class="mb-6 flex flex-wrap gap-2">
						{#each articulationGroups as group (group.id)}
							<button
								onclick={() => (selectedArticulation = group.id)}
								class={cn(
									'rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95',
									selectedArticulation === group.id
										? 'border-tile-600 bg-tile-600 text-white shadow-sm'
										: 'border-tile-500 bg-tile-400 text-text-300 hover:bg-tile-500'
								)}
							>
								{group.label}
							</button>
						{/each}
					</div>

					<div
						class="mb-6 rounded-lg border border-tile-500 bg-tile-400 p-4 text-sm leading-relaxed text-text-200 shadow-sm"
					>
						<span class="font-semibold text-text-300">{selectedGroup.label}:</span>
						{selectedGroup.description}
					</div>

					<div class="rounded-xl border border-tile-500 bg-tile-300 p-4 shadow-sm">
						<div
							class="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10"
							dir="rtl"
						>
							{#each mergedLetters as letter (letter.key)}
								{@const active = letter.articulation === selectedArticulation}
								<div class="group flex flex-col items-center justify-center">
									<p
										class={cn(
											'mb-2 text-center text-xs font-medium transition-all sm:text-sm',
											active ? 'font-semibold text-text-300' : 'text-text-200 opacity-60'
										)}
									>
										{letter.letterName}
									</p>
									<button
										onclick={() => playAudio(letter.key)}
										aria-label={`Play pronunciation for ${letter.letterName}`}
										class={cn(
											'relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border text-3xl shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 active:scale-95 sm:text-4xl lg:text-5xl',
											active
												? 'border-green-600/50 bg-green-500/10 text-text-300 hover:border-green-600 hover:bg-green-500/20'
												: 'border-tile-500 bg-tile-200 text-text-300 opacity-50 hover:bg-tile-400 hover:opacity-100'
										)}
									>
										<span class="relative z-10 text-3xl">{letter.isolated}</span>
									</button>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			{#if page === 2}
				<!-- Lesson 3: Cursive forms + the six kicking letters -->
				<div class="mb-8">
					<div class="mb-6 max-w-4xl">
						<div
							class="mb-3 inline-flex items-center gap-2 rounded-full border border-tile-500 bg-tile-400 px-3 py-1.5 text-xs text-text-200"
						>
							<span>Lesson 3</span>
						</div>
						<h1 class="mb-3 text-2xl font-bold leading-tight text-text-300 sm:text-3xl">
							Arabic is cursive, written right to left
						</h1>
						<p class="mb-3 text-lg leading-relaxed text-text-200">
							Each letter takes a different form depending on whether it sits at the start, middle,
							or end of a word.
						</p>
					</div>

					<div class="mb-6 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
						<div class="rounded-lg border border-tile-500 bg-tile-400 p-4 shadow-sm sm:p-5">
							<div class="mb-3 flex items-center justify-between gap-3">
								<h2 class="text-lg font-bold text-text-300">How to read each row</h2>
								<span
									class="rounded-full border border-tile-600 bg-tile-300 px-3 py-1 text-xs font-semibold text-text-200"
								>
									Right to left
								</span>
							</div>
							<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
								{#each formSlots as slot (slot.key)}
									<div class="border border-tile-600 bg-tile-300 p-3 text-left">
										<p class="text-sm font-bold text-text-300">{slot.label}</p>
										<p class="text-xs leading-snug text-text-200">{slot.context}</p>
									</div>
								{/each}
							</div>
						</div>

						<div class="rounded-lg border border-green-600/50 bg-green-500/10 p-4 shadow-sm sm:p-5">
							<h2 class="mb-2 text-lg font-bold text-text-300">The six kicking letters</h2>
							<p class="mb-3 text-sm leading-relaxed text-text-200">
								ا و د ذ ر ز connect to the letter <span class="font-semibold">before</span> them but
								never to the letter <span class="font-semibold">after</span> — so they have no initial
								or medial form.
							</p>
							<div class="flex flex-wrap gap-2" dir="rtl" aria-label="The six kicking letters">
								{#each sixKickingGlyphs as letter (letter.key)}
									<span
										class="flex h-10 w-10 items-center justify-center border border-green-600/40 bg-tile-300 text-2xl font-bold text-text-300"
									>
										{letter.isolated}
									</span>
								{/each}
							</div>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" dir="rtl">
						{#each mergedLetters as letter (letter.key)}
							<button
								onclick={() => playAudio(letter.key)}
								aria-label={`Play pronunciation for ${letter.letterName}`}
								class={cn(
									'group relative cursor-pointer overflow-hidden rounded-lg border p-3 text-right shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-text-300 focus:ring-offset-2 focus:ring-offset-tile-200',
									hasTwoForms(letter)
										? 'border-green-600/50 bg-green-500/10 hover:border-green-600 hover:bg-green-500/15'
										: 'border-tile-600 bg-tile-400 hover:border-tile-500 hover:bg-tile-500'
								)}
							>
								<div class="relative z-10 flex flex-col gap-3">
									<div
										class="border-tile-600/60 flex items-center justify-between gap-2 border-b pb-2"
									>
										<p class="text-sm font-semibold text-text-200">{letter.letterName}</p>
										<p class="text-4xl font-bold leading-none text-text-300">
											{letter.isolated}
										</p>
									</div>

									<div class="grid grid-cols-4 gap-1.5">
										{#each formSlots as slot (slot.key)}
											{@const value = formValue(letter, slot.key)}
											<div
												class={cn(
													'flex flex-col items-center gap-1 border p-2 text-center',
													value
														? 'border-tile-600 bg-tile-300'
														: 'border-green-600/30 bg-green-500/10'
												)}
											>
												<p class="text-[0.6rem] font-bold uppercase tracking-wide text-text-200">
													{slot.label}
												</p>
												<p
													class={cn(
														'text-3xl font-bold leading-none text-text-300',
														!value && '!text-xs text-green-700 opacity-80'
													)}
													aria-label={value
														? `${letter.letterName} ${slot.label} form`
														: `${letter.letterName} has no ${slot.label} form`}
												>
													{value || 'n/a'}
												</p>
											</div>
										{/each}
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if page === 3}
				<!-- Lesson 4: Special letters & Egyptian notes -->
				<div class="mb-8">
					<div class="mb-6 max-w-3xl">
						<div
							class="mb-3 inline-flex items-center gap-2 rounded-full border border-tile-500 bg-tile-400 px-3 py-1.5 text-xs text-text-200"
						>
							<span>Lesson 4</span>
						</div>
						<h1 class="mb-3 text-2xl font-bold leading-tight text-text-300 sm:text-3xl">
							Special shapes & Egyptian quirks
						</h1>
						<p class="mb-4 text-base leading-relaxed text-text-200">
							A few combinations and letters behave in their own way — and several letters change
							sound completely in Egyptian Colloquial.
						</p>
					</div>

					<!-- Special shapes -->
					<h2 class="mb-3 text-lg font-bold text-text-300">Shapes to know</h2>
					<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
						{#each specialShapes as shape (shape.name)}
							<div class="rounded-xl border border-tile-500 bg-tile-300 p-4 shadow-sm">
								<div class="mb-2 flex items-baseline gap-2">
									<h3 class="font-bold text-text-300">{shape.name}</h3>
									<span class="text-sm text-text-200">· {shape.franco}</span>
								</div>
								<div class="mb-3 flex flex-wrap gap-2" dir="rtl">
									{#each shape.forms as form (form.label)}
										<div class="border border-tile-500 bg-tile-200 px-3 py-2 text-center">
											<p class="text-3xl font-bold text-text-300">{form.glyph}</p>
											<p class="mt-1 text-[0.65rem] text-text-200" dir="ltr">{form.label}</p>
										</div>
									{/each}
								</div>
								<p class="text-sm text-text-300" dir="rtl">{shape.example}</p>
								<p class="mt-1 text-xs italic text-text-200">{shape.note}</p>
							</div>
						{/each}
					</div>

					<!-- Hamza seats -->
					<h2 class="mb-3 text-lg font-bold text-text-300">Hamza (ء) and its seats</h2>
					<p class="mb-3 max-w-3xl text-sm leading-relaxed text-text-200">
						Hamza is a glottal stop. Depending on its position and surrounding vowels it sits on a
						seat — an Alif, Waw, or Ya — or stands alone.
					</p>
					<div class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
						{#each hamzaForms as form, i (i)}
							<div class="rounded-lg border border-tile-500 bg-tile-300 p-3 text-center shadow-sm">
								<p class="text-3xl font-bold text-text-300">{form.glyph}</p>
								<p class="mt-1 text-xs font-semibold text-text-300">{form.name}</p>
								<p class="text-[0.65rem] text-text-200">{form.position}</p>
							</div>
						{/each}
					</div>

					<!-- Egyptian pronunciation notes -->
					<h2 class="mb-3 text-lg font-bold text-text-300">Egyptian pronunciation notes</h2>
					<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each egyptianNotes as note (note.title)}
							<div class="rounded-xl border border-green-600/40 bg-green-500/10 p-4 shadow-sm">
								<h3 class="mb-1 text-lg font-bold text-text-300">{note.title}</h3>
								<p class="mb-3 text-sm leading-relaxed text-text-200">{note.summary}</p>
								<ul class="space-y-1">
									{#each note.rows as row (row.arabic)}
										<li class="flex items-center gap-2 text-sm">
											<span class="text-xl text-text-300" dir="rtl">{row.arabic}</span>
											<span class="text-text-200">→ {row.egyptian}</span>
											<span class="ml-auto">{@render dialectAudio(row.arabic, row.egyptianArabic ?? row.arabic)}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					</div>

					<!-- Long vowels -->
					<h2 class="mb-3 text-lg font-bold text-text-300">Long vowels</h2>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
						{#each longVowels as vowel (vowel.letter)}
							<div
								class="flex items-center gap-4 rounded-lg border border-tile-500 bg-tile-300 p-4 shadow-sm"
							>
								<p class="text-4xl font-bold text-text-300">{vowel.letter}</p>
								<div>
									<p class="font-semibold text-text-300">{vowel.sound}</p>
									<p class="text-sm text-text-200" dir="rtl">{vowel.example}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if page === 4}
				<!-- Lesson 5: Interactive practice -->
				<div class="mb-8">
					<div class="mb-6 max-w-3xl">
						<div
							class="mb-3 inline-flex items-center gap-2 rounded-full border border-tile-500 bg-tile-400 px-3 py-1.5 text-xs text-text-200"
						>
							<span>Lesson 5</span>
						</div>
						<h1 class="mb-3 text-2xl font-bold leading-tight text-text-300 sm:text-3xl">
							Practice what you learned
						</h1>
						<p class="mb-4 text-base leading-relaxed text-text-200">
							Three quick exercises — listen and identify letters, write them yourself, then say a
							few words out loud.
						</p>
					</div>

					<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<section class="rounded-xl border border-tile-500 bg-tile-300 p-4 shadow-sm sm:p-5">
							<div class="mb-4 flex items-center gap-2">
								<span class="text-xl" aria-hidden="true">🎧</span>
								<h2 class="text-lg font-bold text-text-300">Listen</h2>
							</div>
							<ListeningExercise letters={practiceLetters} />
						</section>

						<section class="rounded-xl border border-tile-500 bg-tile-300 p-4 shadow-sm sm:p-5">
							<div class="mb-4 flex items-center gap-2">
								<span class="text-xl" aria-hidden="true">✍️</span>
								<h2 class="text-lg font-bold text-text-300">Write</h2>
							</div>
							<WritingExercise letters={practiceLetters} words={practiceWords} />
						</section>

						<section class="rounded-xl border border-tile-500 bg-tile-300 p-4 shadow-sm sm:p-5">
							<div class="mb-4 flex items-center gap-2">
								<span class="text-xl" aria-hidden="true">🎤</span>
								<h2 class="text-lg font-bold text-text-300">Speak</h2>
							</div>
							<SpeakingExercise words={practiceWords} />
						</section>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Bottom Navigation -->
	<footer class="sticky bottom-0 z-[100] border-t border-tile-500 bg-tile-300 shadow-sm">
		<div class="mx-auto max-w-7xl px-3 py-4 sm:px-8">
			<div class="flex items-center justify-between">
				<div>
					{#if page > 0}
						<button
							onclick={previousPage}
							class="flex items-center gap-2 rounded-full border border-tile-500 bg-tile-400 px-5 py-2.5 font-semibold text-text-300 shadow-sm transition-all duration-200 hover:bg-tile-500 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 active:scale-95"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>Previous</span>
						</button>
					{:else}
						<div></div>
					{/if}
				</div>

				<button
					onclick={nextPage}
					class="flex items-center gap-2 rounded-full border border-tile-600 bg-tile-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-tile-700 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 active:scale-95"
				>
					<span>{page === totalPages - 1 ? 'Back to Alphabet' : 'Next Lesson'}</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>
	</footer>
</section>
