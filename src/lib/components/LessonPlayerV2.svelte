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

	interface Props {
		lesson: GeneratedLessonV2;
		onClose: () => void;
		onLessonComplete?: (nextLessonId?: string) => void | Promise<void>;
		user?: { id: string } | null;
		initialStep?: number;
	}

	let { lesson, onClose, onLessonComplete, user, initialStep }: Props = $props();

	let dialect = $derived(lesson.dialect as Dialect);

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

<div class="overlay" role="dialog" aria-modal="true">
	<!-- Atmosphere: soft brand glow + a giant faint calligraphic glyph -->
	<div class="atmos" aria-hidden="true">
		<div class="glow"></div>
		<div class="watermark">ع</div>
	</div>

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
						<section class="card pad reading-card">
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
	<div class="word-modal" role="dialog" aria-modal="true">
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
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: var(--tile1);
		color: var(--text1);
		display: flex;
		flex-direction: column;
		font-family: 'ReadexPro', system-ui, sans-serif;
	}

	/* Atmosphere */
	.atmos {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}
	.glow {
		position: absolute;
		top: -30%;
		left: 50%;
		width: 60rem;
		height: 60rem;
		transform: translateX(-50%);
		background: radial-gradient(circle, var(--brand) 0%, transparent 65%);
		opacity: 0.12;
		filter: blur(20px);
	}
	.watermark {
		position: absolute;
		right: -3rem;
		bottom: -8rem;
		font-family: 'Rakkas', serif;
		font-size: 34rem;
		line-height: 1;
		color: var(--text1);
		opacity: 0.03;
		user-select: none;
	}

	/* Header */
	.bar {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.85rem 1.1rem;
	}
	.icon-btn {
		display: grid;
		place-items: center;
		width: 2.1rem;
		height: 2.1rem;
		border-radius: 50%;
		border: 1px solid var(--tile4);
		background: var(--tile2);
		color: var(--text2);
		cursor: pointer;
		transition: all 0.18s ease;
		flex-shrink: 0;
	}
	.icon-btn:hover {
		color: var(--text1);
		border-color: var(--tile6);
		transform: scale(1.05);
	}
	.icon-btn svg {
		width: 1.05rem;
		height: 1.05rem;
	}
	.track {
		flex: 1;
		height: 10px;
		background: var(--tile3);
		border-radius: 100px;
		overflow: hidden;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
	}
	.fill {
		height: 100%;
		border-radius: 100px;
		background: linear-gradient(90deg, color-mix(in srgb, var(--brand) 70%, white), var(--brand));
		box-shadow: 0 0 12px -2px var(--brand);
		transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.count {
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--text1);
	}
	.count span {
		color: var(--text3);
		font-weight: 500;
	}

	/* Toolbar */
	.toolbar {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0 1.1rem 0.7rem;
	}
	.crumbs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}
	.level {
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		color: var(--brand);
		border: 1px solid color-mix(in srgb, var(--brand) 35%, transparent);
		background: color-mix(in srgb, var(--brand) 10%, transparent);
		border-radius: 100px;
		padding: 0.12rem 0.55rem;
	}
	.step-label {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text3);
	}
	.title {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.spacer {
		flex: 1;
	}
	.toggle-group {
		display: inline-flex;
		border: 1px solid var(--tile4);
		border-radius: 100px;
		overflow: hidden;
	}
	.tog {
		font-size: 0.72rem;
		font-weight: 700;
		padding: 0.22rem 0.62rem;
		border: none;
		background: var(--tile2);
		color: var(--text2);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.tog + .tog {
		border-left: 1px solid var(--tile4);
	}
	.tog.on {
		background: var(--brand);
		color: #fff;
	}
	.ghost {
		font-size: 0.74rem;
		font-weight: 700;
		padding: 0.24rem 0.7rem;
		border-radius: 100px;
		border: 1px solid var(--tile4);
		background: transparent;
		color: var(--text2);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.ghost:hover {
		color: var(--text1);
		border-color: var(--tile6);
		background: var(--tile2);
	}

	/* Body + step entrance */
	.body {
		position: relative;
		z-index: 1;
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
		max-width: 760px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		background: var(--tile2);
		border: 1px solid var(--tile4);
		border-radius: 1.5rem;
		box-shadow: 0 20px 50px -24px rgba(0, 0, 0, 0.35);
	}
	.card.pad {
		padding: 1.75rem;
	}
	.card-wide {
		max-width: 1080px;
	}
	.eyebrow {
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		color: var(--brand);
	}
	.head {
		font-size: 1.4rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text1);
		line-height: 1.2;
		margin-top: -0.4rem;
	}
	.text {
		color: var(--text2);
		line-height: 1.7;
		white-space: pre-line;
	}

	/* Content examples */
	.examples {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.examples li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		background: var(--tile1);
		border: 1px solid var(--tile3);
		border-radius: 1rem;
		padding: 0.9rem 1.1rem;
		transition: border-color 0.18s ease;
	}
	.examples li:hover {
		border-color: var(--tile5);
	}
	.ex-ar {
		font-size: 1.55rem;
		color: var(--text1);
		line-height: 1.3;
	}
	.ex-tr {
		color: var(--text2);
		font-size: 0.9rem;
	}
	.ex-en {
		color: var(--text3);
		font-size: 0.88rem;
	}

	/* Vocab flashcards */
	.vocab-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.85rem;
	}
	.vocab {
		background: var(--tile1);
		border: 1px solid var(--tile3);
		border-radius: 1.1rem;
		padding: 1.1rem;
		transition:
			transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.2s ease;
		animation: cardIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: calc(var(--i, 0) * 60ms + 80ms);
	}
	.vocab:hover {
		transform: translateY(-3px);
		border-color: color-mix(in srgb, var(--brand) 45%, var(--tile4));
	}
	@keyframes cardIn {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.98);
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
		color: var(--text1);
		line-height: 1.25;
	}
	.v-tr {
		color: var(--brand);
		font-size: 0.95rem;
		font-weight: 600;
	}
	.v-en {
		color: var(--text2);
		font-size: 0.85rem;
		margin-top: 0.15rem;
	}

	/* Reading */
	.reading-card {
		border-left: 3px solid var(--brand);
	}
	.reading {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		background: var(--tile1);
		border: 1px solid var(--tile3);
		border-radius: 1rem;
		padding: 1.25rem;
	}

	/* Primary button */
	.primary {
		align-self: stretch;
		background: var(--brand);
		color: #fff;
		border: none;
		border-radius: 1rem;
		padding: 0.95rem 1.2rem;
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		box-shadow: 0 10px 24px -10px var(--brand);
		transition:
			transform 0.16s ease,
			box-shadow 0.16s ease,
			filter 0.16s ease;
	}
	.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 16px 30px -12px var(--brand);
		filter: brightness(1.06);
	}
	.primary:active {
		transform: translateY(0);
	}

	/* Congratulations */
	.done {
		max-width: 460px;
		margin: 3.5rem auto;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		animation: stepIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	.burst {
		font-size: 3.5rem;
		animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	@keyframes pop {
		from {
			transform: scale(0.3);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	.ar-flourish {
		font-family: 'Rakkas', serif;
		font-size: 3.2rem;
		line-height: 1;
		color: var(--brand);
	}
	.done h2 {
		font-size: 1.7rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text1);
	}
	.done p {
		color: var(--text2);
		line-height: 1.6;
	}
	.done .primary {
		margin-top: 0.6rem;
		align-self: center;
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
		border: none;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(2px);
		cursor: pointer;
	}
	.word-box {
		position: relative;
		z-index: 1;
		background: var(--tile2);
		border: 1px solid var(--tile4);
		border-radius: 1.25rem;
		padding: 1.75rem;
		max-width: 420px;
		width: 100%;
		box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.5);
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
		color: var(--brand);
		font-weight: 600;
		margin-top: 0.2rem;
	}
	.word-en {
		color: var(--text1);
		font-weight: 600;
		margin-top: 0.3rem;
	}
	.word-desc {
		color: var(--text2);
		margin-top: 0.7rem;
		line-height: 1.6;
		white-space: pre-line;
	}
	.muted {
		color: var(--text3);
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
		.vocab {
			transition: none;
		}
	}
</style>
