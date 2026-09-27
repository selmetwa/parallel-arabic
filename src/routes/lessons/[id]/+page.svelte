<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import LessonPlayer from '$lib/components/LessonPlayer.svelte';
	import type { GeneratedLesson } from '$lib/schemas/curriculum-schema';

	let { data } = $props<{ data: PageData }>();

	// Custom lessons are step-based and play in LessonPlayer. The older
	// sub-lesson format is no longer generated and no stored lesson uses it.
	const stepLesson = $derived.by((): GeneratedLesson | null => {
		const lesson = data.lesson;
		const body = lesson?.lesson_body || lesson;
		if (!Array.isArray(body?.steps) || body.steps.length === 0) return null;
		return {
			topicId: body.topicId || lesson?.id || '',
			title: body.title || lesson?.title || 'Lesson',
			dialect: body.dialect || lesson?.dialect || 'egyptian-arabic',
			steps: body.steps
		};
	});

	// The player has only ever mounted in the browser; keep it that way.
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	function backToLessons() {
		goto(resolve('/lessons'));
	}
</script>

<!-- SEO meta tags are handled by +layout.svelte -->

{#if stepLesson && mounted}
	<LessonPlayer
		lesson={stepLesson}
		user={data.user}
		onClose={backToLessons}
		onLessonComplete={backToLessons}
	/>
{:else}
	<section class="page">
		{#if stepLesson}
			<p class="loading" role="status">Loading lesson…</p>
		{:else}
			<div class="msg">
				<div class="msg-emoji">🙈</div>
				<h1 class="msg-title">Lesson not found</h1>
				<p class="msg-body">{data.error || 'This lesson may have been removed or made private.'}</p>
				<a href={resolve('/lessons/custom')} class="press">Browse lessons</a>
			</div>
		{/if}
	</section>
{/if}

<style>
	.page {
		min-height: 70vh;
		display: grid;
		place-items: center;
		padding: 3rem 1.25rem;
	}

	.loading {
		font-size: 0.95rem;
		color: var(--text2);
	}

	/* Message state, as on /speak */
	.msg {
		max-width: 28rem;
		text-align: center;
	}
	.msg-emoji {
		font-size: 3.5rem;
		line-height: 1;
		margin-bottom: 1rem;
	}
	.msg-title {
		font-size: 1.7rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--text1);
	}
	.msg-body {
		margin-top: 0.6rem;
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--text2);
	}

	.press {
		display: inline-flex;
		margin-top: 1.75rem;
		padding: 0.75rem 1.4rem;
		border-radius: 1rem;
		font-weight: 600;
		color: #fff;
		background: #22c55e;
		box-shadow: 0 4px 0 #15803d;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease,
			filter 0.2s ease;
	}
	.press:hover {
		filter: brightness(1.06);
	}
	.press:active {
		transform: translateY(4px);
		box-shadow: 0 0 0 #15803d;
	}
	.press:focus-visible {
		outline: 2px solid var(--text1);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.press {
			transition: none;
		}
	}
</style>
