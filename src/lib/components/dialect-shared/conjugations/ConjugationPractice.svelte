<script lang="ts">
	/**
	 * ConjugationPractice
	 *
	 * On-demand verb conjugation drill. Takes a full conjugation table (3 tenses ×
	 * 2 forms × 8 persons) and lets the user practice via Typing (char-by-char
	 * correction + Arabic keyboard, ported from SentenceBlock) or a Multiple-Choice
	 * Quiz. Checkboxes filter which tenses / forms / persons are drilled (all on by
	 * default).
	 */
	import { onMount } from 'svelte';
	import cn from 'classnames';
	import {
		type Keyboard,
		type Dialect,
		type VerbTense,
		type VerbForm,
		type VerbPerson,
		type ConjugationEntry
	} from '$lib/types/index';
	import type { ConjugationExerciseSchema } from '$lib/utils/gemini-schemas';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { hue, theme } from '$lib/store/store';
	import { userXp, userLevel } from '$lib/store/xp-store';
	import { showXpToast } from '$lib/helpers/toast-helpers';
	import { LEVEL_TIERS } from '$lib/helpers/xp-levels';
	import { getBrowserInfo } from '$lib/helpers/get-browser-info';
	import { normalizeArabicText, normalizeArabicTextLight } from '$lib/utils/arabic-normalization';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import AudioLoading from '$lib/components/AudioLoading.svelte';
	import levenshtein from 'fast-levenshtein';

	interface Props {
		data: ConjugationExerciseSchema;
		dialect: Dialect;
		onNewVerb: () => void;
		onAdvance?: () => void;
	}

	let { data, dialect, onNewVerb, onAdvance }: Props = $props();

	type PracticeMode = 'typing' | 'quiz' | 'speak';
	let mode = $state<PracticeMode>('typing');

	const SPEAK_CORRECT_THRESHOLD = 75;

	// ── Constants ───────────────────────────────────────────────────────────────
	const ALL_TENSES: VerbTense[] = ['past', 'present', 'future'];
	const ALL_FORMS: VerbForm[] = ['affirmative', 'negative'];
	const ALL_PERSONS: VerbPerson[] = ['ana', 'enta', 'enti', 'howa', 'heya', 'ehna', 'entu', 'homma'];

	const personDisplay: Record<VerbPerson, { arabic: string; english: string }> = {
		ana: { arabic: 'أنا', english: 'I' },
		enta: { arabic: 'إنتَ', english: 'you (m)' },
		enti: { arabic: 'إنتِ', english: 'you (f)' },
		howa: { arabic: 'هو', english: 'he' },
		heya: { arabic: 'هي', english: 'she' },
		ehna: { arabic: 'إحنا', english: 'we' },
		entu: { arabic: 'إنتوا', english: 'you (pl)' },
		homma: { arabic: 'هم', english: 'they' }
	};

	function tenseLabel(t: VerbTense) {
		return t === 'past' ? 'Past' : t === 'present' ? 'Present' : 'Future';
	}
	function formLabel(f: VerbForm) {
		return f === 'affirmative' ? 'Affirmative' : 'Negative';
	}

	// ── Filter state (all on by default) ─────────────────────────────────────────
	let tenseOn = $state<Record<VerbTense, boolean>>({ past: true, present: true, future: true });
	let formOn = $state<Record<VerbForm, boolean>>({ affirmative: true, negative: true });
	let personOn = $state<Record<VerbPerson, boolean>>({
		ana: true, enta: true, enti: true, howa: true, heya: true, ehna: true, entu: true, homma: true
	});

	function toggleTense(t: VerbTense) { tenseOn[t] = !tenseOn[t]; }
	function toggleForm(f: VerbForm) { formOn[f] = !formOn[f]; }
	function togglePerson(p: VerbPerson) { personOn[p] = !personOn[p]; }

	// ── Exercises ────────────────────────────────────────────────────────────────
	type ExerciseItem = { entry: ConjugationEntry; tense: VerbTense; form: VerbForm };

	// Full flat pool (used for quiz distractors regardless of filters)
	const allExercises = $derived.by((): ExerciseItem[] => {
		const out: ExerciseItem[] = [];
		for (const tense of ALL_TENSES) {
			for (const form of ALL_FORMS) {
				for (const entry of data.conjugations[tense][form]) {
					out.push({ entry: entry as ConjugationEntry, tense, form });
				}
			}
		}
		return out;
	});

	const exercises = $derived.by((): ExerciseItem[] =>
		allExercises.filter(
			(ex) => tenseOn[ex.tense] && formOn[ex.form] && personOn[ex.entry.person]
		)
	);

	const filterSig = $derived(
		ALL_TENSES.filter((t) => tenseOn[t]).join(',') + '|' +
		ALL_FORMS.filter((f) => formOn[f]).join(',') + '|' +
		ALL_PERSONS.filter((p) => personOn[p]).join(',')
	);

	let currentIndex = $state(0);
	const currentExercise = $derived(exercises[currentIndex] ?? null);

	// ── Answer state ─────────────────────────────────────────────────────────────
	let selectedOption = $state<string | null>(null);
	let answeredCorrectly = $state(false);
	let isCorrect = $state(false); // typing
	let xpAwarded = $state(false);
	let showAnswer = $state(false);
	let showHint = $state(false); // transliteration only

	// Speak mode
	let recording = $state(false);
	// Non-reactive on purpose: these are never rendered, and making them $state
	// would turn resetSpeak()'s `mediaRecorder` read into an effect dependency,
	// causing the recorder to be stopped the instant it's assigned.
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let transcribedText = $state('');
	let similarity = $state(0);
	let isTranscribing = $state(false);
	let spokeCorrectly = $state(false);
	let speakError = $state('');

	type Attempt = { letter: string; correct: boolean };
	let attempt = $state<Attempt[]>([]);
	let keyboardValue = $state('');
	let keyboard = $state<'virtual' | 'physical'>('virtual');
	let keyboardContainer: HTMLDivElement | null = $state(null);

	// ── Per-exercise example sentences (lazily fetched on a correct answer) ──────
	type ExampleSentence = { arabic: string; transliteration: string; english: string };
	type ExampleState = { status: 'loading' | 'done' | 'error'; sentence?: ExampleSentence };
	let examples = $state<Record<string, ExampleState>>({});

	function exKey(ex: ExerciseItem) {
		return `${ex.tense}|${ex.form}|${ex.entry.person}`;
	}

	async function fetchExample(ex: ExerciseItem, key: string) {
		try {
			const res = await fetch('/api/generate-conjugation-example', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ form: ex.entry.arabic, english: ex.entry.english, dialect })
			});
			if (!res.ok) throw new Error('failed');
			examples[key] = { status: 'done', sentence: (await res.json()) as ExampleSentence };
		} catch {
			examples[key] = { status: 'error' };
		}
	}

	function retryExample(ex: ExerciseItem) {
		const key = exKey(ex);
		examples[key] = { status: 'loading' };
		fetchExample(ex, key);
	}

	const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;
	const isSafari = getBrowserInfo();

	// Reset current index whenever the filter selection changes.
	$effect(() => {
		filterSig;
		currentIndex = 0;
	});

	// Reset per-exercise answer state when moving exercise or changing filters.
	$effect(() => {
		currentIndex;
		filterSig;
		selectedOption = null;
		answeredCorrectly = false;
		isCorrect = false;
		xpAwarded = false;
		showAnswer = false;
		showHint = false;
		attempt = [];
		keyboardValue = '';
		resetSpeak();
		resetVirtualKeyboard();
	});

	// Award XP once when an exercise is answered correctly (any mode).
	$effect(() => {
		const correct = isCorrect || answeredCorrectly || spokeCorrectly;
		if (correct && !xpAwarded) {
			xpAwarded = true;
			fetch('/api/award-xp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventType: 'conjugation_correct' })
			})
				.then((r) => r.json())
				.then((d) => {
					if (d.success) {
						userXp.set(d.newTotalXp);
						if (d.leveledUp) userLevel.set(d.newLevel);
						const title = LEVEL_TIERS.find((t) => t.level === d.newLevel)?.title;
						showXpToast(d.xpAwarded, d.leveledUp, d.newLevel, title);
					}
				})
				.catch(() => {});
		}
	});

	// Fetch the example sentence the first time an exercise is answered correctly.
	$effect(() => {
		const correct = isCorrect || answeredCorrectly || spokeCorrectly;
		if (!correct || !currentExercise) return;
		const key = exKey(currentExercise);
		if (examples[key]) return;
		examples[key] = { status: 'loading' };
		fetchExample(currentExercise, key);
	});

	// Keep keyboards styled on hue / theme changes.
	$effect(() => {
		hue.subscribe(() => updateKeyboardStyle());
	});
	$effect(() => {
		theme.subscribe(() => updateKeyboardStyle());
	});

	function resetVirtualKeyboard() {
		if (typeof document === 'undefined') return;
		if (keyboard === 'virtual' && mode === 'typing' && keyboardContainer) {
			const container = keyboardContainer;
			setTimeout(() => {
				const el = container.querySelector('arabic-keyboard') as Keyboard | null;
				if (el && typeof el.resetValue === 'function') el.resetValue();
				updateKeyboardStyle(el ?? undefined);
			}, 0);
		} else {
			setTimeout(() => updateKeyboardStyle(), 0);
		}
	}

	// ── Typing comparison (ported from SentenceBlock) ────────────────────────────
	function compareMyInput(value: string) {
		const target = currentExercise?.entry.arabic ?? '';
		const normalizedInput = normalizeArabicText(value.trim());
		const normalizedTarget = normalizeArabicText(target.trim());

		const lightTarget = normalizeArabicTextLight(target.trim());
		const lightInput = normalizeArabicTextLight(value.trim());

		const visualInputArr = value.trim().split('');
		const normalizedInputArr = lightInput.split('');
		const normalizedTargetArr = lightTarget.split('');

		attempt = visualInputArr.map((letter, index) => ({
			letter,
			correct: (normalizedInputArr[index] || '') === (normalizedTargetArr[index] || '')
		}));

		if (
			normalizedInput === normalizedTarget &&
			value.trim().length > 0 &&
			normalizedTarget.length > 0
		) {
			isCorrect = true;
			if (keyboard === 'virtual' && mode === 'typing' && keyboardContainer) {
				const el = keyboardContainer.querySelector('arabic-keyboard') as Keyboard | null;
				if (el && typeof el.resetValue === 'function') el.resetValue();
			}
		} else if (value.trim().length === 0 && !isCorrect) {
			isCorrect = false;
		}
	}

	function checkInput() {
		if (keyboard !== 'virtual' || mode !== 'typing') return;
		const el = keyboardContainer?.querySelector('arabic-keyboard') as Keyboard | null;
		if (!el || typeof el.getTextAreaValue !== 'function') return;
		const value = el.getTextAreaValue();
		if (typeof value === 'string') compareMyInput(value);
	}

	function onRegularKeyboard(e: Event) {
		const value = (e.target as HTMLTextAreaElement).value;
		keyboardValue = value;
		compareMyInput(value);
	}

	function toggleKeyboard() {
		keyboard = keyboard === 'virtual' ? 'physical' : 'virtual';
	}

	onMount(() => {
		if (isMobile()) keyboard = 'physical';
		updateKeyboardStyle();

		document.addEventListener('keydown', checkInput);
		document.addEventListener('click', checkInput);
		const intervalId = setInterval(checkInput, 300);

		return () => {
			document.removeEventListener('keydown', checkInput);
			document.removeEventListener('click', checkInput);
			clearInterval(intervalId);
		};
	});

	// ── Speak mode (pronunciation, judged via levenshtein similarity) ────────────
	function resetSpeak() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
		recording = false;
		mediaRecorder = null;
		audioChunks = [];
		transcribedText = '';
		similarity = 0;
		isTranscribing = false;
		spokeCorrectly = false;
		speakError = '';
	}

	async function startRecording() {
		speakError = '';

		if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
			speakError = 'Microphone access needs a secure context (https or localhost). Open the app there and allow the mic.';
			return;
		}

		let stream: MediaStream;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch (err) {
			console.error('Microphone access error:', err);
			speakError = 'Could not access the microphone. Please allow microphone access in your browser and try again.';
			recording = false;
			return;
		}

		mediaRecorder = new MediaRecorder(stream);

		mediaRecorder.ondataavailable = (event: BlobEvent) => {
			if (event.data.size > 0) audioChunks.push(event.data);
		};

		mediaRecorder.onstop = async () => {
			const blob = new Blob(audioChunks, { type: 'audio/webm' });
			audioChunks = [];
			isTranscribing = true;

			const target = currentExercise?.entry.arabic ?? '';
			try {
				const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
				const formData = new FormData();
				formData.append('audio', file);
				formData.append('dialect', dialect);
				formData.append('language', 'ar');

				const response = await fetch('/api/speech-to-text', { method: 'POST', body: formData });
				const result = await response.json();
				transcribedText = result.text || '';
			} catch (err) {
				console.error('Speech-to-text error:', err);
				transcribedText = '';
			} finally {
				isTranscribing = false;
			}

			if (transcribedText) {
				const said = transcribedText.replace(/\./g, '');
				const distance = levenshtein.get(normalizeArabicText(target), normalizeArabicText(said));
				const maxLength = Math.max(normalizeArabicText(target).length, normalizeArabicText(said).length) || 1;
				similarity = (1 - distance / maxLength) * 100;
				spokeCorrectly = similarity >= SPEAK_CORRECT_THRESHOLD;
			}
		};

		mediaRecorder.start();
		recording = true;
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			recording = false;
		}
	}

	function toggleRecording() {
		if (recording) stopRecording();
		else startRecording();
	}

	function speakFeedback(score: number): { text: string; emoji: string; color: string } {
		if (score >= 90) return { text: 'Excellent!', emoji: '🎉', color: 'text-green-700' };
		if (score >= 75) return { text: 'Great job!', emoji: '👏', color: 'text-emerald-500' };
		if (score >= 60) return { text: 'Good effort!', emoji: '👍', color: 'text-yellow-500' };
		if (score >= 40) return { text: 'Keep practicing!', emoji: '💪', color: 'text-orange-500' };
		return { text: 'Try again!', emoji: '🔄', color: 'text-red-500' };
	}

	// ── Quiz options ─────────────────────────────────────────────────────────────
	type Option = { arabic: string; transliteration: string; isCorrect: boolean };

	function shuffle<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	const options = $derived.by((): Option[] => {
		if (!currentExercise) return [];
		const correct: Option = {
			arabic: currentExercise.entry.arabic,
			transliteration: currentExercise.entry.transliteration,
			isCorrect: true
		};
		const seen = new Set<string>([correct.arabic]);
		const distractors: Option[] = [];
		for (const ex of shuffle([...allExercises])) {
			if (distractors.length >= 3) break;
			if (seen.has(ex.entry.arabic)) continue;
			seen.add(ex.entry.arabic);
			distractors.push({
				arabic: ex.entry.arabic,
				transliteration: ex.entry.transliteration,
				isCorrect: false
			});
		}
		while (distractors.length < 3) {
			distractors.push({ arabic: '—', transliteration: '—', isCorrect: false });
		}
		return shuffle([correct, ...distractors]);
	});

	function selectOption(arabic: string, correct: boolean) {
		if (selectedOption !== null) return;
		selectedOption = arabic;
		answeredCorrectly = correct;
	}

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

	// ── Navigation ───────────────────────────────────────────────────────────────
	function nextExercise() {
		if (exercises.length === 0) return;
		currentIndex = (currentIndex + 1) % exercises.length;
		onAdvance?.();
	}

	function setMode(m: PracticeMode) {
		mode = m;
		selectedOption = null;
		answeredCorrectly = false;
		isCorrect = false;
		xpAwarded = false;
		showAnswer = false;
		showHint = false;
		attempt = [];
		keyboardValue = '';
		resetSpeak();
		resetVirtualKeyboard();
	}

	function pill(active: boolean) {
		return active
			? 'px-3 py-1.5 text-sm font-semibold rounded-lg bg-amber-600 text-white transition-all'
			: 'px-3 py-1.5 text-sm font-semibold rounded-lg bg-tile-500 text-text-300 border border-tile-600 hover:bg-tile-600 transition-all';
	}

	function chip(active: boolean) {
		return active
			? 'px-3 py-1.5 text-sm font-medium rounded-lg bg-sky-600 text-white border border-sky-500 transition-all'
			: 'px-3 py-1.5 text-sm font-medium rounded-lg bg-tile-300 text-text-300 border border-tile-600 hover:bg-tile-400 transition-all';
	}
