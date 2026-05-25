<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';
    import levenshtein from 'fast-levenshtein';
    import type { SelfStudySession, SelfStudyStep } from '$lib/schemas/self-study-schema';
    import type { Dialect, Keyboard } from '$lib/types/index';
    import AudioButton from '$lib/components/AudioButton.svelte';
    import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
    import { speakArabic } from '$lib/helpers/speak-arabic';
    import { normalizeArabicText } from '$lib/utils/arabic-normalization';
    import { filterArabicCharacters } from '$lib/utils/arabic-normalization';
    import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
    import cn from 'classnames';
    import ArabicWordDisplay from '$lib/components/dialect-shared/story/components/ArabicWordDisplay.svelte';

    let { session, sessionId = null, onClose, user } = $props<{
        session: SelfStudySession;
        sessionId?: string | null;
        onClose: () => void;
        user?: { id: string } | null;
    }>();

    let currentStepIndex = $state(0);
    let showCompletion = $state(false);
    let currentStep = $derived(session.steps[currentStepIndex]);
    let totalSteps = $derived(session.steps.length);
    let progress = $derived(((currentStepIndex + 1) / totalSteps) * 100);

    let correctCount = $state(0);
    let gradedCount = $state(0);

    // Multiple choice
    let selectedOptionId = $state<string | null>(null);
    let isAnswerRevealed = $state(false);
    let isAnswerCorrect = $state(false);

    // Writing — real-time character feedback
    type Attempt = { letter: string; correct: boolean };
    let attempt = $state<Attempt[]>([]);
    let writingIsCorrect = $state(false);
    let writingChecked = $state(false);  // locked after user explicitly checks
    let writingInput = $state('');       // native keyboard value
    let showWritingHint = $state(false);
    let useVirtualKeyboard = $state(true);
    let keyboardContainer: HTMLDivElement | null = $state(null);
    let writingGradedThisStep = $state(false);

    // Speaking
    let isRecording = $state(false);
    let speakingSimilarity = $state<number | null>(null);
    let speakingTranscription = $state('');
    let isTranscribing = $state(false);
    let mediaRecorder = $state<MediaRecorder | null>(null);
    let audioChunks = $state<Blob[]>([]);

    // Definition modal (for reading step word clicks)
    let isDefinitionModalOpen = $state(false);
    let isLoadingDefinition = $state(false);
    let definition = $state('');
    let targetWord = $state('');
    let targetArabicWord = $state('');

    // Reading — story-style toggles
    let showReadingEnglish = $state(true);
    let showReadingTransliteration = $state(true);

    // Writing — SentenceBlock-style toggles + drag-to-define on English words
    let showWritingEnglish = $state(true);
    let showWritingAnswer = $state(false);
    let showWritingTashkeel = $state(false);
    let writingWordSelectedIndices = $state<number[]>([]);
    let writingWordIsSelecting = $state(false);
    let writingWordSelectionStart = $state(-1);
    let writingWordSelectionEnd = $state(-1);

    // Vocab / session save
    let isSavingVocab = $state(false);
    let vocabSaved = $state(false);
    let isSavingSession = $state(false);
    let sessionSaved = $state(false);

    const dialectName: Record<string, string> = {
        fusha: 'Modern Standard Arabic',
        levantine: 'Levantine Arabic',
        darija: 'Moroccan Darija',
        'egyptian-arabic': 'Egyptian Arabic',
        iraqi: 'Iraqi Arabic',
        khaleeji: 'Khaleeji Arabic'
    };

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    onMount(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            useVirtualKeyboard = false;
        }
        updateKeyboardStyle();

        // Poll virtual keyboard changes (same as SentenceBlock)
        document.addEventListener('keydown', checkWritingFromKeyboard);
        document.addEventListener('click', checkWritingFromKeyboard);
        const interval = setInterval(checkWritingFromKeyboard, 300);

        return () => {
            document.removeEventListener('keydown', checkWritingFromKeyboard);
            document.removeEventListener('click', checkWritingFromKeyboard);
            clearInterval(interval);
        };
    });

    // ── Step navigation ───────────────────────────────────────────────────────

    function resetStepState() {
        selectedOptionId = null;
        isAnswerRevealed = false;
        isAnswerCorrect = false;
        attempt = [];
        writingIsCorrect = false;
        writingChecked = false;
        writingInput = '';
        writingGradedThisStep = false;
        showWritingHint = false;
        speakingSimilarity = null;
        speakingTranscription = '';
        isTranscribing = false;
        showReadingEnglish = true;
        showReadingTransliteration = true;
        showWritingEnglish = true;
        showWritingAnswer = false;
        showWritingTashkeel = false;
        writingWordSelectedIndices = [];
        writingWordIsSelecting = false;
        writingWordSelectionStart = -1;
        writingWordSelectionEnd = -1;

        // Reset virtual keyboard
        if (useVirtualKeyboard && keyboardContainer) {
            setTimeout(() => {
                const el = keyboardContainer?.querySelector('arabic-keyboard') as Keyboard | null;
                el?.resetValue?.();
                if (el) updateKeyboardStyle(el); else updateKeyboardStyle();
            }, 0);
        }
    }

    function nextStep() {
        if (currentStepIndex < totalSteps - 1) {
            currentStepIndex++;
            resetStepState();
        } else {
            showCompletion = true;
            if (user?.id && !sessionSaved) saveSession();
        }
    }

    function prevStep() {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            resetStepState();
        }
    }

    // ── Multiple choice ───────────────────────────────────────────────────────

    function selectOption(step: SelfStudyStep, optionId: string, isCorrect: boolean) {
        if (isAnswerRevealed) return;
        selectedOptionId = optionId;
        isAnswerRevealed = true;
        isAnswerCorrect = isCorrect;
        gradedCount++;
        if (isCorrect) correctCount++;
        // Speak Arabic if this is a mode-A question (options have arabic)
        if (step.questionLanguage !== 'arabic') {
            const option = step.options?.find(o => o.id === optionId);
            if (option?.arabic) speakArabic(option.arabic, session.dialect as Dialect).catch(() => {});
        }
    }

    // ── Writing — real-time ───────────────────────────────────────────────────

    function getVirtualKeyboardValue(): string | null {
        if (!keyboardContainer) return null;
        const el = keyboardContainer.querySelector('arabic-keyboard') as Keyboard | null;
        return el?.getTextAreaValue?.() ?? null;
    }

    function compareWritingInput(value: string) {
        if (!currentStep || currentStep.type !== 'writing') return;
        const target = currentStep.targetArabic ?? '';

        const normalizedInput = normalizeArabicText(value.trim());
        const normalizedTarget = normalizeArabicText(target.trim());

        // Per-character visual feedback
        const inputArr = value.trim().split('');
        const normInputArr = normalizedInput.split('');
        const normTargetArr = normalizedTarget.split('');

        attempt = inputArr.map((letter, i) => ({
            letter,
            correct: (normInputArr[i] ?? '') === (normTargetArr[i] ?? '')
        }));

        const isNowCorrect = normalizedInput === normalizedTarget && normalizedInput.length > 0;
        if (isNowCorrect && !writingGradedThisStep) {
            writingIsCorrect = true;
            writingGradedThisStep = true;
            gradedCount++;
            correctCount++;
        } else if (!isNowCorrect) {
            writingIsCorrect = false;
        }
    }

    function checkWritingFromKeyboard() {
        if (!currentStep || currentStep.type !== 'writing') return;
        if (!useVirtualKeyboard) return;
        const value = getVirtualKeyboardValue();
        if (typeof value === 'string') compareWritingInput(value);
    }

    function onNativeKeyboard(e: Event) {
        const value = (e.target as HTMLTextAreaElement).value;
        writingInput = value;
        compareWritingInput(value);
    }

    // ── Speaking ──────────────────────────────────────────────────────────────

    function getSpeakingFeedback(score: number): { text: string; emoji: string; color: string } {
        if (score >= 90) return { text: 'Excellent!', emoji: '🎉', color: 'text-green-700' };
        if (score >= 75) return { text: 'Great job!', emoji: '👏', color: 'text-emerald-500' };
        if (score >= 60) return { text: 'Good effort!', emoji: '👍', color: 'text-yellow-500' };
        if (score >= 40) return { text: 'Keep practicing!', emoji: '💪', color: 'text-orange-500' };
        return { text: 'Try again!', emoji: '🔄', color: 'text-red-500' };
    }

    async function toggleRecording() {
        if (isRecording) {
            mediaRecorder?.stop();
            isRecording = false;
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioChunks = [];
                const recorder = new MediaRecorder(stream);
                recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks = [...audioChunks, e.data]; };
                recorder.onstop = async () => { stream.getTracks().forEach(t => t.stop()); await processSpeaking(); };
                recorder.start();
                mediaRecorder = recorder;
                isRecording = true;
            } catch { console.error('Microphone access denied'); }
        }
    }

    async function processSpeaking() {
        const step = currentStep;
        isTranscribing = true;
        try {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('dialect', session.dialect);
            formData.append('language', 'ar');
            const res = await fetch('/api/speech-to-text', { method: 'POST', body: formData });
            const data = await res.json();
            const transcribed: string = data.text || '';
            speakingTranscription = transcribed;
            const cleaned = transcribed.replace(/\./g, '');
            const target = step.speakingArabic ?? '';
            const distance = levenshtein.get(target, cleaned);
            const maxLen = Math.max(target.length, cleaned.length);
            speakingSimilarity = maxLen > 0 ? (1 - distance / maxLen) * 100 : 0;
        } catch { speakingTranscription = ''; speakingSimilarity = 0; }
        finally { isTranscribing = false; }
    }

    // ── Reading — bridge for ArabicWordDisplay ────────────────────────────────

    function setActiveWordForReading(wordObj: { english: string; arabic: string; transliterated: string; description: string; isLoading: boolean; type: string }) {
        targetWord = wordObj.arabic;
        targetArabicWord = filterArabicCharacters(wordObj.arabic);
        isLoadingDefinition = wordObj.isLoading;
        definition = wordObj.description;
        isDefinitionModalOpen = true;
    }

    // ── Writing word drag-to-define (English prompt words) ───────────────────

    function handleWritingWordMouseDown(index: number, e: MouseEvent) {
        e.preventDefault();
        writingWordIsSelecting = true;
        writingWordSelectionStart = index;
        writingWordSelectionEnd = index;
        updateWritingWordSelection();
    }

    function handleWritingWordMouseEnter(index: number) {
        if (writingWordIsSelecting) {
            writingWordSelectionEnd = index;
            updateWritingWordSelection();
        }
    }

    function handleWritingWordMouseUp() {
        writingWordIsSelecting = false;
    }

    function updateWritingWordSelection() {
        const start = Math.min(writingWordSelectionStart, writingWordSelectionEnd);
        const end = Math.max(writingWordSelectionStart, writingWordSelectionEnd);
        writingWordSelectedIndices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    function writingWordIsSelected(index: number): boolean {
        return writingWordSelectedIndices.includes(index);
    }

    function clearWritingWordSelection() {
        writingWordSelectedIndices = [];
        writingWordSelectionStart = -1;
        writingWordSelectionEnd = -1;
    }

    // ── Definition (for reading passages) ────────────────────────────────────

    async function lookupWord(arabicWord: string, context: { arabic: string; english: string; transliteration: string }) {
        targetWord = arabicWord;
        targetArabicWord = filterArabicCharacters(arabicWord);
        isLoadingDefinition = true;
        isDefinitionModalOpen = true;
        definition = '';

        const question = `What does ${arabicWord} mean in ${dialectName[session.dialect] || session.dialect}? Context sentence:
Arabic: "${context.arabic}"
English: "${context.english}"
Transliteration: "${context.transliteration}"`;

        try {
            const res = await fetch('/api/definition-sentence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ question, isSingleWordDefinition: true })
            });
            const data = await res.json();
            let content = data.message?.content || '';
            if (content.includes('```')) content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            try { JSON.parse(content); definition = content; }
            catch { definition = content || 'No definition available'; }
        } catch { definition = 'Error loading definition.'; }
        finally { isLoadingDefinition = false; }
    }

    async function lookupPhrase(words: string[], context: { arabic: string; english: string; transliteration: string }) {
        const phrase = words.join(' ');
        targetWord = phrase;
        targetArabicWord = filterArabicCharacters(phrase);
        isLoadingDefinition = true;
        isDefinitionModalOpen = true;
        definition = '';
        clearReadingSelection();

        const question = `What does the phrase "${phrase}" mean in ${dialectName[session.dialect] || session.dialect}? Context:
Arabic: "${context.arabic}"
English: "${context.english}"`;

        try {
            const res = await fetch('/api/definition-sentence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ question, isSingleWordDefinition: false })
            });
            const data = await res.json();
            let content = data.message?.content || '';
            if (content.includes('```')) content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            try { JSON.parse(content); definition = content; }
            catch { definition = content || 'No definition available'; }
        } catch { definition = 'Error loading definition.'; }
        finally { isLoadingDefinition = false; }
    }

    // ── Persistence ───────────────────────────────────────────────────────────

    async function saveVocabToReview() {
        if (!user?.id || vocabSaved) return;
        isSavingVocab = true;
        try {
            await Promise.all(session.vocabulary.map(word =>
                fetch('/api/save-word', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ activeWordObj: { arabic: word.arabic, english: word.english, transliterated: word.transliteration, dialect: session.dialect } })
                }).catch(() => {})
            ));
            vocabSaved = true;
        } finally { isSavingVocab = false; }
    }

    async function saveSession() {
        if (!user?.id || sessionSaved) return;
        isSavingSession = true;
        try {
            const res = await fetch('/api/save-self-study-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    // Fallback payload — only used if sessionId is null (persist-on-generate failed)
                    selfStudySession: sessionId ? undefined : session,
                    scorePercent: gradedCount > 0 ? Math.round((correctCount / gradedCount) * 100) : null
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error('[SelfStudyPlayer] saveSession failed:', err);
            } else {
                sessionSaved = true;
            }
        } catch (e) {
            console.error('[SelfStudyPlayer] saveSession error:', e);
        } finally {
            isSavingSession = false;
        }
    }

    let scorePercent = $derived(gradedCount > 0 ? Math.round((correctCount / gradedCount) * 100) : 0);
