<script lang="ts">
	import { letters } from '$lib/constants/alphabet';
	import cn from 'classnames';
	import { hue, theme } from '$lib/store/store';
	import { onMount } from 'svelte';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let page = $state(0);
	const totalPages = 2;
	const formSlots = [
		{
			key: 'isolated',
			label: 'Isolated',
			context: 'stands alone'
		},
		{
			key: 'start',
			label: 'Initial',
			context: 'starts a word'
		},
		{
			key: 'middle',
			label: 'Medial',
			context: 'between letters'
		},
		{
			key: 'end',
			label: 'Final',
			context: 'ends a word'
		}
	] as const;

	type Letter = (typeof letters)[number];
	type FormKey = (typeof formSlots)[number]['key'];

	function formValue(letter: Letter, key: FormKey) {
		return letter[key];
	}

	function hasTwoForms(letter: Letter) {
		return !letter.start || !letter.middle;
	}

	function playAudio(letter: string) {
		const audio = new Audio(`/letters/audios/${letter}.mp3`);
		audio.play();
	}

	function nextPage() {
		if (page === totalPages - 1) {
			goto(resolve('/alphabet/practice'));
			return;
		}
		page += 1;
	}

	function previousPage() {
		page -= 1;
	}

	onMount(() => {
		updateKeyboardStyle();

		// Subscribe to theme changes only on client
		const unsubHue = hue.subscribe(() => {
			updateKeyboardStyle();
		});

		const unsubTheme = theme.subscribe(() => {
			updateKeyboardStyle();
		});

		return () => {
			unsubHue();
			unsubTheme();
		};
	});

	const lettersToRender = letters;
</script>

