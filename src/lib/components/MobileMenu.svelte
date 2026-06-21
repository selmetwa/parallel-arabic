<script lang="ts">
  import { page } from '$app/stores';
  import { fly, fade } from 'svelte/transition';

  interface NavItem {
    label: string;
    href: string;
    icon: string;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    session: any;
    handleOpenDrawer?: () => void;
  }

  let { isOpen, onClose, session, handleOpenDrawer }: Props = $props();

  const navSections = $derived.by(() => {
    const baseSections: NavSection[] = [
      {
        title: 'Learn',
        items: [
          { label: 'Alphabet', href: '/alphabet', icon: '✍️' },
          { label: 'Lessons', href: '/lessons', icon: '📚' },
          { label: 'Vocab Review', href: '/review', icon: '🧠' },
        ]
      },
      {
        title: 'Practice',
        items: [
          { label: 'Game', href: '/learn/game', icon: '🎮' },
          { label: 'Sentences', href: '/sentences', icon: '📝' },
          { label: 'Conjugations', href: '/conjugations', icon: '🔄' },
          { label: 'Stories', href: '/stories', icon: '📖' },
          { label: 'Speak', href: '/speak', icon: '🎤' },
          { label: 'Tutor', href: '/tutor', icon: '💬' },
        ]
      },
      {
        title: 'General',
        items: [
          { label: 'My words', href: '/review/all-words', icon: '🗂️' },
          { label: 'History', href: '/history', icon: '📜' },
          session
            ? { label: 'Profile', href: '/profile', icon: '👤' }
            : { label: 'Login', href: '/login', icon: '🔐' }
        ]
      }
    ];
    return baseSections;
  });

  function isActive(href: string): boolean {
    const currentPath = $page.url.pathname;
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(href);
  }

  function handleThemeClick() {
    onClose();
    handleOpenDrawer?.();
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <button
    type="button"
    aria-label="Close menu"
    class="fixed inset-0 z-[60] bg-black/40 lg:hidden"
    transition:fade={{ duration: 200 }}
    onclick={onClose}
  ></button>

  <!-- Slide-in panel -->
  <aside
    class="fixed left-0 top-0 bottom-0 z-[70] flex w-72 max-w-[85vw] flex-col bg-gradient-to-b from-tile-300 via-tile-300 to-tile-200 border-r border-tile-500 shadow-2xl lg:hidden"
    transition:fly={{ x: -288, duration: 250 }}
  >
    <!-- Header -->
    <div class="flex items-center gap-2 px-4 pt-5 pb-4">
      <a href="/" onclick={onClose} class="group flex min-w-0 flex-1 items-center gap-2.5">
        <span class="truncate text-lg font-bold tracking-tight text-text-300 transition-colors duration-200 group-hover:text-brand">
          Home
        </span>
      </a>
      <button
        type="button"
        onclick={onClose}
        class="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-text-200 transition-all duration-200 hover:bg-tile-400 hover:text-text-300 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
        aria-label="Close menu"
        title="Close menu"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <div class="mx-4 h-px bg-tile-500/70"></div>

    <!-- Scrollable navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-4">
      {#each navSections as section (section.title)}
        <div class="mb-3">
          <p class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-text-200">
            {section.title}
          </p>

          <div class="mt-1.5 flex flex-col gap-0.5">
            {#each section.items as item (item.href)}
              {@const active = isActive(item.href)}
              <a
                href={item.href}
                onclick={onClose}
                aria-current={active ? 'page' : undefined}
                class="group relative flex items-center gap-3 rounded-lg py-2 pl-4 pr-3 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-text-300 {active
                  ? 'bg-tile-400 font-semibold text-text-300 shadow-sm'
                  : 'text-text-200 hover:bg-tile-400 hover:text-text-300'}"
              >
                <!-- Active indicator pill -->
                <span
                  aria-hidden="true"
                  class="absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-brand transition-all duration-300 ease-out {active ? 'h-6 opacity-100' : 'h-0 opacity-0'}"
                ></span>

                <span
                  class="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md text-[15px] leading-none transition-all duration-200 {active
                    ? 'scale-105 bg-tile-200 shadow-sm'
                    : 'bg-transparent group-hover:bg-tile-300'}"
                >
                  {item.icon}
                </span>
                <span class="text-sm">{item.label}</span>
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </nav>

    <!-- Theme Toggle -->
    {#if handleOpenDrawer}
      <div class="border-t border-tile-500 p-3">
        <button
          type="button"
          onclick={handleThemeClick}
          class="group flex w-full items-center gap-3 rounded-lg py-2 pl-4 pr-3 text-text-200 transition-all duration-200 hover:bg-tile-400 hover:text-text-300 focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-text-300"
        >
          <span class="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md text-[15px] leading-none transition-all duration-200 group-hover:bg-tile-300">
            🎨
          </span>
          <span class="text-sm font-medium">Theme</span>
        </button>
      </div>
    {/if}
  </aside>
{/if}

<style>
  aside {
    scrollbar-width: thin;
    scrollbar-color: var(--tile6) transparent;
  }

  nav::-webkit-scrollbar {
    width: 6px;
  }

  nav::-webkit-scrollbar-track {
    background: transparent;
  }

  nav::-webkit-scrollbar-thumb {
    background: var(--tile5);
    border-radius: 3px;
  }

  nav::-webkit-scrollbar-thumb:hover {
    background: var(--tile6);
  }
</style>
