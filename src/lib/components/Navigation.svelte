<script lang="ts">
  import Button from "./Button.svelte";

  interface Props {
    handleOpenDrawer: () => void;
    session: any;
    userEmail: string;
    targetDialect?: string | null;
    user?: {
      current_streak?: number | null;
      longest_streak?: number | null;
    } | null;
  }

  let { handleOpenDrawer, session, targetDialect, user }: Props = $props();

  // Map dialect values to flags (default to Egyptian)
  const dialectFlags: Record<string, string> = {
    'egyptian-arabic': '🇪🇬',
    'darija': '🇲🇦',
    'levantine': '🇱🇧',
    'fusha': '🇸🇦'
  };

  const dialectDisplayNames: Record<string, string> = {
    'egyptian-arabic': 'Egyptian Arabic',
    'darija': 'Moroccan Darija',
    'levantine': 'Levantine Arabic',
    'fusha': 'Modern Standard Arabic (Fusha)'
  };

  // Default to Egyptian if no dialect is set - make reactive with $derived
  const learningDialect = $derived(targetDialect || 'egyptian-arabic');
  const flag = $derived(dialectFlags[learningDialect] || '🇪🇬');
  const displayName = $derived(dialectDisplayNames[learningDialect] || 'Egyptian Arabic');
  
  // Streak counter
  const currentStreak = $derived(user?.current_streak ?? 0);
  const longestStreak = $derived(user?.longest_streak ?? 0);
</script>

<nav class="w-full border-b border-tile-600 py-4 bg-tile-300 relative">
    <menu class="w-full flex gap-4 px-4 items-center flex-wrap">
        <li><a class="text-text-300 text-sm sm:text-base underline" href="/">Home</a></li>
        {#if session}
          <li><a class="text-text-300 text-sm sm:text-base underline" href="/review">Review</a></li>
          <li><a class="text-text-300 text-sm sm:text-base underline" href="/profile">Profile</a></li>
        {/if}
        <menu class="ml-auto flex flex-row gap-4 items-center">
          {#if session}
            <li class="flex items-center gap-2">
              <span class="text-2xl">{flag}</span>
              <span class="text-text-200 text-sm">Learning {displayName}</span>
              {#if currentStreak > 0}
                <span class="text-2xl">🔥</span>
                <span class="text-text-200 text-sm font-semibold">
                  {currentStreak}
                  {#if longestStreak > currentStreak}
                    <span class="text-text-300 opacity-75">/ {longestStreak}</span>
                  {/if}
                </span>
              {/if}
            </li>
          {:else}
            <li><a class="text-text-300 text-sm sm:text-base underline" href="/login">Login</a></li>
            <li><a class="text-text-300 text-sm sm:text-base underline" href="/signup">Sign Up</a></li>        
          {/if}
          <li>
            <Button onClick={handleOpenDrawer} type="button">
              Theme
            </Button>
          </li>
        </menu>
    </menu>
</nav>