<section class="min-h-screen bg-tile-200">
	<!-- Header with Navigation -->
	<header class="sticky top-0 z-10 border-b border-tile-600 bg-tile-200">
		<div class="mx-auto max-w-7xl px-3 py-4 sm:px-8">
			<div class="flex items-center justify-between">
				<a
					href={resolve('/alphabet')}
					class="flex items-center gap-2 text-text-200 transition-colors hover:text-text-300"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="font-medium">Back to Alphabet</span>
				</a>

				<div class="flex items-center gap-4">
					<!-- Progress indicator -->
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
								aria-label="Go to page {i + 1}"
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
	<div class="py-8 sm:py-12">
		<div class="mx-auto max-w-7xl px-3 sm:px-8">
			{#if page === 0}
				<!-- Lesson 1: All Letters -->
				<div class="mb-8">
					<div class="mb-10 max-w-3xl">
						<div
							class="mb-4 inline-flex items-center gap-2 rounded-full border border-tile-600 bg-tile-400 px-3 py-1.5 text-xs text-text-200"
						>
							<span>Lesson 1</span>
						</div>
						<h1 class="mb-4 text-3xl font-bold leading-tight text-text-300 sm:text-4xl lg:text-5xl">
							The Arabic alphabet has 28 letters
						</h1>
						<p class="mb-4 text-lg leading-relaxed text-text-200">
							Here they are arranged in order, starting from top right and moving across to the
							left. Each letter has a name and a unique sound.
						</p>
						<div
							class="inline-flex items-center gap-2 rounded-lg border border-tile-600 bg-tile-400 px-4 py-2 text-sm text-text-200"
						>
							<span>💡</span>
							<span>Click on any letter to hear its pronunciation</span>
						</div>
					</div>

					<div
						class="rounded-2xl border-2 border-tile-600 bg-gradient-to-br from-tile-400 to-tile-300 p-6 shadow-xl"
					>
						<div
							class="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10"
							dir="rtl"
						>
							{#each lettersToRender as letter (letter.key)}
								<div
									class="group flex transform flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1"
								>
									<p
										class="mb-2 text-center text-xs font-medium text-text-200 transition-all group-hover:font-semibold group-hover:text-text-300 sm:text-sm"
									>
										{letter.name}
									</p>
									<button
										onclick={() => playAudio(letter.key)}
										value={letter.key}
										class="relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-tile-600 bg-gradient-to-br from-tile-300 to-tile-200 text-3xl text-text-300 shadow-md transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-110 hover:border-text-200 hover:bg-gradient-to-br hover:from-tile-500 hover:to-tile-400 hover:shadow-xl active:scale-95 sm:text-4xl lg:text-5xl"
									>
										<!-- Ripple effect -->
										<span
											class="absolute inset-0 scale-0 rounded-2xl bg-white/30 transition-all duration-500 group-active:scale-100 group-active:opacity-0"
										></span>

										<!-- Letter -->
										<span
											class="relative z-10 transform transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
										>
											{letter.isolated}
										</span>

										<!-- Audio indicator -->
										<div
											class="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-green-400 opacity-0 transition-opacity group-hover:opacity-100"
										></div>
									</button>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			{#if page === 1}
				<!-- Lesson 2: Letter Forms -->
				<div class="mb-8">
					<div class="mb-8 max-w-4xl">
						<div
							class="mb-4 inline-flex items-center gap-2 rounded-full border border-tile-600 bg-tile-400 px-3 py-1.5 text-xs text-text-200"
						>
							<span>Lesson 2</span>
						</div>
						<h1 class="mb-4 text-3xl font-bold leading-tight text-text-300 sm:text-4xl lg:text-5xl">
							Arabic is cursive, written right to left
						</h1>
						<p class="mb-3 text-lg leading-relaxed text-text-200">
							Each letter takes a different form depending on whether it has an independent,
							initial, medial, or final position in a word.
						</p>
					</div>

					<div class="mb-6 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
						<div class="border-2 border-tile-600 bg-tile-400 p-4 shadow-lg sm:p-5">
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

						<div class="border-2 border-green-600/50 bg-green-500/10 p-4 shadow-lg sm:p-5">
							<h2 class="mb-2 text-lg font-bold text-text-300">Two-form letters</h2>
							<p class="mb-3 text-sm leading-relaxed text-text-200">
								ا د ذ ر ز و connect only from the right, so their initial and medial cells are
								intentionally unavailable.
							</p>
							<div class="flex flex-wrap gap-2" dir="rtl" aria-label="Two-form Arabic letters">
								{#each letters.filter(hasTwoForms) as letter (letter.key)}
									<span
										class="flex h-10 w-10 items-center justify-center border border-green-600/40 bg-tile-300 text-2xl font-bold text-text-300"
									>
										{letter.isolated}
									</span>
								{/each}
							</div>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 lg:grid-cols-2" dir="rtl">
						{#each letters as letter (letter.key)}
							<button
								onclick={() => playAudio(letter.key)}
								aria-label={`Play pronunciation for ${letter.name}`}
								class={cn(
									'group relative cursor-pointer overflow-hidden border-2 p-4 text-right shadow-lg transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-text-300 focus:ring-offset-2 focus:ring-offset-tile-200 sm:p-5',
									hasTwoForms(letter)
										? 'border-green-600/50 bg-green-500/10 hover:border-green-600 hover:bg-green-500/15'
										: 'border-tile-600 bg-tile-400 hover:border-tile-500 hover:bg-tile-500'
								)}
							>
								<div
									class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
								>
									<div
										class="absolute inset-0 translate-x-[-100%] bg-gradient-to-tr from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]"
									></div>
								</div>

								<div class="relative z-10 grid gap-4 sm:grid-cols-[7rem_1fr] sm:items-stretch">
									<div
										class="border-tile-600/60 flex flex-row-reverse items-center justify-between gap-3 border-b pb-3 sm:flex-col sm:justify-center sm:border-b-0 sm:border-l sm:pb-0 sm:pl-4"
									>
										<div class="text-center">
											<p class="mb-1 text-sm font-semibold text-text-200">{letter.name}</p>
											<p class="text-5xl font-bold leading-none text-text-300 sm:text-6xl">
												{letter.isolated}
											</p>
										</div>
										<div class="flex flex-col items-end gap-2 sm:items-center">
											<span
												class={cn(
													'rounded-full border px-3 py-1 text-xs font-semibold',
													hasTwoForms(letter)
														? 'border-green-600/40 bg-green-500/15 text-green-700'
														: 'border-tile-600 bg-tile-300 text-text-200'
												)}
											>
												{hasTwoForms(letter) ? '2 forms' : '4 forms'}
											</span>
											<span class="text-xs font-medium text-text-200 opacity-80">Tap to hear</span>
										</div>
									</div>

									<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
										{#each formSlots as slot (slot.key)}
											{@const value = formValue(letter, slot.key)}
											<div
												class={cn(
													'flex min-h-28 flex-col justify-between border p-3 text-center',
													value
														? 'border-tile-600 bg-tile-300'
														: 'border-green-600/30 bg-green-500/10'
												)}
											>
												<div>
													<p class="text-sm font-bold text-text-300">{slot.label}</p>
													<p class="text-[0.7rem] leading-tight text-text-200">{slot.context}</p>
												</div>
												<p
													class={cn(
														'py-3 text-4xl font-bold leading-none text-text-300 sm:text-5xl',
														!value && 'text-2xl text-green-700 opacity-80 sm:text-3xl'
													)}
													aria-label={value
														? `${letter.name} ${slot.label} form`
														: `${letter.name} has no ${slot.label} form`}
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
		</div>
	</div>

	<!-- Bottom Navigation -->
	<footer
		class="from-tile-300/95 sticky bottom-0 z-[100] border-t border-tile-600 bg-gradient-to-b to-tile-300 shadow-lg backdrop-blur-md"
	>
		<div class="mx-auto max-w-7xl px-3 py-4 sm:px-8">
			<div class="flex items-center justify-between">
				<div>
					{#if page > 0}
						<button
							onclick={previousPage}
							class="flex items-center gap-2 rounded-xl border-2 border-tile-600 bg-gradient-to-r from-tile-400 to-tile-300 px-5 py-3 font-semibold text-text-300 shadow-md transition-all duration-200 hover:from-tile-500 hover:to-tile-400 hover:shadow-lg active:scale-95"
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
					class="hover:to-tile-800 flex transform items-center gap-2 rounded-xl border-2 border-tile-700 bg-gradient-to-r from-tile-600 to-tile-700 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:from-tile-700 hover:shadow-xl active:scale-95"
				>
					<span>{page === totalPages - 1 ? 'Start Practicing' : 'Next Lesson'}</span>
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
