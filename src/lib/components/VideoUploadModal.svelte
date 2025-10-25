<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
  import { goto } from '$app/navigation';
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
  import { 
    showVideoProcessingToast, 
    showVideoProcessingSuccessToast, 
    showVideoProcessingErrorToast 
  } from '$lib/helpers/toast-helpers';

  interface Props {
    data: any;
	}

  const { data }: Props = $props();
  
	let isOpen = $state(false);
	let isLoading = $state(false);
  let isProcessing = $state(false);
  let uploadMode = $state<'file' | 'youtube'>('youtube');
  
  // YouTube URL fields
  let youtubeUrl = $state('');
  
  // File upload fields
  let videoFile = $state<File | null>(null);
  let videoFileError = $state('');
  
  // Common fields
  let customTitle = $state('');
  let dialect = $state('egyptian-arabic');
  let useCustomTitle = $state(false);
  let error = $state('');
  let processingToastId: string | number | null = $state(null);
  let toastIdBackup: string | number | null = null; // Non-reactive backup

	function openModal() {
    if (!data.session) {
      goto('/signup')
    }
		isOpen = true;
	}

	function closeModal() {
		isOpen = false;
    resetForm();
	}

  function resetForm() {
    youtubeUrl = '';
    videoFile = null;
    videoFileError = '';
    customTitle = '';
    useCustomTitle = false;
    error = '';
    isLoading = false;
    isProcessing = false;
    processingToastId = null;
    toastIdBackup = null; // Reset backup as well
  }

  function extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

	async function handleSubmit(event: any) {
		event.preventDefault();
		isLoading = true;
		isProcessing = true;
    error = '';
    
    // Show processing toast
    console.log('🔄 [VideoUploadModal] Creating processing toast...');
    const toastResult = showVideoProcessingToast('YouTube');
    console.log('🔍 [VideoUploadModal] Toast function returned:', toastResult, typeof toastResult);
    processingToastId = toastResult;
    toastIdBackup = toastResult; // Store backup copy
    console.log('🔄 [VideoUploadModal] Processing toast created with ID:', processingToastId, typeof processingToastId);
    console.log('🔄 [VideoUploadModal] Backup toast ID stored:', toastIdBackup);
    
    // Add a small delay to check if the state persists
    setTimeout(() => {
      console.log('⏰ [VideoUploadModal] After timeout, processingToastId is:', processingToastId);
      console.log('⏰ [VideoUploadModal] After timeout, toastIdBackup is:', toastIdBackup);
    }, 10);
    
    try {
      if (uploadMode === 'youtube') {
        // YouTube URL processing
        if (!youtubeUrl.trim()) {
          error = 'Please enter a YouTube URL';
          if (processingToastId) {
            showVideoProcessingErrorToast(processingToastId, 'Please enter a YouTube URL');
          }
          throw new Error('Please enter a YouTube URL');
        }

        const extractedVideoId = extractVideoId(youtubeUrl.trim());
        if (!extractedVideoId) {
          error = 'Please enter a valid YouTube URL';
          if (processingToastId) {
            showVideoProcessingErrorToast(processingToastId, 'Please enter a valid YouTube URL');
          }
          throw new Error('Please enter a valid YouTube URL');
        }

        const response = await fetch('/api/youtube-transcript', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            videoId: extractedVideoId,
            dialect: dialect
          })
        });

        const result = await response.json();
        
        console.log('🎥 [VideoUploadModal] API response:', {
          ok: response.ok,
          status: response.status,
          result
        });

        if (!response.ok) {
          throw new Error(result.error || 'Failed to process YouTube video');
        }

        console.log('🎉 [VideoUploadModal] About to show success toast:', {
          processingToastId,
          processingToastIdType: typeof processingToastId,
          processingToastIdIsNull: processingToastId === null,
          processingToastIdIsUndefined: processingToastId === undefined,
          toastIdBackup,
          toastIdBackupType: typeof toastIdBackup,
          videoDbId: result.videoDbId,
          title: result.title
        });

        // Use backup if reactive state is null
        const validToastId = processingToastId || toastIdBackup;

        // Show success toast with navigation action
        if (validToastId) {
          console.log('✅ [VideoUploadModal] Valid toast ID found, showing success toast with ID:', validToastId);
          showVideoProcessingSuccessToast(validToastId, result.videoDbId, result.title);
        } else {
          console.log('❌ [VideoUploadModal] Both processingToastId and toastIdBackup are null/undefined, cannot show success toast');
          // Fallback: show a new success toast without dismissing the loading one
          console.log('🔄 [VideoUploadModal] Creating fallback success toast');
          showVideoProcessingSuccessToast('fallback-success', result.videoDbId, result.title);
        }
        
        console.log('✅ [VideoUploadModal] Success toast called, navigating to video...');

        // Success - redirect to the video
        // await goto(`/video/${result.videoDbId}`);
        closeModal();
      } 
    } catch (err) {
      console.error('❌ [VideoUploadModal] Error processing video:', err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      error = errorMsg;
      
      console.log('❌ [VideoUploadModal] About to show error toast:', {
        processingToastId,
        toastIdBackup,
        errorMsg
      });
      
      // Use backup if reactive state is null
      const validToastId = processingToastId || toastIdBackup;
      
      // Show error toast
      if (validToastId) {
        console.log('❌ [VideoUploadModal] Valid toast ID found for error, using ID:', validToastId);
        showVideoProcessingErrorToast(validToastId, errorMsg);
      } else {
        console.log('❌ [VideoUploadModal] No valid toast ID for error handling');
      }
    } finally {
      console.log('🧹 [VideoUploadModal] Cleaning up - setting loading states to false');
      isLoading = false;
      isProcessing = false;
    }
	}

  const dialectOptions = [
    { value: 'egyptian-arabic', label: 'Egyptian Arabic' },
    { value: 'darija', label: 'Moroccan Darija' },
    { value: 'fusha', label: 'Modern Standard Arabic' }
  ];
