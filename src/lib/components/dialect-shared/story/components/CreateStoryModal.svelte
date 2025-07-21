<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
  import { goto } from '$app/navigation';
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
  import { type Dialect } from '$lib/types/index';

  interface Props {
    dialect: Dialect;
	}

  const { dialect }: Props = $props();

	let isOpen = $state(false);
	let description = $state('');
	let option = $state('beginner');
	let isLoading = $state(false);
  let title = $state('');

	function openModal() {
		isOpen = true;
	}

	function closeModal() {
		isOpen = false;
	}

	async function handleSubmit(event: any) {
		event.preventDefault();
		isLoading = true;
		const res = await fetch('/api/create-story', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				option,
				description,
        title: title + '_' + dialect, // Add dialect suffix
        dialect: dialect // Specify dialect for story generation
			})
		});

		const chatgptres = await res.json();

		isLoading = false;
    await goto('/' + dialect + '/generated-stories/' + chatgptres.storyId);
	}

	function setOption(event: any) {
		option = event.target.value;
	}

  const dialectName: Record<Dialect, string> = {
    fusha: 'Modern Standard Arabic',
    levantine: 'Levantine Arabic',
    darija: 'Moroccan Darija',
    'egyptian-arabic': 'Egyptian Arabic'
  }
</script>

<Modal {isOpen} handleCloseModal={closeModal} width="600px">
	<div class="p-4">
		{#if isLoading}
			<div
				class="mx-auto my-4 flex w-fit flex-col items-center gap-3 p-4 text-text-200 sm:flex-row"
			>
				<AlphabetCycle />
				<p class="text-2xl text-text-300">
					Generating your {dialectName[dialect]} story, hang tight. <br />
					this usually takes a few seconds.
				</p>
			</div>
		{:else}
			<h1 class="text-2xl font-semibold text-text-300">Create {dialectName[dialect]} Story</h1>
      <p>
        <i>Story is AI generated in {dialectName[dialect]} and may contain mistakes</i>
      </p>
			<form onsubmit={handleSubmit}>
        <div class="mt-4 flex flex-col">
					<label for="title" class="text-text-200"
						>Give your story a title</label
					>
					<input
						type="text"
            required
						name="title"
						bind:value={title}
						id="title"
						class="rounded-0 border border-tile-600 bg-tile-200 py-2 text-text-300"
					/>
				
				<div class="mt-4 flex flex-col">
					<label for="description" class="text-text-200"
						>What do you want the story to be about</label
					>
					<input
						type="text"
            required
						name="description"
						bind:value={description}
						id="description"
						class="rounded-0 border border-tile-600 bg-tile-200 py-2 text-text-300"
					/>
				</div>
				<hr class="my-2 my-4 border border-tile-600" />
				<div class="flex flex-col gap-2">
					<p class="text-md text-text-300">Select difficulty.</p>
					<RadioButton
						className="!text-xl"
						wrapperClass="!p-2"
						onClick={setOption}
						selectableFor="beginner"
						isSelected={option === 'beginner'}
						value="beginner"
						text="Beginner"
					></RadioButton>
					<RadioButton
						className="!text-xl"
						wrapperClass="!p-2"
						onClick={setOption}
						selectableFor="intermediate"
						isSelected={option === 'intermediate'}
						text="Intermediate"
						value="intermediate"
					></RadioButton>
					<RadioButton
						className="!text-xl"
						wrapperClass="!p-2"
						onClick={setOption}
						selectableFor="advanced"
						isSelected={option === 'advanced'}
						text="Advanced"
						value="advanced"
					></RadioButton>
				</div>

				<Button type="submit" className="mt-5">Submit</Button>
			</form>
		{/if}
	</div>
</Modal>

<div class="w-fit mt-2">
  <Button onClick={openModal} type="button">Create your own {dialectName[dialect]} story</Button>
</div> 