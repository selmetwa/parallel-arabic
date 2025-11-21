<script lang="ts">
  import levenshtein from 'fast-levenshtein';
  import Modal from '$lib/components/Modal.svelte';
  import AudioLoading from '$lib/components/AudioLoading.svelte';
  import RecordButton from '$lib/components/RecordButton.svelte';
  import Similarity from '$lib/components/Similarity.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
  import type { Dialect } from '$lib/types/index';

  interface Props {
    isOpen: boolean;
    closeModal: () => void;
    text: string;
    transliteration?: string;
    english?: string;
    dialect: Dialect;
  }

  let { isOpen, closeModal, text, transliteration, english, dialect }: Props = $props();

  let recording = $state(false);
  let mediaRecorder: MediaRecorder | null = $state(null);
  let audioChunks: Blob[] = $state([]);
  let transcribedText = $state("");
  let similarity = $state(0);
  let audioURL = $state('');

  $effect(() => {
    if (!isOpen) {
      // Reset when modal closes
      recording = false;
      mediaRecorder = null;
      audioChunks = [];
      transcribedText = "";
      similarity = 0;
      audioURL = '';
    }
  });

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        audioURL = URL.createObjectURL(blob);
        audioChunks = []; // Clear for next recording

        // Create a File object to send to the backend
        const file = new File([blob], "recording.webm", { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", file);

        const response = await fetch("/api/speech-to-text", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        transcribedText = data.text || '';
      };

      mediaRecorder.start();
      recording = true;
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please check your permissions.');
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      recording = false;
      
      // Stop all tracks to release the microphone
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  $effect(() => {
    if (transcribedText) {
      const transcribedTextWithoutPeriods = transcribedText.replace(/\./g, '');
      const distance = levenshtein.get(text, transcribedTextWithoutPeriods);
      const maxLength = Math.max(text.length, transcribedTextWithoutPeriods.length);
      const _similarity = maxLength > 0 ? (1 - distance / maxLength) * 100 : 0;
      similarity = _similarity;
    }
  });
</script>

<Modal isOpen={isOpen} handleCloseModal={closeModal} width="600px">
  <div class="p-6">
    <h2 class="text-2xl font-bold text-text-300 mb-4">Pronunciation Test</h2>
    
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-2">
        <p class="text-2xl font-semibold text-text-300" dir="rtl">
          {text}
        </p>
        <InlineAudioButton text={text} {dialect} />
      </div>
      {#if transliteration}
        <p class="text-text-200 italic text-lg mb-1">{transliteration}</p>
      {/if}
      {#if english}
        <p class="text-text-200 text-lg">{english}</p>
      {/if}
    </div>

    <div class="bg-tile-300 border border-tile-500 flex flex-col gap-4 items-center px-3 py-12 shadow-lg min-h-[250px] relative">
      {#if !recording}
        <button 
          class="absolute center top-0 right-[50%] translate-x-[50%] translate-y-[-50%]" 
          onclick={startRecording} 
          disabled={recording}
        >
          <RecordButton />
        </button>
      {:else}
        <button 
          class="absolute center top-0 right-[50%] translate-x-[50%] translate-y-[-50%]" 
          onclick={stopRecording} 
          disabled={!recording}
        >
          <AudioLoading />
        </button>
      {/if}

      {#if similarity > 0}
        <div class="absolute right-0 top-0 md:translate-y-[-40%] md:translate-x-[40%]">
          <Similarity score={similarity} />
        </div>
      {/if}
      
      <div class="text-center mt-8">
        {#if !recording && !transcribedText}
          <p class="text-text-200 text-lg">Click the microphone to start recording</p>
        {:else if recording}
          <p class="text-text-200 text-lg">Recording... Click again to stop</p>
        {:else if transcribedText}
          <div class="space-y-4">
            <div>
              <p class="text-sm text-text-200 mb-2">You said:</p>
              <p class="text-xl text-text-300 font-semibold" dir="rtl">
                {transcribedText}
              </p>
            </div>
            {#if similarity > 0}
              <div>
                <p class="text-sm text-text-200 mb-2">Similarity Score:</p>
                <div class="flex justify-center">
                  <Similarity score={similarity} />
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      {#if audioURL && transcribedText}
        <div class="mt-4">
          <audio controls src={audioURL} class="w-full"></audio>
        </div>
      {/if}
    </div>

    <div class="mt-6 flex gap-2 justify-end">
      <button
        type="button"
        onclick={closeModal}
        class="px-4 py-2 bg-tile-500 text-text-300 rounded hover:bg-tile-600"
      >
        Close
      </button>
    </div>
  </div>
</Modal>

