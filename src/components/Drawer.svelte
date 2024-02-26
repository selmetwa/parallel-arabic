<script>
  export let isOpen = true;
  export let handleCloseDrawer = () => {};
</script>

<div class="{`drawer ${isOpen ? 'open' : ''}`}">
  <!-- Your drawer content goes here -->
  <slot />
</div>

<div class="{`overlay ${isOpen ? 'open' : ''}`}" on:click={handleCloseDrawer}>
  <!-- Clicking on the overlay will close the drawer -->
</div>


<style>
  :root {
    --width: 700px;
  }
  .drawer {
    width: var(--width);
    background-color: #ccc;
    position: fixed;
    top: 0;
    right: calc(var(--width) * -1); /* Start off-screen */
    height: 100%;
    z-index: 10;
    transition: right 0.3s ease-in-out;
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