<script lang="ts">
	import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
	import type { Dialect } from '$lib/types/index';

	interface Exercise {
		id: string;
		type: 'multiple-choice' | 'fill-in-blank' | 'matching';
		question: {
			english: string;
			arabic?: string;
		};
		options?: Array<{
			arabic: string;
			english: string;
			transliteration: string;
			isCorrect: boolean;
		}>;
		correctAnswer?: string | string[];
		hint?: {
			english: string;
			arabic?: string;
			transliteration?: string;
		};
	}

	interface Props {
		exercise: Exercise;
		dialect: Dialect;
	}

	let { exercise, dialect }: Props = $props();

	let selectedAnswer = $state<string | null>(null);
	let showResult = $state(false);
	let isCorrect = $state(false);
	let showHint = $state(false);
	
	// Matching exercise state
	let selectedArabic = $state<string | null>(null);
	let selectedEnglish = $state<string | null>(null);
	let matchedPairs = $state<Array<{ arabic: string; english: string }>>([]);
	let allMatched = $state(false);
	
	// Fill-in-blank exercise state
	let blankSelections = $state<Array<string | null>>([]);
	let blankCount = $derived(() => {
		if (exercise.type !== 'fill-in-blank' || !exercise.question.english) return 0;
		// Count blanks in the question (look for ___ or [blank] or similar patterns)
		const matches = exercise.question.english.match(/_{2,}|\[blank\]|___/gi);
		return matches ? matches.length : 0;
	});
	
	let questionParts = $derived(() => {
		if (exercise.type !== 'fill-in-blank' || !exercise.question.english) return [];
		// Split question by blanks
		const parts = exercise.question.english.split(/(_{2,}|\[blank\]|___)/gi);
		return parts;
	});
	
	// Initialize blank selections array
	$effect(() => {
		if (exercise.type === 'fill-in-blank' && blankCount > 0) {
			blankSelections = Array(blankCount).fill(null);
		}
	});

	function handleMultipleChoice(optionValue: string) {
		if (showResult) return;
		selectedAnswer = optionValue;
		const selectedOption = exercise.options?.find(opt => 
			opt.arabic === optionValue || opt.english === optionValue || opt.transliteration === optionValue
		);
		isCorrect = selectedOption?.isCorrect || false;
		showResult = true;
	}


	function handleArabicClick(arabic: string) {
		if (showResult) return;
		
		// If clicking on already selected Arabic, deselect it
		if (selectedArabic === arabic) {
			selectedArabic = null;
			return;
		}
		
		// Check if this Arabic is already matched
		const isMatched = matchedPairs.some(pair => pair.arabic === arabic);
		if (isMatched) return;
		
		selectedArabic = arabic;
	}

	function handleEnglishClick(english: string) {
		if (showResult) return;
		
		// If an Arabic is selected, try to match
		if (selectedArabic) {
			// Check if this pair is already matched
			const alreadyMatched = matchedPairs.some(pair => 
				pair.arabic === selectedArabic || pair.english === english
			);
			
			if (!alreadyMatched) {
				matchedPairs = [...matchedPairs, { arabic: selectedArabic, english }];
				selectedArabic = null;
				
				// Check if all pairs are matched
				const correctPairs = exercise.options?.filter(opt => opt.isCorrect) || [];
				if (matchedPairs.length === correctPairs.length) {
					// Auto-check after a short delay
					setTimeout(() => {
						checkMatchingResult();
					}, 500);
				}
			}
		}
	}

	function checkMatchingResult() {
		if (!exercise.options) return;
		
		const correctPairs = exercise.options
			.filter(opt => opt.isCorrect)
			.map(opt => ({ arabic: opt.arabic, english: opt.english }));
		
		// Check if all matched pairs are correct
		const allCorrect = correctPairs.every(correctPair => 
			matchedPairs.some(matched => 
				matched.arabic === correctPair.arabic && matched.english === correctPair.english
			)
		) && matchedPairs.length === correctPairs.length;
		
		isCorrect = allCorrect;
		showResult = true;
		allMatched = true;
	}

	function handleFillInBlank(blankIndex: number, optionValue: string) {
		if (showResult) return;
		blankSelections[blankIndex] = optionValue;
	}

	function checkFillInBlank() {
		if (!exercise.correctAnswer || !exercise.options) return;
		
		const correctAnswers = Array.isArray(exercise.correctAnswer) 
			? exercise.correctAnswer 
			: [exercise.correctAnswer];
		
		// Check if all blanks are filled
		if (blankSelections.length !== correctAnswers.length || blankSelections.some(sel => sel === null)) {
			return;
		}
		
		// Check each blank against the correct answer
		const allCorrect = blankSelections.every((selection, index) => {
			if (!selection) return false;
			const correctAnswer = correctAnswers[index];
			const selectedOption = exercise.options?.find(opt => opt.arabic === selection);
			
			if (!selectedOption) return false;
			
			// The correct answer could be in arabic, english, or transliteration format
			// Check if the selected option matches the correct answer in any format
			return selectedOption.arabic === correctAnswer || 
			       selectedOption.english === correctAnswer || 
			       selectedOption.transliteration === correctAnswer ||
			       // Also check if the correct answer matches the selected option's arabic (most common case)
			       (correctAnswer === selectedOption.arabic);
		});
		
		isCorrect = allCorrect;
		showResult = true;
	}

	function resetExercise() {
		selectedAnswer = null;
		showResult = false;
		isCorrect = false;
		showHint = false;
		selectedArabic = null;
		selectedEnglish = null;
		matchedPairs = [];
		allMatched = false;
		if (exercise.type === 'fill-in-blank') {
			blankSelections = Array(blankCount).fill(null);
		}
	}
