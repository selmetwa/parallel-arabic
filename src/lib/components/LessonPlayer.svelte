<script lang="ts">
    import { fade, fly, slide } from 'svelte/transition';
    import type { GeneratedLesson, LessonStep, ExerciseStep, PracticeSentenceStep } from '$lib/schemas/curriculum-schema';
    import type { z } from 'zod';
    import type { Dialect } from '$lib/types/index';
    import Button from '$lib/components/Button.svelte';
    import AudioButton from '$lib/components/AudioButton.svelte';
    import BookmarkButton from '$lib/components/BookmarkButton.svelte';
    import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
    import DialectComparisonModal from '$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte';
    import DiacriticExplanationModal from '$lib/components/DiacriticExplanationModal.svelte';
    import { filterArabicCharacters } from '$lib/utils/arabic-normalization';
    import { speakArabic } from '$lib/helpers/speak-arabic';
    import { curriculum } from '$lib/data/curriculum';
    import cn from 'classnames';

    let { lesson, onClose, onLessonComplete } = $props<{ 
        lesson: GeneratedLesson, 
        onClose: () => void,
        onLessonComplete?: (nextLessonId?: string) => void | Promise<void>
    }>();

    let currentStepIndex = $state(0);
    let currentStep = $derived(lesson.steps[currentStepIndex]);
    let totalSteps = $derived(lesson.steps.length);
    let progress = $derived(((currentStepIndex + 1) / totalSteps) * 100);
    
    // Exercise State
    let selectedOptionId = $state<string | null>(null);
    let isAnswerChecked = $state(false);
    let isCorrect = $state(false);
    let feedbackMessage = $state('');
    let showHint = $state(false);
    
    // Practice Sentence State
    let selectedWords = $state<string[]>([]);
    let isSelecting = $state(false);
    let selectionStartIndex = $state(-1);
    let selectionEndIndex = $state(-1);
    let isDefinitionModalOpen = $state(false);
    let isLoadingDefinition = $state(false);
    let definition = $state('');
    let targetWord = $state('');
    let targetArabicWord = $state('');
    
    // Dialect Comparison State
    let isComparisonModalOpen = $state(false);
    let comparisonData = $state<any>(null);
    let isComparing = $state(false);
    let comparisonError = $state<string | null>(null);
    
    // Diacritic Explanation Modal State
    let isDiacriticModalOpen = $state(false);
    
    // Lesson Completion State
    let showCongratulations = $state(false);

    // Reset state when step changes
    $effect(() => {
        if (currentStep) {
            selectedOptionId = null;
            isAnswerChecked = false;
            isCorrect = false;
            feedbackMessage = '';
            showHint = false;
            // Reset practice sentence state
            selectedWords = [];
            isSelecting = false;
            selectionStartIndex = -1;
            selectionEndIndex = -1;
            isDefinitionModalOpen = false;
            isLoadingDefinition = false;
            definition = '';
            targetWord = '';
            targetArabicWord = '';
        }
    });
    
    // Function to check if text contains Arabic characters
    function containsArabic(text: string): boolean {
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return arabicRegex.test(text);
    }
    
    // Function to check if text is entirely Arabic (or mostly Arabic with minimal punctuation)
    function isEntirelyArabic(text: string): boolean {
        const trimmed = text.trim();
        if (!trimmed) return false;
        // Remove common punctuation and check if remaining is Arabic
        const withoutPunctuation = trimmed.replace(/[.,!?'"()\[\]{}:;]/g, '').trim();
        if (!withoutPunctuation) return false;
        // Check if all remaining characters are Arabic
        const arabicRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/;
        return arabicRegex.test(withoutPunctuation);
    }
    
    // Function to extract Arabic text from a string
    function extractArabicText(text: string): string {
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
        const matches = text.match(arabicRegex);
        return matches ? matches.join(' ') : '';
    }
    
    // Function to parse question text and separate Arabic from English
    function parseQuestionWithRTL(question: string): Array<{ text: string; isArabic: boolean }> {
        // Arabic Unicode ranges: \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
        const parts: Array<{ text: string; isArabic: boolean }> = [];
        let lastIndex = 0;
        let match;
        
        while ((match = arabicRegex.exec(question)) !== null) {
            // Add text before Arabic
            if (match.index > lastIndex) {
                const beforeText = question.substring(lastIndex, match.index).trim();
                if (beforeText) {
                    parts.push({ text: beforeText + ' ', isArabic: false });
                }
            }
            // Add Arabic text with space after
            parts.push({ text: match[0], isArabic: true });
            lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < question.length) {
            const remainingText = question.substring(lastIndex).trim();
            if (remainingText) {
                parts.push({ text: remainingText, isArabic: false });
            }
        }
        
        return parts.length > 0 ? parts : [{ text: question, isArabic: false }];
    }

    function nextStep() {
        if (currentStepIndex < totalSteps - 1) {
            currentStepIndex++;
        } else {
            // Lesson completed - show congratulations
            showCongratulations = true;
        }
    }
    
    async function handleContinueToNext() {
        showCongratulations = false;
        
        // Mark lesson as completed if user is logged in
        if (lesson.topicId && lesson.dialect) {
            try {
                const response = await fetch('/api/structured-lessons/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topicId: lesson.topicId,
                        dialect: lesson.dialect
                    })
                });
                
                if (!response.ok) {
                    console.error('Failed to mark lesson as completed');
                }
            } catch (e) {
                console.error('Failed to mark lesson as completed:', e);
                // Continue anyway - not critical
            }
        }
        
        // Call onLessonComplete callback which will handle navigation and data refresh
        if (onLessonComplete) {
            // Find next lesson ID from curriculum (though we won't use it for now)
            const nextLessonId = findNextLessonId(lesson.topicId);
            await onLessonComplete(nextLessonId);
        } else {
            // Fallback to closing if no callback provided
            onClose();
        }
    }
    
    async function handleCloseAfterCompletion() {
        showCongratulations = false;
        
        // Mark lesson as completed if user is logged in
        if (lesson.topicId && lesson.dialect) {
            try {
                const response = await fetch('/api/structured-lessons/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topicId: lesson.topicId,
                        dialect: lesson.dialect
                    })
                });
                
                if (!response.ok) {
                    console.error('Failed to mark lesson as completed');
                }
            } catch (e) {
                console.error('Failed to mark lesson as completed:', e);
                // Continue anyway - not critical
            }
        }
        
        // Call onClose which will handle navigation and data refresh
        onClose();
    }
    
    function findNextLessonId(currentTopicId: string): string | undefined {
        // Find current lesson in curriculum
        let foundCurrent = false;
        
        for (const module of curriculum) {
            for (let i = 0; i < module.topics.length; i++) {
                const topic = module.topics[i];
                
                if (foundCurrent) {
                    // This is the next lesson
                    return topic.id;
                }
                
                if (topic.id === currentTopicId) {
                    foundCurrent = true;
                    // Check if there's a next topic in this module
                    if (i < module.topics.length - 1) {
                        // Next topic in same module
                        return module.topics[i + 1].id;
                    }
                    // Otherwise, continue to find first topic of next module
                }
            }
        }
        
        return undefined; // No next lesson found
    }

    function prevStep() {
        if (currentStepIndex > 0) {
            currentStepIndex--;
        }
    }

    function checkAnswer() {
        if (currentStep.type !== 'exercise' || !selectedOptionId) return;
        
        const step = currentStep as ExerciseStep;
        const correct = step.correctAnswerId === selectedOptionId;
        
        isAnswerChecked = true;
        isCorrect = correct;
        
        if (correct) {
            feedbackMessage = 'Correct! 🎉';
            // Play success sound (optional)
        } else {
            feedbackMessage = 'Not quite. Try again!';
            // Play error sound (optional)
        }
    }

    function handleOptionSelect(optionId: string) {
        if (isAnswerChecked && isCorrect) return; // Prevent changing after correct answer
        selectedOptionId = optionId;
        isAnswerChecked = false; // Reset check status if they change answer (unless correct)
        
        // Play audio for the selected option if it contains Arabic
        if (currentStep.type === 'exercise') {
            const step = currentStep as ExerciseStep;
            const selectedOption = step.options.find(opt => opt.id === optionId);
            if (selectedOption && containsArabic(selectedOption.text)) {
                // Extract Arabic text from the option
                const arabicText = extractArabicText(selectedOption.text);
                if (arabicText) {
                    speakArabic(arabicText, lesson.dialect).catch(error => {
                        console.error('Failed to play audio:', error);
                    });
                }
            }
        }
    }
    
    // Practice Sentence Functions
    function mapEnglishToArabic(englishWords: string[], sentence: { arabic: string; english: string; transliteration: string }): string {
        const allEnglishWords = sentence.english.split(' ');
        const allArabicWords = sentence.arabic.split(' ');
        
        const selectedIndices: number[] = [];
        for (const englishWord of englishWords) {
            const index = allEnglishWords.findIndex((word, i) => 
                word.toLowerCase() === englishWord.toLowerCase() && !selectedIndices.includes(i)
            );
            if (index !== -1) {
                selectedIndices.push(index);
            }
        }
        
        const correspondingArabicWords = selectedIndices
            .sort((a, b) => a - b)
            .map(index => allArabicWords[index])
            .filter(word => word);
        
        if (correspondingArabicWords.length > 0) {
            return filterArabicCharacters(correspondingArabicWords.join(' '));
        }
        
        return filterArabicCharacters(sentence.arabic);
    }
    
    async function askChatGPT(words: string | string[], sentence: { arabic: string; english: string; transliteration: string }) {
        const wordsArray = Array.isArray(words) ? words : [words];
        targetWord = wordsArray.join(' ');
        targetArabicWord = mapEnglishToArabic(wordsArray, sentence);
        
        isLoadingDefinition = true;
        isDefinitionModalOpen = true;
        
        const dialectName: Record<string, string> = {
            'fusha': 'Modern Standard Arabic',
            'levantine': 'Levantine Arabic',
            'darija': 'Moroccan Darija',
            'egyptian-arabic': 'Egyptian Arabic',
            'iraqi': 'Iraqi Arabic',
            'khaleeji': 'Khaleeji Arabic'
        };
        
        const wordText = wordsArray.length === 1 ? wordsArray[0] : `the phrase "${wordsArray.join(' ')}"`;
        const question = `What does ${wordText} mean in ${dialectName[lesson.dialect] || lesson.dialect}? Considering the following sentence:
        Arabic: "${sentence.arabic}"
        English: "${sentence.english}"
        Transliteration: "${sentence.transliteration}"
        
        Please provide a definition based on the context.`;
        
        try {
            const res = await fetch('/api/definition-sentence', {
                method: 'POST',
                headers: { accept: 'application/json' },
                body: JSON.stringify({ question })
            });
            
            const data = await res.json();
            
            try {
                const parsed = JSON.parse(data.message.content);
                definition = JSON.stringify(parsed);
            } catch (e) {
                definition = data.message.content;
            }
        } catch (error) {
            console.error('Error fetching definition:', error);
            definition = 'Failed to load definition. Please try again.';
        } finally {
            isLoadingDefinition = false;
        }
    }
    
    function handleWordMouseDown(index: number, event: MouseEvent) {
        event.preventDefault();
        isSelecting = true;
        selectionStartIndex = index;
        selectionEndIndex = index;
        updateSelectedWords();
    }
    
    function handleWordMouseEnter(index: number) {
        if (isSelecting) {
            selectionEndIndex = index;
            updateSelectedWords();
        }
    }
    
    function handleWordMouseUp() {
        isSelecting = false;
    }
    
    function updateSelectedWords() {
        if (!currentStep || currentStep.type !== 'practice-sentence') return;
        const step = currentStep as PracticeSentenceStep;
        const words = step.sentence.english.split(' ');
        const start = Math.min(selectionStartIndex, selectionEndIndex);
        const end = Math.max(selectionStartIndex, selectionEndIndex);
        selectedWords = words.slice(start, end + 1);
    }
    
    function clearSelection() {
        selectedWords = [];
        selectionStartIndex = -1;
        selectionEndIndex = -1;
    }
    
    function isWordSelected(index: number): boolean {
        const start = Math.min(selectionStartIndex, selectionEndIndex);
        const end = Math.max(selectionStartIndex, selectionEndIndex);
        return selectedWords.length > 0 && index >= start && index <= end;
    }
    
    function closeDefinitionModal() {
        isDefinitionModalOpen = false;
        definition = '';
    }
    
    async function compareDialects(sentence: { arabic: string; english: string; transliteration: string }) {
        isComparing = true;
        isComparisonModalOpen = true;
        comparisonData = null;
        comparisonError = null;
        
        try {
            const res = await fetch('/api/compare-dialects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: sentence.arabic,
                    currentDialect: lesson.dialect,
                    transliteration: sentence.transliteration,
                    english: sentence.english
                })
            });
            
            if (res.ok) {
                comparisonData = await res.json();
            } else {
                const errorData = await res.json().catch(() => ({ message: 'Failed to compare dialects' }));
                comparisonError = errorData.message || 'Failed to compare dialects. Please try again.';
            }
        } catch (e) {
            comparisonError = e instanceof Error ? e.message : 'An unexpected error occurred. Please try again.';
        } finally {
            isComparing = false;
        }
    }
    
    function closeComparisonModal() {
        isComparisonModalOpen = false;
    }
