<script lang="ts">
    import type { SelfStudySession } from '$lib/schemas/self-study-schema';
    import type { Dialect } from '$lib/types/index';
    import SelfStudyPlayer from '$lib/components/SelfStudyPlayer.svelte';

    let { data } = $props();

    const DIALECTS: { value: Dialect; label: string }[] = [
        { value: 'egyptian-arabic', label: '🇪🇬 Egyptian Arabic' },
        { value: 'levantine', label: '🇱🇧 Levantine' },
        { value: 'fusha', label: '📖 Modern Standard Arabic' },
        { value: 'darija', label: '🇲🇦 Moroccan Darija' },
    ];

    const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    const SESSION_LENGTHS = [
        { value: 20,  label: '~20 steps', description: 'Quick review' },
        { value: 35,  label: '~35 steps', description: 'Standard' },
        { value: 50,  label: '~50 steps', description: 'Thorough' },
        { value: 999, label: 'All vocab',  description: 'Cover every word' },
    ];

    let wordList = $state('');
    let grammarNotes = $state('');
    let selectedDialect = $state<Dialect>('egyptian-arabic');
    let selectedLevel = $state('B1');
    let sessionLength = $state(35);

    let isGenerating = $state(false);
    let error = $state<string | null>(null);
    let session = $state<SelfStudySession | null>(null);
    let sessionId = $state<string | null>(null);

    async function generate() {
        if (!wordList.trim() || !grammarNotes.trim()) {
            error = 'Please paste both your word list and grammar notes.';
            return;
        }
        error = null;
        isGenerating = true;
        try {
            const res = await fetch('/api/generate-self-study', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wordList,
                    grammarNotes,
                    dialect: selectedDialect,
                    level: selectedLevel,
                    sessionLength
                })
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.error || 'Generation failed');
            }
            session = result.session as SelfStudySession;
            sessionId = result.sessionId ?? null;
        } catch (e) {
            error = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
        } finally {
            isGenerating = false;
        }
    }

    function closeSession() {
        session = null;
        sessionId = null;
    }
</script>

<svelte:head>
    <title>Self Study | Parallel Arabic</title>
</svelte:head>

{#if session}
    <SelfStudyPlayer {session} {sessionId} onClose={closeSession} user={data.user} />
{:else}
    <div class="min-h-screen bg-tile-300 py-10 px-4">
        <div class="max-w-4xl mx-auto space-y-8">

            <!-- Header -->
            <div class="text-center space-y-2">
                <h1 class="text-3xl sm:text-4xl font-bold text-text-300">Self Study</h1>
                <p class="text-text-200 text-base max-w-xl mx-auto">
                    Paste your vocabulary list and grammar notes from your tutor session. We'll generate a personalized review — reading, vocab drills, writing, and speaking — all in one flow.
                </p>
            </div>

            <!-- Controls row -->
            <div class="flex flex-wrap gap-4 justify-center">
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-bold uppercase tracking-wider text-text-200" for="dialect-select">Dialect</label>
                    <select id="dialect-select" bind:value={selectedDialect} class="bg-tile-400 border-2 border-tile-600 rounded-xl px-4 py-2.5 text-text-300 font-semibold focus:outline-none focus:border-blue-400 transition-colors">
                        {#each DIALECTS as d (d.value)}
                            <option value={d.value}>{d.label}</option>
                        {/each}
                    </select>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-bold uppercase tracking-wider text-text-200" for="level-select">Level</label>
                    <select id="level-select" bind:value={selectedLevel} class="bg-tile-400 border-2 border-tile-600 rounded-xl px-4 py-2.5 text-text-300 font-semibold focus:outline-none focus:border-blue-400 transition-colors">
                        {#each LEVELS as l (l)}
                            <option value={l}>{l}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <!-- Session length selector -->
            <div class="space-y-2">
                <p class="text-xs font-bold uppercase tracking-wider text-text-200 text-center">Session Length</p>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {#each SESSION_LENGTHS as opt (opt.value)}
                        <button
                            onclick={() => sessionLength = opt.value}
                            class="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200
                                {sessionLength === opt.value ? 'bg-blue-600 border-blue-700 text-white' : 'bg-tile-400 border-tile-600 text-text-300 hover:bg-tile-500'}"
                        >
                            <span class="font-bold text-sm">{opt.label}</span>
                            <span class="text-xs opacity-75">{opt.description}</span>
                        </button>
                    {/each}
                </div>
                <p class="text-xs text-text-200 text-center">Longer sessions cover more vocabulary words with more exercise variety.</p>
            </div>

            <!-- Input panels -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-bold text-text-300" for="word-list">
                        Vocabulary List
                        <span class="ml-1 text-xs text-text-200 font-normal">(paste raw tutor notes)</span>
                    </label>
                    <textarea
                        id="word-list"
                        bind:value={wordList}
                        placeholder="صَيّف to go for summer vacation&#10;صيف summer&#10;مُنتشر popular / common&#10;..."
                        rows="16"
                        class="w-full bg-tile-400 border-2 border-tile-600 rounded-xl p-4 text-base text-text-300 placeholder-text-200 focus:outline-none focus:border-blue-400 transition-colors resize-none font-mono leading-relaxed"
                    ></textarea>
                    <p class="text-xs text-text-200">Any format works — we'll handle the formatting.</p>
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-bold text-text-300" for="grammar-notes">
                        Grammar Notes
                        <span class="ml-1 text-xs text-text-200 font-normal">(verb, conjugation table, examples)</span>
                    </label>
                    <textarea
                        id="grammar-notes"
                        bind:value={grammarNotes}
                        placeholder="بَقى = (to be / to become / to start)&#10;Past: بقيت، بقيتي، بقى...&#10;&#10;Example: انا بقيت اشتغل من البيت..."
                        rows="16"
                        class="w-full bg-tile-400 border-2 border-tile-600 rounded-xl p-4 text-base text-text-300 placeholder-text-200 focus:outline-none focus:border-blue-400 transition-colors resize-none font-mono leading-relaxed"
                    ></textarea>
                    <p class="text-xs text-text-200">Paste your tutor's notes exactly as sent.</p>
                </div>
            </div>

            {#if error}
                <div class="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-red-700 font-semibold text-sm">{error}</div>
            {/if}

            <div class="flex justify-center">
                <button
                    onclick={generate}
                    disabled={isGenerating || !wordList.trim() || !grammarNotes.trim()}
                    class="px-10 py-4 text-lg font-bold rounded-2xl transition-all duration-200 shadow-lg border-2
                        {isGenerating ? 'bg-blue-400 border-blue-500 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 border-blue-700 text-white'}
                        disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {#if isGenerating}
                        <span class="flex items-center gap-3">
                            <span class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" aria-hidden="true"></span>
                            Generating your session…
                        </span>
                    {:else}
                        ✨ Generate Review Session
                    {/if}
                </button>
            </div>

            {#if isGenerating}
                <p class="text-center text-sm text-text-200 animate-pulse">
                    Parsing your notes and building your review session — this takes about 20–30 seconds for longer sessions…
                </p>
            {/if}

        </div>
    </div>
{/if}
