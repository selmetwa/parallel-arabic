<script lang="ts">
    import { supabase } from '$lib/supabaseClient';
    
    interface Props {
        arabic: string;
        english: string;
        transliteration: string;
        dialect: string;
    }
    
    let { arabic, english, transliteration, dialect }: Props = $props();
    
    let isSaved = $state(false);
    let isLoading = $state(false);
    let isChecking = $state(true);
    let error = $state<string | null>(null);
    
    // Check if word is already saved (for UI state only)
    async function checkIfSaved() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                isChecking = false;
                return;
            }
            
            const { data } = await supabase
                .from('saved_word')
                .select('id')
                .eq('arabic_word', arabic)
                .eq('user_id', user.id)
                .maybeSingle();
            
            isSaved = !!data?.id;
        } catch (error) {
            console.error('[BookmarkButton] Error checking saved status:', error);
        } finally {
            isChecking = false;
        }
    }
    
    // Check on mount and when arabic changes
    $effect(() => {
        if (arabic) {
            checkIfSaved();
        }
    });
    
    async function toggleSave() {
        if (isSaved) {
            // Already saved, do nothing
            return;
        }
        
        isLoading = true;
        error = null;
        
        try {
            const res = await fetch('/api/save-word', {
                method: 'POST',
                headers: { 
                    'accept': 'application/json',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    activeWordObj: {
                        arabic,
                        english,
                        transliterated: transliteration,
                        dialect
                    }
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                // Server handles all checks - if we get here, it's saved
                if (data.message === 'Saved' || data.message === 'You have already saved this') {
                    isSaved = true;
                } else {
                    error = data.message || 'Failed to save';
                }
            } else {
                error = data.message || 'Failed to save word';
            }
        } catch (error) {
            console.error('[BookmarkButton] Error saving word:', error);
            error = 'Network error. Please try again.';
        } finally {
            isLoading = false;
            if (error) {
                setTimeout(() => error = null, 3000);
            }
        }
    }
</script>

<div class="relative inline-flex">
    {#if error}
        <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 text-xs px-2 py-1 rounded whitespace-nowrap z-50">
            {error}
        </div>
    {/if}
    <button
        type="button"
        onclick={toggleSave}
        disabled={isLoading}
        class="inline-flex items-center justify-center p-1.5 rounded hover:bg-tile-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed {isSaved ? 'text-yellow-500' : 'text-text-200'}"
        aria-label={isSaved ? 'Word saved' : 'Save to review later'}
        title={isSaved ? 'Word saved' : 'Save to review later'}
    >
    {#if isLoading}
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    {:else if isSaved}
        <svg class="w-4 h-4 fill-yellow-500 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    {/if}
    </button>
</div>

