<script lang="ts">
	import type { VerbConjugationData, VerbTense, VerbForm, ConjugationEntry } from '$lib/types/index';
	import { userXp, userLevel } from '$lib/store/xp-store';
	import { showXpToast } from '$lib/helpers/toast-helpers';
	import { LEVEL_TIERS } from '$lib/helpers/xp-levels';

	interface Props {
		verb: VerbConjugationData;
	}

	let { verb }: Props = $props();

	// ── View / filter state ────────────────────────────────────────────────────
	let viewMode = $state<'practice' | 'table'>('practice');
	let selectedTense = $state<'past' | 'present' | 'future' | 'all'>('all');
	let selectedForm = $state<'affirmative' | 'negative' | 'both'>('both');

	// ── Exercise state ─────────────────────────────────────────────────────────
	let currentIndex = $state(0);
	let selectedOption = $state<string | null>(null);
	let answeredCorrectly = $state(false);
	let xpAwardedThisExercise = $state(false);

	// ── Person display map ─────────────────────────────────────────────────────
	const personDisplay: Record<string, { arabic: string; english: string }> = {
		ana:   { arabic: 'أنا',    english: 'I' },
		enta:  { arabic: 'إنتَ',   english: 'you (m)' },
		enti:  { arabic: 'إنتِ',   english: 'you (f)' },
		howa:  { arabic: 'هُوَّ',   english: 'he' },
		heya:  { arabic: 'هِيَّ',   english: 'she' },
		ehna:  { arabic: 'إحنا',   english: 'we' },
		entu:  { arabic: 'إنتوا',  english: 'you (pl)' },
		homma: { arabic: 'هُمَّ',   english: 'they' }
	};

	const ALL_PERSONS = ['ana', 'enta', 'enti', 'howa', 'heya', 'ehna', 'entu', 'homma'] as const;

	// ── Shuffle helper ─────────────────────────────────────────────────────────
	function shuffle<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	// ── Flat exercises list ────────────────────────────────────────────────────
	type ExerciseItem = { entry: ConjugationEntry; tense: VerbTense; form: VerbForm };

	const exercises = $derived.by((): ExerciseItem[] => {
		const tenses: VerbTense[] =
			selectedTense === 'all' ? ['past', 'present', 'future'] : [selectedTense];
		const forms: VerbForm[] =
			selectedForm === 'both' ? ['affirmative', 'negative'] : [selectedForm];

		const result: ExerciseItem[] = [];
		for (const tense of tenses) {
			for (const form of forms) {
				for (const entry of verb.conjugations[tense][form]) {
					result.push({ entry, tense, form });
				}
			}
		}
		return result;
	});

	const currentExercise = $derived(exercises[currentIndex] ?? null);

	// ── Options derived ────────────────────────────────────────────────────────
	type Option = { arabic: string; transliteration: string; isCorrect: boolean };

	const options = $derived.by((): Option[] => {
		if (!currentExercise) return [];

		const correct: Option = {
			arabic: currentExercise.entry.arabic,
			transliteration: currentExercise.entry.transliteration,
			isCorrect: true
		};

		const seen = new Set<string>([correct.arabic]);
		const distractors: Option[] = [];

		const shuffledExercises = shuffle([...exercises]);
		for (const ex of shuffledExercises) {
			if (distractors.length >= 3) break;
			if (seen.has(ex.entry.arabic)) continue;
			seen.add(ex.entry.arabic);
			distractors.push({
				arabic: ex.entry.arabic,
				transliteration: ex.entry.transliteration,
				isCorrect: false
			});
		}

		// Pad with placeholder if not enough distractors
		while (distractors.length < 3) {
			distractors.push({ arabic: '—', transliteration: '—', isCorrect: false });
		}

		return shuffle([correct, ...distractors]);
	});

	// ── XP effect ─────────────────────────────────────────────────────────────
	$effect(() => {
		if (answeredCorrectly && !xpAwardedThisExercise) {
			xpAwardedThisExercise = true;
			fetch('/api/award-xp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventType: 'conjugation_correct' })
			})
				.then((r) => r.json())
				.then((data) => {
					if (data.success) {
						userXp.set(data.newTotalXp);
						userLevel.set(data.newLevel);
						const newTitle =
							LEVEL_TIERS.find((t) => t.level === data.newLevel)?.title ?? 'Tourist';
						showXpToast(data.xpAwarded, data.leveledUp, data.newLevel, newTitle);
					}
				})
				.catch(() => {});
		}
	});

	// ── Reset effect ───────────────────────────────────────────────────────────
	$effect(() => {
		// Track these as dependencies so the effect re-runs when they change
		currentIndex;
		selectedTense;
		selectedForm;

		selectedOption = null;
		answeredCorrectly = false;
		xpAwardedThisExercise = false;
	});

	// ── Select option handler ──────────────────────────────────────────────────
	function selectOption(arabic: string, isCorrect: boolean) {
		if (selectedOption !== null) return;
		selectedOption = arabic;
		answeredCorrectly = isCorrect;
	}

	// ── Navigation ─────────────────────────────────────────────────────────────
	function nextExercise() {
		if (exercises.length === 0) return;
		currentIndex = (currentIndex + 1) % exercises.length;
	}

	// ── Badge helpers ──────────────────────────────────────────────────────────
	function tenseLabel(tense: VerbTense) {
		if (tense === 'past') return 'Past';
		if (tense === 'present') return 'Present';
		return 'Future';
	}

	function formLabel(form: VerbForm) {
		return form === 'affirmative' ? 'Affirmative' : 'Negative';
	}

	// ── Pill button class helper ───────────────────────────────────────────────
	function pill(active: boolean) {
		return active
			? 'px-3 py-1.5 text-sm font-semibold rounded-lg bg-amber-600 text-white transition-all'
			: 'px-3 py-1.5 text-sm font-semibold rounded-lg bg-tile-500 text-text-300 border border-tile-600 hover:bg-tile-600 transition-all';
	}

	// ── Option button class helper ────────────────────────────────────────────
	function optionClass(opt: Option): string {
		if (selectedOption === null) {
			return 'p-4 rounded-xl border border-tile-500 bg-tile-400 hover:bg-tile-500 transition-all text-center cursor-pointer';
		}
		if (opt.isCorrect) {
			return 'p-4 rounded-xl border border-green-700 bg-green-700 text-white transition-all text-center cursor-not-allowed';
		}
		if (selectedOption === opt.arabic) {
			return 'p-4 rounded-xl border border-red-700 bg-red-700 text-white transition-all text-center cursor-not-allowed';
		}
		return 'p-4 rounded-xl border border-tile-500 bg-tile-400 transition-all text-center cursor-not-allowed opacity-60';
	}

	// ── Reference table lookup ────────────────────────────────────────────────
	function findEntry(person: string, tense: VerbTense, form: VerbForm): ConjugationEntry | undefined {
		return verb.conjugations[tense][form].find((e) => e.person === person);
	}
