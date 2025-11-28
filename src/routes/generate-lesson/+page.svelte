<script lang="ts">
    import { curriculum } from '$lib/data/curriculum';
    
    let selectedModuleId = $state('');
    let selectedTopicId = $state('');
    let selectedDialect = $state('egyptian-arabic');
    let selectedModuleIds = $state<string[]>([]);
    let generateAll = $state(false);
    let batchMode = $state(false);
    
    let isGenerating = $state(false);
    let result = $state<any>(null);
    let error = $state('');
    let batchProgress = $state<{
        current: number;
        total: number;
        currentTopic: string;
        results: Array<{ topicId: string; title: string; success: boolean; skipped?: boolean; error?: string }>;
    } | null>(null);
    
    let currentModule = $derived(curriculum.find(m => m.id === selectedModuleId));
    
    async function handleGenerate() {
        if (batchMode) {
            await handleBatchGenerate();
            return;
        }
        
        if (!selectedTopicId) return;
        
        isGenerating = true;
        error = '';
        result = null;
        
        try {
            const response = await fetch('/generate-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topicId: selectedTopicId,
                    dialect: selectedDialect
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Generation failed');
            }
            
            result = data.lesson;
            
        } catch (e) {
            error = (e as Error).message;
        } finally {
            isGenerating = false;
        }
    }
    
    async function handleBatchGenerate() {
        if (!generateAll && selectedModuleIds.length === 0) {
            error = 'Please select at least one module or enable "Generate All"';
            return;
        }
        
        isGenerating = true;
        error = '';
        result = null;
        batchProgress = {
            current: 0,
            total: 0,
            currentTopic: '',
            results: []
        };
        
        try {
            // Calculate total topics
            let totalTopics = 0;
            if (generateAll) {
                totalTopics = curriculum.reduce((sum, m) => sum + m.topics.length, 0);
            } else {
                totalTopics = curriculum
                    .filter(m => selectedModuleIds.includes(m.id))
                    .reduce((sum, m) => sum + m.topics.length, 0);
            }
            
            batchProgress.total = totalTopics;
            
            const response = await fetch('/generate-lesson-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dialect: selectedDialect,
                    generateAll,
                    moduleIds: generateAll ? undefined : selectedModuleIds
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Batch generation failed');
            }
            
            result = data;
            batchProgress = {
                current: data.summary.total,
                total: data.summary.total,
                currentTopic: '',
                results: data.results.map((r: any) => ({
                    topicId: r.topicId,
                    title: r.title,
                    success: r.success,
                    error: r.error
                }))
            };
            
        } catch (e) {
            error = (e as Error).message;
        } finally {
            isGenerating = false;
        }
    }
    
    function toggleModule(moduleId: string) {
        if (selectedModuleIds.includes(moduleId)) {
            selectedModuleIds = selectedModuleIds.filter(id => id !== moduleId);
        } else {
            selectedModuleIds = [...selectedModuleIds, moduleId];
        }
    }
</script>

