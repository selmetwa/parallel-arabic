<script lang="ts">
	import { fade, fly } from 'svelte/transition';
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

	function nodeClasses(status: string) {
		if (status === 'completed')
			return 'bg-amber-400 text-amber-950 border-b-[6px] border-amber-600 shadow-[0_10px_24px_-10px_rgba(217,119,6,0.8)] hover:-translate-y-0.5 active:translate-y-1 active:border-b-2 cursor-pointer';
		if (status === 'active')
			return 'bg-brand text-white border-b-[6px] border-black/30 shadow-lg shadow-black/25 hover:-translate-y-0.5 active:translate-y-1 active:border-b-2 cursor-pointer';
		return 'bg-tile-300 text-text-200 border-b-[6px] border-tile-400 cursor-pointer';
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

<div class="relative min-h-screen overflow-x-hidden bg-tile-100 pb-24 font-sans">
	<!-- Atmosphere: brand glow + drifting calligraphy field -->
	<div class="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
		<div
			class="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
			style="background: radial-gradient(circle, var(--brand) 0%, transparent 70%);"
		></div>
		<div class="absolute inset-0 opacity-[0.06] text-tile-600">
			<span class="absolute left-[6%] top-[8%] text-[7rem] -rotate-12">ا</span>
			<span class="absolute right-[8%] top-[18%] text-[9rem] rotate-6">ب</span>
			<span class="absolute left-[14%] top-[42%] text-[8rem] rotate-3">ج</span>
			<span class="absolute right-[12%] top-[55%] text-[10rem] -rotate-6">م</span>
			<span class="absolute left-[8%] top-[72%] text-[8rem] -rotate-3">ع</span>
			<span class="absolute right-[16%] bottom-[6%] text-[7rem] rotate-12">س</span>
		</div>
	</div>

	<div class="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-4 py-8">
		<header class="rise mb-10 flex w-full flex-col items-center text-center">
			<div class="mb-5 w-full text-left">
				<a
					href="/lessons/structured"
					class="inline-flex items-center gap-2 text-sm font-medium text-text-200 transition-colors hover:text-text-300"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Back to Structured Lessons
				</a>
			</div>

			<span
				class="mb-3 text-4xl font-bold leading-none text-brand opacity-90 sm:text-5xl"
				dir="rtl"
				aria-hidden="true"
			>
				{dialectGlyph}
			</span>
			<h1 class="text-3xl font-bold tracking-tight text-text-300 sm:text-4xl">
				{dialectName}
			</h1>
			<p class="mt-1.5 text-sm uppercase tracking-[0.25em] text-text-200">Learning Path</p>

			{#if totalCount > 0}
				<div class="mt-6 w-full max-w-xs">
					<div class="mb-2 flex items-center justify-between text-xs font-semibold text-text-200">
						<span>{completedCount} of {totalCount} lessons</span>
						<span class="text-brand">{progressPct}%</span>
					</div>
					<div class="h-2.5 w-full overflow-hidden rounded-full bg-tile-300 shadow-inner">
						<div
							class="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
							style="width: {progressPct}%"
						></div>
					</div>
				</div>
			{/if}
		</header>

		<!-- Path Container -->
		<div
			class="relative mx-auto mt-12 w-full max-w-xs sm:max-w-sm"
			style="height: {goal.y + 170}px;"
		>
            <!-- SVG Trail Layer -->
            <svg
                class="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 overflow-visible"
                width="400"
                height={goal.y + 170}
                viewBox="-200 0 400 {goal.y + 170}"
                style="z-index: 0;"
            >
                <!-- Carved base groove -->
                {#each segments as seg (seg.d)}
                    <path
                        d={seg.d}
                        class="stroke-tile-300"
                        stroke-width="18"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                {/each}

                <!-- Progress overlay: inked where done, gold dots where it's your next step, muted ahead -->
                {#each segments as seg (seg.d)}
                    {#if seg.done}
                        <path
                            d={seg.d}
                            class="stroke-brand"
                            stroke-width="10"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    {:else if seg.next}
                        <path
                            d={seg.d}
                            class="trail-flow stroke-amber-400"
                            stroke-width="7"
                            fill="none"
                            stroke-linecap="round"
                            stroke-dasharray="1 20"
                        />
                    {:else}
                        <path
                            d={seg.d}
                            class="stroke-tile-400 opacity-70"
                            stroke-width="6"
                            fill="none"
                            stroke-linecap="round"
                            stroke-dasharray="1 20"
                        />
                    {/if}
                {/each}
            </svg>

			<!-- Nodes Layer -->
			{#each lessonPositions as lesson, i (lesson.id)}
				{@const labelSideClass = lesson.x > 0 ? 'right-full mr-5' : 'left-full ml-5'}
				<div
					class="absolute left-1/2 z-10 flex w-24 -translate-x-1/2 flex-col items-center justify-center"
					style="transform: translate(calc(-50% + {lesson.x}px), {lesson.y}px);"
				>
					<div
						class="rise group/node flex flex-col items-center"
						style="animation-delay: {Math.min(i, 12) * 55}ms;"
					>
                    <!-- Chapter divider — first topic of each module -->
                    {#if i === 0 || lessonPositions[i-1].moduleTitle !== lesson.moduleTitle}
                        <div class="absolute -top-14 flex w-56 items-center justify-center gap-2">
                            <span class="h-px flex-1 bg-tile-400"></span>
                            <span class="whitespace-nowrap text-[0.65rem] font-bold uppercase tracking-[0.15em] text-text-200">
                                {lesson.moduleTitle}
                            </span>
                            <span class="h-px flex-1 bg-tile-400"></span>
                        </div>
                    {/if}

					<!-- Desktop tooltip: always shown for the active step, on hover otherwise -->
					<div
						class="absolute top-1/2 hidden w-48 -translate-y-1/2 rounded-xl border border-tile-400 bg-tile-200/95 p-3 shadow-lg backdrop-blur-sm transition-opacity duration-200 sm:block z-20 {labelSideClass} {lesson.status === 'active' ? 'opacity-100' : 'opacity-0 group-hover/node:opacity-100 group-focus-within/node:opacity-100'}"
					>
						<div class="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-text-200 opacity-70">
							Lesson {i + 1}
						</div>
						<h3 class="line-clamp-2 text-sm font-bold text-text-300">{lesson.title}</h3>
						<p class="mt-1 text-[10px] leading-tight text-text-200 opacity-80">{lesson.description}</p>
                         <div class="absolute top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-t border-r border-tile-400 bg-tile-200 {lesson.x > 0 ? '-right-1.5' : '-left-1.5'}"></div>
					</div>

					<!-- Node Button -->
					<div class="relative">
						<button
							class="relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:h-24 sm:w-24 {nodeClasses(lesson.status)} {lesson.status === 'active' ? 'ring-2 ring-brand/40 ring-offset-2 ring-offset-tile-100' : ''}"
							onclick={() => handleLessonClick(lesson)}
							aria-label={lesson.title}
						>
							{#if lesson.status === 'completed'}
								<svg class="h-9 w-9 drop-shadow-sm sm:h-10 sm:w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
									<path d="M5 13l4 4L19 7" />
								</svg>
							{:else if lesson.status === 'locked'}
								<svg class="h-7 w-7 opacity-60" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0v3z" />
								</svg>
							{:else}
								<span class="text-2xl font-extrabold drop-shadow-sm sm:text-3xl">{i + 1}</span>
							{/if}
						</button>

                        <!-- Mobile-only label below -->
                        <div class="absolute top-full left-1/2 mt-3 w-32 -translate-x-1/2 rounded-lg border border-tile-300 bg-tile-200/90 p-2 text-center shadow-sm backdrop-blur-sm sm:hidden z-30">
                            <span class="block truncate text-xs font-bold text-text-300">{lesson.title}</span>
                        </div>
					</div>
					</div>
				</div>
			{/each}

            <!-- Goal Node -->
            <div
                class="absolute left-1/2 z-10 flex w-28 -translate-x-1/2 flex-col items-center justify-center"
                style="transform: translate(calc(-50% + {goal.x}px), {goal.y}px);"
            >
                <div class="relative">
                    <div class="flex h-24 w-24 items-center justify-center rounded-full border-b-[6px] border-amber-600 bg-gradient-to-b from-amber-300 to-amber-500 shadow-[0_12px_30px_-10px_rgba(217,119,6,0.85)] transition-transform hover:scale-105 sm:h-28 sm:w-28">
                        <span class="text-5xl drop-shadow-md">🏆</span>
                    </div>
                </div>
                <div class="mt-4 rounded-full border border-amber-500/40 bg-amber-400/15 px-4 py-1">
                    <span class="text-xs font-bold uppercase tracking-[0.15em] text-amber-700">Fluency</span>
                </div>
            </div>

		</div>
	</div>
</div>

<style>
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
	.trail-flow {
		animation: flow 24s linear infinite;
	}
	.rise {
		animation: rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}
	@media (prefers-reduced-motion: reduce) {
		.trail-flow,
		.rise {
			animation: none;
		}
	}
</style>