</script>

<div class="max-w-2xl mx-auto">

	<!-- Root verb header -->
	<div class="text-center mb-6 p-4 bg-tile-300 border border-tile-500 rounded-xl">
		<p class="text-sm text-text-200 uppercase tracking-wider mb-1">Root Verb</p>
		<p class="text-5xl font-bold text-text-300 mb-2" dir="rtl">{verb.arabic}</p>
		<p class="text-xl text-text-200">{verb.transliteration}</p>
		<p class="text-lg text-text-300 font-semibold">{verb.english}</p>
		<p class="text-sm text-text-200 mt-2">{verb.rootLetters}</p>
		<span class="inline-block mt-2 px-2 py-0.5 text-xs font-semibold rounded bg-tile-500 border border-tile-600 text-text-200 uppercase tracking-wide">
			{verb.verbClass}
		</span>
		{#if verb.notes}
			<p class="text-sm text-text-200 mt-2 italic">{verb.notes}</p>
		{/if}
	</div>

	<!-- View mode toggle -->
	<div class="flex gap-2 mb-4 justify-center">
		<button onclick={() => (viewMode = 'practice')} class={pill(viewMode === 'practice')}>
			Practice
		</button>
		<button onclick={() => (viewMode = 'table')} class={pill(viewMode === 'table')}>
			Reference Table
		</button>
	</div>

	{#if viewMode === 'practice'}
		<!-- Filter controls -->
		<div class="flex flex-wrap gap-2 mb-4 justify-center">
			<button onclick={() => { selectedTense = 'past'; currentIndex = 0; }} class={pill(selectedTense === 'past')}>Past</button>
			<button onclick={() => { selectedTense = 'present'; currentIndex = 0; }} class={pill(selectedTense === 'present')}>Present</button>
			<button onclick={() => { selectedTense = 'future'; currentIndex = 0; }} class={pill(selectedTense === 'future')}>Future</button>
			<button onclick={() => { selectedTense = 'all'; currentIndex = 0; }} class={pill(selectedTense === 'all')}>All Tenses</button>

			<span class="w-full sm:w-px sm:h-6 border-b sm:border-b-0 sm:border-r border-tile-500"></span>

			<button onclick={() => { selectedForm = 'affirmative'; currentIndex = 0; }} class={pill(selectedForm === 'affirmative')}>Affirmative</button>
			<button onclick={() => { selectedForm = 'negative'; currentIndex = 0; }} class={pill(selectedForm === 'negative')}>Negative</button>
			<button onclick={() => { selectedForm = 'both'; currentIndex = 0; }} class={pill(selectedForm === 'both')}>Both Forms</button>
		</div>

		<!-- Progress bar -->
		{#if exercises.length > 0}
			<div class="mb-4">
				<p class="text-sm text-text-200 text-center mb-1">
					{currentIndex + 1} / {exercises.length}
				</p>
				<div class="w-full h-2 bg-tile-400 rounded-full">
					<div
						class="h-2 bg-green-500 rounded-full transition-all"
						style="width: {((currentIndex + 1) / exercises.length) * 100}%"
					></div>
				</div>
			</div>
		{/if}

		{#if exercises.length > 0 && currentExercise}
			<!-- Exercise card -->
			<div class="bg-tile-300 border border-tile-500 rounded-xl p-6 mb-4">

				<!-- Tense + form badges -->
				<div class="flex gap-2 justify-center mb-4">
					<span class="px-2 py-0.5 text-xs font-semibold rounded bg-blue-600 text-white uppercase tracking-wide">
						{tenseLabel(currentExercise.tense)}
					</span>
					<span class="px-2 py-0.5 text-xs font-semibold rounded {currentExercise.form === 'affirmative' ? 'bg-green-600' : 'bg-red-600'} text-white uppercase tracking-wide">
						{formLabel(currentExercise.form)}
					</span>
				</div>

				<!-- Pronoun display -->
				<div class="text-center mb-6">
					<p class="text-4xl font-bold text-text-300 mb-1" dir="rtl">
						{personDisplay[currentExercise.entry.person].arabic}
					</p>
					<p class="text-xl text-text-200">
						{personDisplay[currentExercise.entry.person].english} — "{currentExercise.entry.english}"
					</p>
				</div>

				<!-- Multiple choice options (2x2 grid) -->
				<div class="grid grid-cols-2 gap-3 mb-4">
					{#each options as opt (opt.arabic)}
						<button
							onclick={() => selectOption(opt.arabic, opt.isCorrect)}
							disabled={selectedOption !== null}
							class={optionClass(opt)}
						>
							<span class="text-2xl font-arabic block mb-1" dir="rtl">{opt.arabic}</span>
							<span class="text-xs text-inherit opacity-80">{opt.transliteration}</span>
						</button>
					{/each}
				</div>

				<!-- Feedback banner -->
				{#if selectedOption !== null}
					{#if answeredCorrectly}
						<div class="bg-green-700 text-white text-center py-3 rounded-lg text-base font-semibold">
							Correct! — {currentExercise.entry.english}
						</div>
					{:else}
						<div class="bg-red-700 text-white text-center py-3 rounded-lg text-base font-semibold">
							Not quite — the answer is
							<span class="font-arabic" dir="rtl">{currentExercise.entry.arabic}</span>
							({currentExercise.entry.transliteration})
						</div>
					{/if}
				{/if}
			</div>

			<!-- Next button (only visible after selection) -->
			{#if selectedOption !== null}
				<div class="flex justify-center mb-4">
					<button
						onclick={nextExercise}
						class="px-4 py-1.5 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-all"
					>
						Next &rarr;
					</button>
				</div>
			{/if}
		{:else}
			<p class="text-center text-text-200 py-8">No exercises match the current filters.</p>
		{/if}

	{:else}
		<!-- Reference Table -->
		<div class="overflow-x-auto rounded-xl border border-tile-500">
			<table class="w-full text-sm border-collapse">
				<thead>
					<tr class="bg-tile-400">
						<th class="p-2 text-left text-text-200 font-semibold border-b border-tile-500">Pronoun</th>
						<th class="p-2 text-center text-text-200 font-semibold border-b border-tile-500">Past (+)</th>
						<th class="p-2 text-center text-text-200 font-semibold border-b border-tile-500">Past (-)</th>
						<th class="p-2 text-center text-text-200 font-semibold border-b border-tile-500">Present (+)</th>
						<th class="p-2 text-center text-text-200 font-semibold border-b border-tile-500">Present (-)</th>
						<th class="p-2 text-center text-text-200 font-semibold border-b border-tile-500">Future (+)</th>
						<th class="p-2 text-center text-text-200 font-semibold border-b border-tile-500">Future (-)</th>
					</tr>
				</thead>
				<tbody>
					{#each ALL_PERSONS as person (person)}
						{@const pastAff = findEntry(person, 'past', 'affirmative')}
						{@const pastNeg = findEntry(person, 'past', 'negative')}
						{@const presAff = findEntry(person, 'present', 'affirmative')}
						{@const presNeg = findEntry(person, 'present', 'negative')}
						{@const futAff  = findEntry(person, 'future', 'affirmative')}
						{@const futNeg  = findEntry(person, 'future', 'negative')}
						<tr class="border-b border-tile-500 even:bg-tile-300 odd:bg-tile-200">
							<td class="p-2 text-text-300 font-semibold">
								<span dir="rtl" class="text-base font-arabic block">{personDisplay[person].arabic}</span>
								<span class="text-xs text-text-200">{person}</span>
							</td>
							<td class="p-2 text-center">
								{#if pastAff}
									<span class="text-base font-arabic text-text-300 block" dir="rtl">{pastAff.arabic}</span>
									<span class="text-xs text-text-200">{pastAff.transliteration}</span>
								{:else}
									<span class="text-text-100">—</span>
								{/if}
							</td>
							<td class="p-2 text-center">
								{#if pastNeg}
									<span class="text-base font-arabic text-text-300 block" dir="rtl">{pastNeg.arabic}</span>
									<span class="text-xs text-text-200">{pastNeg.transliteration}</span>
								{:else}
									<span class="text-text-100">—</span>
								{/if}
							</td>
							<td class="p-2 text-center">
								{#if presAff}
									<span class="text-base font-arabic text-text-300 block" dir="rtl">{presAff.arabic}</span>
									<span class="text-xs text-text-200">{presAff.transliteration}</span>
								{:else}
									<span class="text-text-100">—</span>
								{/if}
							</td>
							<td class="p-2 text-center">
								{#if presNeg}
									<span class="text-base font-arabic text-text-300 block" dir="rtl">{presNeg.arabic}</span>
									<span class="text-xs text-text-200">{presNeg.transliteration}</span>
								{:else}
									<span class="text-text-100">—</span>
								{/if}
							</td>
							<td class="p-2 text-center">
								{#if futAff}
									<span class="text-base font-arabic text-text-300 block" dir="rtl">{futAff.arabic}</span>
									<span class="text-xs text-text-200">{futAff.transliteration}</span>
								{:else}
									<span class="text-text-100">—</span>
								{/if}
							</td>
							<td class="p-2 text-center">
								{#if futNeg}
									<span class="text-base font-arabic text-text-300 block" dir="rtl">{futNeg.arabic}</span>
									<span class="text-xs text-text-200">{futNeg.transliteration}</span>
								{:else}
									<span class="text-text-100">—</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
