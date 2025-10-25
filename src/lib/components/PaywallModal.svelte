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

<Modal isOpen={isOpen} handleCloseModal={handleCloseModal}>
  <div class="p-6 text-text-300">
    <h2 class="text-2xl font-bold">Subscriber Only Content</h2>
    <ul class="mt-3 flex flex-col gap-4 text-text-300">
      <li class="flex items-start gap-2">
        <Checkmark />
        <span><strong>Multiple Arabic dialects:</strong> Egyptian, Moroccan & Fusha</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Access to all stories and conversations with native audio</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span><strong>Unlimited AI-generated practice sentences</strong> for all skill levels</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span><strong>Advanced speaking practice</strong> with real-time pronunciation feedback</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Access to all verbs for comprehensive verb conjugation practice</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Access to <strong>over 15,000 vocabulary words</strong> for writing and handwriting practice</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Access to <strong>over 15,000 vocabulary words</strong> and multiple choice quizzes</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Access to custom built Anki decks for all dialects</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Complete Arabic Alphabet mastery with native pronunciation</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Save unlimited keywords and phrases to personal wordbank</span>
      </li>
    </ul>
    <form method="POST" action="/?/subscribe" class="mt-4">
      <!-- Modify this value using your own Stripe price_id -->
      <input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
      <Button type="submit">
        Subscribe
      </Button>
    </form>
  </div>
 </Modal>