</script>

<Modal {isOpen} handleCloseModal={closeModal} width="600px" height='fit-content'>
	<div class="p-4">
		{#if isLoading}
			<div class="mx-auto my-8 flex w-fit flex-col items-center gap-4 p-6 text-text-200">
				<AlphabetCycle size={100} duration={1000} />
        <div class="flex flex-col gap-2 text-center">
				<p class="text-2xl text-text-300 font-semibold">
            Processing your video
				</p>
        <p class="text-lg text-text-200">
            This usually takes up to 2 minutes...
        </p>
        <p class="text-lg text-text-200">
          💡 <strong>Tip:</strong> You can close this modal and continue using the app. We'll notify you with a toast when your video is ready!
        </p>
      </div>
			</div>
		{:else}
			<h1 class="text-2xl font-semibold text-text-300">Upload Arabic Video</h1>
      <p class="text-text-200 text-lg">Make sure the video has a transcript in Arabic.</p>
      <form onsubmit={handleSubmit}>
        {#if uploadMode === 'youtube'}
          <div class="mt-6 p-4 border border-tile-600 bg-tile-100 rounded">
            <h3 class="text-lg font-semibold text-text-300 mb-2">YouTube Video URL</h3>
            <div class="space-y-4">
              <div>
                <label for="youtube-url" class="block text-sm font-medium text-text-200 mb-2">
                  YouTube URL or Video ID
                </label>
                <input
                  id="youtube-url"
                  type="text"
                  bind:value={youtubeUrl}
                  placeholder="https://www.youtube.com/watch?v=jNQXAC9IVRw or jNQXAC9IVRw"
                  class="w-full px-3 py-2 bg-tile-200 border border-tile-600 text-text-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label for="dialect" class="block text-sm font-medium text-text-200 mb-2">
                  Dialect
                </label>
                <select
                  id="dialect"
                  bind:value={dialect}
                  class="w-full px-3 py-2 bg-tile-200 border border-tile-600 text-text-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded"
                  disabled={isLoading}
                >
                  {#each dialectOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </div>
            </div>
          </div>
        {/if}

        {#if uploadMode === 'file'}
          <!-- Video File Upload Section -->
          <div class="mt-6 p-4 border border-tile-600 bg-tile-100 rounded">
            <h3 class="text-lg font-semibold text-text-300 mb-2">Upload Video File</h3>
            <!-- Title Input for File Mode -->
            <div class="mb-4">
              <div class="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  id="useCustomTitleFile"
                  bind:checked={useCustomTitle}
                  class="w-4 h-4"
                  disabled
                />
                <label for="useCustomTitleFile" class="text-sm text-text-200">
                  Use custom title (otherwise use filename)
                </label>
              </div>
              
              {#if useCustomTitle}
                <input
                  type="text"
                  bind:value={customTitle}
                  placeholder="Enter custom title for your video..."
                  class="w-full rounded border border-tile-600 bg-tile-200 py-2 px-3 text-text-300"
                  disabled
                />
              {:else if videoFile}
                <p class="text-sm text-text-200">
                  Title will be: <span class="font-medium text-text-300">{customTitle}</span>
                </p>
              {/if}
            </div>

            {#if videoFileError}
              <p class="text-sm text-red-400 mt-2">⚠ {videoFileError}</p>
            {/if}
          </div>
        {/if}

        {#if error}
          <div class="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        {/if}

        <div class="mt-6 flex gap-3">
          <Button 
            type="button" 
            onClick={closeModal}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={isLoading || (uploadMode === 'youtube' && !youtubeUrl.trim()) || (uploadMode === 'file' && !videoFile)}
          >
            {#if isProcessing}
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
                Processing Video...
              </div>
            {:else}
              🎥 {uploadMode === 'youtube' ? 'Process YouTube Video' : 'Upload Video'}
            {/if}
          </Button>

        </div>
			</form>
		{/if}
	</div>
</Modal>

<div class="w-fit">
  <Button onClick={openModal} type="button">Upload Arabic Video</Button>
</div>
