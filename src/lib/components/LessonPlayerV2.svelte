<script lang="ts">
	import { untrack } from 'svelte';
	import { type Dialect } from '$lib/types/index';
	import type { GeneratedLessonV2, SentenceItem } from '$lib/schemas/lesson-v2-schema';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import SpeakSentence from '$lib/components/dialect-shared/speak/SpeakSentence.svelte';
	import SentenceBlock from '$lib/components/dialect-shared/sentences/SentenceBlock.svelte';
	import ArabicWordDisplay from '$lib/components/dialect-shared/story/components/ArabicWordDisplay.svelte';
	import LessonTutorStep from '$lib/components/lesson-v2/LessonTutorStep.svelte';
	import LessonMcqStep from '$lib/components/lesson-v2/LessonMcqStep.svelte';
	import { userXp, userLevel } from '$lib/store/xp-store';
	import { showXpToast } from '$lib/helpers/toast-helpers';
	import { LEVEL_TIERS } from '$lib/helpers/xp-levels';
	import { dialectAccent } from '$lib/constants/dialect-accents';

	interface Props {
		lesson: GeneratedLessonV2;
		onClose: () => void;
		onLessonComplete?: (nextLessonId?: string) => void | Promise<void>;
		user?: { id: string } | null;
		initialStep?: number;
	}

	let { lesson, onClose, onLessonComplete, user, initialStep }: Props = $props();

	let dialect = $derived(lesson.dialect as Dialect);
	// The dialect's accent, as on its learning path. Step components inherit it.
	let accent = $derived(dialectAccent(lesson.dialect));

	// Seed the step index from the prop once; subsequent navigation is local.
	let currentStepIndex = $state(untrack(() => initialStep ?? 0));
	let currentStep = $derived(lesson.steps[currentStepIndex]);
	let totalSteps = $derived(lesson.steps.length);
	let progress = $derived(Math.round(((currentStepIndex + 1) / totalSteps) * 100));
	let showCongratulations = $state(false);

	// A short label for the current step, shown in the header eyebrow.
	const STEP_LABELS: Record<string, string> = {
		content: 'Learn',
		'vocab-intro': 'New words',
		'multiple-choice': 'Quiz',
		typing: 'Write',
		reorder: 'Build',
		translate: 'Translate',
		speaking: 'Speak',
		reading: 'Read',
		'tutor-conversation': 'Converse'
	};
	let stepLabel = $derived(currentStep ? (STEP_LABELS[currentStep.type] ?? '') : '');

	// Global interlinear toggles (per-word English / transliteration).
	let showEnglish = $state(false);
	let showTransliteration = $state(true);

	// Reading define modal state (cleared on close and on advancing).
	let activeWord = $state<{
		arabic: string;
		transliterated: string;
		english: string;
		description: string;
		isLoading: boolean;
	} | null>(null);

	function saveProgress() {
		if (!user?.id || !lesson.topicId) return;
		fetch('/api/user-preferences/last-content', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				last_content_type: 'lessons',
				last_content_id: lesson.topicId,
				last_content_position: currentStepIndex,
				last_content_dialect: lesson.dialect
			})
		}).catch(() => {});
	}

	function goNext() {
		activeWord = null;
		if (currentStepIndex < totalSteps - 1) {
			currentStepIndex++;
			saveProgress();
		} else {
			showCongratulations = true;
		}
	}

	function goBack() {
		activeWord = null;
		if (showCongratulations) {
			showCongratulations = false;
			return;
		}
		if (currentStepIndex > 0) {
			currentStepIndex--;
			saveProgress();
		}
	}

	async function markComplete() {
		if (!lesson.topicId || !lesson.dialect) return;
		try {
			const res = await fetch('/api/structured-lessons/complete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ topicId: lesson.topicId, dialect: lesson.dialect })
			});
			if (res.ok) {
				const data = await res.json().catch(() => null);
				if (data?.xpResult?.success) {
					userXp.set(data.xpResult.newTotalXp);
					if (data.xpResult.leveledUp) userLevel.set(data.xpResult.newLevel);
					const title = LEVEL_TIERS.find((t) => t.level === data.xpResult.newLevel)?.title;
					showXpToast(data.xpResult.xpAwarded, data.xpResult.leveledUp, data.xpResult.newLevel, title);
				}
			}
		} catch (e) {
			console.error('Failed to mark v2 lesson complete:', e);
		}
	}

	async function handleFinish() {
		showCongratulations = false;
		await markComplete();
		if (onLessonComplete) {
			await onLessonComplete();
		} else {
			onClose();
		}
	}

	function toNested(s: SentenceItem) {
		return {
			arabic: { text: s.arabic },
			arabicTashkeel: s.arabicTashkeel ? { text: s.arabicTashkeel } : undefined,
			english: { text: s.english },
			transliteration: { text: s.transliteration },
			wordAlignments: s.wordAlignments
		};
	}

	const noop = () => {};
