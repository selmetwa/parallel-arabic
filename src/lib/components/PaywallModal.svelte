<script lang="ts">
  import { PUBLIC_PRICE_ID } from '$env/static/public'
  import Modal from '$lib/components/Modal.svelte';
  import Checkmark from '$lib/components/Checkmark.svelte';
  import Button from '$lib/components/Button.svelte';

  type Props = {
    isOpen: boolean;
    handleCloseModal: () => void;
  }

  let { isOpen = false, handleCloseModal = () => {} }: Props = $props();
</script>

<Modal isOpen={isOpen} handleCloseModal={handleCloseModal} width="max(70%, 600px)" height="fit-content">
  <div class="flex flex-col h-full bg-tile-400 rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="bg-tile-500 border-b border-tile-600 p-6 text-center">
        <h2 class="text-2xl font-bold text-text-300 mb-2">Unlock Full Access</h2>
        <p class="text-text-200">Upgrade to master Arabic dialects</p>
        <h3 class="text-3xl font-bold text-text-300 mt-3">$10<span class="text-lg font-normal text-text-300">/month</span></h3>
    </div>

    <!-- Content -->
    <div class="p-6 flex-grow overflow-y-auto">
        <ul class="flex flex-col gap-3 text-text-200">
            <li class="flex items-start gap-3">
                <div class="shrink-0 mt-1"><Checkmark /></div>
                <span><strong class="text-text-300">Multiple Arabic dialects:</strong> Egyptian, Levantine, Moroccan & Fusha</span>
            </li>
            <li class="flex items-start gap-3">
                <div class="shrink-0 mt-1"><Checkmark /></div>
                <span><strong class="text-text-300">AI Tutor:</strong> Practice speaking with an AI tutor with real-time feedback</span>
            </li>
            <li class="flex items-start gap-3">
                <div class="shrink-0 mt-1"><Checkmark /></div>
                <span><strong class="text-text-300">Spaced repetition system</strong> to remember words and sentences effectively</span>
            </li>
            <li class="flex items-start gap-3">
                <div class="shrink-0 mt-1"><Checkmark /></div>
                <span><strong class="text-text-300">Interactive videos</strong> with transcripts, translations, and transliterations</span>
            </li>
            <li class="flex items-start gap-3">
                <div class="shrink-0 mt-1"><Checkmark /></div>
                <span>Access to all stories and conversations with native audio</span>
            </li>
            <li class="flex items-start gap-3">
                <div class="shrink-0 mt-1"><Checkmark /></div>
                <span><strong class="text-text-300">Unlimited AI-generated practice sentences</strong> for all skill levels</span>
            </li>
            <li class="flex items-start gap-3">
                <div class="shrink-0 mt-1"><Checkmark /></div>
                <span><strong class="text-text-300">Advanced speaking practice</strong> with real-time pronunciation feedback</span>
            </li>
            <li class="flex items-start gap-3">
                <div class="shrink-0 mt-1"><Checkmark /></div>
                <span>Access to <strong class="text-text-300">over 20,000 vocabulary words</strong> with multiple choice quizzes</span>
            </li>
             <li class="flex items-start gap-3">
                <div class="shrink-0 mt-1"><Checkmark /></div>
                <span>Complete Arabic Alphabet mastery with native pronunciation</span>
            </li>
        </ul>
    </div>

    <!-- Footer / Action -->
    <div class="p-6 pt-0">
        <form method="POST" action="/?/subscribe">
            <input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
            <Button type="submit" className="!py-3 !text-lg w-full shadow-md">
                Subscribe Now
            </Button>
        </form>
    </div>
  </div>
</Modal>