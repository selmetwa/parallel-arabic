<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
  import { goto } from '$app/navigation';
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
  import { type Dialect } from '$lib/types/index';

  interface Props {
    dialect: Dialect;
    data: any;
	}

  const { data, dialect }: Props = $props();
  console.log({ data })
	let isOpen = $state(false);
	let description = $state('');
	let option = $state('beginner');
	let isLoading = $state(false);
  let storyType = $state('story');
  let sentenceCount = $state(25);
  let selectedTheme = $state('');

	function openModal() {
    if (!data.session) {
      goto('/signup')
    }
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
				description: selectedTheme ? `${selectedTheme}: ${description}` : description,
        dialect: dialect, // Specify dialect for story generation
        storyType: storyType,
        sentenceCount: sentenceCount,
        theme: selectedTheme // Send theme separately for title generation
			})
		});

		const chatgptres = await res.json();

		isLoading = false;
    await goto('/' + dialect + '/generated-stories/' + chatgptres.storyId);
	}

	function setOption(event: any) {
		option = event.target.value;
	}

  function setStoryType(event: any) {
    storyType = event.target.value;
  }

  function setSentenceCount(event: any) {
    sentenceCount = parseInt(event.target.value);
  }

  function setTheme(theme: string) {
    selectedTheme = theme;
    if (theme && !description) {
      // Auto-fill description based on theme
      const themeDescriptions: Record<string, string> = {
        'Getting a taxi': 'A person needs to get a taxi to reach their destination',
        'Checking into a hotel': 'A traveler arrives at a hotel and goes through the check-in process',
        'Visiting a football match': 'Someone goes to watch a football game for the first time',
        'Going to a mosque for the first time': 'A person visits a mosque and learns about the customs',
        'At a restaurant': 'Ordering food and dining at a local restaurant',
        'Shopping at the market': 'Buying groceries and bargaining at a traditional market',
        'Meeting new friends': 'Making new friendships and social connections',
        'Family gathering': 'A family comes together for a special occasion'
      };
      description = themeDescriptions[theme] || '';
    }
  }

  const dialectName: Record<Dialect, string> = {
    fusha: 'Modern Standard Arabic',
    levantine: 'Levantine Arabic',
    darija: 'Moroccan Darija',
    'egyptian-arabic': 'Egyptian Arabic',
    iraqi: 'Iraqi Arabic',
    khaleeji: 'Khaleeji Arabic'
  }

  const themeOptions = [
    'Getting a taxi',
    'Checking into a hotel',
    'Visiting a football match',
    'Going to a mosque for the first time',
    'At a restaurant',
    'Shopping at the market',
    'Meeting new friends',
    'Family gathering'
  ];

  const sentenceOptions = [
    { value: 15, label: '15 sentences (Short)' },
    { value: 25, label: '25 sentences (Medium)' },
    { value: 35, label: '35 sentences (Long)' }
  ];
</script>

<Modal {isOpen} handleCloseModal={closeModal} width="700px" height={isLoading ? "fit-content" : "90%"}>
	<div class="p-4">
		{#if isLoading}
			<div
				class="mx-auto my-4 flex w-fit flex-col items-center gap-3 p-4 text-text-200 sm:flex-row"
			>
				<AlphabetCycle />
				<p class="text-2xl text-text-300">
					Generating your {dialectName[dialect]} {storyType}, hang tight. <br />
					this usually takes a few seconds.
				</p>
			</div>
		{:else}
			<h1 class="text-2xl font-semibold text-text-300">Create {dialectName[dialect]} {storyType === 'story' ? 'Story' : 'Conversation'}</h1>
      <p>
        <i>{storyType === 'story' ? 'Story' : 'Conversation'} is AI generated in {dialectName[dialect]} and may contain mistakes</i>
      </p>
			<form onsubmit={handleSubmit}>
        <!-- Story Type Selection -->
        <div class="mt-4 flex flex-col gap-2">
          <p class="text-md text-text-300">Choose type:</p>
          <div class="flex gap-4">
            <RadioButton
              className="!text-lg"
              wrapperClass="!p-2"
              onClick={setStoryType}
              selectableFor="story"
              isSelected={storyType === 'story'}
              value="story"
              text="Story (Narrative)"
            />
            <RadioButton
              className="!text-lg"
              wrapperClass="!p-2"
              onClick={setStoryType}
              selectableFor="conversation"
              isSelected={storyType === 'conversation'}
              value="conversation"
              text="Conversation (Dialogue)"
            />
          </div>
        </div>

        <!-- Length Selection -->
        <div class="mt-4 flex flex-col gap-2">
          <p class="text-md text-text-300">Choose length:</p>
          <div class="flex gap-2 flex-wrap">
            {#each sentenceOptions as option}
              <RadioButton
                className="!text-sm"
                wrapperClass="!p-2"
                onClick={setSentenceCount}
                selectableFor={option.value.toString()}
                isSelected={sentenceCount === option.value}
                value={option.value.toString()}
                text={option.label}
              />
            {/each}
          </div>
        </div>

        <!-- Theme Suggestions -->
        <div class="mt-4 flex flex-col gap-2">
          <p class="text-md text-text-300">Choose a theme (optional):</p>
          <div class="grid grid-cols-2 gap-2">
            {#each themeOptions as theme}
              <button
                type="button"
                class="text-left p-2 border border-tile-600 bg-tile-200 hover:bg-tile-400 transition-colors text-text-300 text-sm {selectedTheme === theme ? 'bg-tile-500 border-tile-400' : ''}"
                onclick={() => setTheme(theme)}
              >
                {theme}
              </button>
            {/each}
          </div>
          {#if selectedTheme}
            <button
              type="button"
              class="text-sm text-text-200 underline hover:text-text-300"
              onclick={() => setTheme('')}
            >
              Clear theme selection
            </button>
          {/if}
        </div>

				<div class="mt-4 flex flex-col">
					<label for="description" class="text-text-200"
						>What do you want the {storyType} to be about {selectedTheme ? `(${selectedTheme})` : ''}</label
					>
					<textarea
            required
						name="description"
						bind:value={description}
						id="description"
            rows="3"
						class="rounded-0 border border-tile-600 bg-tile-200 py-2 px-2 text-text-300 resize-none"
            placeholder={selectedTheme ? `Describe your ${storyType} about ${selectedTheme.toLowerCase()}...` : `Describe what you want your ${storyType} to be about...`}
					></textarea>
				</div>
				<hr class="my-4 border border-tile-600" />
				<div class="flex flex-col gap-2">
					<p class="text-md text-text-300">Select difficulty:</p>
					<RadioButton
						className="!text-xl"
						wrapperClass="!p-2"
						onClick={setOption}
						selectableFor="beginner"
						isSelected={option === 'beginner'}
						value="beginner"
						text="Beginner"
					/>
					<RadioButton
						className="!text-xl"
						wrapperClass="!p-2"
						onClick={setOption}
						selectableFor="intermediate"
						isSelected={option === 'intermediate'}
						text="Intermediate"
						value="intermediate"
					/>
					<RadioButton
						className="!text-xl"
						wrapperClass="!p-2"
						onClick={setOption}
						selectableFor="advanced"
						isSelected={option === 'advanced'}
						text="Advanced"
						value="advanced"
					/>
				</div>

				<Button type="submit" className="mt-5">Create {storyType === 'story' ? 'Story' : 'Conversation'}</Button>
			</form>
		{/if}
	</div>
</Modal>

<div class="w-fit mt-2">
  <Button onClick={openModal} type="button">Create your own {dialectName[dialect]} content</Button>
</div> 