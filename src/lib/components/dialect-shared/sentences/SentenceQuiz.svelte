<script lang="ts">
	import { type sentenceObjectItem } from '$lib/types/index';
  import SaveButton from '$lib/components/SaveButton.svelte';
	import { userXp, userLevel } from '$lib/store/xp-store';
	import { showXpToast } from '$lib/helpers/toast-helpers';
	import { LEVEL_TIERS } from '$lib/helpers/xp-levels';
	import { trackEvent } from '$lib/analytics';

	interface Props {
		index?: number;
		sentences: sentenceObjectItem[];
    resetSentences: () => void;
    next: () => void;
	}

	let { index = 0, sentences, resetSentences, next }: Props = $props();

	let isCorrect = $state(false);
	let isIncorrect = $state(false);
	let xpAwardedThisQuestion = $state(false);

	$effect(() => {
		if (isCorrect && !xpAwardedThisQuestion) {
			xpAwardedThisQuestion = true;
			fetch('/api/award-xp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventType: 'sentence_correct' })
			})
				.then((r) => r.json())
				.then((data) => {
					if (data.success) {
						userXp.set(data.newTotalXp);
						if (data.leveledUp) userLevel.set(data.newLevel);
						const title = LEVEL_TIERS.find((t) => t.level === data.newLevel)?.title;
						showXpToast(data.xpAwarded, data.leveledUp, data.newLevel, title);
					}
				})
				.catch(() => {});
		}
	});
	let showHint = $state(false);
	let showAnswer = $state(false);
	let showTashkeel = $state(false);
	let selectedObj = $state({} as sentenceObjectItem);
	let selected = $state<string | null>(null);
	
	function shuffleArray(array: any) {
		const _arr = [...array];
		for (let i = _arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[_arr[i], _arr[j]] = [_arr[j], _arr[i]];
		}
		return _arr;
	}

	let targetSentence = $derived(sentences[index]);

	// Wrong answers come from the other sentences in the set. Skip the answer
	// itself and anything whose Arabic or English repeats an option already
	// picked, so all options on screen are distinct.
	let sentenceObj = $derived.by(() => {
		if (!targetSentence) return null;

		const seenArabic = new Set([targetSentence.arabic.trim()]);
		const seenEnglish = new Set([targetSentence.english.trim()]);
		const distractors: sentenceObjectItem[] = [];

		for (const candidate of shuffleArray(sentences) as sentenceObjectItem[]) {
			if (distractors.length === 3) break;
			const arabic = candidate.arabic.trim();
			const english = candidate.english.trim();
			if (seenArabic.has(arabic) || seenEnglish.has(english)) continue;
			seenArabic.add(arabic);
			seenEnglish.add(english);
			distractors.push(candidate);
		}

		return {
			answer: targetSentence,
			options: shuffleArray([targetSentence, ...distractors]) as sentenceObjectItem[]
		};
	});

	function handleClick(value: string) {
		if (!sentenceObj) return;
		selected = value;

		selectedObj = sentenceObj.options.find((o) => o.english === value) ?? ({} as sentenceObjectItem);

		if (selected === sentenceObj.answer.english) {
			isCorrect = true;
			isIncorrect = false;
		} else {
			isIncorrect = true;
			isCorrect = false;
		}
		trackEvent('sentences_quiz_answer_selected', { correct: isCorrect });
	}

	$effect(() => {
		if (sentenceObj) {
			selectedObj = {} as sentenceObjectItem;
			showHint = false;
			showTashkeel = false;
			selected = null;
			isCorrect = false;
			isIncorrect = false;
			xpAwardedThisQuestion = false;
		}
	});
</script>

