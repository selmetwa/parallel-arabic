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

    let { lesson, onClose, onLessonComplete, user } = $props<{ 
        lesson: GeneratedLesson, 
        onClose: () => void,
        onLessonComplete?: (nextLessonId?: string) => void | Promise<void>,
        user?: { id: string } | null
    }>();

    let currentStepIndex = $state(0);
    let currentStep = $derived(lesson.steps[currentStepIndex]);
    let totalSteps = $derived(lesson.steps.length);
    let progress = $derived(((currentStepIndex + 1) / totalSteps) * 100);
    
    // For alphabet lessons, use 'egyptian-arabic' for text-to-speech
    const isAlphabetLesson = $derived(lesson.topicId?.startsWith('m-alphabet-') || lesson.dialect === 'alphabet');
    const ttsDialect = $derived(isAlphabetLesson ? 'egyptian-arabic' : (lesson.dialect as Dialect));
    
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
    
    // Save sentence state
    let isSavingSentence = $state(false);
    let sentenceSaveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');

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
            // Reset save status
            sentenceSaveStatus = 'idle';
        }
    });
    
    // Save practice sentence to review deck
    async function savePracticeSentence(sentence: { arabic: string; english: string; transliteration: string }) {
        if (!user?.id) {
            sentenceSaveStatus = 'error';
            return;
        }
        
        sentenceSaveStatus = 'saving';
        isSavingSentence = true;
        
        try {
            const response = await fetch('/api/save-sentences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sentences: [sentence],
                    dialect: lesson.dialect
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                sentenceSaveStatus = 'saved';
                // Reset to idle after 2 seconds
                setTimeout(() => {
                    sentenceSaveStatus = 'idle';
                }, 2000);
            } else {
                sentenceSaveStatus = 'error';
            }
        } catch (error) {
            console.error('Error saving sentence:', error);
            sentenceSaveStatus = 'error';
        } finally {
            isSavingSentence = false;
        }
    }
    
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
                    speakArabic(arabicText, ttsDialect).catch(error => {
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
    
    // Parse verb conjugation tables from text
    interface ConjugationTable {
        baseVerb: string;
        baseTransliteration: string;
        baseEnglish: string;
        conjugations: Array<{
            person: string;
            arabic: string;
            transliteration: string;
            english: string;
        }>;
    }
    
    function parseConjugationTables(text: string): { tables: ConjugationTable[]; remainingText: string } {
        const tables: ConjugationTable[] = [];
        let remainingText = text;
        
        // Pattern to match sections starting with "**1. Base verb:" or "**2. Base verb:"
        const tableSectionPattern = /\*\*?\s*\d+\.\s*Base verb:.*?(?=\*\*?\s*\d+\.\s*Base verb:|$)/gis;
        
        // Find all table sections
        const tableSections: string[] = [];
        let match;
        while ((match = tableSectionPattern.exec(text)) !== null) {
            tableSections.push(match[0]);
        }
        
        // If no tables found, return original text
        if (tableSections.length === 0) {
            return { tables: [], remainingText: text };
        }
        
        // Parse each table
        for (const section of tableSections) {
            // Extract base verb info: "Base verb: يحب (to like) - ye7ebb"
            const baseVerbMatch = section.match(/Base verb:\s*([^\s(]+)\s*\(([^)]+)\)\s*-\s*([^\n*]+)/i);
            if (!baseVerbMatch) continue;
            
            const baseVerb = baseVerbMatch[1].trim();
            const baseEnglish = baseVerbMatch[2].trim();
            const baseTransliteration = baseVerbMatch[3].trim();
            
            // Extract conjugations (lines starting with *)
            // Format: * أنا باحب (ana ba7ebb) - I like
            const conjugationLines = section.split('\n').filter(line => line.trim().startsWith('*') && !line.includes('Base verb:'));
            const conjugations: ConjugationTable['conjugations'] = [];
            
            for (const line of conjugationLines) {
                // Remove leading * and trim
                const cleanLine = line.replace(/^\*\s*/, '').trim();
                
                // Split by " - " to separate the Arabic/transliteration part from English
                const parts = cleanLine.split(' - ');
                if (parts.length < 2) continue;
                
                const beforeDash = parts[0].trim();
                const english = parts.slice(1).join(' - ').trim();
                
                // Extract Arabic text (all Arabic characters)
                const arabicMatch = beforeDash.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g);
                const arabic = arabicMatch ? arabicMatch.join(' ') : '';
                
                // Extract transliteration (in parentheses)
                const transliterationMatch = beforeDash.match(/\(([^)]+)\)/);
                const transliteration = transliterationMatch ? transliterationMatch[1].trim() : '';
                
                // Extract person from English (usually the first word like "I", "You", "He", etc.)
                // Or from transliteration if English doesn't start with a pronoun
                let person = '';
                const englishWords = english.split(/\s+/);
                const firstEnglishWord = englishWords[0].toLowerCase();
                
                // Map common pronouns
                const pronounMap: Record<string, string> = {
                    'i': 'I',
                    'you': englishWords[1]?.toLowerCase() === '(m)' ? 'You (m)' : 
                           englishWords[1]?.toLowerCase() === '(f)' ? 'You (f)' : 'You',
                    'he': 'He',
                    'she': 'She',
                    'we': 'We',
                    'they': 'They'
                };
                
                person = pronounMap[firstEnglishWord] || englishWords[0];
                
                if (arabic && transliteration && english) {
                    conjugations.push({
                        person,
                        arabic,
                        transliteration,
                        english
                    });
                }
            }
            
            if (conjugations.length > 0) {
                tables.push({
                    baseVerb,
                    baseTransliteration,
                    baseEnglish,
                    conjugations
                });
                
                // Remove this table section from remaining text
                remainingText = remainingText.replace(section, '');
            }
        }
        
        // Clean up remaining text (remove extra newlines and markdown formatting)
        remainingText = remainingText
            .replace(/\*\*?\s*\d+\.\s*Base verb:.*?(?=\*\*?\s*\d+\.\s*Base verb:|$)/gis, '')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\s+|\s+$/g, '')
            .trim();
        
        return { tables, remainingText };
    }
