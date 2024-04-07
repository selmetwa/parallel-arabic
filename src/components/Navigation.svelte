<script lang="ts">
  export let handleOpenDrawer: () => void;
  import Button from "./Button.svelte";

  export let session
</script>

<nav class="w-full border-b border-tile-600 py-4 bg-tile-300">
    <ul class="w-full flex gap-4 px-4 items-center">
        <li><a class="text-text-300 text-sm sm:text-base underline" href="/stories">Read</a></li>
        <li><a class="text-text-300 text-sm sm:text-base underline" href="/write">Write</a></li>
        {#if session}
          <li><a class="text-text-300 text-sm sm:text-base underline" href="/profile">Profile</a></li>
        {/if}
        <div class="ml-auto flex flex-row gap-4 items-center">
          {#if !session}
          <li><a class="text-text-300 text-sm sm:text-base underline" href="/login">Login</a></li>
          <li><a class="text-text-300 text-sm sm:text-base underline" href="/signup">Sign Up</a></li>        
          {/if}
          <li>
            <Button onClick={handleOpenDrawer} type="button">
              Menu
            </Button>
          </li>
        </div>
    </ul>
</nav>
