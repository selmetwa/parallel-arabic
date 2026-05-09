<script lang="ts">
  import { PUBLIC_PRICE_ID } from '$env/static/public'
  import Modal from '$lib/components/Modal.svelte';
  import Checkmark from '$lib/components/Checkmark.svelte';
  import Button from '$lib/components/Button.svelte';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  type Props = {
    isOpen: boolean;
    handleCloseModal: () => void;
    userId?: string;
  }

  let { isOpen = false, handleCloseModal = () => {}, userId = '' }: Props = $props();

  let isNative = $state(false);
  let isPurchasing = $state(false);
  let purchaseError = $state<string | null>(null);

  onMount(() => {
    isNative = !!(window as any).Capacitor?.isNativePlatform?.();
  });

  async function handleApplePurchase() {
    if (!userId) return;
    isPurchasing = true;
    purchaseError = null;
    try {
      const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui');
      const result = await RevenueCatUI.presentPaywall();

      if (result.paywallResult === 'PURCHASED' || result.paywallResult === 'RESTORED') {
        // Immediately sync to DB
        await fetch('/api/verify-apple-purchase', { method: 'POST' });
        await invalidateAll();
        handleCloseModal();
      }
    } catch (err: any) {
      if (err?.code !== 'PURCHASE_CANCELLED') {
        purchaseError = 'Purchase failed. Please try again.';
      }
    } finally {
      isPurchasing = false;
    }
  }
</script>

<Modal isOpen={isOpen} handleCloseModal={handleCloseModal} width="min(90%, 600px)" height="fit-content">
  <div class="flex flex-col bg-tile-400 rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="bg-tile-500 border-b border-tile-600 p-6 text-center">
        <h2 class="text-2xl font-bold text-text-300 mb-2">Unlock Full Access</h2>
        <p class="text-text-200">Upgrade to master Arabic dialects</p>
        <h3 class="text-3xl font-bold text-text-300 mt-3">$10<span class="text-lg font-normal text-text-300">/month</span></h3>
    </div>

    <!-- Content -->
    <div class="p-6 overflow-y-auto max-h-[50vh]">
        <ul class="flex flex-col gap-3 text-text-200">
            <li class="flex items-start gap-3 bg-tile-300/50 p-3 rounded-lg border border-tile-500">
                <div class="shrink-0 mt-1"><Checkmark /></div>
                <span><strong class="text-text-300">Structured Lessons:</strong> Follow comprehensive learning paths organized by modules and topics for Egyptian Arabic, Levantine, Moroccan Darija, and Modern Standard Arabic. Progress through lessons sequentially with progress tracking and unlock new content as you advance.</span>
            </li>
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
                <span>Complete Arabic Alphabet mastery with native pronunciation</span>
            </li>
        </ul>
    </div>

    <!-- Footer / Action -->
    <div class="p-6 pt-0">
      {#if purchaseError}
        <p class="text-red-400 text-sm mb-3 text-center">{purchaseError}</p>
      {/if}

      {#if isNative}
        <Button
          type="button"
          onClick={handleApplePurchase}
          disabled={isPurchasing}
          className="!py-3 !text-lg w-full shadow-md"
        >
          {isPurchasing ? 'Loading...' : 'Subscribe Now'}
        </Button>
      {:else}
        <form method="POST" action="/?/subscribe">
          <input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
          <Button type="submit" className="!py-3 !text-lg w-full shadow-md">
            Subscribe Now
          </Button>
        </form>
      {/if}
    </div>
  </div>
</Modal>
