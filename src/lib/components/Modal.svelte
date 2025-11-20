<script>
  import Button from "./Button.svelte";


  /**
   * @typedef {Object} Props
   * @property {boolean} [isOpen]
   * @property {any} [handleCloseModal]
   * @property {string} [width]
   * @property {string} [height]
   * @property {number} [zIndex]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let {
    isOpen = true,
    handleCloseModal = () => {},
    width = '400px',
    height = 'fit-content',
    zIndex = 100,
    children
  } = $props();
</script>

<dialog 
open={isOpen}
class="{`modal ${isOpen ? 'open' : ''} bg-tile-300 border-4 border-tile-600`}" style="--width: {width}; --height: {height}; --z-index: {zIndex};">
  <!-- Your modal content goes here -->
   <div class="absolute top-0 right-0 p-2">
    <Button onClick={handleCloseModal} type="button">X</Button>
   </div>
  <slot></slot>
</dialog>

<div class="{`overlay ${isOpen ? 'open' : ''}`}" onclick={handleCloseModal} style="z-index: {zIndex - 1};">
  <!-- Clicking on the overlay will close the modal -->
</div>

<style>
  .modal {
    width: min(var(--width), 100%);
    height: var(--height);
    max-height: 90%;
    position: fixed;
    top: 50%; /* Center vertically */
    left: 50%; /* Center horizontally */
    transform: translate(-50%, -50%);
    z-index: -1;
    overflow-x: auto;
    opacity: 0; /* Start with 0 opacity for fade-in effect */
    transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s ease-in-out, visibility 0s linear 0.3s;
  }

  .modal.open {
    opacity: 1;
    z-index: var(--z-index);
  }

  .overlay.open {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.3s ease-in-out;
  }
</style>
