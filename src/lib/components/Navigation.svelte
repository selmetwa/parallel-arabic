<script lang="ts">
  import Button from "./Button.svelte";
  import MobileMenu from "./MobileMenu.svelte";

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

  let mobileMenuOpen = $state(false);

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

<nav class="w-full border-b border-tile-600 py-4 bg-gradient-to-b from-tile-300 to-tile-200 backdrop-blur-sm sticky top-0 z-50 shadow-md">
    <menu class="w-full flex gap-4 px-4 sm:px-6 items-center flex-wrap">
        <li>
          <button
            type="button"
            onclick={() => (mobileMenuOpen = true)}
            class="grid h-9 w-9 place-items-center rounded-lg text-text-200 transition-all duration-200 hover:bg-tile-400 hover:text-text-300 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
            aria-label="Open menu"
            title="Open menu"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </li>
        <menu class="ml-auto flex flex-row gap-3 sm:gap-4 items-center">
          {#if session}
            <li class="flex items-center gap-2 bg-tile-400/50 px-3 py-1.5 rounded-full border border-tile-500/50">
              <span class="text-xl sm:text-2xl">{flag}</span>
              <span class="text-text-200 text-xs sm:text-sm hidden md:inline">Learning {displayName}</span>
              {#if currentStreak > 0}
                <span class="text-xl sm:text-2xl">🔥</span>
                <span class="text-text-200 text-xs sm:text-sm font-bold">
                  {currentStreak}
                  {#if longestStreak > currentStreak}
                    <span class="text-text-300 opacity-75 font-normal">/ {longestStreak}</span>
                  {/if}
                </span>
              {/if}
            </li>
          {:else}
            <li>
              <a class="text-text-300 text-sm sm:text-base font-semibold hover:text-text-100 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-tile-400/30" href="/login">
                Login
              </a>
            </li>
            <li>
              <a class="text-white text-sm sm:text-base font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-tile-600 to-tile-700 hover:from-tile-700 hover:to-tile-800 shadow-md hover:shadow-lg active:scale-95 transition-all duration-200" href="/signup">
                Sign Up
              </a>
            </li>
          {/if}
          <li>
            <Button onClick={handleOpenDrawer} type="button" className="!px-3 !py-1.5 !text-sm">
              Theme
            </Button>
          </li>
        </menu>
    </menu>
</nav>

<MobileMenu
  isOpen={mobileMenuOpen}
  onClose={() => (mobileMenuOpen = false)}
  {session}
  {handleOpenDrawer}
/>
