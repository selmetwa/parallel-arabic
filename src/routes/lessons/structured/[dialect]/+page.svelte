<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { dialectAccent } from '$lib/constants/dialect-accents';
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
    import LessonPlayer from '$lib/components/LessonPlayer.svelte';
    import LessonPlayerV2 from '$lib/components/LessonPlayerV2.svelte';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { trackEvent } from '$lib/analytics';

	let { data } = $props();
	let isModalOpen = $state(false);
	let isAuthModalOpen = $state(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let activeLesson = $state<any>(null);
	let isAutoOpening = $state(false);

	// Egyptian Arabic uses the new heavy-practice v2 lessons + player.
	const useV2 = (data as { useV2?: boolean }).useV2 ?? false;

	// Dialect display names
	const dialectNames: Record<string, string> = {
		'egyptian-arabic': 'Egyptian Arabic',
		'darija': 'Moroccan Darija',
		'fusha': 'Modern Standard Arabic',
		'levantine': 'Levantine Arabic'
	};

	// A small calligraphic accent per dialect for the header
	const dialectGlyphs: Record<string, string> = {
		'egyptian-arabic': 'مصر',
		'darija': 'المغرب',
		'fusha': 'الفصحى',
		'levantine': 'الشام'
	};

	const dialectName = dialectNames[data.dialect] || data.dialect;
	const dialectGlyph = dialectGlyphs[data.dialect] || 'العربية';

	const { accent, deep } = $derived(dialectAccent(data.dialect));

	const STEP_HEIGHT = 140;
	const AMPLITUDE = 100;

	// Transform curriculum into a flat list of lesson nodes for the path
	let lessonPositions = $derived.by(() => {
		const nodes = [];
		let index = 0;
		let previousCompleted = true; // First lesson is always available if it exists
		const isSubscribed = data.isSubscribed || data.hasActiveSubscription;
		const isWhitelisted = data.isWhitelisted || false;

		for (const module of data.curriculum) {
			for (const topic of module.topics) {
				const lessonInfo = data.existingLessons[topic.id];
				const exists = lessonInfo?.exists ?? false;
				const progress = data.userProgress?.[topic.id];
				const isCompleted = progress?.status === 'completed';
				const isFirstLesson = index === 0;

				// Determine status logic
				let status: 'completed' | 'active' | 'locked' = 'locked';

				if (!exists) {
					// Lesson doesn't exist yet
					status = 'locked';
				} else if (isWhitelisted || isSubscribed) {
					// Whitelisted and subscribed users: all existing lessons are unlocked
					if (isCompleted) {
						status = 'completed';
					} else {
						status = 'active';
					}
					previousCompleted = true; // Always allow next lessons for whitelisted/subscribed users
				} else if (!isFirstLesson && !isSubscribed) {
					// All lessons except the first one require subscription
					status = 'locked';
					// Don't update previousCompleted - keep it as is so progression logic still works
				} else if (isCompleted) {
					// Lesson is completed
					status = 'completed';
					previousCompleted = true; // Allow next lesson
				} else if (previousCompleted) {
					// Previous lesson is completed (or this is the first one), so this one is active
					status = 'active';
					previousCompleted = false; // Block next lessons until this is completed
				} else {
					// Previous lesson not completed, so this one is locked
					status = 'locked';
				}

				// Sine wave pattern for X offset
				const xOffset = Math.sin(index * 0.8) * AMPLITUDE;

				nodes.push({
					id: topic.id,
					title: topic.title,
					description: topic.description,
					moduleTitle: module.title,
					level: 'Beginner',
					dialect: data.dialect,
					status: status,
					isPaywalled: !isFirstLesson && !isSubscribed && !isWhitelisted,
					x: xOffset,
					y: index * STEP_HEIGHT
				});
				index++;
			}
		}
		return nodes;
	});

	// Progress summary for the header meter
	let completedCount = $derived(lessonPositions.filter((l) => l.status === 'completed').length);
	let totalCount = $derived(lessonPositions.length);
	let progressPct = $derived(totalCount ? Math.round((completedCount / totalCount) * 100) : 0);

	// The "you are here" lesson — its incoming trail gets the gold beacon dots.
	let activeIndex = $derived(lessonPositions.findIndex((l) => l.status === 'active'));

	// Goal node sits one step past the final lesson.
	let goal = $derived.by(() => {
		if (lessonPositions.length === 0) return { x: 0, y: 0 };
		const last = lessonPositions[lessonPositions.length - 1];
		return {
			x: Math.sin(lessonPositions.length * 0.8) * AMPLITUDE,
			y: last.y + STEP_HEIGHT
		};
	});

	// Build the trail as individual cubic segments so each one can reflect progress.
	let segments = $derived.by(() => {
		const segs: { d: string; done: boolean; next: boolean }[] = [];
		for (let i = 0; i < lessonPositions.length - 1; i++) {
			const cur = lessonPositions[i];
			const next = lessonPositions[i + 1];
			const d = `M ${cur.x} ${cur.y} C ${cur.x} ${cur.y + STEP_HEIGHT * 0.5}, ${next.x} ${next.y - STEP_HEIGHT * 0.5}, ${next.x} ${next.y}`;
			segs.push({ d, done: cur.status === 'completed', next: i + 1 === activeIndex });
		}
		if (lessonPositions.length > 0) {
			const last = lessonPositions[lessonPositions.length - 1];
			const d = `M ${last.x} ${last.y} C ${last.x} ${last.y + STEP_HEIGHT * 0.5}, ${goal.x} ${goal.y - STEP_HEIGHT * 0.5}, ${goal.x} ${goal.y}`;
			segs.push({ d, done: last.status === 'completed', next: false });
		}
		return segs;
	});

	function handleCloseModal() {
		isModalOpen = false;
	}

    async function handleLessonClick(lessonNode: any) {
        // Check authentication first
        if (!data.user || !data.session) {
            trackEvent('lessons_auth_required', { lesson_id: lessonNode.id, dialect: lessonNode.dialect });
            isAuthModalOpen = true;
            return;
        }

        if (lessonNode.status === 'locked') {
            // Check if it's paywalled
            if (lessonNode.isPaywalled) {
                trackEvent('lessons_paywall_triggered', { lesson_id: lessonNode.id, dialect: lessonNode.dialect });
                isModalOpen = true;
                return;
            }

            // Find the previous lesson that needs to be completed
            const currentIndex = lessonPositions.findIndex(l => l.id === lessonNode.id);
            if (currentIndex > 0) {
                const previousLesson = lessonPositions[currentIndex - 1];
                console.warn(`Lesson locked: complete "${previousLesson.title}" first.`);
            } else {
                console.warn('Lesson not available yet.');
            }
            return;
        }

        try {
            trackEvent('lessons_lesson_opened', {
                lesson_id: lessonNode.id,
                dialect: lessonNode.dialect,
                lesson_title: lessonNode.title
            });

            // Mark lesson as started if user is logged in
            if (data.user) {
                try {
                    await fetch('/api/structured-lessons/start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            topicId: lessonNode.id,
                            dialect: lessonNode.dialect
                        })
                    });
                } catch (e) {
                    console.error('Failed to mark lesson as started:', e);
                    // Continue anyway - not critical
                }
            }

            // Load lesson — v2 (Egyptian) uses the dedicated heavy-practice endpoint.
            const lessonUrl = useV2
                ? `/api/lessons-v2/${lessonNode.id}?dialect=${encodeURIComponent(lessonNode.dialect)}`
                : `/api/lessons/${lessonNode.id}?dialect=${encodeURIComponent(lessonNode.dialect)}`;
            const response = await fetch(lessonUrl);
            if (!response.ok) throw new Error('Failed to load lesson');
            const lessonData = await response.json();

            // Ensure topicId and dialect are set for completion tracking
            activeLesson = {
                ...lessonData,
                topicId: lessonNode.id,
                dialect: lessonNode.dialect
            };
        } catch (e) {
            console.error(e);
        }
    }

	onMount(async () => {
		if (!data.autoOpenLessonId) return;
		const targetLesson = lessonPositions.find(l => l.id === data.autoOpenLessonId);
		if (!targetLesson) return;
		isAutoOpening = true;
		try {
			await handleLessonClick(targetLesson);
		} finally {
			isAutoOpening = false;
		}
	});
