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
	let option = $state('a1');
	let isLoading = $state(false);
  let storyType = $state('story');
  let sentenceCount = $state(25);
  let selectedLearningTopics = $state<string[]>([]);
  let vocabularyWords = $state('');
  let vocabularyInputMode = $state('text'); // 'text' or 'file'
  let vocabularyFile = $state<File | null>(null);
  let fileError = $state('');

	function openModal() {
    if (!data.session) {
      goto('/signup')
    }
		isOpen = true;
	}

	function closeModal() {
		isOpen = false;
	}

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    fileError = '';
    
    if (file) {
      // Check file size (150KB limit)
      const maxSize = 150 * 1024; // 150KB in bytes
      if (file.size > maxSize) {
        fileError = 'File size must be less than 150KB';
        vocabularyFile = null;
        return;
      }
      
      // Check file type
      const allowedTypes = ['text/plain', 'text/csv', 'application/csv'];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      if (!allowedTypes.includes(file.type) && !['txt', 'csv'].includes(fileExtension || '')) {
        fileError = 'Only TXT and CSV files are allowed';
        vocabularyFile = null;
        return;
      }
      
      vocabularyFile = file;
    } else {
      vocabularyFile = null;
    }
  }

  async function processVocabularyFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          // Process CSV or TXT content
          let words: string[] = [];
          
          if (file.name.toLowerCase().endsWith('.csv')) {
            // Parse CSV - assume words are in first column or comma-separated
            const lines = text.split('\n');
            words = lines.flatMap((line: string) => 
              line.split(',').map((word: string) => word.trim().replace(/['"]/g, ''))
            ).filter((word: string) => word.length > 0);
          } else {
            // Parse TXT - assume words are separated by commas, newlines, or spaces
            words = text.split(/[,\n\s]+/).map((word: string) => word.trim()).filter((word: string) => word.length > 0);
          }
          
          resolve(words.join(', '));
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

	async function handleSubmit(event: any) {
		event.preventDefault();
		isLoading = true;
    
    let finalVocabularyWords = vocabularyWords;
    
    // If file mode is selected and a file is uploaded, process it
    if (vocabularyInputMode === 'file' && vocabularyFile) {
      try {
        finalVocabularyWords = await processVocabularyFile(vocabularyFile);
      } catch (error) {
        fileError = 'Failed to process file';
        isLoading = false;
        return;
      }
    }
    
		const res = await fetch('/api/create-story', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				option,
				description,
        dialect: dialect, // Specify dialect for story generation
        storyType: storyType,
        sentenceCount: sentenceCount,
        learningTopics: selectedLearningTopics, // Send selected learning topics
        vocabularyWords: finalVocabularyWords // Send vocabulary words to feature
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

  function toggleLearningTopic(topic: string) {
    if (selectedLearningTopics.includes(topic)) {
      selectedLearningTopics = selectedLearningTopics.filter((t: string) => t !== topic);
    } else {
      selectedLearningTopics = [...selectedLearningTopics, topic];
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

  const learningTopicOptions = [
    'verb conjugation',
    'noun plurals',
    'past tense',
    'present tense',
    'infinitive',
    'numbers',
    'future tense',
    'possessive suffixes'
  ];

  const sentenceOptions = [
    { value: 15, label: '15 sentences (Short)' },
    { value: 25, label: '25 sentences (Medium)' },
    { value: 35, label: '35 sentences (Long)' }
  ];

  const difficultyOptions = [
    { value: 'a1', label: 'A1 (Beginner)' },
    { value: 'a2', label: 'A2 (Elementary)' },
    { value: 'b1', label: 'B1 (Intermediate)' },
    { value: 'b2', label: 'B2 (Upper Intermediate)' },
    { value: 'c1', label: 'C1 (Advanced)' },
    { value: 'c2', label: 'C2 (Proficient)' }
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

        <!-- Learning Topics Selection -->
        <div class="mt-4 flex flex-col gap-2">
          <p class="text-md text-text-300">Focus on specific language topics (optional):</p>
          <p class="text-sm text-text-200">Select multiple topics to emphasize in your {storyType}</p>
          <div class="grid grid-cols-2 gap-2">
            {#each learningTopicOptions as topic}
              <button
                type="button"
                class="text-left p-2 border border-tile-600 bg-tile-200 hover:bg-tile-400 transition-colors text-text-300 text-sm {selectedLearningTopics.includes(topic) ? 'bg-tile-500 border-tile-400' : ''}"
                onclick={() => toggleLearningTopic(topic)}
              >
                <span class="mr-2">{selectedLearningTopics.includes(topic) ? '✓' : ''}</span>
                {topic}
              </button>
            {/each}
          </div>
          {#if selectedLearningTopics.length > 0}
            <div class="text-sm text-text-200">
              Selected: {selectedLearningTopics.join(', ')}
              <button
                type="button"
                class="ml-2 underline hover:text-text-300"
                onclick={() => selectedLearningTopics = []}
              >
                Clear all
              </button>
            </div>
          {/if}
        </div>

        <!-- Vocabulary Words Input -->
        <div class="mt-4 flex flex-col gap-2">
          <p class="text-md text-text-300">Include specific vocabulary words (optional):</p>
          <p class="text-sm text-text-200">Enter words you're studying that you'd like featured in your {storyType}</p>
          
          <!-- Input Mode Toggle -->
          <div class="flex gap-2 mb-3">
            <button
              type="button"
              class="px-3 py-1 text-sm border border-tile-600 transition-colors {vocabularyInputMode === 'text' ? 'bg-tile-500 text-text-300' : 'bg-tile-200 text-text-200 hover:bg-tile-400'}"
              onclick={() => { vocabularyInputMode = 'text'; vocabularyFile = null; fileError = ''; }}
            >
              Text Input
            </button>
            <button
              type="button"
              class="px-3 py-1 text-sm border border-tile-600 transition-colors {vocabularyInputMode === 'file' ? 'bg-tile-500 text-text-300' : 'bg-tile-200 text-text-200 hover:bg-tile-400'}"
              onclick={() => { vocabularyInputMode = 'file'; vocabularyWords = ''; }}
            >
              File Upload
            </button>
          </div>
          
          {#if vocabularyInputMode === 'text'}
            <textarea
              bind:value={vocabularyWords}
              rows="3"
              class="rounded-0 border border-tile-600 bg-tile-200 py-2 px-2 text-text-300 resize-none"
              placeholder="Enter vocabulary words separated by commas (e.g., بيت, مدرسة, طعام, سيارة)"
            ></textarea>
            <p class="text-xs text-text-200">
              <strong>Tip:</strong> You can enter words in Arabic, English, or transliteration. Separate multiple words with commas.
            </p>
          {:else}
            <div class="space-y-2">
              <input
                type="file"
                accept=".txt,.csv"
                onchange={handleFileChange}
                class="block w-full text-sm text-text-300 file:mr-4 file:py-2 file:px-4 file:rounded-0 file:border-0 file:text-sm file:font-medium file:bg-tile-400 file:text-text-300 hover:file:bg-tile-500 border border-tile-600 bg-tile-200 p-2"
              />
              <p class="text-xs text-text-200">
                <strong>Supported formats:</strong> TXT, CSV files (max 150KB)<br/>
                <strong>TXT format:</strong> Words separated by commas, spaces, or new lines<br/>
                <strong>CSV format:</strong> Words in any column, separated by commas
              </p>
              {#if vocabularyFile}
                <p class="text-sm text-green-400">
                  ✓ File loaded: {vocabularyFile.name} ({Math.round(vocabularyFile.size / 1024)}KB)
                </p>
              {/if}
              {#if fileError}
                <p class="text-sm text-red-400">
                  ⚠ {fileError}
                </p>
              {/if}
            </div>
          {/if}
        </div>

				<div class="mt-4 flex flex-col">
					<label for="description" class="text-text-200"
						>What do you want the {storyType} to be about? (optional)</label
					>
					<textarea
						name="description"
						bind:value={description}
						id="description"
            rows="3"
						class="rounded-0 border border-tile-600 bg-tile-200 py-2 px-2 text-text-300 resize-none"
            placeholder={`Describe what you want your ${storyType} to be about...`}
					></textarea>
				</div>
				<hr class="my-4 border border-tile-600" />
				<div class="flex flex-col gap-2">
					<p class="text-md text-text-300">Select difficulty level:</p>
					<div class="grid grid-cols-2 gap-2">
						{#each difficultyOptions as difficultyOption}
							<RadioButton
								className="!text-lg"
								wrapperClass="!p-2"
								onClick={setOption}
								selectableFor={difficultyOption.value}
								isSelected={option === difficultyOption.value}
								value={difficultyOption.value}
								text={difficultyOption.label}
							/>
						{/each}
					</div>
				</div>

				<Button type="submit" className="mt-5">Create {storyType === 'story' ? 'Story' : 'Conversation'}</Button>
			</form>
		{/if}
	</div>
</Modal>

<div class="w-fit mt-2">
  <Button onClick={openModal} type="button">Create your own {dialectName[dialect]} content</Button>
</div> 