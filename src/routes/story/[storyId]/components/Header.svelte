<script lang="ts">
	import Button from '../../../../components/Button.svelte';
	export let key = '';
	export let handleOpenDrawer = () => {};
	export let updateMode = (event: Event) => {};

	const modeOptions = [
		{ value: 'single-text', text: 'Single Text' },
		{ value: 'bi-text', text: 'Bi Text' },
		{ value: 'sentence-view', text: 'Sentence View' }
	];
</script>

<header
	class="flex w-full flex-col justify-between gap-4 border-t border-tile-600 bg-tile-300 p-3 sm:flex-row"
>
	<figure>
		<figcaption>Listen to the Story</figcaption>
		<audio controls src={`/src/stories/${key}.mp3`}></audio>
	</figure>
	<fieldset>
		<legend class="sr-only">Select Mode</legend>
		<ul class="flex flex-row gap-1">
			{#each modeOptions as option}
				<li>
					<label
						for={option.value}
						class="flex w-full flex-row items-center gap-2 p-2 text-base sm:cursor-pointer"
					>
						<input
							type="radio"
							name="mode"
							id={option.value}
							value={option.value}
							on:change={updateMode}
						/>
						<span
							class="select-none overflow-hidden text-ellipsis whitespace-nowrap text-base font-normal"
							>{option.text}</span
						>
					</label>
				</li>
			{/each}
		</ul>
	</fieldset>
</header>
