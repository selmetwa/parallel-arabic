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
  
  // New audio upload states
  let creationMode = $state<'generate' | 'upload'>('generate');
  let audioFile = $state<File | null>(null);
  let audioFileError = $state('');
  let isDragOver = $state(false);
  let isTranscribing = $state(false);
  let customTitle = $state('');
  let useCustomTitle = $state(false);

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

  // Audio file handling functions
  function handleAudioFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      validateAndSetAudioFile(file);
    }
  }

  function handleAudioDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      validateAndSetAudioFile(files[0]);
    }
  }

  function handleAudioDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleAudioDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }

  function validateAndSetAudioFile(file: File) {
    audioFileError = '';
    
    // Check file size (25MB limit for audio)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      audioFileError = 'Audio file size must be less than 25MB';
      audioFile = null;
      return;
    }
    
    // Check file type
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 
      'audio/m4a', 'audio/mp4', 'audio/webm', 'audio/ogg'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      audioFileError = 'Unsupported file type. Supported formats: MP3, WAV, FLAC, M4A, MP4, WebM, OGG';
      audioFile = null;
      return;
    }
    
    audioFile = file;
    
    // Auto-generate title from filename if not using custom title
    if (!useCustomTitle) {
      const baseName = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
      customTitle = baseName.replace(/[-_]/g, ' '); // Replace dashes and underscores with spaces
    }
  }

  function removeAudioFile() {
    audioFile = null;
    audioFileError = '';
    customTitle = '';
  }

  function formatFileSize(bytes: number) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
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
		isTranscribing = creationMode === 'upload';
    
    try {
      if (creationMode === 'upload') {
        // Audio upload mode - transcribe and create story from audio
        if (!audioFile) {
          audioFileError = 'Please select an audio file';
          isLoading = false;
          isTranscribing = false;
          return;
        }

        // Step 1: Transcribe the audio file
        const formData = new FormData();
        formData.append('audio', audioFile);

        const transcribeResponse = await fetch('/api/audio-transcribe', {
          method: 'POST',
          body: formData,
        });

        const transcriptionData = await transcribeResponse.json();

        if (!transcribeResponse.ok) {
          throw new Error(transcriptionData.error || 'Failed to transcribe audio');
        }

        // Step 2: Create story from transcription
        const storyFormData = new FormData();
        storyFormData.append('mode', 'transcription');
        storyFormData.append('transcript', transcriptionData.transcript);
        storyFormData.append('sentences', JSON.stringify(transcriptionData.sentences || []));
        storyFormData.append('dialect', dialect);
        storyFormData.append('customTitle', useCustomTitle ? customTitle : '');
        storyFormData.append('originalFileName', audioFile.name);
        storyFormData.append('audioFile', audioFile); // Send the actual audio file

        // const API_URL = dialect === 'egyptian-arabic' ? '/api/create-story-egyptian' : '/api/create-story';
        let API_URL = '/api/create-story';
        if (dialect === 'egyptian-arabic') {
          API_URL = '/api/create-story-egyptian';
        } else if (dialect === 'darija') {
          API_URL = '/api/create-story-darija';
        }

        console.log({ API_URL, dialect });
        const createStoryResponse = await fetch(API_URL, {
          method: 'POST',
          body: storyFormData // Send as FormData instead of JSON
        });

        const storyResult = await createStoryResponse.json();
        
        if (!createStoryResponse.ok) {
          throw new Error(storyResult.error || 'Failed to create story from transcription');
        }

        isLoading = false;
        isTranscribing = false;
        await goto('/' + dialect + '/generated-stories/' + storyResult.storyId);
        
      } else {
        // Original AI generation mode
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
        
        let API_URL = '/api/create-story';
        if (dialect === 'egyptian-arabic') {
          API_URL = '/api/create-story-egyptian';
        } else if (dialect === 'darija') {
          API_URL = '/api/create-story-darija';
        } 
          const res = await fetch(API_URL, {
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
    } catch (error) {
      console.error('Error creating story:', error);
      if (creationMode === 'upload') {
        audioFileError = error instanceof Error ? error.message : 'Failed to create story from audio';
        isTranscribing = false;
      } else {
        fileError = error instanceof Error ? error.message : 'Failed to create story';
      }
      isLoading = false;
    }
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
        <div class="flex flex-col gap-2">
				<p class="text-2xl text-text-300">
          {#if dialect === 'darija'}
            Generating your {storyType} using an LLM adapted specifically for Moroccan Darija.
          {:else if dialect === 'egyptian-arabic'}
            Generating your {storyType} using an LLM adapted specifically for Egyptian Arabic.
          {:else}
            Generating your {dialectName[dialect]} {storyType}, hang tight.
          {/if}
				</p>
        <p class="text-xl text-text-200">
          {#if dialect === 'darija' || dialect === 'egyptian-arabic'}
            This usually takes up to 30 seconds.
          {:else}
            This usually takes a few seconds.
          {/if}
        </p>
      </div>
			</div>
		{:else}
			<h1 class="text-2xl font-semibold text-text-300">Create {dialectName[dialect]} {storyType === 'story' ? 'Story' : 'Conversation'}</h1>
      <p>
        <i>{storyType === 'story' ? 'Story' : 'Conversation'} is AI generated in {dialectName[dialect]} and may contain mistakes</i>
      </p>
			<form onsubmit={handleSubmit}>

        <!-- Creation Mode Selection -->
        <div class="mt-4 flex flex-col gap-2">
          <p class="text-md text-text-300">Choose creation method:</p>
          <div class="flex gap-4">
            <RadioButton
              className="!text-lg"
              wrapperClass="!p-2"
              onClick={(e) => creationMode = e.target.value}
              selectableFor="generate"
              isSelected={creationMode === 'generate'}
              value="generate"
              text="AI Generate"
            />
          </div>
          <p class="text-sm text-text-200">
            {#if creationMode === 'generate'}
              AI will create original content based on your preferences
            {:else}
              Upload an Arabic audio file to create a story from existing content
            {/if}
          </p>
        </div>

        {#if creationMode === 'upload'}
          <!-- Audio Upload Section -->
          <div class="mt-6 p-4 border border-tile-600 bg-tile-100 rounded">
            <h3 class="text-lg font-semibold text-text-300 mb-2">Upload Arabic Audio</h3>
            <p class="text-sm text-text-200 mb-4">
              Use this service to convert a youtube video to MP3
              <a href="https://ezconv.com/" class="underline" target="_blank">ezconv.com</a>
            </p>
            <!-- Title Input for Audio Mode -->
            <div class="mb-4">
              <div class="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  id="useCustomTitle"
                  bind:checked={useCustomTitle}
                  class="w-4 h-4"
                />
                <label for="useCustomTitle" class="text-sm text-text-300">
                  Use custom title (otherwise use filename)
                </label>
              </div>
              
              {#if useCustomTitle}
                <input
                  type="text"
                  bind:value={customTitle}
                  placeholder="Enter custom title for your story..."
                  class="w-full rounded border border-tile-600 bg-tile-200 py-2 px-3 text-text-300"
                />
              {:else if audioFile}
                <p class="text-sm text-text-200">
                  Title will be: <span class="font-medium text-text-300">{customTitle}</span>
                </p>
              {/if}
            </div>

            <!-- Audio File Drop Zone -->
            <div
              class="relative border-2 border-dashed border-tile-600 rounded-lg p-6 text-center transition-colors {isDragOver ? 'border-blue-400 bg-blue-50' : audioFile ? 'border-green-400 bg-green-50' : 'hover:border-tile-500 hover:bg-tile-200'}"
              ondrop={handleAudioDrop}
              ondragover={handleAudioDragOver}
              ondragleave={handleAudioDragLeave}
            >
              {#if audioFile}
                <div class="space-y-3">
                  <div class="flex items-center justify-center">
                    <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-text-300">{audioFile.name}</p>
                    <p class="text-sm text-text-200">{formatFileSize(audioFile.size)} • {audioFile.type}</p>
                  </div>
                  <button
                    type="button"
                    onclick={removeAudioFile}
                    class="px-3 py-1 bg-tile-400 text-text-300 rounded hover:bg-tile-500 transition-colors text-sm"
                  >
                    Remove File
                  </button>
                </div>
              {:else}
                <div class="space-y-3">
                  <div class="flex items-center justify-center">
                    <svg class="w-12 h-12 text-tile-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                  <div>
                    <p class="text-lg font-medium text-text-300">Drop your audio file here</p>
                    <p class="text-sm text-text-200">or click to browse</p>
                  </div>
                  <div class="text-xs text-text-200">
                    Supported formats: MP3, WAV, FLAC, M4A, MP4, WebM, OGG (max 25MB)
                  </div>
                </div>
                
                <input
                  type="file"
                  accept="audio/*"
                  onchange={handleAudioFileSelect}
                  class="inset-0 absolute w-full h-full opacity-0 cursor-pointer"
                />
              {/if}
            </div>
            
            {#if audioFileError}
              <p class="text-sm text-red-400 mt-2">⚠ {audioFileError}</p>
            {/if}
            
            <div class="mt-4 p-3 bg-tile-400 rounded border border-tile-500">
              <p class="text-sm text-text-300">
                <strong>How it works:</strong> Your audio will be transcribed to Arabic text, then formatted as an interactive story with English translations and transliterations. The original audio will be preserved for playback.
              </p>
            </div>
            
            <!-- Transcribe Button for Audio Mode -->
            {#if audioFile}
              <div class="mt-4">
                <Button type="submit" className="w-full">
                  {#if isTranscribing}
                    <div class="flex items-center justify-center gap-2">
                      <div role="status">
                        <svg
                          aria-hidden="true"
                          class="h-5 w-5 animate-spin fill-white text-gray-300"
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
                      </div>
                      Transcribing Audio...
                    </div>
                  {:else}
                    🎵 Transcribe & Create Story
                  {/if}
                </Button>
              </div>
            {/if}
          </div>
        {/if}

        {#if creationMode === 'generate'}
          <!-- Original AI Generation Options -->
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
        {/if}
			</form>
		{/if}
	</div>
</Modal>

<div class="w-fit mt-2">
  <Button onClick={openModal} type="button">Create your own {dialectName[dialect]} content</Button>
</div> 