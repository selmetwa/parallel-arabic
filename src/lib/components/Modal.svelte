<script>
  import Button from "./Button.svelte";
  export let isOpen = true;
  export let handleCloseModal = () => {};


  export let width = '400px';
  export let height = 'fit-content';
</script>

<dialog 
open={isOpen}
class="{`modal ${isOpen ? 'open' : ''} bg-tile-300 border-4 border-tile-600`}" style="--width: {width}; --height: {height};">
  <!-- Your modal content goes here -->
   <div class="absolute top-0 right-0 p-2">
    <Button onClick={handleCloseModal} type="button">X</Button>
   </div>
  <slot />
</dialog>

<div class="{`overlay ${isOpen ? 'open' : ''}`}" on:click={handleCloseModal}>
  <!-- Clicking on the overlay will close the modal -->
</div>

<style>
  .modal {
    width: min(var(--width), 100%);
    height: var(--height);
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
    z-index: 9;
  }

  .modal.open {
    opacity: 1;
    z-index: 10;
  }

  .overlay.open {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.3s ease-in-out;
  }
</style>