<div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Lesson Generator</h1>
    
    <!-- Mode Toggle -->
    <div class="mb-6 flex gap-4">
        <button
            onclick={() => { batchMode = false; generateAll = false; selectedModuleIds = []; }}
            class="px-4 py-2 rounded-lg font-medium transition-colors {!batchMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
        >
            Single Lesson
        </button>
        <button
            onclick={() => { batchMode = true; selectedTopicId = ''; selectedModuleId = ''; }}
            class="px-4 py-2 rounded-lg font-medium transition-colors {batchMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
        >
            Batch Generation
        </button>
    </div>
    
    <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
        {#if !batchMode}
            <!-- Single Lesson Mode -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <!-- Module Select -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Module</label>
                    <select 
                        bind:value={selectedModuleId}
                        class="w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Select Module...</option>
                        {#each curriculum as module}
                            <option value={module.id}>{module.title}</option>
                        {/each}
                    </select>
                </div>
                
                <!-- Topic Select -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                    <select 
                        bind:value={selectedTopicId}
                        disabled={!currentModule}
                        class="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        <option value="">Select Topic...</option>
                        {#if currentModule}
                            {#each currentModule.topics as topic}
                                <option value={topic.id}>{topic.title}</option>
                            {/each}
                        {/if}
                    </select>
                </div>
                
                <!-- Dialect Select -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Dialect</label>
                    <select 
                        bind:value={selectedDialect}
                        class="w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="egyptian-arabic">Egyptian Arabic</option>
                        <option value="levantine">Levantine</option>
                        <option value="fusha">MSA (Fusha)</option>
                        <option value="darija">Moroccan Darija</option>
                    </select>
                </div>
            </div>
            
            <button
                onclick={handleGenerate}
                disabled={isGenerating || !selectedTopicId}
                class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isGenerating ? 'Generating Lesson (this may take 30s)...' : 'Generate & Save Lesson'}
            </button>
        {:else}
            <!-- Batch Generation Mode -->
            <div class="space-y-6">
                <!-- Dialect Select -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Dialect</label>
                    <select 
                        bind:value={selectedDialect}
                        class="w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="egyptian-arabic">Egyptian Arabic</option>
                        <option value="levantine">Levantine</option>
                        <option value="fusha">MSA (Fusha)</option>
                        <option value="darija">Moroccan Darija</option>
                    </select>
                </div>
                
                <!-- Generate All Option -->
                <div class="flex items-center gap-3">
                    <input
                        type="checkbox"
                        bind:checked={generateAll}
                        id="generateAll"
                        onchange={() => { if (generateAll) selectedModuleIds = []; }}
                        class="w-5 h-5"
                    />
                    <label for="generateAll" class="text-sm font-medium text-gray-700 cursor-pointer">
                        Generate all lessons from all modules ({curriculum.reduce((sum, m) => sum + m.topics.length, 0)} total)
                    </label>
                </div>
                
                {#if !generateAll}
                    <!-- Module Selection -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Select Modules (or enable "Generate All" above)</label>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-3 border border-gray-300 rounded-md">
                            {#each curriculum as module}
                                <label class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedModuleIds.includes(module.id)}
                                        onchange={() => toggleModule(module.id)}
                                        class="w-4 h-4"
                                    />
                                    <span class="text-sm">{module.title} ({module.topics.length} topics)</span>
                                </label>
                            {/each}
                        </div>
                    </div>
                {/if}
                
                <button
                    onclick={handleBatchGenerate}
                    disabled={isGenerating || (!generateAll && selectedModuleIds.length === 0)}
                    class="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isGenerating 
                        ? `Generating... (this will take several minutes)` 
                        : `Generate ${generateAll ? 'All' : selectedModuleIds.length > 0 ? selectedModuleIds.reduce((sum, id) => sum + (curriculum.find(m => m.id === id)?.topics.length || 0), 0) : 0} Lessons`}
                </button>
            </div>
        {/if}
        
        {#if error}
            <div class="mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                {error}
            </div>
        {/if}
        
        {#if batchProgress && batchMode}
            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="mb-2">
                    <div class="flex justify-between text-sm mb-1">
                        <span>Progress: {batchProgress.current} / {batchProgress.total}</span>
                        <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style="width: {(batchProgress.current / batchProgress.total) * 100}%"
                        ></div>
                    </div>
                </div>
                {#if batchProgress.currentTopic}
                    <p class="text-sm text-gray-600 mt-2">Currently generating: {batchProgress.currentTopic}</p>
                {/if}
            </div>
        {/if}
    </div>
    
    {#if result}
        {#if batchMode && result.summary}
            <!-- Batch Results -->
            <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-green-700">Batch Generation Complete!</h2>
                    <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {result.summary.generated} / {result.summary.total} generated
                    </span>
                </div>
                
                <div class="space-y-4 mb-4">
                    <p><strong>Total:</strong> {result.summary.total} lessons</p>
                    <p><strong>Generated:</strong> {result.summary.generated} lessons</p>
                    {#if result.summary.skipped > 0}
                        <p><strong>Skipped (already exist):</strong> {result.summary.skipped} lessons</p>
                    {/if}
                    {#if result.summary.failed > 0}
                        <p><strong>Failed:</strong> {result.summary.failed} lessons</p>
                    {/if}
                    <p><strong>Total Duration:</strong> {Math.round(result.summary.totalDuration / 1000)}s</p>
                </div>
                
                <details class="bg-white p-4 rounded-lg border border-gray-200">
                    <summary class="cursor-pointer font-medium">View Detailed Results</summary>
                    <div class="mt-4 space-y-2 max-h-96 overflow-y-auto">
                        {#each result.results as r}
                            <div class="p-3 rounded border {
                                r.skipped ? 'bg-yellow-50 border-yellow-200' :
                                r.success ? 'bg-green-50 border-green-200' : 
                                'bg-red-50 border-red-200'
                            }">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="font-medium">{r.title} ({r.topicId})</p>
                                        {#if r.skipped}
                                            <p class="text-sm text-yellow-600 mt-1">Already exists, skipped</p>
                                        {:else if r.error}
                                            <p class="text-sm text-red-600 mt-1">{r.error}</p>
                                        {/if}
                                    </div>
                                    <span class="text-sm {
                                        r.skipped ? 'text-yellow-600' :
                                        r.success ? 'text-green-600' : 
                                        'text-red-600'
                                    }">
                                        {r.skipped ? '⊘' : r.success ? '✓' : '✗'}
                                    </span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </details>
            </div>
        {:else if !batchMode}
            <!-- Single Lesson Result -->
            <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-green-700">Generation Successful!</h2>
                    <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Saved to file</span>
                </div>
                
                <div class="space-y-4">
                    <p><strong>Topic:</strong> {result.title}</p>
                    <p><strong>Total Steps:</strong> {result.steps.length}</p>
                    
                    <details class="bg-white p-4 rounded-lg border border-gray-200">
                        <summary class="cursor-pointer font-medium">View Raw JSON</summary>
                        <pre class="mt-4 overflow-x-auto text-xs bg-gray-900 text-green-400 p-4 rounded-lg">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>
        {/if}
    {/if}
</div>