</script>

<!-- Definition modal -->
<DefinitionModal
    activeWordObj={{ english: targetWord, arabic: targetArabicWord, isLoading: isLoadingDefinition, description: definition }}
    isModalOpen={isDefinitionModalOpen}
    closeModal={() => { isDefinitionModalOpen = false; definition = ''; }}
    dialect={session.dialect as Dialect}
/>

<div class="fixed inset-0 z-[100] bg-tile-300 flex flex-col" transition:fade={{ duration: 200 }}>

    <!-- Header -->
    <header class="bg-tile-400 border-b-2 border-tile-600 px-4 py-3 flex items-center gap-4 shadow-lg z-10">
        <button onclick={onClose} aria-label="Close session" class="text-text-200 hover:text-text-300 p-2 rounded-lg bg-tile-500 border-2 border-tile-600 hover:bg-tile-600 transition-colors shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div class="flex-1 max-w-lg mx-auto">
            <div class="relative h-3 bg-tile-600 rounded-full overflow-hidden border border-tile-700">
                <div class="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out rounded-full" style="width: {progress}%"></div>
            </div>
            <div class="flex justify-between mt-1">
                <span class="text-xs text-text-200 font-medium">Step {currentStepIndex + 1} / {totalSteps}</span>
                <span class="text-xs text-text-200 font-medium">{gradedCount > 0 ? scorePercent + '%' : ''}</span>
            </div>
        </div>
        <div class="text-xs font-bold uppercase tracking-wider text-text-200 shrink-0 hidden sm:block">{session.title}</div>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-start justify-center">
        <div class="w-full max-w-3xl py-4 flex flex-col gap-6">
            {#key currentStepIndex}
            <div in:fly={{ x: 50, duration: 300, delay: 100 }}>

                <!-- ── READING ─────────────────────────────────────────────── -->
                {#if currentStep.type === 'reading'}
                    {@const readingSentence = {
                        arabic: { text: currentStep.passageArabic ?? '' },
                        english: { text: currentStep.passageEnglish ?? '' },
                        transliteration: { text: currentStep.passageTransliteration ?? '' },
                        wordAlignments: currentStep.wordAlignments
                    }}
                    <div class="space-y-4">
                        <div class="text-center">
                            <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-300 bg-blue-100 border border-blue-300 px-4 py-1.5 rounded-full">📖 Reading</span>
                            <h2 class="text-xl font-bold text-text-300 mt-3">{currentStep.title ?? ''}</h2>
                        </div>

                        {#if currentStep.tip}
                            <div class="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                                <p class="text-sm font-semibold text-amber-800">💡 Grammar Note: {currentStep.tip}</p>
                            </div>
                        {/if}

                        <!-- Story-style sentence card -->
                        <section class="bg-tile-400 border-2 rounded-xl p-6 border-tile-600">
                            <ArabicWordDisplay
                                sentence={readingSentence}
                                setActiveWord={setActiveWordForReading}
                                dialect={session.dialect as Dialect}
                                showEnglish={showReadingEnglish}
                                showTransliteration={showReadingTransliteration}
                            />
                            <!-- Footer: toggles + audio -->
                            <div class="mt-4 pt-3 border-t border-tile-600 flex items-center justify-between">
                                <span class="text-xs text-text-200 hidden sm:block">Click to define · drag to select a phrase</span>
                                <div class="flex items-center gap-3 ml-auto">
                                    <button
                                        onclick={() => showReadingEnglish = !showReadingEnglish}
                                        title={showReadingEnglish ? 'Hide English' : 'Show English'}
                                        class={cn('text-xs transition-opacity', showReadingEnglish ? 'opacity-40 hover:opacity-70' : 'opacity-20 hover:opacity-50 line-through')}
                                    >EN</button>
                                    <button
                                        onclick={() => showReadingTransliteration = !showReadingTransliteration}
                                        title={showReadingTransliteration ? 'Hide transliteration' : 'Show transliteration'}
                                        class={cn('text-xs transition-opacity', showReadingTransliteration ? 'opacity-40 hover:opacity-70' : 'opacity-20 hover:opacity-50 line-through')}
                                    >Trans</button>
                                    <AudioButton text={currentStep.passageArabic ?? ''} dialect={session.dialect as Dialect} />
                                </div>
                            </div>
                        </section>

                        <!-- Conjugation table (collapsible) -->
                        <details class="bg-tile-500 border border-tile-600 rounded-xl overflow-hidden">
                            <summary class="px-4 py-3 cursor-pointer text-sm font-bold text-text-300 hover:bg-tile-600 transition-colors select-none">
                                📋 {session.grammarConcept.verb} — conjugation table
                            </summary>
                            <div class="p-4 overflow-x-auto">
                                <table class="w-full text-sm border-collapse">
                                    <thead>
                                        <tr class="bg-tile-600">
                                            <th class="border border-tile-700 px-3 py-2 text-left text-xs font-bold text-text-300">Pronoun</th>
                                            <th class="border border-tile-700 px-3 py-2 text-center text-xs font-bold text-text-300">Past</th>
                                            <th class="border border-tile-700 px-3 py-2 text-center text-xs font-bold text-text-300">Present</th>
                                            <th class="border border-tile-700 px-3 py-2 text-center text-xs font-bold text-text-300">Future</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each session.grammarConcept.conjugationTable as row (row.pronoun)}
                                            <tr class="hover:bg-tile-400 transition-colors">
                                                <td class="border border-tile-600 px-3 py-2 text-text-200 text-xs">
                                                    <span class="font-arabic" dir="rtl">{row.pronoun}</span>
                                                    <span class="ml-1 opacity-60">({row.pronounEnglish})</span>
                                                </td>
                                                <td class="border border-tile-600 px-3 py-2 text-center font-arabic text-text-300 font-bold" dir="rtl">{row.past}</td>
                                                <td class="border border-tile-600 px-3 py-2 text-center font-arabic text-text-300" dir="rtl">{row.present}</td>
                                                <td class="border border-tile-600 px-3 py-2 text-center font-arabic text-text-300" dir="rtl">{row.future}</td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    </div>

                <!-- ── MULTIPLE CHOICE ─────────────────────────────────────── -->
                {:else if currentStep.type === 'multiple-choice'}
                    {@const isArabicQuestion = currentStep.questionLanguage === 'arabic'}
                    <div class="space-y-4">
                        <div class="text-center">
                            <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-300 bg-tile-500 border border-tile-600 px-4 py-1.5 rounded-full">
                                {currentStep.focus === 'vocabulary' ? '📝 Vocabulary' : '🔤 Grammar'}
                            </span>
                        </div>
                        <!-- Question -->
                        <div class="bg-tile-500 border border-tile-600 rounded-2xl p-5 shadow-md">
                            {#if isArabicQuestion}
                                <p class="text-2xl font-bold text-text-300 font-arabic text-right" dir="rtl">{currentStep.question ?? ''}</p>
                            {:else}
                                <p class="text-lg font-bold text-text-300">{currentStep.question ?? ''}</p>
                            {/if}
                        </div>
                        <!-- Options -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {#each (currentStep.options ?? []) as option (option.id)}
                                {@const isSelected = selectedOptionId === option.id}
                                {@const showSuccess = isAnswerRevealed && option.isCorrect}
                                {@const showError = isAnswerRevealed && isSelected && !option.isCorrect}
                                <button
                                    onclick={() => selectOption(currentStep, option.id, option.isCorrect)}
                                    disabled={isAnswerRevealed}
                                    class={cn(
                                        'p-4 rounded-xl border-2 transition-all duration-200 flex flex-col gap-1 shadow-sm disabled:cursor-not-allowed',
                                        isArabicQuestion ? 'items-start text-left' : 'items-end text-right',
                                        isSelected && !isAnswerRevealed ? 'border-blue-500 bg-blue-50' : 'border-tile-600 bg-tile-400 hover:bg-tile-500 hover:border-tile-700',
                                        showSuccess ? '!border-green-500 !bg-green-50' : '',
                                        showError ? '!border-red-500 !bg-red-50' : '',
                                        isAnswerRevealed && !isSelected && !option.isCorrect ? 'opacity-50' : ''
                                    )}
                                >
                                    {#if isArabicQuestion}
                                        <!-- English option -->
                                        <span class="text-base font-semibold text-text-300">{option.english ?? ''}</span>
                                    {:else}
                                        <!-- Arabic + transliteration option -->
                                        <span class="text-2xl font-bold text-text-300 font-arabic leading-relaxed" dir="rtl">{option.arabic ?? ''}</span>
                                        <span class="text-xs text-text-200 italic">{option.transliteration ?? ''}</span>
                                    {/if}
                                    {#if showSuccess}
                                        <span class="text-green-600 font-bold text-lg" aria-label="Correct">✓</span>
                                    {:else if showError}
                                        <span class="text-red-600 font-bold text-lg" aria-label="Incorrect">✕</span>
                                    {/if}
                                </button>
                            {/each}
                        </div>
                        {#if isAnswerRevealed}
                            <div class="bg-tile-400 border-2 {isAnswerCorrect ? 'border-green-400' : 'border-red-300'} rounded-xl p-4" in:fly={{ y: 10, duration: 200 }}>
                                <p class="font-bold {isAnswerCorrect ? 'text-green-700' : 'text-red-700'} mb-1">{isAnswerCorrect ? '✓ Correct!' : '✕ Not quite'}</p>
                                <p class="text-sm text-text-200">{currentStep.explanation ?? ''}</p>
                            </div>
                        {/if}
                    </div>

                <!-- ── WRITING ─────────────────────────────────────────────── -->
                {:else if currentStep.type === 'writing'}
                    {@const step = currentStep}
                    {@const englishWords = (step.promptEnglish ?? '').split(' ')}
                    {@const writingSelectedPhrase = writingWordSelectedIndices.map(i => englishWords[i]).filter(Boolean).join(' ')}
                    {@const displayArabic = showWritingTashkeel && step.targetArabicTashkeel ? step.targetArabicTashkeel : step.targetArabic ?? ''}
                    <div class="space-y-4">
                        <div class="text-center">
                            <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-300 bg-tile-500 border border-tile-600 px-4 py-1.5 rounded-full">✍️ Writing</span>
                        </div>

                        {#if currentStep.tip}
                            <div class="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                                <p class="text-sm font-semibold text-amber-800">💡 {currentStep.tip}</p>
                            </div>
                        {/if}

                        <!-- Controls bar (SentenceBlock-style) -->
                        <div class="flex flex-wrap items-center justify-center gap-2 p-3 bg-tile-400 rounded-xl border border-tile-500">
                            <button
                                onclick={() => showWritingEnglish = !showWritingEnglish}
                                class={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200', showWritingEnglish ? 'bg-amber-600 text-white shadow-md' : 'bg-tile-500 text-text-300 hover:bg-tile-600 border border-tile-600')}
                            >{showWritingEnglish ? 'Hide' : 'Show'} English</button>

                            <button
                                onclick={() => showWritingHint = !showWritingHint}
                                class={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200', showWritingHint ? 'bg-amber-600 text-white shadow-md' : 'bg-tile-500 text-text-300 hover:bg-tile-600 border border-tile-600')}
                            >{showWritingHint ? 'Hide' : 'Show'} Hint</button>

                            <button
                                onclick={() => showWritingAnswer = !showWritingAnswer}
                                class={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200', showWritingAnswer ? 'bg-amber-600 text-white shadow-md' : 'bg-tile-500 text-text-300 hover:bg-tile-600 border border-tile-600')}
                            >{showWritingAnswer ? 'Hide' : 'Show'} Answer</button>

                            {#if step.targetArabicTashkeel}
                                <button
                                    onclick={() => showWritingTashkeel = !showWritingTashkeel}
                                    class={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200', showWritingTashkeel ? 'bg-amber-600 text-white shadow-md' : 'bg-tile-500 text-text-300 hover:bg-tile-600 border border-tile-600')}
                                >{showWritingTashkeel ? 'Hide' : 'Show'} Tashkeel</button>
                            {/if}

                            <AudioButton text={step.targetArabic ?? ''} dialect={session.dialect as Dialect} />
                        </div>

                        <!-- English prompt with drag-to-define (SentenceBlock pattern) -->
                        {#if showWritingEnglish}
                            <div class="bg-tile-500 border border-tile-600 rounded-2xl p-5 shadow-md space-y-3">
                                <!-- Multi-word selection bar -->
                                {#if writingWordSelectedIndices.length > 1}
                                    <div class="flex gap-2 justify-center flex-wrap mb-2">
                                        <button
                                            onclick={() => lookupPhrase(writingWordSelectedIndices.map(i => englishWords[i]).filter(Boolean), { arabic: step.targetArabic ?? '', english: step.promptEnglish ?? '', transliteration: step.hint ?? '' })}
                                            class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 transition-colors text-sm"
                                        >Define "{writingSelectedPhrase}"</button>
                                        <button onclick={clearWritingWordSelection} class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 transition-colors text-sm">Clear</button>
                                    </div>
                                {/if}

                                <!-- Clickable/draggable English words -->
                                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                                <div
                                    class="flex w-fit flex-row flex-wrap text-base sm:text-lg font-medium text-text-200 select-none mx-auto"
                                    onmouseup={handleWritingWordMouseUp}
                                    role="application"
                                    aria-label="Click words to look up definitions"
                                >
                                    {#each englishWords as word, wi (wi)}
                                        <span
                                            onmousedown={(e) => handleWritingWordMouseDown(wi, e)}
                                            onmouseenter={() => handleWritingWordMouseEnter(wi)}
                                            onclick={() => lookupWord(word, { arabic: step.targetArabic ?? '', english: step.promptEnglish ?? '', transliteration: step.hint ?? '' })}
                                            onkeydown={(e) => { if (e.key === 'Enter') lookupWord(word, { arabic: step.targetArabic ?? '', english: step.promptEnglish ?? '', transliteration: step.hint ?? '' }); }}
                                            role="button"
                                            tabindex="0"
                                            aria-label="Look up: {word}"
                                            class={cn('p-1 duration-200 cursor-pointer rounded-lg border-2', {
                                                'bg-blue-100 border-blue-400': writingWordIsSelected(wi),
                                                'hover:bg-tile-400 border-transparent hover:border-tile-600': !writingWordIsSelected(wi)
                                            })}
                                        >{word}</span>
                                    {/each}
                                </div>

                                <!-- Hint (transliteration) -->
                                {#if showWritingHint && step.hint}
                                    <p class="text-base text-text-200 italic text-center">({step.hint})</p>
                                {/if}

                                <!-- Target Arabic (shown when answer toggle is on) -->
                                {#if showWritingAnswer}
                                    <p class="text-2xl sm:text-3xl text-text-300 font-arabic text-center font-semibold" dir="rtl">{displayArabic}</p>
                                {/if}
                            </div>
                        {/if}

                        <!-- Real-time character feedback -->
                        {#if attempt.length > 0}
                            <div class="text-center min-h-12" dir="rtl">
                                {#each attempt as { letter, correct }, ai (ai)}
                                    <span class={cn('text-2xl sm:text-3xl', { 'text-green-600': correct, 'text-red-500': !correct })}>{letter}</span>
                                {/each}
                            </div>
                        {/if}

                        {#if writingIsCorrect}
                            <div class="bg-green-50 border-2 border-green-400 rounded-xl p-3 text-center" in:fly={{ y: 10, duration: 200 }}>
                                <p class="font-bold text-green-700">🎉 Correct! Well done.</p>
                            </div>
                        {/if}

                        <!-- Keyboard toggle + input -->
                        <div bind:this={keyboardContainer} class="space-y-3">
                            <button
                                onclick={() => { useVirtualKeyboard = !useVirtualKeyboard; setTimeout(() => updateKeyboardStyle(), 0); }}
                                class="flex items-center gap-2 px-3 py-1.5 text-sm text-text-300 bg-tile-400 hover:bg-tile-500 border border-tile-500 rounded-lg transition-colors"
                            >
                                {useVirtualKeyboard ? '📱 Use native keyboard' : '⌨️ Use virtual keyboard'}
                            </button>

                            <div class={cn('block', { hidden: !useVirtualKeyboard })}>
                                <arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
                            </div>

                            <textarea
                                oninput={onNativeKeyboard}
                                bind:value={writingInput}
                                placeholder="اكتب جوابك هنا..."
                                dir="rtl"
                                rows="3"
                                aria-label="Write your answer in Arabic"
                                class={cn(
                                    'w-full bg-tile-400 border-2 border-tile-600 rounded-xl p-4 text-2xl font-arabic text-text-300 placeholder-text-200 focus:outline-none focus:border-blue-400 transition-colors resize-none',
                                    { hidden: useVirtualKeyboard }
                                )}
                            ></textarea>
                        </div>
                    </div>

                <!-- ── SPEAKING ─────────────────────────────────────────────── -->
                {:else if currentStep.type === 'speaking'}
                    <div class="space-y-4">
                        <div class="text-center">
                            <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-300 bg-tile-500 border border-tile-600 px-4 py-1.5 rounded-full">🎙️ Speaking</span>
                        </div>
                        <div class="bg-tile-400 border-2 border-tile-600 rounded-2xl p-5 shadow-md space-y-3">
                            <p class="text-base text-text-200">{currentStep.speakingEnglish ?? ''}</p>
                            <div class="flex items-center justify-between gap-3">
                                <p class="text-2xl sm:text-3xl font-bold text-text-300 font-arabic leading-relaxed text-right flex-1" dir="rtl">{currentStep.speakingArabic ?? ''}</p>
                                <AudioButton text={currentStep.speakingArabic ?? ''} dialect={session.dialect as Dialect} />
                            </div>
                            <p class="text-sm text-text-200 italic">{currentStep.speakingTransliteration ?? ''}</p>
                            {#if currentStep.tip}
                                <p class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">💡 {currentStep.tip}</p>
                            {/if}
                        </div>

                        <div class="flex justify-center">
                            <button
                                onclick={toggleRecording}
                                disabled={isTranscribing}
                                class={cn(
                                    'group flex flex-col items-center gap-4 p-8 rounded-3xl border-4 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
                                    isRecording
                                        ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/30'
                                        : 'bg-tile-300/50 border-tile-500 hover:border-tile-600 hover:bg-tile-400/50'
                                )}
                            >
                                <div class={cn('w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300', isRecording ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-red-400 to-red-600 group-hover:from-red-500 group-hover:to-red-700')}>
                                    {#if isRecording}
                                        <div class="w-8 h-8 bg-white rounded-sm" aria-hidden="true"></div>
                                    {:else}
                                        <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                                        </svg>
                                    {/if}
                                </div>
                                <span class="text-lg font-bold {isRecording ? 'text-red-500' : 'text-text-300'}">
                                    {isTranscribing ? 'Processing...' : isRecording ? 'Tap to Stop' : 'Tap to Speak'}
                                </span>
                                <span class="text-sm text-text-200">{isRecording ? 'Recording your voice...' : 'Say the sentence in Arabic'}</span>
                            </button>
                        </div>

                        {#if isTranscribing}
                            <div class="flex flex-col items-center gap-3 py-6" role="status" aria-live="polite">
                                <div class="w-10 h-10 border-4 border-tile-500 border-t-tile-700 rounded-full animate-spin" aria-hidden="true"></div>
                                <p class="text-text-200 font-medium">Analyzing your speech...</p>
                            </div>
                        {:else if speakingSimilarity !== null}
                            {@const feedback = getSpeakingFeedback(speakingSimilarity)}
                            <div class="bg-tile-300/50 border-2 border-tile-500/50 rounded-2xl p-6 space-y-4" in:fly={{ y: 10, duration: 200 }}>
                                <div class="flex items-center justify-center gap-4">
                                    <span class="text-4xl">{feedback.emoji}</span>
                                    <div class="text-center">
                                        <p class="text-4xl font-bold {feedback.color}">{Math.round(speakingSimilarity)}%</p>
                                        <p class="text-base font-semibold {feedback.color}">{feedback.text}</p>
                                    </div>
                                </div>
                                {#if speakingTranscription}
                                    <div class="border-t border-tile-500/30 pt-4">
                                        <p class="text-xs text-text-200 uppercase tracking-wider font-bold text-center mb-2">You said:</p>
                                        <p class="text-xl text-center font-arabic text-text-300" dir="rtl">{speakingTranscription}</p>
                                    </div>
                                {/if}
                                <div class="flex justify-center">
                                    <button onclick={() => { speakingSimilarity = null; speakingTranscription = ''; }} class="px-6 py-2.5 bg-tile-500 hover:bg-tile-600 text-text-300 font-semibold rounded-xl transition-colors flex items-center gap-2">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

            </div>
            {/key}
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-tile-400 border-t border-tile-600 p-4 shadow-lg">
        <div class="max-w-3xl mx-auto flex items-center gap-3">
            <button onclick={prevStep} disabled={currentStepIndex === 0} class="px-4 py-2.5 rounded-xl bg-tile-500 border border-tile-600 text-text-200 font-bold hover:bg-tile-600 transition-colors disabled:opacity-0 text-sm">← Back</button>
            <div class="flex-1 flex justify-end gap-2">
                {#if currentStep.type === 'multiple-choice'}
                    <button onclick={nextStep} disabled={!isAnswerRevealed} class="px-8 py-2.5 rounded-xl bg-tile-600 border border-tile-700 text-text-300 font-bold hover:bg-tile-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                        {currentStepIndex === totalSteps - 1 ? '🎉 Finish' : 'Next →'}
                    </button>
                {:else if currentStep.type === 'writing'}
                    <button onclick={nextStep} class="px-8 py-2.5 rounded-xl bg-tile-600 border border-tile-700 text-text-300 font-bold hover:bg-tile-700 transition-colors text-sm
                        {writingIsCorrect ? '!bg-green-600 !border-green-700 !text-white' : ''}">
                        {writingIsCorrect ? '✓ Next →' : currentStepIndex === totalSteps - 1 ? '🎉 Finish' : 'Next →'}
                    </button>
                {:else if currentStep.type === 'speaking'}
                    <button onclick={nextStep} disabled={isRecording || isTranscribing} class="px-8 py-2.5 rounded-xl bg-tile-600 border border-tile-700 text-text-300 font-bold hover:bg-tile-700 transition-colors disabled:opacity-40 text-sm">
                        {speakingSimilarity === null ? 'Skip →' : currentStepIndex === totalSteps - 1 ? '🎉 Finish' : 'Next →'}
                    </button>
                {:else}
                    <button onclick={nextStep} class="px-8 py-2.5 rounded-xl bg-tile-600 border border-tile-700 text-text-300 font-bold hover:bg-tile-700 transition-colors text-sm">
                        {currentStepIndex === totalSteps - 1 ? '🎉 Finish' : 'Continue →'}
                    </button>
                {/if}
            </div>
        </div>
    </footer>
</div>

<!-- Completion Modal -->
{#if showCompletion}
    <div class="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" transition:fade={{ duration: 200 }} role="dialog" aria-modal="true" aria-labelledby="completion-title">
        <div class="bg-tile-400 border border-tile-600 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-6" transition:fly={{ y: 50, duration: 300 }}>
            <div>
                <div class="text-7xl mb-4" aria-hidden="true">🎉</div>
                <h2 id="completion-title" class="text-3xl font-bold text-text-300">Session Complete!</h2>
                <p class="text-text-200 mt-1">{session.title}</p>
            </div>
            {#if gradedCount > 0}
                <div class="bg-tile-500 border border-tile-600 rounded-xl p-4">
                    <p class="text-4xl font-bold {scorePercent >= 70 ? 'text-green-600' : 'text-orange-500'}">{scorePercent}%</p>
                    <p class="text-sm text-text-200 mt-1">{correctCount} / {gradedCount} graded steps correct</p>
                </div>
            {/if}
            <div class="space-y-3">
                {#if user?.id && !vocabSaved}
                    <button onclick={saveVocabToReview} disabled={isSavingVocab} class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                        {isSavingVocab ? 'Saving...' : `💾 Save ${session.vocabulary.length} words to Review Deck`}
                    </button>
                {:else if vocabSaved}
                    <p class="text-sm text-green-600 font-bold">✓ {session.vocabulary.length} words saved to your review deck</p>
                {/if}
                <button onclick={onClose} class="w-full px-6 py-3 bg-tile-500 border border-tile-600 text-text-300 font-bold rounded-xl hover:bg-tile-600 transition-colors">Close</button>
            </div>
        </div>
    </div>
{/if}
