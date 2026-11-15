<script lang="ts">
	import { onMount } from 'svelte';
	import { type Dialect, type Keyboard } from '$lib/types/index';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import { normalizeArabicText, normalizeArabicTextLight, stripArabicDiacritics } from '$lib/utils/arabic-normalization';
	import { arabicRunsHtml } from '$lib/helpers/arabic-runs';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { userXp, userLevel } from '$lib/store/xp-store';
	import { showXpToast } from '$lib/helpers/toast-helpers';
	import { LEVEL_TIERS } from '$lib/helpers/xp-levels';
	import { trackEvent } from '$lib/analytics';

	interface Props {
		sentence: {
			arabic: string;
			arabicTashkeel?: string;
			english: string;
			transliteration: string;
		};
		dialect: Dialect;
		onContinue: () => void;
	}

	let { sentence, dialect, onContinue }: Props = $props();

	// Same default as SentenceBlock: the on-screen Arabic keyboard on desktop, the device keyboard on phones.
	let keyboard = $state<'virtual' | 'physical'>('virtual');
	let keyboardWrap = $state<HTMLDivElement | null>(null);
	let typed = $state('');
	let checked = $state(false);
	let correct = $state(false);
	let showHint = $state(false);
	let showAnswer = $state(false);
	// Trace: the answer sits dimmed on the board and fills in as you type.
	let trace = $state(false);

	const answer = $derived(sentence.arabicTashkeel || sentence.arabic);
	const matches = (value: string) =>
		normalizeArabicText(value).replace(/\s+/g, ' ').trim() ===
		normalizeArabicText(sentence.arabic).replace(/\s+/g, ' ').trim();

	const escape = (c: string) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c);

	// Letters as written, minus tashkeel, so positions line up; each letter is normalized only to compare.
	const letters = (s: string) => stripArabicDiacritics(s).trim().split('');
	const same = (a: string, b: string | undefined) => b !== undefined && normalizeArabicTextLight(a) === normalizeArabicTextLight(b);

	// Each typed letter compared with the answer's letter at the same position, as SentenceBlock does:
	// trace fills the faded answer in (ok) and typing colours each letter (good / bad).
	const boardHtml = $derived.by(() => {
		const target = letters(sentence.arabic);
		const input = letters(typed);
		const chars = trace
			? target.map((char, i) => ({ char, state: i >= input.length ? 'pending' : same(input[i], char) ? 'ok' : 'bad' }))
			: input.map((char, i) => ({ char, state: same(char, target[i]) ? 'good' : 'bad' }));
		return arabicRunsHtml(chars, (c) => escape(c.char), (c) => c.state);
	});

	function virtualKeyboard() {
		return keyboardWrap?.querySelector('arabic-keyboard') as Keyboard | null;
	}

	/** The virtual keyboard has no input event; read it after each key press or tap. */
	function readVirtual() {
		if (keyboard !== 'virtual' || checked) return;
		const value = virtualKeyboard()?.getTextAreaValue();
		if (typeof value === 'string') typed = value;
		checkIfRight();
	}

	/** Marks the answer right as soon as it matches, so the learner doesn't have to press Check. */
	function checkIfRight() {
		if (!checked && typed.trim() && matches(typed)) check();
	}

	onMount(() => {
		if (window.innerWidth < 768) keyboard = 'physical';
		updateKeyboardStyle();
		document.addEventListener('keyup', readVirtual);
		document.addEventListener('click', readVirtual);
		return () => {
			document.removeEventListener('keyup', readVirtual);
			document.removeEventListener('click', readVirtual);
		};
	});

	function check() {
		if (keyboard === 'virtual') {
			const value = virtualKeyboard()?.getTextAreaValue();
			if (typeof value === 'string') typed = value;
		}
		correct = matches(typed);
		checked = true;
		trackEvent('lesson_write_submitted', { correct, dialect, keyboard, trace });
		if (correct) awardXp();
	}

	function tryAgain() {
		checked = false;
		correct = false;
	}

	function awardXp() {
		fetch('/api/award-xp', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ eventType: 'sentence_correct' })
		})
			.then((r) => r.json())
			.then((data) => {
				if (!data.success) return;
				userXp.set(data.newTotalXp);
				if (data.leveledUp) userLevel.set(data.newLevel);
				const title = LEVEL_TIERS.find((t) => t.level === data.newLevel)?.title;
				showXpToast(data.xpAwarded, data.leveledUp, data.newLevel, title);
			})
			.catch(() => {});
	}
</script>

