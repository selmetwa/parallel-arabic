<script lang="ts">
	import ConjugationPractice from '$lib/components/dialect-shared/conjugations/ConjugationPractice.svelte';
	import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
	import SubscribeButton from '$lib/components/SubscribeButton.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { getDefaultDialect } from '$lib/helpers/get-default-dialect';
	import { type Dialect } from '$lib/types/index';
	import { conjugationPractice as session } from '$lib/store/generated-content.svelte';

	let { data } = $props();

	const dialectOptions = [
		{ value: 'egyptian-arabic', label: 'Egyptian Arabic', emoji: '🇪🇬' },
		{ value: 'fusha', label: 'Modern Standard Arabic', emoji: '📚' },
		{ value: 'levantine', label: 'Levantine Arabic', emoji: '🇱🇧' },
		{ value: 'darija', label: 'Moroccan Darija', emoji: '🇲🇦' }
	];

	const exampleVerbs = ['to write', 'to eat', 'to go', 'to drink', 'to study', 'to speak'];

	// Generated exercise lives in global state so it survives navigating away
	let selectedDialect = $state(session.dialect || getDefaultDialect(data.user));
	let verb = $state(session.verb);

	let isLoading = $state(false);
	let isError = $state(false);
	let errorMessage = $state('');

	let tensesViewed = $state(data.tensesViewed);
	let hasReachedLimit = $derived(!data.isSubscribed && tensesViewed >= 5);

	async function generate(e?: Event) {
		e?.preventDefault();
		if (!verb.trim() || isLoading) return;

		isLoading = true;
		isError = false;
		errorMessage = '';
		session.exercise = null;

		try {
			const res = await fetch('/api/generate-conjugations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ verb: verb.trim(), dialect: selectedDialect })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({ message: `Server error: ${res.status}` }));
				throw new Error(body.message || `Server error: ${res.status}`);
			}

			session.exercise = await res.json();
			session.verb = verb.trim();
			session.dialect = selectedDialect;
		} catch (error) {
			console.error('Error generating conjugations:', error);
			isError = true;
			errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	async function onAdvance() {
		if (data.isSubscribed) return;
		try {
			const res = await fetch('/api/increment_tenses_viewed', { method: 'POST' });
			const json = await res.json();
			if (typeof json.tensesViewed === 'number') tensesViewed = json.tensesViewed;
		} catch {
			// non-fatal
		}
	}

	function onNewVerb() {
		session.exercise = null;
		session.verb = '';
		verb = '';
		isError = false;
		errorMessage = '';
	}
</script>

<svelte:head>
	<title>Arabic Verb Conjugation Practice — All Dialects</title>
	<meta name="description" content="Practice Arabic verb conjugations in Egyptian, Levantine, Moroccan Darija, and Modern Standard Arabic. Drill past, present, and future tense by typing or multiple-choice quiz." />
</svelte:head>

{#if hasReachedLimit && data.session}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-8 text-center sm:mx-auto max-w-2xl rounded-xl shadow-lg">
		<h1 class="text-2xl font-bold text-text-300">You have reached your free conjugation limit.</h1>
		<p class="mt-2 text-xl text-text-200">To keep practicing, please subscribe.</p>
		<SubscribeButton className="mx-auto mt-6" />
	</div>
{:else if isLoading}
	<div class="px-4 mt-12 sm:px-8 max-w-3xl mx-auto min-h-[60vh] flex items-center justify-center">
		<div class="flex flex-col items-center text-center gap-6 max-w-md">
			<AlphabetCycle />
			<div class="flex flex-col gap-3">
				<h2 class="text-2xl font-bold text-text-300">Generating conjugations...</h2>
				<p class="text-text-200 text-lg">
					Building the full table for "{verb}" in {dialectOptions.find((d) => d.value === selectedDialect)?.label}.
					<span class="block mt-2 text-sm opacity-75">This may take up to a minute.</span>
				</p>
			</div>
		</div>
	</div>
{:else if session.exercise}
	<div class="px-4 sm:px-8 py-8">
		<ConjugationPractice data={session.exercise} dialect={selectedDialect as Dialect} {onNewVerb} {onAdvance} />
	</div>
{:else}
	<!-- Generation form -->
	<header class="py-5 bg-tile-200 border-b border-tile-500 px-6 sm:px-12">
		<div class="text-left">
			<h1 class="text-2xl sm:text-3xl text-text-300 font-bold mb-1 tracking-tight">Verb Conjugation Practice</h1>
			<p class="text-text-200 text-base sm:text-lg leading-snug max-w-2xl">
				Pick a dialect and a verb, then drill every tense, form, and pronoun by typing or quiz.
			</p>
		</div>
	</header>

	<section class="py-6">
		<div class="px-6 sm:px-12 max-w-3xl mx-auto">
			{#if isError}
				<div class="mb-4 flex flex-col items-center gap-3 border-2 border-red-200 bg-red-50/50 p-5 text-text-200 shadow-sm rounded-xl">
					<p class="text-xl text-red-700 font-bold">Generation Failed</p>
					<p class="text-red-600 text-center">{errorMessage}</p>
				</div>
			{/if}

			<form class="space-y-4" onsubmit={generate}>
				<!-- Dialect -->
				<div class="bg-tile-400 border border-tile-500 rounded-xl shadow-sm overflow-hidden">
					<div class="px-4 py-3 border-b border-tile-500">
						<h3 class="text-lg font-bold text-text-300 flex items-center gap-2"><span>🗣️</span> Dialect</h3>
					</div>
					<div class="p-4">
						<div class="grid grid-cols-2 gap-2">
							{#each dialectOptions as d (d.value)}
								<button
									type="button"
									onclick={() => (selectedDialect = d.value)}
									class="flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 text-left {selectedDialect === d.value ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70'}"
								>
									<span class="text-xl">{d.emoji}</span>
									<span class="font-semibold text-text-300 text-sm">{d.label}</span>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Verb -->
				<div class="bg-tile-400 border border-tile-500 rounded-xl shadow-sm overflow-hidden">
					<div class="px-4 py-3 border-b border-tile-500">
						<h3 class="text-lg font-bold text-text-300 flex items-center gap-2"><span>🔤</span> English Verb</h3>
					</div>
					<div class="p-4">
						<input
							type="text"
							bind:value={verb}
							placeholder="e.g. to write"
							class="w-full rounded-lg border border-tile-500 bg-tile-300 py-2.5 px-3.5 text-text-300 focus:border-tile-600 focus:ring-0 transition-colors text-base placeholder:text-text-200/50"
						/>
						<div class="flex flex-wrap gap-2 mt-3">
							{#each exampleVerbs as ex (ex)}
								<button
									type="button"
									onclick={() => (verb = ex)}
									class="px-3 py-1 text-sm rounded-full bg-tile-300 text-text-300 border border-tile-600 hover:bg-tile-500 transition-colors"
								>
									{ex}
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Submit -->
				<div class="pt-2">
					{#if !data.session}
						<Tooltip text="An account is required to access this feature">
							<button type="submit" disabled={true} class="w-full py-3 text-lg font-bold bg-tile-500 text-text-200 rounded-lg opacity-50 cursor-not-allowed">
								Generate Conjugations
							</button>
						</Tooltip>
						<p class="text-center text-text-200 mt-4">
							<a href="/login" class="text-sky-400 hover:text-sky-300 font-semibold">Log in</a> or
							<a href="/signup" class="text-sky-400 hover:text-sky-300 font-semibold">sign up</a> to start practicing
						</p>
					{:else}
						<button
							type="submit"
							disabled={!verb.trim()}
							class="w-full py-3 text-lg font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
						>
							🔄 Generate Conjugations
						</button>
					{/if}
				</div>
			</form>
		</div>
	</section>
{/if}