</script>

<div class="fixed inset-0 z-[100] bg-tile-100 flex flex-col" transition:fade={{ duration: 200 }}>
    
    <!-- Header -->
    <header class="bg-white border-b border-tile-200 px-4 py-3 flex items-center gap-4 shadow-sm z-10">
        <button onclick={onClose} class="text-text-200 hover:text-text-300 p-2 rounded-full hover:bg-tile-200 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        
        <div class="flex-1">
            <div class="h-2 bg-tile-300 rounded-full overflow-hidden w-full max-w-md mx-auto">
                <div class="h-full bg-green-500 transition-all duration-300 ease-out" style="width: {progress}%"></div>
            </div>
        </div>
        
        <button
            onclick={() => isDiacriticModalOpen = true}
            class="text-xs text-tile-600 hover:text-tile-700 px-3 py-1 rounded-lg hover:bg-tile-200 transition-colors font-medium"
            title="View diacritical marks guide"
            aria-label="View diacritical marks guide"
        >
            Diacritics Guide
        </button>
        
        <div class="text-sm font-bold text-text-200 w-10 text-right">
            {currentStepIndex + 1}/{totalSteps}
        </div>
    </header>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
        <div class="w-full max-w-2xl py-8 flex flex-col">
            
            {#key currentStepIndex}
                <div in:fly={{ x: 50, duration: 300, delay: 100 }} class="flex-1 flex flex-col">
                    
                    {#if currentStep.type === 'content'}
                        <!-- Content Step -->
                        <div class="text-center space-y-8 my-auto">
                            <h2 class="text-3xl font-bold text-text-300">{currentStep.content.title.english}</h2>
                            {#if currentStep.content.title.arabic}
                                <h3 class="text-5xl sm:text-6xl text-tile-600 font-arabic mb-6" dir="rtl">{currentStep.content.title.arabic}</h3>
                            {/if}
                            
                            <div class="bg-white p-8 rounded-2xl shadow-sm border-2 border-tile-200 text-left">
                                <p class="text-lg text-text-200 leading-loose mb-8">{currentStep.content.text}</p>
                                
                                {#if currentStep.content.examples && currentStep.content.examples.length > 0}
                                    <div class="space-y-6">
                                        {#each currentStep.content.examples as example}
                                            <div class="bg-tile-100 p-5 rounded-xl border border-tile-300 flex flex-col sm:flex-row items-center justify-between gap-5">
                                                <div class="text-center sm:text-left flex-1 space-y-2">
                                                    <p class="text-lg font-bold text-text-300 leading-relaxed">{example.english}</p>
                                                    <p class="text-sm text-text-200 italic opacity-75 leading-relaxed">{example.transliteration}</p>
                                                    {#if example.diacriticalNotes}
                                                        <p class="text-xs text-tile-600 mt-1 font-medium">📝 Note: {example.diacriticalNotes}</p>
                                                    {/if}
                                                </div>
                                                <div class="text-center sm:text-right flex items-center gap-3">
                                                    <p class="text-3xl sm:text-4xl font-bold text-tile-700 leading-relaxed" dir="rtl">{example.arabic}</p>
                                                    <AudioButton 
                                                        text={example.arabic}
                                                        dialect={lesson.dialect as any}
                                                        className="text-tile-600 hover:text-tile-700"
                                                    />
                                                    <BookmarkButton
                                                        arabic={example.arabic}
                                                        english={example.english}
                                                        transliteration={example.transliteration}
                                                        dialect={lesson.dialect}
                                                    />
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>

                    {:else if currentStep.type === 'practice-sentence'}
                        <!-- Practice Sentence Step -->
                        {@const step = currentStep as PracticeSentenceStep}
                        <div class="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full space-y-8">
                            <div class="text-center mb-4">
                                <span class="text-xs font-bold uppercase tracking-wider text-tile-600 bg-tile-200 px-3 py-1 rounded-full mb-4 inline-block">
                                    Practice Sentence
                                </span>
                                {#if step.context}
                                    <p class="text-sm text-text-200 italic mb-4">{step.context}</p>
                                {/if}
                            </div>
                            
                            <!-- Selection controls -->
                            {#if selectedWords.length > 0}
                                <div class="flex gap-2 justify-center mb-2">
                                    <button
                                        onclick={() => askChatGPT(selectedWords, step.sentence)}
                                        class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors"
                                    >
                                        Define "{selectedWords.join(' ')}"
                                    </button>
                                    <button
                                        onclick={clearSelection}
                                        class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors"
                                    >
                                        Clear Selection
                                    </button>
                                </div>
                            {/if}
                            
                            <!-- English sentence with word selection -->
                            <div 
                                class="flex w-fit mx-auto flex-row flex-wrap text-2xl sm:text-3xl font-bold text-text-300 select-none"
                                onmouseup={handleWordMouseUp}
                                role="application"
                                aria-label="Word selection area for definitions"
                            >
                                {#each step.sentence.english.split(' ') as word, index}
                                    <span
                                        onmousedown={(e) => handleWordMouseDown(index, e)}
                                        onmouseenter={() => handleWordMouseEnter(index)}
                                        onclick={() => askChatGPT(word, step.sentence)}
                                        onkeydown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                askChatGPT(word, step.sentence);
                                            }
                                        }}
                                        role="button"
                                        tabindex="0"
                                        aria-label={`Get definition for: ${word}`}
                                        class={cn("p-2 text-2xl sm:text-3xl duration-300 cursor-pointer border-2 rounded", {
                                            "bg-blue-200 border-blue-400": isWordSelected(index),
                                            "hover:bg-tile-500 border-transparent hover:border-tile-600": !isWordSelected(index)
                                        })}
                                    >{word}</span>
                                {/each}
                            </div>
                            
                            <!-- Arabic sentence -->
                            <div class="text-center space-y-3">
                                <p class="text-4xl sm:text-5xl font-bold text-tile-700 leading-relaxed" dir="rtl">{step.sentence.arabic}</p>
                                <p class="text-lg text-text-200 italic leading-relaxed">{step.sentence.transliteration}</p>
                            </div>
                            
                            <!-- Action buttons -->
                            <div class="flex gap-3 justify-center">
                                <AudioButton text={step.sentence.arabic} dialect={lesson.dialect as Dialect}>
                                    🔊 Listen
                                </AudioButton>
                                <Button onClick={() => compareDialects(step.sentence)} type="button">
                                    Compare Dialects
                                </Button>
                            </div>
                        </div>
                        
                    {:else if currentStep.type === 'exercise'}
                        <!-- Exercise Step -->
                         <div class="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
                            <div class="mb-10">
                                <span class="text-xs font-bold uppercase tracking-wider text-tile-600 bg-tile-200 px-3 py-1 rounded-full mb-6 inline-block">
                                    {currentStep.exerciseType === 'multiple-choice' ? 'Quiz' : 
                                     currentStep.exerciseType === 'fill-in-blank' ? 'Fill in the blank' : 'Match'}
                                </span>
                                <h2 class="text-2xl sm:text-3xl font-bold text-text-300 leading-relaxed">
                                    {#if isEntirelyArabic(currentStep.question)}
                                        <span dir="rtl" class="font-arabic block text-right text-3xl sm:text-4xl">{currentStep.question}</span>
                                    {:else if containsArabic(currentStep.question)}
                                        <div class="space-y-2">
                                            {#each parseQuestionWithRTL(currentStep.question) as part}
                                                {#if part.isArabic}
                                                    <div dir="rtl" class="font-arabic text-right text-tile-700 text-3xl sm:text-4xl">{part.text}</div>
                                                {:else}
                                                    <div>{part.text}</div>
                                                {/if}
                                            {/each}
                                        </div>
                                    {:else}
                                        {currentStep.question}
                                    {/if}
                                </h2>
                                
                                <!-- Hint Display -->
                                {#if currentStep.hint}
                                    {@const step = currentStep as ExerciseStep}
                                    {@const correctAnswer = step.options.find(opt => opt.id === step.correctAnswerId)}
                                    {@const arabicToPlay = currentStep.hint.arabic || correctAnswer?.text || ''}
                                    <div class="mt-4">
                                        {#if showHint}
                                            <div class="bg-tile-200 p-5 rounded-lg border border-tile-400">
                                                <div class="flex items-start justify-between gap-3 mb-3">
                                                    <p class="text-sm font-semibold text-text-200">💡 Hint:</p>
                                                    {#if arabicToPlay}
                                                        <AudioButton 
                                                            text={arabicToPlay}
                                                            dialect={lesson.dialect as Dialect}
                                                            className="text-tile-600 hover:text-tile-700 shrink-0"
                                                        />
                                                    {/if}
                                                </div>
                                                <p class="text-lg text-text-300 italic leading-relaxed">{currentStep.hint.transliteration}</p>
                                                {#if currentStep.hint.arabic}
                                                    <p class="text-2xl sm:text-3xl text-tile-700 mt-3 font-arabic leading-relaxed" dir="rtl">{currentStep.hint.arabic}</p>
                                                {/if}
                                            </div>
                                        {:else}
                                            <button
                                                onclick={() => showHint = true}
                                                class="text-sm text-tile-600 hover:text-tile-700 underline"
                                            >
                                                Show hint
                                            </button>
                                        {/if}
                                    </div>
                                {/if}
                            </div>

                            <div class="space-y-4">
                                {#each currentStep.options as option}
                                    {@const isSelected = selectedOptionId === option.id}
                                    {@const showSuccess = isAnswerChecked && option.id === currentStep.correctAnswerId}
                                    {@const showError = isAnswerChecked && isSelected && !showSuccess}
                                    
                                    <button
                                        class="w-full p-5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                                        {isEntirelyArabic(option.text) ? 'text-right' : 'text-left'}
                                        {isSelected ? 'border-tile-500 bg-tile-100' : 'border-tile-300 bg-white hover:bg-tile-50 hover:border-tile-400'}
                                        {showSuccess ? '!border-green-500 !bg-green-50' : ''}
                                        {showError ? '!border-red-500 !bg-red-50' : ''}
                                        "
                                        onclick={() => handleOptionSelect(option.id)}
                                        disabled={isAnswerChecked && isCorrect}
                                    >
                                        {#if isEntirelyArabic(option.text)}
                                            <span class="text-2xl sm:text-3xl font-medium text-text-300 font-arabic leading-relaxed" dir="rtl">{option.text}</span>
                                        {:else if containsArabic(option.text)}
                                            <span class="text-lg font-medium text-text-300 leading-relaxed">
                                                {#each parseQuestionWithRTL(option.text) as part}
                                                    {#if part.isArabic}
                                                        <span dir="rtl" class="font-arabic inline-block text-tile-700 text-2xl sm:text-3xl leading-relaxed">{part.text}</span>
                                                    {:else}
                                                        {part.text}
                                                    {/if}
                                                {/each}
                                            </span>
                                        {:else}
                                            <span class="text-lg font-medium text-text-300 leading-relaxed">{option.text}</span>
                                        {/if}
                                        
                                        {#if showSuccess}
                                            <span class="text-green-600 text-xl">✓</span>
                                        {:else if showError}
                                            <span class="text-red-500 text-xl">✕</span>
                                        {:else}
                                            <div class="w-6 h-6 rounded-full border-2 border-tile-300 group-hover:border-tile-400 {isSelected ? 'border-tile-600 bg-tile-600' : ''}"></div>
                                        {/if}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {/key}
        </div>
    </div>

    <!-- Congratulations Modal -->
    {#if showCongratulations}
        <div 
            class="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
            transition:fade={{ duration: 200 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="congratulations-title"
            tabindex="-1"
            onclick={(e) => {
                if (e.target === e.currentTarget) {
                    handleCloseAfterCompletion();
                }
            }}
            onkeydown={(e) => {
                if (e.key === 'Escape') {
                    handleCloseAfterCompletion();
                }
            }}
        >
            <div 
                class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
                transition:fly={{ y: 50, duration: 300 }}
            >
                <div class="mb-6">
                    <div class="text-6xl mb-4" aria-hidden="true">🎉</div>
                    <h2 id="congratulations-title" class="text-3xl font-bold text-text-300 mb-2">Congratulations!</h2>
                    <p class="text-lg text-text-200">
                        You've completed "{lesson.title}"
                    </p>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    {#if onLessonComplete && findNextLessonId(lesson.topicId)}
                        <Button
                            type="button"
                            className="!px-8 !py-3 text-lg !bg-green-600 hover:!bg-green-700"
                            onClick={handleContinueToNext}
                        >
                            Continue to Next Lesson →
                        </Button>
                    {/if}
                    <Button
                        type="button"
                        className="!px-8 !py-3 text-lg !bg-gray-200 hover:!bg-gray-300 !text-gray-800"
                        onClick={handleCloseAfterCompletion}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Modals -->
    <DiacriticExplanationModal
        isOpen={isDiacriticModalOpen}
        closeModal={() => isDiacriticModalOpen = false}
    />
    
    {#if currentStep?.type === 'practice-sentence'}
        {@const step = currentStep as PracticeSentenceStep}
        <DefinitionModal
            activeWordObj={{
                english: targetWord,
                arabic: targetArabicWord,
                isLoading: isLoadingDefinition,
                description: definition,
                transliterated: step.sentence.transliteration
            }}
            isModalOpen={isDefinitionModalOpen}
            closeModal={closeDefinitionModal}
            dialect={lesson.dialect as Dialect}
        />
        
        <DialectComparisonModal
            isOpen={isComparisonModalOpen}
            closeModal={closeComparisonModal}
            originalText={step.sentence.arabic}
            originalEnglish={step.sentence.english}
            {comparisonData}
            isLoading={isComparing}
            error={comparisonError}
            currentDialect={lesson.dialect as Dialect}
        />
    {/if}

    <!-- Footer -->
    <footer class="bg-white border-t border-tile-200 p-4 sm:p-6">
        <div class="max-w-2xl mx-auto flex items-center justify-between gap-4">
            {#if currentStep.type === 'exercise'}
                 <div class="flex-1">
                    {#if isAnswerChecked}
                        <div class="font-bold text-lg {isCorrect ? 'text-green-600' : 'text-red-500'}" in:slide>
                            {feedbackMessage}
                        </div>
                    {/if}
                 </div>
                 
                 {#if !isAnswerChecked}
                    <Button 
                        className="w-full sm:w-auto !px-12 !py-4 text-lg"
                        onClick={checkAnswer}
                        disabled={!selectedOptionId}
                    >
                        Check Answer
                    </Button>
                 {:else}
                     <Button 
                        className="w-full sm:w-auto !px-12 !py-4 text-lg {isCorrect ? '!bg-green-500 hover:!bg-green-600' : ''}"
                        onClick={nextStep}
                        disabled={!isCorrect} 
                    >
                        Next
                    </Button>
                 {/if}
            {:else if currentStep.type === 'practice-sentence'}
                <!-- Practice Sentence Navigation -->
                <button 
                    class="text-text-200 font-bold hover:text-text-300 px-4 py-2 rounded-lg hover:bg-tile-200 transition-colors disabled:opacity-0"
                    onclick={prevStep}
                    disabled={currentStepIndex === 0}
                >
                    Back
                </button>
                
                <Button 
                    className="w-full sm:w-auto !px-12 !py-4 text-lg"
                    onClick={nextStep}
                >
                    Continue
                </Button>
            {:else}
                <!-- Content Step Navigation -->
                <button 
                    class="text-text-200 font-bold hover:text-text-300 px-4 py-2 rounded-lg hover:bg-tile-200 transition-colors disabled:opacity-0"
                    onclick={prevStep}
                    disabled={currentStepIndex === 0}
                >
                    Back
                </button>
                
                <Button 
                    className="w-full sm:w-auto !px-12 !py-4 text-lg"
                    onClick={nextStep}
                >
                    {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Continue'}
                </Button>
            {/if}
        </div>
    </footer>
</div>