<div class="write">
	<p class="english">{sentence.english}</p>

	<div class="tools">
		<button type="button" class="tool" class:on={showHint} onclick={() => (showHint = !showHint)}>Hint</button>
		<button type="button" class="tool" class:on={showAnswer} onclick={() => (showAnswer = !showAnswer)}>
			Show answer
		</button>
		<button
			type="button"
			class="tool"
			class:on={trace}
			aria-pressed={trace}
			onclick={() => {
				trace = !trace;
				trackEvent('lesson_write_trace_toggled', { on: trace });
			}}>Trace</button
		>
		<AudioButton text={sentence.arabic} {dialect} />
	</div>

	{#if showHint || showAnswer}
		<div class="reveal">
			{#if showAnswer}<p class="reveal-ar" dir="rtl">{answer}</p>{/if}
			{#if showHint}<p class="reveal-tr">{sentence.transliteration}</p>{/if}
		</div>
	{/if}

	<div
		class="board"
		class:is-right={checked && correct}
		class:is-wrong={checked && !correct}
		dir="rtl"
		aria-live="polite"
		aria-label="What you have written"
	>
		{#if typed.trim() || trace}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- letters are escaped above -->
			<span class="board-text">{@html boardHtml}</span>
		{:else}
			<span class="board-placeholder">اكتب هنا</span>
		{/if}
	</div>

	{#if checked && correct}
		<p class="feedback good">✓ Correct!</p>
	{:else if checked}
		<p class="feedback bad">Not quite. The answer is:</p>
		<p class="solution" dir="rtl">{answer}</p>
	{/if}

	<div class="seg-wrap" role="group" aria-label="Keyboard">
		<button type="button" class="seg" class:is-on={keyboard === 'virtual'} onclick={() => (keyboard = 'virtual')}>
			Arabic keyboard
		</button>
		<button type="button" class="seg" class:is-on={keyboard === 'physical'} onclick={() => (keyboard = 'physical')}>
			My keyboard
		</button>
	</div>

	<div bind:this={keyboardWrap}>
		<div class:hidden={keyboard !== 'virtual'}>
			<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
		</div>
		{#if keyboard === 'physical'}
			<textarea
				bind:value={typed}
				oninput={(e) => {
					typed = e.currentTarget.value;
					checkIfRight();
				}}
				readonly={checked}
				placeholder="اكتب هنا..."
				dir="rtl"
				rows="2"
				aria-label="Your answer in Arabic"
			></textarea>
		{/if}
	</div>

	{#if !checked}
		<button type="button" class="primary" onclick={check}>Check</button>
	{:else if correct}
		<button type="button" class="primary" onclick={onContinue}>Continue</button>
	{:else}
		<div class="row">
			<button type="button" class="secondary" onclick={onContinue}>Skip</button>
			<button type="button" class="primary" onclick={tryAgain}>Try again</button>
		</div>
	{/if}
</div>

<style>
	/* --accent/--deep and --go/--go-deep come from LessonPlayerV2, as in LessonReorderStep. */
	.write {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.english {
		font-size: 1.3rem;
		font-weight: 600;
		line-height: 1.35;
		text-align: center;
		color: var(--text1);
	}

	.seg-wrap {
		display: inline-flex;
		align-self: center;
		padding: 0.2rem;
		border-radius: 100px;
		background: var(--tile3);
		border: 2px solid var(--tile5);
	}
	.seg {
		padding: 0.3rem 0.9rem;
		border-radius: 100px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
	}
	.seg.is-on {
		background: var(--accent, var(--brand));
		color: #fff;
	}

	/* Big live view of what the learner has written (or the trace filling in). */
	.board {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 5.5rem;
		padding: 0.75rem 1rem;
		border-radius: 1.1rem;
		border: 2px dashed var(--tile5);
		background: var(--tile1);
		text-align: center;
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
	}
	.board.is-right {
		border-style: solid;
		border-color: #2e9e5b;
		background: color-mix(in srgb, #2e9e5b 12%, var(--tile1));
	}
	.board.is-wrong {
		border-style: solid;
		border-color: #d65745;
		background: color-mix(in srgb, #d65745 12%, var(--tile1));
	}
	.board-text {
		font-size: clamp(2rem, 7vw, 3rem);
		font-weight: 600;
		line-height: 1.5;
		color: var(--text1);
	}
	.board-text :global(.ok) {
		color: var(--text1);
	}
	/* Typing mode colours each letter like the Sentences page: green when it matches, red when not. */
	.board-text :global(.good) {
		color: #2e9e5b;
	}
	.board-text :global(.bad) {
		color: #d65745;
	}
	.board-text :global(.pending) {
		color: color-mix(in srgb, var(--text1) 30%, transparent);
	}
	.board-placeholder {
		font-size: 1.5rem;
		color: color-mix(in srgb, var(--text1) 30%, transparent);
	}
	.hidden {
		display: none;
	}
	textarea {
		width: 100%;
		padding: 0.85rem 1rem;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile1);
		color: var(--text1);
		font-size: 1.5rem;
		line-height: 1.6;
		resize: none;
	}
	textarea:focus {
		outline: none;
		border-color: var(--accent, var(--brand));
	}

	.feedback {
		font-weight: 600;
		text-align: center;
	}
	.feedback.good {
		color: #2e9e5b;
	}
	.feedback.bad {
		color: #d65745;
	}
	.solution {
		margin-top: -0.6rem;
		font-size: 1.4rem;
		font-weight: 600;
		text-align: center;
		color: var(--text1);
	}

	.reveal {
		text-align: center;
	}
	.reveal-ar {
		font-size: 1.4rem;
		color: var(--text1);
	}
	.reveal-tr {
		color: var(--text2);
	}

	.tools {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}
	.tool {
		padding: 0.3rem 0.85rem;
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
		transition:
			color 0.15s ease,
			border-color 0.15s ease,
			background 0.15s ease;
	}
	.tool:hover {
		border-color: var(--tile6);
		color: var(--text1);
	}
	.tool.on {
		background: var(--accent, var(--brand));
		border-color: var(--deep, var(--brand));
		color: #fff;
	}

	.row {
		display: flex;
		gap: 0.75rem;
	}
	.row > * {
		flex: 1;
	}

	.primary {
		align-self: stretch;
		padding: 0.95rem 1.2rem;
		border-radius: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		background: var(--go, #22c55e);
		box-shadow: 0 4px 0 var(--go-deep, #15803d);
		cursor: pointer;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease,
			filter 0.2s ease;
	}
	.primary:hover {
		filter: brightness(1.06);
	}
	.primary:active {
		transform: translateY(4px);
		box-shadow: 0 0 0 var(--go-deep, #15803d);
	}
	.secondary {
		padding: 0.95rem 1.2rem;
		border-radius: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text1);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		cursor: pointer;
	}
</style>
