<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import Button from '$lib/components/Button.svelte';
  import Testimonial from '$lib/components/Testimonial.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';

  type Props = {
    isOpen: boolean;
    handleCloseModal: () => void;
    title?: string;
    message?: string;
    /** Where to come back to after signing up or logging in. Defaults to this page. */
    next?: string;
    /** Called as the visitor heads to sign up or log in, e.g. to record where they came from. */
    onChoose?: (choice: 'signup' | 'login') => void;
  }

  let {
    isOpen = false,
    handleCloseModal = () => {},
    title = 'Login Required',
    message = 'Create an account or log in to continue your learning journey.',
    next,
    onChoose
  }: Props = $props();

  // Only read the URL once open: prerendered pages can't touch url.search.
  const nextQuery = $derived(
    isOpen ? `?next=${encodeURIComponent(next ?? page.url.pathname + page.url.search)}` : ''
  );
</script>

<Modal isOpen={isOpen} handleCloseModal={handleCloseModal} width="min(90%, 500px)" height="fit-content">
  <div class="flex flex-col bg-tile-400 rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="bg-tile-500 border-b border-tile-600 p-6 text-center">
        <h2 class="text-2xl font-bold text-text-300">{title}</h2>
    </div>

    <!-- Content -->
    <div class="p-6 overflow-y-auto">
        <p class="text-lg text-text-200 text-center">{message}</p>
        <Testimonial
            class="mt-6"
            segments={[
                { t: 'This is great! As someone outgrowing Duolingo this is perfect.', b: true }
            ]}
        />
    </div>

    <!-- Footer / Action -->
    <div class="p-6 pt-0 flex flex-col items-center gap-3">
        <Button type="button" onClick={() => {
          onChoose?.('signup');
          goto(`${resolve('/signup')}${nextQuery}`);
        }} className="!py-3 !text-lg w-full shadow-md">
            Create a free account
        </Button>
        <a href="{resolve('/login')}{nextQuery}" onclick={() => onChoose?.('login')} class="text-sm font-semibold text-text-200 underline underline-offset-2 hover:text-text-300">
            I already have an account
        </a>
    </div>
  </div>
</Modal>
