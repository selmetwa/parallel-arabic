<script>
  import { PUBLIC_TEST_PRICE_ID } from '$env/static/public'
  import Modal from '$lib/components/Modal.svelte';
	import Checkmark from '$lib/components/Checkmark.svelte';
  import Button from '$lib/components/Button.svelte';
  export let isOpen = false;
  export let handleCloseModal = () => {};
</script>

<Modal isOpen={isOpen} handleCloseModal={handleCloseModal}>
  <div class="p-6 text-text-300">
    <h2 class="text-2xl font-bold">Subscriber Only Content</h2>
    <ul class="mt-3 flex flex-col gap-4 text-text-300">
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Access to all stories and conversations with native audio</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Unlimited AI practice sentences for beginner and intermediate levels</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Access to all verbs for verb conjugation practice</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Access to 4,100 vocabulary words for writing and handwriting practice</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Access to 4,100 vocabulary words and multiple choice quizzes</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Access to custom built Anki decks for Egyptian Arabic</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Access to Alphabet learning</span>
      </li>
      <li class="flex items-start gap-2">
        <Checkmark />
        <span>Save keywords and phrases to personal wordbank</span>
      </li>
    </ul>
    <form method="POST" action="/?/subscribe" class="mt-4">
      <!-- Modify this value using your own Stripe price_id -->
      <input type="hidden" name="price_id" value={PUBLIC_TEST_PRICE_ID} />
      <Button type="submit">
        Subscribe
      </Button>
    </form>
  </div>
 </Modal>
