<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import { generatedStoryInStore } from '$lib/store/store';
  import { goto } from '$app/navigation';

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
        title,
			})
		});
    console.log({ res });

		const chatgptres = await res.json();

		isLoading = false;
    await goto('/generated-stories/' + chatgptres.storyId);
	}

	function setOption(event: any) {
		option = event.target.value;
	}
</script>

<Modal {isOpen} handleCloseModal={closeModal} width="600px">
	<div class="p-4">
		{#if isLoading}
			<div
				class="mx-auto my-4 flex w-fit flex-col items-center gap-3 p-4 text-text-200 sm:flex-row"
			>
				<div role="status">
					<svg
						aria-hidden="true"
						class="my-3 h-10 w-10 animate-spin fill-tile-500 text-text-200 dark:text-text-200"
						viewBox="0 0 100 101"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
							fill="currentColor"
						/>
						<path
							d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
							fill="currentFill"
						/>
					</svg>
					<span class="sr-only">Loading...</span>
				</div>
				<p class="text-2xl text-text-300">
					Generating your story, hang tight. <br />
					this usually takes a few seconds.
				</p>
			</div>
		{:else}
			<h1 class="text-2xl font-semibold text-text-300">Create your own story</h1>
      <p>
        <i>Story is AI generated and may contain mistakes, or words not exclusive to Egyptian Arabic</i>
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
				</div>
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
  <Button onClick={openModal} type="button">Create your own story</Button>
</div>