</script>

<div class="bg-tile-300 p-5 rounded-lg border border-tile-600">
	<div class="mb-3">
		<span class="inline-block bg-tile-500 text-text-300 px-2 py-1 rounded text-xs font-semibold mb-2">
			{exercise.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
		</span>
		<p class="text-text-300 font-semibold mb-1">{exercise.question.english}</p>
			{#if exercise.question.arabic}
				<div class="flex items-center gap-2 mb-1">
					<p class="text-text-200" dir="rtl">{exercise.question.arabic}</p>
					<InlineAudioButton text={exercise.question.arabic} {dialect} />
				</div>
			{/if}
	</div>

	{#if exercise.type === 'multiple-choice' && exercise.options}
		<div class="space-y-2 mt-4">
			{#each exercise.options as option}
				<button
					type="button"
					onclick={() => handleMultipleChoice(option.arabic)}
					class="w-full flex items-start gap-3 p-3 bg-tile-400 rounded border border-tile-600 hover:bg-tile-500 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed {showResult && option.isCorrect ? 'ring-2 ring-green-500 bg-green-50' : ''} {showResult && selectedAnswer === option.arabic && !option.isCorrect ? 'ring-2 ring-red-500 bg-red-50' : ''}"
					disabled={showResult}
				>
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-1">
							<p class="text-lg font-semibold text-text-300" dir="rtl">
								{option.arabic}
							</p>
							<InlineAudioButton text={option.arabic} {dialect} />
						</div>
						<p class="text-text-200">{option.english}</p>
						<p class="text-text-200 italic text-sm">{option.transliteration}</p>
					</div>
					{#if showResult && option.isCorrect}
						<svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
					{/if}
					{#if showResult && selectedAnswer === option.arabic && !option.isCorrect}
						<svg class="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{:else if exercise.type === 'fill-in-blank'}
		{#if !exercise.options || exercise.options.length === 0}
			<div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
				<p class="text-yellow-800 text-sm">
					⚠ This fill-in-blank exercise is missing options. Please contact support.
				</p>
			</div>
		{:else}
		<div class="mt-4">
			<p class="text-sm text-text-200 mb-4">
				Select an option for each blank. The first selection fills the first blank, the second selection fills the second blank, and so on.
			</p>
			
			<!-- Display question with blanks -->
			<div class="mb-6 p-4 bg-tile-400 rounded border border-tile-600">
				{#if exercise.question.arabic}
					<div class="flex items-center gap-2 mb-2">
						<p class="text-text-200" dir="rtl">{exercise.question.arabic}</p>
						<InlineAudioButton text={exercise.question.arabic} {dialect} />
					</div>
				{/if}
				<div class="text-text-300">
					{#each questionParts as part, index}
						{#if /_{2,}|\[blank\]|___/gi.test(part)}
							{@const blankIndex = questionParts.slice(0, index).filter(p => /_{2,}|\[blank\]|___/gi.test(p)).length}
							<span class="inline-block min-w-[150px] px-3 py-1 mx-1 bg-tile-300 border-2 border-dashed border-tile-500 rounded text-center">
								{#if blankSelections[blankIndex]}
									<span class="text-text-300 font-semibold" dir="rtl">
										{exercise.options?.find(opt => opt.arabic === blankSelections[blankIndex])?.arabic || blankSelections[blankIndex]}
									</span>
								{:else}
									<span class="text-text-200 italic">______</span>
								{/if}
							</span>
						{:else}
							{part}
						{/if}
					{/each}
				</div>
			</div>
			
			<!-- Render blanks with dropdowns -->
			<div class="space-y-4 mb-4">
				{#each Array(blankCount) as _, blankIndex}
					<div class="flex flex-col sm:flex-row sm:items-center gap-3">
						<span class="text-text-300 font-semibold min-w-[100px]">Blank {blankIndex + 1}:</span>
						<select
							bind:value={blankSelections[blankIndex]}
							onchange={(e) => handleFillInBlank(blankIndex, e.target.value)}
							disabled={showResult}
							class="flex-1 px-4 py-2 border border-tile-600 bg-tile-400 text-text-300 rounded focus:outline-none focus:border-tile-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<option value="">-- Select an option --</option>
							{#each exercise.options as option}
								<option value={option.arabic}>
									{option.arabic} ({option.english}) - {option.transliteration}
								</option>
							{/each}
						</select>
						{#if blankSelections[blankIndex]}
							<div class="flex items-center gap-2">
								<div class="flex items-center gap-1">
									<p class="text-text-300 font-semibold" dir="rtl">
										{exercise.options.find(opt => opt.arabic === blankSelections[blankIndex])?.arabic}
									</p>
									<InlineAudioButton text={exercise.options.find(opt => opt.arabic === blankSelections[blankIndex])?.arabic || ''} {dialect} />
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
			
			<!-- Check button -->
			{#if !showResult}
				<button
					type="button"
					onclick={checkFillInBlank}
					disabled={blankSelections.some(sel => sel === null)}
					class="px-4 py-2 bg-tile-500 text-text-300 rounded hover:bg-tile-600 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Check Answer
				</button>
			{/if}
			
			<!-- Results -->
			{#if showResult}
				<div class="mt-4 p-4 rounded {isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
					<p class="text-text-300 font-semibold mb-2">
						{isCorrect ? '✓ All blanks are correct!' : '✗ Some blanks are incorrect'}
					</p>
					{#if !isCorrect && exercise.correctAnswer}
						<div class="mt-3">
							<p class="text-text-200 text-sm mb-2 font-semibold">Correct answers:</p>
							<div class="space-y-1">
								{#each (Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer : [exercise.correctAnswer]) as correctAnswer, index}
									<div class="text-text-200 text-sm">
										Blank {index + 1}: {correctAnswer}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
		{/if}
	{:else if exercise.type === 'matching' && exercise.options}
		<div class="mt-4">
			<p class="text-sm text-text-200 mb-4">
				Click on an Arabic word/phrase, then click on its matching English translation. 
				{#if matchedPairs.length > 0}
					Matched: {matchedPairs.length} / {exercise.options.filter(opt => opt.isCorrect).length}
				{/if}
			</p>
			
			{#if !showResult}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Arabic Column -->
					<div>
						<h5 class="text-sm font-semibold text-text-300 mb-2">Arabic (Click to select)</h5>
						<div class="space-y-2">
							{#each exercise.options.filter(opt => !matchedPairs.some(m => m.arabic === opt.arabic)) as option}
								<button
									type="button"
									onclick={() => handleArabicClick(option.arabic)}
									class="w-full p-3 bg-tile-400 rounded border-2 transition-all text-left {selectedArabic === option.arabic ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500' : 'border-tile-600 hover:bg-tile-500'}"
								>
									<div class="flex items-center gap-2 mb-1">
										<p class="text-lg font-semibold text-text-300" dir="rtl">
											{option.arabic}
										</p>
										<InlineAudioButton text={option.arabic} {dialect} />
									</div>
									<p class="text-text-200 italic text-sm">{option.transliteration}</p>
								</button>
							{/each}
						</div>
					</div>
					
					<!-- English Column -->
					<div>
						<h5 class="text-sm font-semibold text-text-300 mb-2">
							English {#if selectedArabic}(Click to match){/if}
						</h5>
						<div class="space-y-2">
							{#each exercise.options.filter(opt => !matchedPairs.some(m => m.english === opt.english)) as option}
								<button
									type="button"
									onclick={() => handleEnglishClick(option.english)}
									class="w-full p-3 bg-tile-400 rounded border-2 transition-all text-left {selectedArabic ? 'border-tile-600 hover:bg-tile-500 cursor-pointer' : 'border-tile-600 opacity-50 cursor-not-allowed'}"
									disabled={!selectedArabic}
								>
									<p class="text-text-200 font-medium">{option.english}</p>
								</button>
							{/each}
						</div>
					</div>
				</div>
				
				<!-- Matched Pairs Display -->
				{#if matchedPairs.length > 0}
					<div class="mt-6 pt-4 border-t border-tile-600">
						<h5 class="text-sm font-semibold text-text-300 mb-2">Matched Pairs</h5>
						<div class="space-y-2">
							{#each matchedPairs as pair}
								<div class="p-3 bg-green-50 border border-green-200 rounded flex items-center justify-between">
									<div class="flex items-center gap-2">
										<p class="text-lg font-semibold text-text-300" dir="rtl">{pair.arabic}</p>
										<span class="text-text-200">→</span>
										<p class="text-text-200 font-medium">{pair.english}</p>
									</div>
									<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
									</svg>
								</div>
							{/each}
						</div>
						{#if matchedPairs.length === exercise.options.filter(opt => opt.isCorrect).length}
							<button
								type="button"
								onclick={checkMatchingResult}
								class="mt-4 px-4 py-2 bg-tile-500 text-text-300 rounded hover:bg-tile-600"
							>
								Check Answers
							</button>
						{/if}
					</div>
				{/if}
			{:else}
				<!-- Show Results -->
				<div class="space-y-4">
					<div class="p-4 rounded {isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
						<p class="text-text-300 font-semibold mb-2">
							{isCorrect ? '✓ All matches are correct!' : '✗ Some matches are incorrect'}
						</p>
						{#if !isCorrect}
							<p class="text-text-200 text-sm mb-3">Here are the correct matches:</p>
							<div class="space-y-2">
								{#each exercise.options.filter(opt => opt.isCorrect) as option}
									<div class="p-2 bg-white rounded border border-green-200">
										<div class="flex items-center gap-2">
											<p class="text-text-300 font-semibold" dir="rtl">{option.arabic}</p>
											<span class="text-text-200">→</span>
											<p class="text-text-200">{option.english}</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if exercise.hint && !showResult}
		<div class="mt-4">
			<button
				type="button"
				onclick={() => showHint = !showHint}
				class="text-sm text-blue-600 hover:text-blue-800 underline"
			>
				{showHint ? 'Hide' : 'Show'} Hint
			</button>
			{#if showHint}
				<div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
					<p class="text-sm text-blue-800">{exercise.hint.english}</p>
					{#if exercise.hint.arabic}
						<p class="text-sm text-blue-800 mt-1" dir="rtl">{exercise.hint.arabic}</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	{#if showResult}
		<button
			type="button"
			onclick={resetExercise}
			class="mt-4 px-4 py-2 bg-tile-500 text-text-300 rounded hover:bg-tile-600"
		>
			Try Again
		</button>
	{/if}
</div>

