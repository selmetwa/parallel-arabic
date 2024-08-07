<script lang="ts">
	import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';

  export let data;

  console.log({ data })
</script>

<section class="px-4 py-8">
  <header class="flex flex-row gap-2 items-center justify-between mt-8 mb-4">
    <form method="post" action="?/logout" use:enhance class="w-fit ml-auto">
      <Button type='submit'>
        Sign out
      </Button>
    </form>
    
  </header>
  {JSON.stringify(data)}

</section>