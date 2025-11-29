<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import Button from '$lib/components/Button.svelte';
  import { goto } from '$app/navigation';

  type Props = {
    isOpen: boolean;
    handleCloseModal: () => void;
  }

  let { isOpen = false, handleCloseModal = () => {} }: Props = $props();

  function handleLogin() {
    goto('/login');
  }
</script>

<Modal isOpen={isOpen} handleCloseModal={handleCloseModal} width="min(90%, 500px)" height="fit-content">
  <div class="flex flex-col bg-tile-400 rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="bg-tile-500 border-b border-tile-600 p-6 text-center">
        <h2 class="text-2xl font-bold text-text-300 mb-2">Login Required</h2>
        <p class="text-text-200">Please log in to access lessons</p>
    </div>

    <!-- Content -->
    <div class="p-6 overflow-y-auto">
        <div class="text-center space-y-4">
            <div class="text-6xl mb-4">🔒</div>
            <p class="text-lg text-text-200">
                You need to be logged in to access structured and unstructured lessons. 
                Create an account or log in to continue your learning journey.
            </p>
        </div>
    </div>

    <!-- Footer / Action -->
    <div class="p-6 pt-0">
        <Button onClick={handleLogin} className="!py-3 !text-lg w-full shadow-md">
            Go to Login
        </Button>
    </div>
  </div>
</Modal>

