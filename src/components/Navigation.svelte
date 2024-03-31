<script lang="ts">
  export let handleOpenDrawer: () => void;

  import Button from "./Button.svelte";
</script>

<nav class="w-full border-b border-tile-600 py-4 bg-tile-300">
    <ul class="w-full flex gap-4 px-4 items-center">
        <li><a class="text-text-300 text-lg underline" href="/stories">Read</a></li>
        <li><a class="text-text-300 text-lg underline" href="/write">Write</a></li>
        <li><a class="text-text-300 text-lg underline" href="/profile">Profile</a></li>
        <li class="ml-auto">
          <Button onClick={handleOpenDrawer} type="button">
            Menu
          </Button>
        </li>
    </ul>
</nav>
