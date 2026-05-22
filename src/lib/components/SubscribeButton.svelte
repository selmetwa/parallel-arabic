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
  let purchaseSuccess = $state<string | null>(null);

  onMount(() => {
    isNative = !!(window as any).Capacitor?.isNativePlatform?.();
  });

  async function handleApplePurchase() {
    isPurchasing = true;
    purchaseError = null;
    purchaseSuccess = null;
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

      if (!RevenueCatService.isEntitlementActive(customerInfo)) {
        purchaseError = 'Payment succeeded but the subscription is not yet active. Please contact support if this persists.';
        return;
      }

      const verifyRes = await fetch('/api/verify-apple-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerInfo })
      });
      const verifyData = await verifyRes.json().catch(() => ({}));

      if (!verifyRes.ok) {
        purchaseError =
          verifyData?.error ||
          'Payment succeeded but we could not save your subscription. Please contact support.';
        console.error('[SubscribeButton] verify failed:', verifyRes.status, verifyData);
        return;
      }

      if (verifyData?.active === false) {
        purchaseError =
          'Payment succeeded but your subscription has not propagated yet. It should activate within a minute — refresh the page.';
        return;
      }

      purchaseSuccess = 'Subscription activated. Enjoy Parallel Arabic Premium!';

      // Force a full page reload to guarantee every loader and cached component
      // sees the new is_subscriber state. invalidateAll() alone is not enough
      // inside the Capacitor WebView where users cannot pull-to-refresh.
      await invalidateAll();
      setTimeout(() => {
        window.location.reload();
      }, 1200);
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
{#if purchaseSuccess}
  <p class="text-green-400 text-sm mb-2 text-center">{purchaseSuccess}</p>
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
