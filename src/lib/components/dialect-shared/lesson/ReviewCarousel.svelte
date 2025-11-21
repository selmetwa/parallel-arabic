<script lang="ts">
	import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
	import PronunciationTestModal from '$lib/components/dialect-shared/lesson/PronunciationTestModal.svelte';
	import type { Dialect } from '$lib/types/index';
	import Button from '$lib/components/Button.svelte';

	interface ReviewItem {
		arabic: string;
		english: string;
		transliteration: string;
	}

	interface Props {
		items: ReviewItem[];
		dialect: Dialect;
		title: string;
	}

	let { items, dialect, title }: Props = $props();

	let currentIndex = $state(0);
	let showAnswer = $state(false);
	let pronunciationModalOpen = $state(false);

	function openPronunciationTest() {
		pronunciationModalOpen = true;
	}

	function closePronunciationModal() {
		pronunciationModalOpen = false;
	}

	const currentItem = $derived(items[currentIndex]);
	const hasNext = $derived(currentIndex < items.length - 1);
	const hasPrev = $derived(currentIndex > 0);

	function next() {
		if (hasNext) {
			currentIndex++;
			showAnswer = false;
		}
	}

	function prev() {
		if (hasPrev) {
			currentIndex--;
			showAnswer = false;
		}
	}

	function toggleAnswer() {
		showAnswer = !showAnswer;
	}
</script>

<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
	<h3 class="text-xl font-semibold text-text-300 mb-4">{title}</h3>
	
	{#if items.length === 0}
		<p class="text-text-200">No items to review.</p>
	{:else}
		<div class="mb-4">
			<div class="flex items-center justify-between mb-4">
				<span class="text-sm text-text-200">
					{currentIndex + 1} of {items.length}
				</span>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={prev}
						disabled={!hasPrev}
						class="px-3 py-1 bg-tile-500 text-text-300 rounded hover:bg-tile-600 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						← Prev
					</button>
					<button
						type="button"
						onclick={next}
						disabled={!hasNext}
						class="px-3 py-1 bg-tile-500 text-text-300 rounded hover:bg-tile-600 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next →
					</button>
				</div>
			</div>

			<div class="bg-tile-300 p-6 rounded-lg border border-tile-600 min-h-[200px] flex flex-col justify-center">
				<div class="mb-4">
					<div class="flex items-center gap-2 mb-2 justify-between">
						<div class="flex items-center gap-2">
							<p class="text-2xl font-bold text-text-300" dir="rtl">
								{currentItem.arabic}
							</p>
							<InlineAudioButton text={currentItem.arabic} {dialect} />
						</div>
						<button
							type="button"
							onclick={openPronunciationTest}
							class="px-3 py-1 text-sm bg-tile-500 text-text-300 rounded hover:bg-tile-600 transition-colors whitespace-nowrap"
							title="Test pronunciation"
						>
							🎤 Test Pronunciation
						</button>
					</div>
					<p class="text-text-200 italic text-lg mb-2">{currentItem.transliteration}</p>
				</div>

				{#if showAnswer}
					<div class="mt-4 pt-4 border-t border-tile-600">
						<p class="text-xl font-semibold text-text-300">{currentItem.english}</p>
					</div>
				{:else}
					<button
						type="button"
						onclick={toggleAnswer}
						class="mt-4 px-4 py-2 bg-tile-500 text-text-300 rounded hover:bg-tile-600 self-start"
					>
						Show Answer
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Pronunciation Test Modal -->
{#if items.length > 0}
	<PronunciationTestModal
		isOpen={pronunciationModalOpen}
		closeModal={closePronunciationModal}
		text={currentItem.arabic}
		transliteration={currentItem.transliteration}
		english={currentItem.english}
		{dialect}
	/>
{/if}