<section class="py-2">
{#if sentenceObj}
	{#if isCorrect}
		<p class="note note--good mb-4">
			<span class="font-arabic" dir="rtl">{sentenceObj.answer.arabic}</span> is correct
		</p>
	{/if}
	{#if isIncorrect}
		<p class="note note--bad mb-4">
			<span class="font-arabic" dir="rtl">{selectedObj.arabic}</span> is incorrect
		</p>
	{/if}

	<div class="toolbar">
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				onclick={() => (showHint = !showHint)}
				aria-pressed={showHint}
				class="chip {showHint ? 'is-on' : ''}">Hint</button
			>
			<button
				type="button"
				onclick={() => (showAnswer = !showAnswer)}
				aria-pressed={showAnswer}
				class="chip {showAnswer ? 'is-on' : ''}">Answer</button
			>
			{#if sentenceObj.answer.arabicTashkeel}
				<button
					type="button"
					onclick={() => (showTashkeel = !showTashkeel)}
					aria-pressed={showTashkeel}
					class="chip {showTashkeel ? 'is-on' : ''}">Tashkeel</button
				>
			{/if}
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<SaveButton
				type="sentence"
				objectToSave={{
					arabic: sentenceObj.answer.arabic,
					english: sentenceObj.answer.english,
					transliterated: sentenceObj.answer.transliteration
				}}
				className="!rounded-full !px-4 !py-2 !text-[0.83rem] !shadow-none"
			/>
			<button type="button" onclick={resetSentences} class="chip">Reset</button>
		</div>
	</div>

	<div class="prompt">
		<h1 class="prompt-text">{sentenceObj.answer.english}</h1>
		{#if showHint}
			<p class="reveal">{sentenceObj.answer.transliteration}</p>
		{/if}
		{#if showAnswer}
			<p class="reveal reveal--ar font-arabic" dir="rtl">
				{showTashkeel && sentenceObj.answer.arabicTashkeel
					? sentenceObj.answer.arabicTashkeel
					: sentenceObj.answer.arabic}
			</p>
		{/if}
	</div>

	<fieldset class="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
		<legend class="sr-only">Choose the correct Arabic translation</legend>
		{#each sentenceObj.options as opt, i (i)}
			{@const isPicked = selected === opt.english}
			<button
				type="button"
				onclick={() => handleClick(opt.english)}
				aria-pressed={isPicked}
				class="pick {isPicked ? 'is-on' : ''}"
				style={isPicked
					? isCorrect
						? '--accent:#22c55e; --deep:#15803d;'
						: '--accent:#f43f5e; --deep:#9f1239;'
					: '--accent:#0ea5e9; --deep:#0369a1;'}
				dir="rtl"
			>
				<span class="pick-text font-arabic">{opt.arabic}</span>
			</button>
		{/each}
	</fieldset>
{/if}
</section>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		margin-bottom: 1.25rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		padding: 0.45rem 0.95rem;
		border-radius: 100px;
		font-size: 0.83rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		cursor: pointer;
		transition:
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.18s ease,
			border-color 0.18s ease,
			color 0.18s ease;
	}
	.chip:hover {
		transform: translateY(-2px);
		border-color: var(--tile6);
		color: var(--text1);
	}
	.chip.is-on {
		background: #0ea5e9;
		border-color: #0369a1;
		color: #fff;
	}

	/* Notes — tint carries the meaning, text stays on the theme's own ink */
	.note {
		font-size: 0.95rem;
		line-height: 1.5;
		font-weight: 600;
		border-radius: 0.8rem;
		padding: 0.7rem 0.95rem;
		color: var(--text1);
	}
	.note--good {
		background: color-mix(in srgb, #10b981 18%, var(--tile3));
		box-shadow: inset 3px 0 0 #10b981;
	}
	.note--bad {
		background: color-mix(in srgb, #f43f5e 18%, var(--tile3));
		box-shadow: inset 3px 0 0 #f43f5e;
	}

	.prompt {
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1.5rem 1.25rem;
		text-align: center;
	}
	.prompt-text {
		font-size: clamp(1.4rem, 4vw, 1.9rem);
		font-weight: 600;
		line-height: 1.3;
		letter-spacing: -0.02em;
		color: var(--text1);
	}
	.reveal {
		margin-top: 0.9rem;
		font-size: 1.05rem;
		font-style: italic;
		color: var(--text2);
	}
	.reveal--ar {
		font-size: 1.6rem;
		font-style: normal;
		color: var(--text1);
	}

	.pick {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 4rem;
		padding: 0.85rem 1rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		cursor: pointer;
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.18s ease,
			box-shadow 0.18s ease,
			background 0.18s ease;
	}
	.pick:hover {
		transform: translateY(-3px);
		border-color: var(--accent);
		box-shadow: 0 6px 0 var(--deep);
	}
	.pick:active {
		transform: translateY(1px);
		box-shadow: 0 1px 0 var(--deep);
	}
	.pick.is-on {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, var(--tile3));
		box-shadow: 0 4px 0 var(--deep);
	}
	.pick-text {
		font-size: 1.3rem;
		font-weight: 500;
		line-height: 1.6;
		color: var(--text1);
	}

	@media (prefers-reduced-motion: reduce) {
		.chip,
		.pick {
			transition: none;
		}
		.chip:hover,
		.pick:hover {
			transform: none;
		}
	}
</style>
