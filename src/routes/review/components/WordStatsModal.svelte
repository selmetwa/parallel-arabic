<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';

  interface Word {
    arabic: string;
    english: string;
    transliteration: string;
    dialect: string;
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    nextReviewDate: number | null;
    lastReviewDate: number | null;
    isLearning: boolean;
  }

  interface Props {
    isOpen: boolean;
    closeModal: () => void;
    word: Word;
  }

  let { isOpen, closeModal, word }: Props = $props();

  const dialectName: Record<string, string> = {
    fusha: 'Modern Standard Arabic',
    levantine: 'Levantine Arabic',
    darija: 'Moroccan Darija',
    'egyptian-arabic': 'Egyptian Arabic',
    iraqi: 'Iraqi Arabic',
    khaleeji: 'Khaleeji Arabic'
  };

  function getRetentionLabel(easeFactor: number): string {
    if (easeFactor >= 2.5) return 'Easy';
    if (easeFactor >= 1.8) return 'Medium';
    return 'Hard';
  }

  function formatDate(timestamp: number | null): string {
    if (timestamp === null) return 'Never';
    return new Date(timestamp).toLocaleDateString();
  }

  function formatNextReview(timestamp: number | null): string {
    if (timestamp === null) return 'Not scheduled';
    return new Date(timestamp).toLocaleDateString();
  }
</script>

<Modal isOpen={isOpen} handleCloseModal={closeModal} width="500px">
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6 text-center">
      <p class="text-3xl font-bold text-text-100 mb-1">{word.arabic}</p>
      <p class="text-lg text-text-200">{word.english}</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-tile-400 rounded-lg p-3 border border-tile-500">
        <p class="text-xs text-text-200 mb-1">Total Reviews</p>
        <p class="text-lg font-semibold text-text-100">
          {word.repetitions === 0 ? 'First review' : word.repetitions}
        </p>
      </div>

      <div class="bg-tile-400 rounded-lg p-3 border border-tile-500">
        <p class="text-xs text-text-200 mb-1">Status</p>
        <p class="text-lg font-semibold text-text-100">
          {word.isLearning ? 'Learning' : 'Graduated'}
        </p>
      </div>

      <div class="bg-tile-400 rounded-lg p-3 border border-tile-500">
        <p class="text-xs text-text-200 mb-1">Retention Score</p>
        <p class="text-lg font-semibold text-text-100">
          {getRetentionLabel(word.easeFactor)} ({word.easeFactor.toFixed(2)})
        </p>
      </div>

      <div class="bg-tile-400 rounded-lg p-3 border border-tile-500">
        <p class="text-xs text-text-200 mb-1">Current Interval</p>
        <p class="text-lg font-semibold text-text-100">
          {word.intervalDays === 0 ? 'N/A' : `${word.intervalDays} days`}
        </p>
      </div>

      <div class="bg-tile-400 rounded-lg p-3 border border-tile-500">
        <p class="text-xs text-text-200 mb-1">Next Review</p>
        <p class="text-lg font-semibold text-text-100">
          {formatNextReview(word.nextReviewDate)}
        </p>
      </div>

      <div class="bg-tile-400 rounded-lg p-3 border border-tile-500">
        <p class="text-xs text-text-200 mb-1">Last Reviewed</p>
        <p class="text-lg font-semibold text-text-100">
          {formatDate(word.lastReviewDate)}
        </p>
      </div>

      <div class="bg-tile-400 rounded-lg p-3 border border-tile-500 col-span-2">
        <p class="text-xs text-text-200 mb-1">Dialect</p>
        <p class="text-lg font-semibold text-text-100">
          {dialectName[word.dialect] || word.dialect}
        </p>
      </div>
    </div>
  </div>
</Modal>