</script>

<div class="fixed inset-0 z-[100] bg-tile-300 flex flex-col" transition:fade={{ duration: 200 }}>
    
    <!-- Header -->
    <header class="bg-tile-400 border-b-2 border-tile-600 px-4 py-4 flex items-center gap-4 shadow-lg z-10">
        <button onclick={onClose} class="text-text-200 hover:text-text-300 p-2 rounded-lg bg-tile-500 border-2 border-tile-600 hover:bg-tile-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        
        <div class="flex-1 max-w-lg mx-auto">
            <div class="relative h-3 bg-tile-600 rounded-full overflow-hidden border border-tile-700">
                <div class="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 ease-out rounded-full" style="width: {progress}%"></div>
            </div>
            <div class="flex justify-between mt-1">
                <span class="text-xs text-text-200 font-medium">Step {currentStepIndex + 1}</span>
                <span class="text-xs text-text-200 font-medium">{totalSteps} total</span>
            </div>
        </div>
        
        <button
            onclick={() => isDiacriticModalOpen = true}
            class="text-xs px-4 py-2 rounded-lg bg-tile-500 border-2 border-tile-600 text-text-300 hover:bg-tile-600 transition-colors font-semibold"
            title="View diacritical marks guide"
            aria-label="View diacritical marks guide"
        >
            📝 Diacritics
        </button>
    </header>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
        <div class="w-full max-w-2xl py-6 flex flex-col">
            
            {#key currentStepIndex}
                <div in:fly={{ x: 50, duration: 300, delay: 100 }} class="flex-1 flex flex-col">
                    
                    {#if currentStep.type === 'content'}
                        {@const parsedContent = parseConjugationTables(currentStep.content.text)}
                        <!-- Content Step -->
                        <div class="space-y-6">
                            <!-- Step Badge -->
                            <div class="text-center">
                                <span class="inline-block text-xs font-bold uppercase tracking-wider text-text-300 bg-tile-500 border-2 border-tile-600 px-4 py-2 rounded-lg shadow-md">
                                    📚 Learn
                                </span>
                            </div>
                            
                            <!-- Title Card -->
                            <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg text-center">
                                <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-2">{currentStep.content.title.english}</h2>
                                {#if currentStep.content.title.arabic}
                                    <h3 class="text-4xl sm:text-5xl text-text-300 font-arabic" dir="rtl">{currentStep.content.title.arabic}</h3>
                                {/if}
                            </div>
                            
                            <!-- Content Card -->
                            <div class="bg-tile-500 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
                                {#if parsedContent.remainingText}
                                    <div class="text-lg text-text-200 leading-relaxed mb-6 whitespace-pre-line">{parsedContent.remainingText}</div>
                                {/if}
                                
                                {#if parsedContent.tables.length > 0}
                                    <div class="space-y-6 mb-6">
                                        {#each parsedContent.tables as table}
                                            <div class="bg-tile-400 p-5 rounded-lg border-2 border-tile-600">
                                                <div class="mb-4 pb-3 border-b-2 border-tile-600">
                                                    <h4 class="text-lg font-bold text-text-300 mb-1">Base verb: <span dir="rtl" class="font-arabic">{table.baseVerb}</span></h4>
                                                    <p class="text-sm text-text-200">
                                                        <span class="font-semibold">{table.baseEnglish}</span> - <span class="italic">{table.baseTransliteration}</span>
                                                    </p>
                                                </div>
                                                
                                                <div class="overflow-x-auto -mx-2">
                                                    <table class="w-full border-collapse min-w-full">
                                                        <thead>
                                                            <tr class="bg-tile-600">
                                                                <th class="border-2 border-tile-700 px-3 py-2 text-left text-xs sm:text-sm font-bold text-text-300 whitespace-nowrap">Person</th>
                                                                <th class="border-2 border-tile-700 px-3 py-2 text-center text-xs sm:text-sm font-bold text-text-300">Arabic</th>
                                                                <th class="border-2 border-tile-700 px-3 py-2 text-left text-xs sm:text-sm font-bold text-text-300">Transliteration</th>
                                                                <th class="border-2 border-tile-700 px-3 py-2 text-left text-xs sm:text-sm font-bold text-text-300">English</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {#each table.conjugations as conj}
                                                                <tr class="hover:bg-tile-500 transition-colors">
                                                                    <td class="border-2 border-tile-600 px-3 py-3 text-text-200 font-semibold text-sm whitespace-nowrap">{conj.person}</td>
                                                                    <td class="border-2 border-tile-600 px-3 py-3 text-center">
                                                                        <div class="flex items-center justify-center gap-2 flex-wrap">
                                                                            <span class="text-xl sm:text-2xl font-bold text-text-300 font-arabic" dir="rtl">{conj.arabic}</span>
                                                                            <AudioButton 
                                                                                text={conj.arabic}
                                                                                dialect={ttsDialect}
                                                                                className="text-text-200 hover:text-text-300 shrink-0"
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td class="border-2 border-tile-600 px-3 py-3 text-text-200 italic text-sm">{conj.transliteration}</td>
                                                                    <td class="border-2 border-tile-600 px-3 py-3 text-text-200 text-sm">{conj.english}</td>
                                                                </tr>
                                                            {/each}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                                
                                {#if currentStep.content.examples && currentStep.content.examples.length > 0}
                                    <div class="space-y-4">
                                        <h4 class="text-sm font-bold uppercase tracking-wider text-text-300 border-b-2 border-tile-600 pb-2">Examples</h4>
                                        {#each currentStep.content.examples as example}
                                            <div class="bg-tile-400 p-5 rounded-lg border-2 border-tile-600 flex flex-col gap-4">
                                                <div class="flex items-start justify-between gap-4">
                                                    <div class="flex-1 space-y-1">
                                                        <p class="text-lg font-bold text-text-300">{example.english}</p>
                                                        <p class="text-sm text-text-200 italic">{example.transliteration}</p>
                                                        {#if example.diacriticalNotes}
                                                            <p class="text-xs text-text-200 font-medium mt-2">📝 {example.diacriticalNotes}</p>
                                                        {/if}
                                                    </div>
                                                    <div class="flex items-center gap-2">
<AudioButton 
                                                                            text={example.arabic}
                                                                            dialect={ttsDialect}
                                                                            className="text-text-200 hover:text-text-300"
                                                                        />
                                                        <BookmarkButton
                                                            arabic={example.arabic}
                                                            english={example.english}
                                                            transliteration={example.transliteration}
                                                            dialect={lesson.dialect}
                                                        />
                                                    </div>
                                                </div>
                                                <div class="bg-tile-300 p-4 rounded-lg border border-tile-500">
                                                    <p class="text-3xl sm:text-4xl font-bold text-text-300 text-center" dir="rtl">{example.arabic}</p>
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
                        <div class="flex-1 flex flex-col justify-center space-y-6">
                            <!-- Step Badge -->
                            <div class="text-center">
                                <span class="inline-block text-xs font-bold uppercase tracking-wider text-text-300 bg-tile-500 border-2 border-tile-600 px-4 py-2 rounded-lg shadow-md">
                                    🗣️ Practice Sentence
                                </span>
                                {#if step.context}
                                    <p class="text-sm text-text-200 italic mt-3">{step.context}</p>
                                {/if}
                            </div>
                            
                            <!-- Selection controls -->
                            {#if selectedWords.length > 0}
                                <div class="flex gap-2 justify-center">
                                    <button
                                        onclick={() => askChatGPT(selectedWords, step.sentence)}
                                        class="px-4 py-2 bg-tile-500 text-text-300 rounded-lg border-2 border-tile-600 hover:bg-tile-600 transition-colors font-semibold text-sm"
                                    >
                                        📖 Define "{selectedWords.join(' ')}"
                                    </button>
                                    <button
                                        onclick={clearSelection}
                                        class="px-4 py-2 bg-tile-400 text-text-200 rounded-lg border-2 border-tile-600 hover:bg-tile-500 hover:text-text-300 transition-colors font-semibold text-sm"
                                    >
                                        ✕ Clear
                                    </button>
                                </div>
                            {/if}
                            
                            <!-- Main Content Card -->
                            <div class="bg-tile-500 border-2 border-tile-600 rounded-lg p-6 shadow-lg space-y-6">
                                <!-- English sentence with word selection -->
                                <div 
                                    class="flex w-fit mx-auto flex-row flex-wrap justify-center text-xl sm:text-2xl font-bold text-text-300 select-none"
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
                                            class={cn("px-2 py-1 m-1 text-xl sm:text-2xl duration-200 cursor-pointer rounded-lg border-2", {
                                                "bg-blue-100 border-blue-500 text-blue-700": isWordSelected(index),
                                                "hover:bg-tile-400 border-transparent hover:border-tile-600": !isWordSelected(index)
                                            })}
                                        >{word}</span>
                                    {/each}
                                </div>
                                
                                <!-- Arabic sentence -->
                                <div class="bg-tile-400 p-6 rounded-lg border-2 border-tile-600 text-center space-y-3">
                                    <p class="text-3xl sm:text-4xl font-bold text-text-300 leading-relaxed" dir="rtl">{step.sentence.arabic}</p>
                                    <p class="text-base text-text-200 italic">{step.sentence.transliteration}</p>
                                </div>
                                
                                <!-- Action buttons -->
                                <div class="flex gap-3 justify-center pt-2 flex-wrap">
                                    <AudioButton text={step.sentence.arabic} dialect={ttsDialect}>
                                        🔊 Listen
                                    </AudioButton>
                                    <Button onClick={() => compareDialects(step.sentence)} type="button">
                                        🌍 Compare Dialects
                                    </Button>
                                    {#if user?.id}
                                        <Button 
                                            onClick={() => savePracticeSentence(step.sentence)} 
                                            type="button"
                                            disabled={isSavingSentence || sentenceSaveStatus === 'saved'}
                                            class={cn({
                                                'opacity-50 cursor-not-allowed': isSavingSentence || sentenceSaveStatus === 'saved',
                                                'bg-green-600 hover:bg-green-700 border-green-700': sentenceSaveStatus === 'saved'
                                            })}
                                        >
                                            {#if sentenceSaveStatus === 'saving'}
                                                💾 Saving...
                                            {:else if sentenceSaveStatus === 'saved'}
                                                ✓ Saved to Review
                                            {:else if sentenceSaveStatus === 'error'}
                                                ✗ Error
                                            {:else}
                                                💾 Save to Review
                                            {/if}
                                        </Button>
                                    {/if}
                                </div>
                            </div>
                        </div>
                        
                    {:else if currentStep.type === 'exercise'}
                        <!-- Exercise Step -->
                        <div class="flex-1 flex flex-col justify-center space-y-6">
                            <!-- Step Badge -->
                            <div class="text-center">
                                <span class="inline-block text-xs font-bold uppercase tracking-wider text-text-300 bg-tile-500 border-2 border-tile-600 px-4 py-2 rounded-lg shadow-md">
                                    {currentStep.exerciseType === 'multiple-choice' ? '❓ Quiz' : 
                                     currentStep.exerciseType === 'fill-in-blank' ? '✏️ Fill in the blank' : '🔗 Match'}
                                </span>
                            </div>
                            
                            <!-- Question Card -->
                            <div class="bg-tile-500 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
                                <h2 class="text-xl sm:text-2xl font-bold text-text-300 leading-relaxed">
                                    {#if isEntirelyArabic(currentStep.question)}
                                        <span dir="rtl" class="font-arabic block text-right text-2xl sm:text-3xl">{currentStep.question}</span>
                                    {:else if containsArabic(currentStep.question)}
                                        <div class="space-y-2">
                                            {#each parseQuestionWithRTL(currentStep.question) as part}
                                                {#if part.isArabic}
                                                    <div dir="rtl" class="font-arabic text-right text-text-300 text-2xl sm:text-3xl">{part.text}</div>
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
                                            <div class="bg-tile-400 p-4 rounded-lg border-2 border-tile-600">
                                                <div class="flex items-start justify-between gap-3 mb-2">
                                                    <p class="text-sm font-bold text-text-300">💡 Hint:</p>
                                                    {#if arabicToPlay}
                                                        <AudioButton 
                                                            text={arabicToPlay}
                                                            dialect={ttsDialect}
                                                            className="text-text-200 hover:text-text-300 shrink-0"
                                                        />
                                                    {/if}
                                                </div>
                                                <p class="text-lg text-text-200 italic">{currentStep.hint.transliteration}</p>
                                                {#if currentStep.hint.arabic}
                                                    <p class="text-2xl text-text-300 mt-2 font-arabic" dir="rtl">{currentStep.hint.arabic}</p>
                                                {/if}
                                            </div>
                                        {:else}
                                            <button
                                                onclick={() => showHint = true}
                                                class="text-sm text-text-200 hover:text-text-300 font-semibold underline"
                                            >
                                                💡 Show hint
                                            </button>
                                        {/if}
                                    </div>
                                {/if}
                            </div>

                            <!-- Options -->
                            <div class="space-y-3">
                                {#each currentStep.options as option}
                                    {@const isSelected = selectedOptionId === option.id}
                                    {@const showSuccess = isAnswerChecked && option.id === currentStep.correctAnswerId}
                                    {@const showError = isAnswerChecked && isSelected && !showSuccess}
                                    
                                    <button
                                        class="w-full p-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-between group shadow-md
                                        {isEntirelyArabic(option.text) ? 'text-right' : 'text-left'}
                                        {isSelected ? 'border-tile-700 bg-tile-500' : 'border-tile-600 bg-tile-400 hover:bg-tile-500 hover:border-tile-700'}
                                        {showSuccess ? '!border-green-600 !bg-green-100' : ''}
                                        {showError ? '!border-red-600 !bg-red-100' : ''}
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
                                                        <span dir="rtl" class="font-arabic inline-block text-text-300 text-2xl sm:text-3xl leading-relaxed">{part.text}</span>
                                                    {:else}
                                                        {part.text}
                                                    {/if}
                                                {/each}
                                            </span>
                                        {:else}
                                            <span class="text-lg font-medium text-text-300 leading-relaxed">{option.text}</span>
                                        {/if}
                                        
                                        {#if showSuccess}
                                            <span class="text-green-600 text-2xl font-bold">✓</span>
                                        {:else if showError}
                                            <span class="text-red-600 text-2xl font-bold">✕</span>
                                        {:else}
                                            <div class="w-6 h-6 rounded-full border-2 border-tile-600 group-hover:border-tile-700 {isSelected ? 'border-tile-700 bg-tile-700' : 'bg-tile-300'}"></div>
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
            class="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4"
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
                class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-2xl max-w-md w-full p-8 text-center"
                transition:fly={{ y: 50, duration: 300 }}
            >
                <div class="mb-8">
                    <div class="text-7xl mb-4" aria-hidden="true">🎉</div>
                    <h2 id="congratulations-title" class="text-3xl font-bold text-text-300 mb-3">Congratulations!</h2>
                    <p class="text-lg text-text-200">
                        You've completed
                    </p>
                    <p class="text-xl font-bold text-text-300 mt-1">"{lesson.title}"</p>
                </div>
                
                <div class="flex flex-col gap-3">
                    {#if onLessonComplete && findNextLessonId(lesson.topicId)}
                        <button
                            type="button"
                            class="w-full px-6 py-4 text-lg font-bold bg-green-600 border-2 border-green-700 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                            onclick={handleContinueToNext}
                        >
                            Continue to Next Lesson →
                        </button>
                    {/if}
                    <button
                        type="button"
                        class="w-full px-6 py-4 text-lg font-bold bg-tile-500 border-2 border-tile-600 text-text-300 rounded-lg hover:bg-tile-600 transition-colors"
                        onclick={handleCloseAfterCompletion}
                    >
                        Close
                    </button>
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
    <footer class="bg-tile-400 border-t-2 border-tile-600 p-4 sm:p-6 shadow-lg">
        <div class="max-w-2xl mx-auto flex items-center justify-between gap-4">
            {#if currentStep.type === 'exercise'}
                 <div class="flex-1">
                    {#if isAnswerChecked}
                        <div class="font-bold text-lg px-4 py-2 rounded-lg {isCorrect ? 'text-green-700 bg-green-100 border-2 border-green-300' : 'text-red-700 bg-red-100 border-2 border-red-300'}" in:slide>
                            {feedbackMessage}
                        </div>
                    {/if}
                 </div>
                 
                 {#if !isAnswerChecked}
                    <button 
                        class="w-full sm:w-auto px-10 py-4 text-lg font-bold bg-tile-500 border-2 border-tile-600 text-text-300 rounded-lg hover:bg-tile-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        onclick={checkAnswer}
                        disabled={!selectedOptionId}
                    >
                        Check Answer
                    </button>
                 {:else}
                    <button 
                        class="w-full sm:w-auto px-10 py-4 text-lg font-bold rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                        {isCorrect ? 'bg-green-600 border-2 border-green-700 text-white hover:bg-green-700' : 'bg-tile-500 border-2 border-tile-600 text-text-300'}"
                        onclick={nextStep}
                        disabled={!isCorrect} 
                    >
                        Next →
                    </button>
                 {/if}
            {:else if currentStep.type === 'practice-sentence'}
                <!-- Practice Sentence Navigation -->
                <button 
                    class="text-text-200 font-bold hover:text-text-300 px-6 py-3 rounded-lg bg-tile-500 border-2 border-tile-600 hover:bg-tile-600 transition-colors disabled:opacity-0"
                    onclick={prevStep}
                    disabled={currentStepIndex === 0}
                >
                    ← Back
                </button>
                
                <button 
                    class="w-full sm:w-auto px-10 py-4 text-lg font-bold bg-tile-600 border-2 border-tile-700 text-text-300 rounded-lg hover:bg-tile-700 transition-colors shadow-md"
                    onclick={nextStep}
                >
                    Continue →
                </button>
            {:else}
                <!-- Content Step Navigation -->
                <button 
                    class="text-text-200 font-bold hover:text-text-300 px-6 py-3 rounded-lg bg-tile-500 border-2 border-tile-600 hover:bg-tile-600 transition-colors disabled:opacity-0"
                    onclick={prevStep}
                    disabled={currentStepIndex === 0}
                >
                    ← Back
                </button>
                
                <button 
                    class="w-full sm:w-auto px-10 py-4 text-lg font-bold bg-tile-600 border-2 border-tile-700 text-text-300 rounded-lg hover:bg-tile-700 transition-colors shadow-md"
                    onclick={nextStep}
                >
                    {currentStepIndex === totalSteps - 1 ? '🎉 Finish' : 'Continue →'}
                </button>
            {/if}
        </div>
    </footer>
</div>
