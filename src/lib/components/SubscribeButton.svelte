<script lang="ts">
  import { PUBLIC_PRICE_ID } from '$env/static/public';
  import Button from '$lib/components/Button.svelte';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { RevenueCatService } from '$lib/services/revenuecat.service';

  type Props = {
    label?: string;
    className?: string;
    nativeClass?: string;
  }

  let { label = 'Subscribe Now', className = '', nativeClass = '' }: Props = $props();

  let isNative = $state<boolean | null>(null);
  let isPurchasing = $state(false);
  let purchaseError = $state<string | null>(null);

  onMount(() => {
    isNative = !!(window as any).Capacitor?.isNativePlatform?.();
  });

  async function handleApplePurchase() {
    isPurchasing = true;
    purchaseError = null;
    try {
      const userId = page.data.user?.id;
      if (!userId) {
        purchaseError = 'Please sign in before subscribing.';
        return;
      }

      await RevenueCatService.initialize(userId);

      const pkg = await RevenueCatService.getCurrentOffering();
      if (!pkg) {
        purchaseError = 'No subscription products available. Please try again later.';
        return;
      }

      const customerInfo = await RevenueCatService.purchasePackage(pkg);

      if (RevenueCatService.isEntitlementActive(customerInfo)) {
        await fetch('/api/verify-apple-purchase', { method: 'POST' });
        await invalidateAll();
      }
    } catch (err: any) {
      const code = err?.code ?? err?.errorCode;
      const userCancelled =
        code === 'PURCHASE_CANCELLED' ||
        code === 1 ||
        err?.userCancelled === true ||
        /cancel/i.test(String(err?.message ?? ''));
      if (!userCancelled) {
        purchaseError = err?.message || 'Purchase failed. Please try again.';
        console.error('Apple purchase failed:', err);
      }
    } finally {
      isPurchasing = false;
    }
  }
</script>

{#if purchaseError}
  <p class="text-red-400 text-sm mb-2 text-center">{purchaseError}</p>
{/if}

{#if isNative === null}
  <Button type="button" disabled={true} className={className}>
    Loading…
  </Button>
{:else if isNative}
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
