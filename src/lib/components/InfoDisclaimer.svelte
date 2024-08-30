<script>
	import Button from './Button.svelte';
	$: isOpen = true;

	function close() {
		isOpen = false;
	}
</script>

{#if isOpen}
	<div class="relative border border-tile-500 bg-tile-400 py-4 my-3">
    <div class="px-4 flex flex-col gap-2">
      <div class="bg-tile-500 rounded-full h-8 w-8 flex items-center justify-center">
        <p class="text-text-200 text-lg italic">i</p>
      </div>
      <p class="text-base text-text-300">
        To get the most out of these exercises, try using a pen and paper in addition to the keyboard.
        And make sure to say each word outloud.
      </p>
    </div>
		<div class="absolute right-0 top-0 p-2">
			<Button onClick={close} type="button">X</Button>
		</div>
	</div>
{/if}
