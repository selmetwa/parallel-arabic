<script>
  /**
   * @typedef {Object} Props
   * @property {boolean} [isOpen]
   * @property {any} [handleCloseDrawer]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { isOpen = false, handleCloseDrawer = () => {}, children } = $props();
</script>

<div class="{`drawer ${isOpen ? 'open' : ''} bg-tile-300 border border-l border-tile-400`}">
  <!-- Your drawer content goes here -->
  {@render children?.()}
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="{`overlay ${isOpen ? 'open' : ''}`}" onclick={handleCloseDrawer}>
  <!-- Clicking on the overlay will close the drawer -->
</div>


<style>
  .drawer {
    --width: 100%;
    width: var(--width);
    position: fixed;
    top: 0;
    right: calc(var(--width) * -1); /* Start off-screen */
    height: 100%;
    z-index: 10;
    border-left: 4px solid var(--tile6);
    transition: right 0.3s ease-in-out;
  }

  @media only screen and (min-width: 420px) {
    .drawer {
      --width: 400px;
    }
}

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5); /* Adjust the opacity as needed */
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s ease-in-out, visibility 0s linear 0.3s;
    z-index: 9;
  }

  .drawer.open {
    right: 0;
  }

  .overlay.open {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.3s ease-in-out;
  }
</style>