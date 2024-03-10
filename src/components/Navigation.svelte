<script lang="ts">
  export let handleOpenDrawer: () => void;

  import Button from "./Button.svelte";
</script>

<nav class="w-full border-tile-600 py-4 bg-tile-300">
    <ul class="w-full flex gap-2 px-4 items-center">
        <li><a class="text-text-300" href="/">Home</a></li>
        <li><a class="text-text-300" href="/profile">Profile</a></li>
        <li><a class="text-text-300" href="/stories">Stories</a></li>
        <li class="ml-auto">
          <Button onClick={handleOpenDrawer} type="button">
            Settings
          </Button>
        </li>
    </ul>
</nav>