</script>

<div
	class="overlay"
	role="dialog"
	aria-modal="true"
	style="--accent:{accent.accent}; --deep:{accent.deep};"
>
	<header class="bar">
		<button class="icon-btn" onclick={() => { saveProgress(); onClose(); }} aria-label="Close lesson">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
		</button>
		<div class="track"><div class="fill" style="width:{progress}%"></div></div>
		<div class="count">{currentStepIndex + 1}<span>/{totalSteps}</span></div>
	</header>

	<div class="toolbar">
		{#if currentStepIndex > 0 || showCongratulations}
			<button class="ghost back" onclick={goBack}>‹ Back</button>
		{/if}
		<div class="crumbs">
			<span class="level">{lesson.level}</span>
			{#if stepLabel && !showCongratulations}<span class="step-label">{stepLabel}</span>{/if}
			<span class="title">{lesson.title}</span>
		</div>
		<div class="spacer"></div>
		<div class="toggle-group" role="group" aria-label="Show translation lines">
			<button class="tog" class:on={showEnglish} onclick={() => (showEnglish = !showEnglish)}>EN</button>
			<button class="tog" class:on={showTransliteration} onclick={() => (showTransliteration = !showTransliteration)}>Aa</button>
		</div>
		{#if !showCongratulations}
			<button class="ghost skip" onclick={goNext}>Skip ›</button>
		{/if}
	</div>

	<main class="body">
		{#if showCongratulations}
			<div class="done">
				<div class="burst" aria-hidden="true">🎉</div>
				<div class="ar-flourish">أحسنت</div>
				<h2>Lesson complete</h2>
				<p>You practiced every new word many times over — across reading, speaking, building and translating. That's how it sticks.</p>
				<button class="primary" onclick={handleFinish}>Finish &amp; continue</button>
			</div>
		{:else}
			{#key currentStepIndex}
				<div class="step">
					{#if currentStep.type === 'content'}
						<section class="card pad">
							<div class="eyebrow">Learn</div>
							<h2 class="head">{currentStep.title}</h2>
							<p class="text">{currentStep.text}</p>
							{#if currentStep.examples?.length}
								<ul class="examples">
									{#each currentStep.examples as ex (ex.arabic)}
										<li>
											<div class="ex-main">
												<div class="ex-ar" dir="rtl">{ex.arabicTashkeel || ex.arabic}</div>
												<div class="ex-tr">{ex.transliteration}</div>
												<div class="ex-en">{ex.english}</div>
											</div>
											<AudioButton text={ex.arabic} {dialect} />
										</li>
									{/each}
								</ul>
							{/if}
							<button class="primary" onclick={goNext}>Continue</button>
						</section>
					{:else if currentStep.type === 'vocab-intro'}
						<section class="card pad">
							<div class="eyebrow">New words</div>
							<h2 class="head">Learn these {currentStep.items.length}</h2>
							<div class="vocab-grid">
								{#each currentStep.items as v, i (v.arabic)}
									<div class="vocab" style="--i:{i}">
										<div class="v-top">
											<span class="v-ar" dir="rtl">{v.arabicTashkeel || v.arabic}</span>
											<AudioButton text={v.arabic} {dialect} />
										</div>
										<div class="v-tr">{v.transliteration}</div>
										<div class="v-en">{v.english}{v.partOfSpeech ? ` · ${v.partOfSpeech}` : ''}</div>
									</div>
								{/each}
							</div>
							<button class="primary" onclick={goNext}>Continue</button>
						</section>
					{:else if currentStep.type === 'multiple-choice'}
						<section class="card pad">
							<LessonMcqStep
								mode="multiple-choice"
								prompt={currentStep.prompt}
								options={currentStep.options}
								correctIndex={currentStep.correctIndex}
								{dialect}
								{showTransliteration}
								onContinue={goNext}
							/>
						</section>
					{:else if currentStep.type === 'translate'}
						<section class="card pad">
							<LessonMcqStep
								mode="translate"
								sentence={currentStep.sentence}
								options={currentStep.options}
								correctIndex={currentStep.correctIndex}
								{dialect}
								{showTransliteration}
								onContinue={goNext}
							/>
						</section>
					{:else if currentStep.type === 'typing' || currentStep.type === 'reorder'}
						<section class="card pad">
							<div class="eyebrow">{currentStep.type === 'reorder' ? 'Build' : 'Write'}</div>
							<h2 class="head">{currentStep.type === 'reorder' ? 'Build the sentence in Arabic' : 'Write it in Arabic'}</h2>
							<SentenceBlock sentence={currentStep.sentence} resetSentences={noop} next={goNext} {dialect} />
						</section>
					{:else if currentStep.type === 'speaking'}
						<section class="card pad">
							<div class="eyebrow">Speak</div>
							<h2 class="head">Say it out loud</h2>
							<SpeakSentence sentence={currentStep.sentence} resetSentences={noop} {dialect} />
							<button class="primary" onclick={goNext}>Continue</button>
						</section>
					{:else if currentStep.type === 'reading'}
						<section class="card pad">
							<div class="eyebrow">Reading</div>
							<h2 class="head">{currentStep.title}</h2>
							<div class="reading">
								{#each currentStep.sentences as s, i (i)}
									<ArabicWordDisplay
										sentence={toNested(s)}
										setActiveWord={(w) => (activeWord = w)}
										{dialect}
										{showEnglish}
										{showTransliteration}
									/>
								{/each}
							</div>
							<button class="primary" onclick={goNext}>Continue</button>
						</section>
					{:else if currentStep.type === 'tutor-conversation'}
						<section class="card pad card-wide">
							<LessonTutorStep
								{dialect}
								level={lesson.level}
								situation={currentStep.situation}
								studentRole={currentStep.studentRole}
								otherRole={currentStep.otherRole}
								goalEnglish={currentStep.goalEnglish}
								targetWords={currentStep.targetWords}
								vocab={lesson.vocab}
								onDone={goNext}
							/>
						</section>
					{/if}
				</div>
			{/key}
		{/if}
	</main>
</div>

{#if activeWord}
	<div
		class="word-modal"
		role="dialog"
		aria-modal="true"
		style="--accent:{accent.accent}; --deep:{accent.deep};"
	>
		<button class="word-scrim" onclick={() => (activeWord = null)} aria-label="Close definition"></button>
		<div class="word-box">
			<button class="icon-btn close-x" onclick={() => (activeWord = null)} aria-label="Close">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
			</button>
			{#if activeWord.isLoading}
				<p class="muted">Loading…</p>
			{:else}
				<div class="word-ar" dir="rtl">{activeWord.arabic}</div>
				{#if activeWord.transliterated}<div class="word-tr">{activeWord.transliterated}</div>{/if}
				{#if activeWord.english}<div class="word-en">{activeWord.english}</div>{/if}
				{#if activeWord.description}<p class="word-desc">{activeWord.description}</p>{/if}
			{/if}
		</div>
	</div>
{/if}


<style>
	/* Same system as /speak and the lessons pages: tile cards with a solid
	   bottom edge, the dialect's --accent/--deep pair for identity, and a green
	   --go pair for the main action. Step components inherit these variables. */
	.overlay {
		--go: #22c55e;
		--go-deep: #15803d;
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		background: var(--tile2);
		color: var(--text1);
		font-family: 'ReadexPro', system-ui, sans-serif;
	}

	/* Header */
	.bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.85rem 1.1rem;
	}
	.icon-btn {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		color: var(--text2);
		cursor: pointer;
		transition:
			color 0.18s ease,
			border-color 0.18s ease,
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.icon-btn:hover {
		color: var(--text1);
		border-color: var(--tile6);
		transform: translateY(-2px);
	}
	.icon-btn svg {
		width: 1.05rem;
		height: 1.05rem;
	}
	.track {
		flex: 1;
		height: 0.75rem;
		overflow: hidden;
		border-radius: 100px;
		background: var(--tile4);
	}
	.fill {
		height: 100%;
		border-radius: 100px;
		background: var(--accent);
		transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.count {
		font-variant-numeric: tabular-nums;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
	}
	.count span {
		font-weight: 500;
		color: var(--text2);
	}

	/* Toolbar */
	.toolbar {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0 1.1rem 0.75rem;
	}
	.crumbs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}
	.level {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text1);
		background: color-mix(in srgb, var(--accent) 16%, var(--tile3));
		border-radius: 100px;
		padding: 0.18rem 0.6rem;
	}
	.step-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}
	.title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}
	.spacer {
		flex: 1;
	}
	/* Segmented control, as on /speak */
	.toggle-group {
		display: inline-flex;
		gap: 0.2rem;
		padding: 0.2rem;
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
	}
	.tog {
		padding: 0.2rem 0.65rem;
		border-radius: 100px;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}
	.tog.on {
		background: var(--accent);
		color: #fff;
	}
	/* Chip, as on /speak */
	.ghost {
		padding: 0.3rem 0.8rem;
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
		transition:
			color 0.15s ease,
			border-color 0.15s ease,
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.ghost:hover {
		transform: translateY(-2px);
		border-color: var(--tile6);
		color: var(--text1);
	}

	/* Body + step entrance */
	.body {
		flex: 1;
		overflow-y: auto;
		padding: 1.25rem 1.1rem 5rem;
	}
	.step {
		animation: stepIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	@keyframes stepIn {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	/* Card */
	.card {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		max-width: 760px;
		margin: 0 auto;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		box-shadow: 0 5px 0 var(--tile5);
	}
	.card.pad {
		padding: 1.75rem;
	}
	.card-wide {
		max-width: 1080px;
	}
	.eyebrow {
		align-self: flex-start;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text1);
		background: color-mix(in srgb, var(--accent) 16%, var(--tile3));
		border-radius: 100px;
		padding: 0.22rem 0.65rem;
	}
	.head {
		margin-top: -0.3rem;
		font-size: 1.4rem;
		font-weight: 600;
		line-height: 1.2;
		letter-spacing: -0.02em;
		color: var(--text1);
	}
	.text {
		line-height: 1.7;
		white-space: pre-line;
		color: var(--text2);
	}

	/* Content examples */
	.examples {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		list-style: none;
	}
	.examples li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.9rem 1.1rem;
		border-radius: 1rem;
		border: 2px solid var(--tile4);
		background: var(--tile2);
		transition: border-color 0.18s ease;
	}
	.examples li:hover {
		border-color: var(--accent);
	}
	.ex-ar {
		font-size: 1.55rem;
		line-height: 1.3;
		color: var(--text1);
	}
	.ex-tr {
		font-size: 0.9rem;
		color: var(--text2);
	}
	.ex-en {
		font-size: 0.88rem;
		color: var(--text2);
	}

	/* Vocab cards */
	.vocab-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.85rem;
	}
	.vocab {
		padding: 1.1rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile4);
		background: var(--tile2);
		box-shadow: 0 4px 0 var(--tile4);
		transition:
			transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.2s ease,
			box-shadow 0.2s ease;
		animation: cardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
		animation-delay: calc(var(--i, 0) * 60ms + 80ms);
	}
	.vocab:hover {
		transform: translateY(-3px);
		border-color: var(--accent);
		box-shadow: 0 6px 0 var(--deep);
	}
	@keyframes cardIn {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.v-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.3rem;
	}
	.v-ar {
		font-size: 1.75rem;
		font-weight: 600;
		line-height: 1.25;
		color: var(--text1);
	}
	.v-tr {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
	}
	.v-en {
		margin-top: 0.15rem;
		font-size: 0.85rem;
		color: var(--text2);
	}

	/* Reading */
	.reading {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		padding: 1.25rem;
		border-radius: 1rem;
		border: 2px solid var(--tile4);
		background: var(--tile2);
	}

	/* Main action: the green press button from /speak */
	.primary {
		align-self: stretch;
		padding: 0.95rem 1.2rem;
		border-radius: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		background: var(--go);
		box-shadow: 0 4px 0 var(--go-deep);
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
		box-shadow: 0 0 0 var(--go-deep);
	}

	button:focus-visible {
		outline: 2px solid var(--text1);
		outline-offset: 3px;
	}

	/* Congratulations */
	.done {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		max-width: 460px;
		margin: 3.5rem auto;
		text-align: center;
		animation: stepIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	.burst {
		font-size: 3.5rem;
		animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.3);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	.ar-flourish {
		font-size: 2.6rem;
		font-weight: 600;
		line-height: 1.1;
		color: var(--accent);
	}
	.done h2 {
		font-size: 1.7rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--text1);
	}
	.done p {
		line-height: 1.6;
		color: var(--text2);
	}
	.done .primary {
		align-self: center;
		margin-top: 0.6rem;
		padding-inline: 2rem;
	}

	/* Word definition modal */
	.word-modal {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: grid;
		place-items: center;
		padding: 1rem;
	}
	.word-scrim {
		position: absolute;
		inset: 0;
		background: rgb(0 0 0 / 0.45);
		cursor: pointer;
	}
	.word-box {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 420px;
		padding: 1.75rem;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		box-shadow: 0 6px 0 var(--tile5);
		animation: cardIn 0.3s ease both;
	}
	.close-x {
		position: absolute;
		top: 0.85rem;
		right: 0.85rem;
	}
	.word-ar {
		font-size: 2rem;
		font-weight: 600;
		color: var(--text1);
	}
	.word-tr {
		margin-top: 0.2rem;
		font-weight: 600;
		color: var(--text2);
	}
	.word-en {
		margin-top: 0.3rem;
		font-weight: 600;
		color: var(--text1);
	}
	.word-desc {
		margin-top: 0.7rem;
		line-height: 1.6;
		white-space: pre-line;
		color: var(--text2);
	}
	.muted {
		color: var(--text2);
	}

	@media (max-width: 560px) {
		.vocab-grid {
			grid-template-columns: 1fr;
		}
		.card.pad {
			padding: 1.25rem;
		}
		.title {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.step,
		.vocab,
		.done,
		.burst,
		.word-box {
			animation: none;
		}
		.fill,
		.primary,
		.icon-btn,
		.ghost,
		.vocab {
			transition: none;
		}
		.icon-btn:hover,
		.ghost:hover,
		.vocab:hover {
			transform: none;
		}
	}
</style>