</script>

{#if activeLesson}
    {@const initialStepValue =
        data.user?.last_content_id === activeLesson?.topicId
            ? (data.user?.last_content_position ?? 0)
            : (activeLesson?.topicId === data.autoOpenLessonId && data.autoOpenStep !== null
                ? (data.autoOpenStep ?? 0)
                : 0)}
    {#if useV2}
        <LessonPlayerV2
            lesson={activeLesson}
            user={data.user}
            initialStep={initialStepValue}
            onClose={async () => {
                activeLesson = null;
                await invalidateAll();
            }}
            onLessonComplete={async () => {
                trackEvent('lessons_lesson_completed', {
                    lesson_id: activeLesson?.topicId,
                    dialect: activeLesson?.dialect
                });
                activeLesson = null;
                await invalidateAll();
            }}
        />
    {:else}
        <LessonPlayer
            lesson={activeLesson}
            user={data.user}
            initialStep={initialStepValue}
            onClose={async () => {
                // Close the lesson player first
                activeLesson = null;
                // Refetch data to show updated completion status
                await invalidateAll();
            }}
            onLessonComplete={async () => {
                trackEvent('lessons_lesson_completed', {
                    lesson_id: activeLesson?.topicId,
                    dialect: activeLesson?.dialect
                });
                // Close the lesson player first (completion already marked in LessonPlayer)
                activeLesson = null;

                // Refetch data to show updated completion status
                // This will reload the page data including userProgress
                await invalidateAll();

                // User is now back on the structured lessons page with updated data
                // The next lesson should now be unlocked if it exists
            }}
        />
    {/if}
{/if}

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>
<AuthModal isOpen={isAuthModalOpen} handleCloseModal={() => isAuthModalOpen = false}></AuthModal>

<section class="page" style="--accent:{accent}; --deep:{deep};">
	<div class="inner">
		<a href={resolve('/lessons/structured')} class="back">
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
			</svg>
			Structured lessons
		</a>

		<header class="hero rise">
			<span class="glyph" dir="rtl" aria-hidden="true">{dialectGlyph}</span>
			<h1>{dialectName}</h1>
			<p>Learning path</p>
			{#if totalCount > 0}
				<div class="meter">
					<div class="meter-row">
						<span>{completedCount} of {totalCount} lessons</span>
						<span class="meter-pct">{progressPct}%</span>
					</div>
					<div class="meter-track">
						<div class="meter-fill" style="width: {progressPct}%"></div>
					</div>
				</div>
			{/if}
		</header>

		<!-- Path container: nodes are placed on a sine wave; see lessonPositions -->
		<div class="relative mx-auto mt-12 w-full max-w-xs sm:max-w-sm" style="height: {goal.y + 170}px;">
			<svg
				class="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 overflow-visible"
				width="400"
				height={goal.y + 170}
				viewBox="-200 0 400 {goal.y + 170}"
				style="z-index: 0;"
			>
				<!-- Base groove under the whole trail -->
				{#each segments as seg (seg.d)}
					<path d={seg.d} class="trail trail--groove" />
				{/each}
				<!-- Progress: inked where done, flowing dots into the next lesson, faint ahead -->
				{#each segments as seg (seg.d)}
					{#if seg.done}
						<path d={seg.d} class="trail trail--done" />
					{:else if seg.next}
						<path d={seg.d} class="trail trail--next trail-flow" />
					{:else}
						<path d={seg.d} class="trail trail--ahead" />
					{/if}
				{/each}
			</svg>

			{#each lessonPositions as lesson, i (lesson.id)}
				<div
					class="absolute left-1/2 z-10 flex w-24 -translate-x-1/2 flex-col items-center justify-center"
					style="transform: translate(calc(-50% + {lesson.x}px), {lesson.y}px);"
				>
					<div class="rise stop flex flex-col items-center" style="animation-delay: {Math.min(i, 12) * 55}ms;">
						<!-- Module divider: first topic of each module -->
						{#if i === 0 || lessonPositions[i - 1].moduleTitle !== lesson.moduleTitle}
							<div class="module">
								<span class="module-pill">{lesson.moduleTitle}</span>
							</div>
						{/if}

						<!-- Desktop tooltip: always shown for the active step, on hover otherwise -->
						<div
							class="tip {lesson.x > 0 ? 'tip--left' : 'tip--right'}"
							class:tip--shown={lesson.status === 'active'}
						>
							<span class="tip-num">Lesson {i + 1}</span>
							<h3 class="tip-title">{lesson.title}</h3>
							<p class="tip-note">{lesson.description}</p>
						</div>

						<div class="relative">
							<button
								class="node"
								class:is-done={lesson.status === 'completed'}
								class:is-active={lesson.status === 'active'}
								class:is-locked={lesson.status === 'locked'}
								onclick={() => handleLessonClick(lesson)}
								aria-label={lesson.title}
							>
								{#if lesson.status === 'completed'}
									<svg class="node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
										<path d="M5 13l4 4L19 7" />
									</svg>
								{:else if lesson.status === 'locked'}
									<svg class="node-lock" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0v3z" />
									</svg>
								{:else}
									<span class="node-num">{i + 1}</span>
								{/if}
							</button>
							<!-- Mobile-only label below -->
							<div class="tip-mobile">
								<span>{lesson.title}</span>
							</div>
						</div>
					</div>
				</div>
			{/each}

			<!-- Goal node -->
			<div
				class="absolute left-1/2 z-10 flex w-28 -translate-x-1/2 flex-col items-center justify-center"
				style="transform: translate(calc(-50% + {goal.x}px), {goal.y}px);"
			>
				<div class="goal" aria-hidden="true">🏆</div>
				<span class="goal-pill">Fluency</span>
			</div>
		</div>
	</div>
</section>

<style>
	.page {
		min-height: 100vh;
		overflow-x: hidden;
		padding: 1.5rem 1.25rem 6rem;
	}

	.inner {
		max-width: 42rem;
		margin: 0 auto;
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		transition:
			transform 0.2s ease,
			color 0.2s ease;
	}
	.back:hover {
		color: var(--text1);
		transform: translateX(-3px);
	}
	.back svg {
		width: 1rem;
		height: 1rem;
	}

	/* Header */
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 2rem;
		text-align: center;
	}
	.glyph {
		font-size: 1.6rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--accent);
	}
	.hero h1 {
		margin-top: 0.3rem;
		font-size: clamp(2.2rem, 6.5vw, 3.2rem);
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.035em;
		color: var(--text1);
	}
	.hero p {
		margin-top: 0.5rem;
		font-size: 0.95rem;
		color: var(--text2);
	}

	.meter {
		width: 100%;
		max-width: 20rem;
		margin-top: 1.5rem;
	}
	.meter-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.45rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text2);
	}
	.meter-pct {
		color: var(--text1);
	}
	.meter-track {
		height: 0.65rem;
		overflow: hidden;
		border-radius: 100px;
		background: var(--tile4);
	}
	.meter-fill {
		height: 100%;
		border-radius: 100px;
		background: var(--accent);
		transition: width 0.7s ease-out;
	}

	/* Trail */
	.trail {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.trail--groove {
		stroke: var(--tile4);
		stroke-width: 18;
	}
	.trail--done {
		stroke: var(--accent);
		stroke-width: 10;
	}
	.trail--next {
		stroke: var(--accent);
		stroke-width: 7;
		stroke-dasharray: 1 20;
	}
	.trail--ahead {
		stroke: var(--tile6);
		stroke-width: 6;
		stroke-dasharray: 1 20;
	}

	/* Module divider */
	.module {
		position: absolute;
		top: -3.4rem;
		display: flex;
		width: 16rem;
		justify-content: center;
	}
	.module-pill {
		white-space: nowrap;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		border-radius: 100px;
		padding: 0.2rem 0.75rem;
	}

	/* Nodes: pressable discs with a solid bottom edge */
	.node {
		position: relative;
		display: grid;
		place-items: center;
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		color: var(--text1);
		box-shadow: 0 6px 0 var(--tile5);
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}
	@media (min-width: 640px) {
		.node {
			width: 6rem;
			height: 6rem;
		}
	}
	.node:focus-visible {
		outline: 2px solid var(--text1);
		outline-offset: 4px;
	}
	.node.is-done,
	.node.is-active {
		background: var(--accent);
		border-color: var(--deep);
		color: #fff;
		box-shadow: 0 6px 0 var(--deep);
	}
	.node.is-done:hover,
	.node.is-active:hover {
		transform: translateY(-3px);
		box-shadow: 0 9px 0 var(--deep);
	}
	.node.is-done:active,
	.node.is-active:active {
		transform: translateY(4px);
		box-shadow: 0 1px 0 var(--deep);
	}
	/* "You are here": a ring and a gentle pulse */
	.node.is-active {
		outline: 4px solid color-mix(in srgb, var(--accent) 35%, transparent);
		outline-offset: 4px;
		animation: pulse 2.4s ease-in-out infinite;
	}
	.node.is-locked {
		background: var(--tile4);
		color: var(--text2);
	}
	.node-icon {
		width: 2.4rem;
		height: 2.4rem;
	}
	.node-lock {
		width: 1.75rem;
		height: 1.75rem;
		opacity: 0.7;
	}
	.node-num {
		font-size: 1.9rem;
		font-weight: 700;
	}

	/* Tooltips */
	.tip {
		position: absolute;
		top: 50%;
		z-index: 20;
		display: none;
		width: 12rem;
		transform: translateY(-50%);
		padding: 0.75rem 0.85rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		box-shadow: 0 4px 0 var(--tile5);
		opacity: 0;
		transition: opacity 0.2s ease;
	}
	@media (min-width: 640px) {
		.tip {
			display: block;
		}
	}
	.stop:hover .tip,
	.stop:focus-within .tip,
	.tip--shown {
		opacity: 1;
	}
	.tip--shown {
		border-color: var(--accent);
		box-shadow: 0 4px 0 var(--deep);
	}
	.tip--left {
		right: 100%;
		margin-right: 1.25rem;
	}
	.tip--right {
		left: 100%;
		margin-left: 1.25rem;
	}
	.tip-num {
		font-size: 0.68rem;
		font-weight: 600;
		color: var(--text2);
	}
	.tip-title {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1.3;
		color: var(--text1);
	}
	.tip-note {
		margin-top: 0.25rem;
		font-size: 0.72rem;
		line-height: 1.4;
		color: var(--text2);
	}
	.tip-mobile {
		position: absolute;
		top: 100%;
		left: 50%;
		z-index: 30;
		width: 8rem;
		margin-top: 0.9rem;
		transform: translateX(-50%);
		padding: 0.35rem 0.5rem;
		text-align: center;
		border-radius: 0.75rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
	}
	.tip-mobile span {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text1);
	}
	@media (min-width: 640px) {
		.tip-mobile {
			display: none;
		}
	}

	/* Goal */
	.goal {
		display: grid;
		place-items: center;
		width: 6rem;
		height: 6rem;
		border-radius: 50%;
		font-size: 2.8rem;
		background: #fbbf24;
		border: 2px solid #b45309;
		box-shadow: 0 6px 0 #b45309;
	}
	.goal-pill {
		margin-top: 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text1);
		background: color-mix(in srgb, #f59e0b 18%, var(--tile3));
		border-radius: 100px;
		padding: 0.25rem 0.9rem;
	}

	@keyframes flow {
		to {
			stroke-dashoffset: -1000;
		}
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(18px) scale(0.92);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	@keyframes pulse {
		50% {
			outline-color: color-mix(in srgb, var(--accent) 12%, transparent);
		}
	}
	.trail-flow {
		animation: flow 24s linear infinite;
	}
	.rise {
		animation: rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}
	@media (prefers-reduced-motion: reduce) {
		.trail-flow,
		.rise,
		.node.is-active {
			animation: none;
		}
		.back,
		.node {
			transition: none;
		}
		.node:hover,
		.node:active {
			transform: none;
		}
	}
</style>
