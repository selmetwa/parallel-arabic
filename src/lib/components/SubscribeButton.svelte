<script lang="ts">
  import { PUBLIC_PRICE_ID } from '$env/static/public';
  import Button from '$lib/components/Button.svelte';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  type Props = {
    label?: string;
    className?: string;
    nativeClass?: string;
  }

  let { label = 'Subscribe Now', className = '', nativeClass = '' }: Props = $props();

  let isNative = $state(false);
  let isPurchasing = $state(false);
  let purchaseError = $state<string | null>(null);

  onMount(() => {
    isNative = !!(window as any).Capacitor?.isNativePlatform?.();
  });

  async function handleApplePurchase() {
    isPurchasing = true;
    purchaseError = null;
    try {
      const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui');
      const result = await RevenueCatUI.presentPaywall();
      if (result.paywallResult === 'PURCHASED' || result.paywallResult === 'RESTORED') {
        await fetch('/api/verify-apple-purchase', { method: 'POST' });
        await invalidateAll();
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

{#if purchaseError}
  <p class="text-red-400 text-sm mb-2 text-center">{purchaseError}</p>
{/if}

{#if isNative}
  <Button
    type="button"
    onClick={handleApplePurchase}
    disabled={isPurchasing}
    className={className}
  >
    {isPurchasing ? 'Loading...' : label}
  </Button>
{:else}
  <form method="POST" action="/?/subscribe">
    <input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
    <Button type="submit" className={className}>
      {label}
    </Button>
  </form>
{/if}
