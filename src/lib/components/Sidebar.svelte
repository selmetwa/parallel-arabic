<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { sidebarCollapsed } from '$lib/store/store';
  import Logo from './Logo.svelte';

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
    session: any;
    handleOpenDrawer?: () => void;
  }

  let { session, handleOpenDrawer }: Props = $props();

  // Load collapsed state from localStorage on mount
  onMount(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === 'true') {
        sidebarCollapsed.set(true);
      }
    }
  });

  // Sync localStorage with store changes
  $effect(() => {
    const unsubscribe = sidebarCollapsed.subscribe((value) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-collapsed', value.toString());
      }
    });
    return unsubscribe;
  });

  function toggleSidebar() {
    sidebarCollapsed.update(collapsed => !collapsed);
  }

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
          session
            ? { label: 'Profile', href: '/profile', icon: '👤' }
            : { label: 'Login', href: '/login', icon: '🔐' }
        ]
      }
    ];
    return baseSections;
  });

  let expandedSections = $state<Set<string>>(new Set(['Learn', 'Practice', 'Explore', 'Resources', 'General']));

  function toggleSection(title: string) {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    expandedSections = newExpanded;
  }

  function isActive(href: string): boolean {
    const currentPath = $page.url.pathname;
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(href);
  }
</script>

<aside class="hidden lg:flex flex-col bg-gradient-to-b from-tile-300 via-tile-300 to-tile-200 border-r border-tile-500 fixed left-0 bottom-0 overflow-hidden z-40 transition-all duration-300 {session ? 'top-8' : 'top-0'} {$sidebarCollapsed ? 'w-0 opacity-0' : 'w-64 opacity-100'}">
  <div class="flex h-full flex-col {$sidebarCollapsed ? 'hidden' : ''}">
    <!-- Header -->
    <div class="flex items-center gap-2 px-4 pt-5 pb-4">
      <a href="/" class="group flex min-w-0 flex-1 items-center gap-2.5">
        <span class="truncate text-lg font-bold tracking-tight text-text-300 transition-colors duration-200 group-hover:text-brand">
          Home
        </span>
      </a>
      <button
        type="button"
        onclick={toggleSidebar}
        class="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-text-200 transition-all duration-200 hover:bg-tile-400 hover:text-text-300 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
        </svg>
      </button>
    </div>

    <div class="mx-4 h-px bg-tile-500/70"></div>

    <!-- Scrollable navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-4">
      {#each navSections as section, si (section.title)}
        <div class="mb-3">
          <button
            type="button"
            onclick={() => toggleSection(section.title)}
            aria-expanded={expandedSections.has(section.title)}
            class="group flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-text-200 transition-colors duration-200 hover:text-text-300 focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-text-300"
          >
            <span>{section.title}</span>
            <svg
              class="h-3 w-3 transition-transform duration-300 ease-out {expandedSections.has(section.title) ? 'rotate-0' : '-rotate-90'}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {#if expandedSections.has(section.title)}
            <div class="mt-1.5 flex flex-col gap-0.5">
              {#each section.items as item, ii (item.href)}
                {@const active = isActive(item.href)}
                <a
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  style="animation-delay: {si * 70 + ii * 35}ms"
                  class="nav-reveal group relative flex items-center gap-3 rounded-lg py-2 pl-4 pr-3 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-text-300 motion-reduce:transform-none {active
                    ? 'bg-tile-400 font-semibold text-text-300 shadow-sm'
                    : 'text-text-200 hover:translate-x-0.5 hover:bg-tile-400 hover:text-text-300'}"
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
          {/if}
        </div>
      {/each}
    </nav>

    <!-- Theme Toggle -->
    {#if handleOpenDrawer}
      <div class="border-t border-tile-500 p-3">
        <button
          type="button"
          onclick={handleOpenDrawer}
          class="group flex w-full items-center gap-3 rounded-lg py-2 pl-4 pr-3 text-text-200 transition-all duration-200 hover:translate-x-0.5 hover:bg-tile-400 hover:text-text-300 focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-text-300"
        >
          <span class="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md text-[15px] leading-none transition-all duration-200 group-hover:bg-tile-300">
            🎨
          </span>
          <span class="text-sm font-medium">Theme</span>
        </button>
      </div>
    {/if}
  </div>
</aside>

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

  @keyframes nav-reveal {
    from {
      opacity: 0;
      transform: translateX(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .nav-reveal {
    animation: nav-reveal 0.35s ease both;
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-reveal {
      animation: none;
    }
  }
</style>
