<script>
  import { PUBLIC_TEST_PRICE_ID } from '$env/static/public'
  import Modal from '$lib/components/Modal.svelte';
  import Button from '$lib/components/Button.svelte';
  export let isOpen = false;
  export let handleCloseModal = () => {};
</script>

<Modal isOpen={isOpen} handleCloseModal={handleCloseModal}>
  <div class="p-4">
    <h2 class="text-2xl font-bold">Paywall</h2>
    <p class="mt-2">This content is behind a paywall. Please subscribe to access it.</p>
    <form method="POST" action="/?/subscribe" class="mt-4">
      <!-- Modify this value using your own Stripe price_id -->
      <input type="hidden" name="price_id" value={PUBLIC_TEST_PRICE_ID} />
      <Button type="submit">
        Subscribe
      </Button>
    </form>
  </div>
 </Modal>
