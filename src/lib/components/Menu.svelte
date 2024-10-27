
<script>
  let dropdownOpen = $state(false);
  import { onDestroy } from 'svelte';
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
    if (dropdownOpen) {
      if (typeof document !== 'undefined') {
        document.addEventListener('click', handleClickOutside);
      }
    } else {
      if (typeof document !== 'undefined') {
        document.removeEventListener('click', handleClickOutside);
      }
    }
  }

  function handleClickOutside(event) {
    if (typeof document !== 'undefined') {
      const dropdown = document.querySelector('.dropdown-menu');
      const button = document.querySelector('.dropdown-button');
      if (dropdown && !dropdown.contains(event.target) && button && !button.contains(event.target)) {
        dropdownOpen = false;
        document.removeEventListener('click', handleClickOutside);
      }
    }
  }
  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', handleClickOutside);
    }
  });

</script>
<div class="relative inline-block text-left">
  <div>
    <button onclick={toggleDropdown} class="dropdown-button inline-flex justify-center w-full rounded-full border bg-tile-400 border-gray-300 shadow-sm p-2 text-sm font-medium text-text-300 hover:bg-tile-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tile-600">
      <svg class="h-5 w-5 block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>
    </button>
  </div>

  <dialog open={dropdownOpen} class={`dropdown-menu origin-top-right absolute right-0 mt-2 w-56 bg-tile-300 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50`}>
    <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
      {@render children?.()}
    </div>
  </dialog>
</div>
