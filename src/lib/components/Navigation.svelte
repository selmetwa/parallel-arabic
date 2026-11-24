<script lang="ts">
  import Button from "./Button.svelte";
  import MobileMenu from "./MobileMenu.svelte";
  import DialectSwitcher from "./DialectSwitcher.svelte";
  import StreakBadge from "./StreakBadge.svelte";
  import type { LiveStreak } from "$lib/helpers/streak";

  interface Props {
    handleOpenDrawer: () => void;
    session: any;
    userEmail: string;
    targetDialect?: string | null;
    streak?: LiveStreak | null;
  }

  let { handleOpenDrawer, session, targetDialect, streak = null }: Props = $props();

  let mobileMenuOpen = $state(false);

  // Default to Egyptian if no dialect is set
  const learningDialect = $derived(targetDialect || 'egyptian-arabic');

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
            <li>
              <DialectSwitcher dialect={learningDialect} />
            </li>
            <li>
              <StreakBadge {streak} />
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
  targetDialect={learningDialect}
/>