</script>

{#snippet exampleReward(ex: ExerciseItem)}
	{@const state = examples[exKey(ex)]}
	{#if state}
		<div class="mt-3 p-3 bg-tile-300 border border-tile-500 rounded-lg text-left">
			<div class="flex items-center justify-between gap-2 mb-1">
				<p class="text-xs font-bold text-text-200 uppercase tracking-wide">Example sentence</p>
				{#if state.status === 'done' && state.sentence}
					<AudioButton text={state.sentence.arabic} {dialect} className="!p-1.5 bg-sky-600 !text-white hover:!bg-sky-700 rounded-lg" />
				{/if}
			</div>
			{#if state.status === 'loading'}
				<p class="text-sm text-text-200 italic">Loading an example…</p>
			{:else if state.status === 'error'}
				<p class="text-sm text-text-200 italic">
					Couldn't load an example.
					<button onclick={() => retryExample(ex)} class="underline hover:text-text-300">Retry</button>
				</p>
			{:else if state.sentence}
				<p class="text-xl text-text-300" dir="rtl">{state.sentence.arabic}</p>
				<p class="text-sm text-text-200">{state.sentence.transliteration}</p>
				<p class="text-sm text-text-300">{state.sentence.english}</p>
			{/if}
		</div>
	{/if}
{/snippet}

<div class="w-full max-w-6xl mx-auto">
	<!-- Verb header -->
	<div class="text-center mb-6 p-4 bg-tile-300 border border-tile-500 rounded-xl">
		<p class="text-sm text-text-200 uppercase tracking-wider mb-1">Verb</p>
		<div class="flex items-center justify-center gap-3">
			<p class="text-5xl font-bold text-text-300" dir="rtl">{data.verb.arabic}</p>
			<AudioButton text={data.verb.arabic} {dialect} className="!p-2 bg-sky-600 !text-white hover:!bg-sky-700 rounded-lg" />
		</div>
		<p class="text-xl text-text-200 mt-2">{data.verb.transliteration}</p>
		<p class="text-lg text-text-300 font-semibold">{data.verb.english}</p>
		<p class="text-sm text-text-200 mt-2">{data.rootLetters}</p>
		<span class="inline-block mt-2 px-2 py-0.5 text-xs font-semibold rounded bg-tile-500 border border-tile-600 text-text-200 uppercase tracking-wide">
			{data.verbClass}
		</span>
		{#if data.notes}
			<p class="text-sm text-text-200 mt-2 italic">{data.notes}</p>
		{/if}

		<div class="mt-3">
			<button
				onclick={onNewVerb}
				class="px-4 py-1.5 text-sm font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all"
			>
				New verb
			</button>
		</div>
	</div>

	<!-- Mode toggle -->
	<div class="flex gap-2 mb-4 justify-center">
		<button onclick={() => setMode('typing')} class={pill(mode === 'typing')}>✍️ Typing</button>
		<button onclick={() => setMode('quiz')} class={pill(mode === 'quiz')}>🧩 Quiz</button>
		<button onclick={() => setMode('speak')} class={pill(mode === 'speak')}>🎤 Speak</button>
	</div>

	<div class="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
	<!-- Filters -->
	<div class="p-4 bg-tile-400 rounded-xl border border-tile-500 space-y-3 lg:sticky lg:top-4">
		<div>
			<p class="text-xs font-bold text-text-200 uppercase tracking-wide mb-2">Tenses</p>
			<div class="flex flex-wrap gap-2">
				{#each ALL_TENSES as t (t)}
					<button onclick={() => toggleTense(t)} class={chip(tenseOn[t])}>{tenseLabel(t)}</button>
				{/each}
			</div>
		</div>
		<div>
			<p class="text-xs font-bold text-text-200 uppercase tracking-wide mb-2">Forms</p>
			<div class="flex flex-wrap gap-2">
				{#each ALL_FORMS as f (f)}
					<button onclick={() => toggleForm(f)} class={chip(formOn[f])}>{formLabel(f)}</button>
				{/each}
			</div>
		</div>
		<div>
			<p class="text-xs font-bold text-text-200 uppercase tracking-wide mb-2">Persons</p>
			<div class="flex flex-wrap gap-2">
				{#each ALL_PERSONS as p (p)}
					<button onclick={() => togglePerson(p)} class={chip(personOn[p])}>
						{personDisplay[p].english}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="min-w-0">
	{#if exercises.length === 0}
		<p class="text-center text-text-200 py-8">No exercises match the current filters. Re-enable a tense, form, or person above.</p>
	{:else if currentExercise}
		<!-- Progress -->
		<div class="mb-4">
			<p class="text-sm text-text-200 text-center mb-1">{currentIndex + 1} / {exercises.length}</p>
			<div class="w-full h-2 bg-tile-400 rounded-full">
				<div class="h-2 bg-green-500 rounded-full transition-all" style="width: {((currentIndex + 1) / exercises.length) * 100}%"></div>
			</div>
		</div>

		<!-- Prompt card -->
		<div class="bg-tile-300 border border-tile-500 rounded-xl p-6 mb-4">
			<div class="flex gap-2 justify-center mb-4">
				<span class="px-2 py-0.5 text-xs font-semibold rounded bg-blue-600 text-white uppercase tracking-wide">{tenseLabel(currentExercise.tense)}</span>
				<span class="px-2 py-0.5 text-xs font-semibold rounded {currentExercise.form === 'affirmative' ? 'bg-green-600' : 'bg-red-600'} text-white uppercase tracking-wide">{formLabel(currentExercise.form)}</span>
			</div>

			<div class="text-center mb-6">
				<p class="text-4xl font-bold text-text-300 mb-1" dir="rtl">{personDisplay[currentExercise.entry.person].arabic}</p>
				<p class="text-xl text-text-200">{personDisplay[currentExercise.entry.person].english} — "{currentExercise.entry.english}"</p>
			</div>

			{#if mode === 'quiz'}
				<!-- Quiz options -->
				<div class="grid grid-cols-2 gap-3 mb-4">
					{#each options as opt (opt.arabic)}
						<button onclick={() => selectOption(opt.arabic, opt.isCorrect)} disabled={selectedOption !== null} class={optionClass(opt)}>
							<span class="text-2xl font-arabic block mb-1" dir="rtl">{opt.arabic}</span>
							<span class="text-xs text-inherit opacity-80">{opt.transliteration}</span>
						</button>
					{/each}
				</div>

				{#if selectedOption !== null}
					{#if answeredCorrectly}
						<div class="bg-green-700 text-white text-center py-3 rounded-lg text-base font-semibold">Correct! — {currentExercise.entry.english}</div>
					{:else}
						<div class="bg-red-700 text-white text-center py-3 rounded-lg text-base font-semibold">
							Not quite — the answer is <span class="font-arabic" dir="rtl">{currentExercise.entry.arabic}</span> ({currentExercise.entry.transliteration})
						</div>
					{/if}
					<div class="flex justify-center mt-3">
						<AudioButton text={currentExercise.entry.arabic} {dialect} className="!px-3 !py-1.5 text-sm font-semibold bg-sky-600 !text-white hover:!bg-sky-700 rounded-lg gap-1.5">
							<span>🔊 Hear answer</span>
						</AudioButton>
					</div>
					{#if answeredCorrectly}
						{@render exampleReward(currentExercise)}
					{/if}
				{/if}
			{:else if mode === 'typing'}
				<!-- Typing -->
				{#if isCorrect}
					<div class="mb-4 bg-green-100 py-3 px-4 text-center border-2 border-green-200 rounded-lg">
						<p class="text-lg font-bold text-text-300"><span dir="rtl">{currentExercise.entry.arabic}</span> is correct!</p>
					</div>
					{@render exampleReward(currentExercise)}
				{/if}

				<div class="text-center mb-4 min-h-[2.5rem]">
					<span class="text-2xl sm:text-3xl">
						{#if isSafari}
							{@html attempt
								.map(({ letter, correct }) => `<span class="${cn('text-2xl sm:text-3xl', { 'text-green-700': correct, 'text-red-500': !correct })}">&zwj;&zwj;${letter}&zwj;&zwj;</span>`)
								.join('')}
						{:else}
							{@html attempt
								.map(({ letter, correct }) => `<span class="${cn('text-2xl sm:text-3xl', { 'text-green-700': correct, 'text-red-500': !correct })}">${letter}</span>`)
								.join('')}
						{/if}
					</span>
				</div>

				<div class="flex flex-wrap items-center justify-between gap-2 mb-3">
					<button onclick={toggleKeyboard} class="flex items-center gap-2 px-3 py-1.5 text-sm text-text-300 bg-tile-400 hover:bg-tile-500 border border-tile-500 rounded-lg transition-colors">
						<span>{keyboard === 'virtual' ? '📱 Use native keyboard' : '⌨️ Use virtual keyboard'}</span>
					</button>
					<div class="flex flex-wrap items-center gap-2">
						<button onclick={() => (showHint = !showHint)} class="px-3 py-1.5 text-sm font-semibold rounded-lg {showHint ? 'bg-amber-600 text-white' : 'bg-tile-500 text-text-300 border border-tile-600 hover:bg-tile-600'} transition-all">
							💡 {showHint ? 'Hide' : 'Hint'}
						</button>
						<AudioButton text={currentExercise.entry.arabic} {dialect} className="!px-3 !py-1.5 text-sm font-semibold bg-sky-600 !text-white hover:!bg-sky-700 rounded-lg gap-1.5">
							<span>🔊 Hear answer</span>
						</AudioButton>
						<button onclick={() => (showAnswer = !showAnswer)} class="px-3 py-1.5 text-sm font-semibold rounded-lg {showAnswer ? 'bg-amber-600 text-white' : 'bg-tile-500 text-text-300 border border-tile-600 hover:bg-tile-600'} transition-all">
							{showAnswer ? 'Hide' : 'Show'} answer
						</button>
					</div>
				</div>

				{#if showHint}
					<p class="text-center text-base text-text-200 mb-3" dir="ltr">Hint: {currentExercise.entry.transliteration}</p>
				{/if}

				{#if showAnswer}
					<p class="text-center text-2xl text-text-300 mb-3" dir="rtl">{currentExercise.entry.arabic}
						<span class="block text-sm text-text-200" dir="ltr">{currentExercise.entry.transliteration}</span>
					</p>
				{/if}

				<div bind:this={keyboardContainer}>
					<div class={cn('block', { hidden: keyboard !== 'virtual' })}>
						<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
					</div>
					<textarea
						oninput={onRegularKeyboard}
						bind:value={keyboardValue}
						placeholder="اكتب هنا..."
						dir="rtl"
						class={cn('block min-h-32 w-full text-2xl sm:text-3xl font-arabic text-text-300 bg-tile-200 border-2 border-tile-500 rounded-xl p-4 focus:border-tile-700 focus:outline-none focus:ring-2 focus:ring-tile-600/50 transition-all placeholder:text-text-100', { hidden: keyboard === 'virtual' })}
					></textarea>
				</div>
			{:else if mode === 'speak'}
				<!-- Speak -->
				<div class="flex flex-col items-center gap-4">
					<button
						onclick={toggleRecording}
						disabled={isTranscribing}
						class="group flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed {recording ? 'bg-red-500/20 border-red-500' : 'bg-tile-400 border-tile-500 hover:border-tile-600'}"
					>
						<div class="w-20 h-20 rounded-full flex items-center justify-center {recording ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-red-400 to-red-600'}">
							{#if recording}
								<AudioLoading />
							{:else}
								<svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
									<path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
								</svg>
							{/if}
						</div>
						<span class="text-base font-bold {recording ? 'text-red-500' : 'text-text-300'}">
							{#if isTranscribing}Processing…{:else if recording}Tap to stop{:else}Tap to speak{/if}
						</span>
					</button>
					<p class="text-sm text-text-200 text-center">
						Say the {tenseLabel(currentExercise.tense).toLowerCase()} {formLabel(currentExercise.form).toLowerCase()} form for "{personDisplay[currentExercise.entry.person].english}"
					</p>

					{#if speakError}
						<p class="text-sm text-red-600 text-center max-w-md">{speakError}</p>
					{/if}

					{#if isTranscribing}
						<div class="w-12 h-12 border-4 border-tile-500 border-t-tile-700 rounded-full animate-spin"></div>
					{:else if transcribedText}
						{@const fb = speakFeedback(similarity)}
						<div class="w-full p-4 bg-tile-400 border border-tile-500 rounded-xl text-center">
							<div class="flex items-center justify-center gap-3 mb-3">
								<span class="text-4xl">{fb.emoji}</span>
								<div>
									<p class="text-3xl font-bold {fb.color}">{Math.round(similarity)}%</p>
									<p class="text-sm font-semibold {fb.color}">{fb.text}</p>
								</div>
							</div>
							<p class="text-xs text-text-200 uppercase tracking-wider font-bold mb-1">You said</p>
							<p class="text-2xl text-text-300 font-arabic" dir="rtl">{transcribedText}</p>
							<p class="text-xs text-text-200 uppercase tracking-wider font-bold mt-3 mb-1">Target</p>
							<p class="text-2xl text-text-300 font-arabic" dir="rtl">{currentExercise.entry.arabic}</p>
							<span class="block text-sm text-text-200">{currentExercise.entry.transliteration}</span>
							<div class="flex justify-center mt-3">
								<AudioButton text={currentExercise.entry.arabic} {dialect} className="!px-3 !py-1.5 text-sm font-semibold bg-sky-600 !text-white hover:!bg-sky-700 rounded-lg gap-1.5">
									<span>🔊 Hear answer</span>
								</AudioButton>
							</div>
							{#if spokeCorrectly}
								{@render exampleReward(currentExercise)}
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Next -->
		{#if (mode === 'quiz' && selectedOption !== null) || (mode === 'typing' && isCorrect) || (mode === 'speak' && transcribedText)}
			<div class="flex justify-center mb-4">
				<button onclick={nextExercise} class="px-6 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-all">Next →</button>
			</div>
		{:else if mode === 'typing' || mode === 'speak'}
			<div class="flex justify-center mb-4">
				<button onclick={nextExercise} class="px-4 py-1.5 text-sm font-semibold rounded-lg bg-tile-500 text-text-300 border border-tile-600 hover:bg-tile-600 transition-all">Skip →</button>
			</div>
		{/if}
	{/if}
	</div>
	</div>
</div>
