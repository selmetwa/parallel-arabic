<script>
  /** @type {{ isOpen?: boolean, handleCloseDrawer?: () => void, children?: import('svelte').Snippet }} */
  let { isOpen = false, handleCloseDrawer = () => {}, children } = $props();
</script>

<div
  role="dialog"
  aria-modal="true"
  aria-hidden={!isOpen}
  class="drawer {isOpen ? 'open' : ''}"
>
  <div class="drawer-accent"></div>
  <div class="drawer-content">
    {@render children?.()}
  </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay {isOpen ? 'open' : ''}" onclick={handleCloseDrawer}></div>

<style>
  .drawer {
    --width: 100%;
    position: fixed;
    top: 0;
    right: calc(var(--width) * -1);
    width: var(--width);
    height: 100%;
    z-index: 100;
    display: flex;
    flex-direction: row;
    background-color: var(--tile2);
    box-shadow:
      -8px 0 32px rgba(0, 0, 0, 0.12),
      -2px 0 8px rgba(0, 0, 0, 0.06);
    transition: right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    will-change: right;
  }

  @media only screen and (min-width: 420px) {
    .drawer {
      --width: 380px;
    }
  }

  .drawer-accent {
    width: 3px;
    height: 100%;
    flex-shrink: 0;
    background: linear-gradient(
      180deg,
      var(--brand) 0%,
      hsl(200 100% 40%) 50%,
      transparent 100%
    );
    opacity: 0.7;
  }

  .drawer-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .drawer.open {
    right: 0;
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    visibility: hidden;
    opacity: 0;
    transition:
      opacity 0.3s ease,
      visibility 0s linear 0.3s;
    z-index: 99;
  }

  .overlay.open {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.3s ease;
  }
</style>
