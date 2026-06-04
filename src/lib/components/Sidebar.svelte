<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { sidebarCollapsed } from '$lib/store/store';
  import Button from './Button.svelte';
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
          { label: 'Word Map', href: '/map', icon: '🗺️' },
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

<aside class="hidden lg:flex flex-col bg-tile-300 border-r border-tile-500 fixed left-0 bottom-0 overflow-hidden z-40 transition-all duration-300 {session ? 'top-8' : 'top-0'} {$sidebarCollapsed ? 'w-0 opacity-0' : 'w-64 opacity-100'}">
  <div class="p-5 {$sidebarCollapsed ? 'hidden' : ''}">
    <div class="flex items-center justify-between mb-6">
      <a href="/" class="flex items-center logo-container flex-1 min-w-0 group">
        <h1 class="text-xl font-bold text-text-300 tracking-tight transition-colors duration-200">Parallel Arabic</h1>
      </a>
      <button
        type="button"
        onclick={toggleSidebar}
        class="p-2 rounded-lg hover:bg-tile-400 active:scale-95 transition-colors duration-200 text-text-200 hover:text-text-300 flex-shrink-0 ml-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <nav class="flex flex-col gap-1">
      {#each navSections as section}
        <div class="mb-2">
          <button
            type="button"
            onclick={() => toggleSection(section.title)}
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-tile-400 active:scale-[0.98] transition-colors duration-200 text-text-200 hover:text-text-300 font-semibold text-xs uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-text-300"
          >
            <span>{section.title}</span>
            <span
              class="transition-transform duration-300 text-[10px]"
              style="transform: {expandedSections.has(section.title) ? 'rotate(180deg)' : 'rotate(0deg)'}"
            >
              ▼
            </span>
          </button>

          {#if expandedSections.has(section.title)}
            <div class="mt-1 flex flex-col gap-0.5">
              {#each section.items as item}
                <a
                  href={item.href}
                  class="group flex items-center gap-3 px-3 py-2 rounded-lg border-l-2 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-text-300 {isActive(item.href) ? 'bg-tile-400 border-amber-400 text-text-300 font-semibold' : 'border-transparent text-text-200 hover:bg-tile-400 hover:text-text-300'}"
                >
                  <span class="text-lg leading-none">{item.icon}</span>
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
      <div class="mt-auto pt-5 border-t border-tile-500">
        <Button onClick={handleOpenDrawer} type="button" className="w-full">
          Theme
        </Button>
      </div>
    {/if}
  </div>
</aside>

<style>
  aside {
    scrollbar-width: thin;
    scrollbar-color: var(--tile-600) var(--tile-300);
  }

  aside::-webkit-scrollbar {
    width: 6px;
  }

  aside::-webkit-scrollbar-track {
    background: var(--tile-300);
  }

  aside::-webkit-scrollbar-thumb {
    background: var(--tile-600);
    border-radius: 3px;
  }

  .logo-container {
    transition: transform 0.2s ease;
  }

  .logo-container:hover {
    transform: scale(1.02);
  }
</style>
