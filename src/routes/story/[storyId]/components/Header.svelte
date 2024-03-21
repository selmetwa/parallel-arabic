<script lang="ts">
	export let key = '';
	export let updateMode = (event: Event) => {};
	import { Mode } from '../types';

  export let mode: Mode = Mode.SingleText;

	const modeOptions = [
		{ value: Mode.SingleText, text: 'Single Text' },
		{ value: Mode.BiText, text: 'Bi Text' },
		{ value: Mode.SentanceView, text: 'Sentence View' }
	];
</script>

<header class="flex w-full flex-col justify-between gap-4 border-t border-tile-600 bg-tile-300 p-3 sm:flex-row">
	<figure>
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
              checked={option.value === mode}
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
