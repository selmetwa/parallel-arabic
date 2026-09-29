<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { RevenueCatService } from '$lib/services/revenuecat.service';
  import { PLANS, type PlanId } from '$lib/constants/pricing';

  type Props = {
    label?: string;
    className?: string;
    nativeClass?: string;
  }

  let { label = 'Subscribe Now', className = '', nativeClass = '' }: Props = $props();

  let isNative = $state<boolean | null>(null);

  // Trial copy is web-only: offering a Stripe trial inside the iOS app would
  // be an external purchase. isNative stays null until mount, so the WebView
  // never flashes trial wording.
  const showTrial = $derived(isNative === false && page.data.trialEligible === true);

  // Web-only choice; the native branch below never renders it.
  let plan = $state<PlanId>('annual');

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
    <div role="radiogroup" aria-label="Billing period" class="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-tile-600 bg-tile-300 p-1">
      {#each ['monthly', 'annual'] as const as id (id)}
        <label
          class="flex cursor-pointer flex-col items-center rounded-md px-2 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tile-600 {plan === id
            ? 'bg-tile-500 text-text-300 font-semibold shadow-sm'
            : 'text-text-200 hover:text-text-300'}"
        >
          <input type="radio" name="plan" value={id} bind:group={plan} class="sr-only" />
          <span>{PLANS[id].label}</span>
          <span class="text-xs font-normal">
            {id === 'annual' ? `${PLANS.annual.perMonth} · ${PLANS.annual.savings}` : PLANS.monthly.price}
          </span>
        </label>
      {/each}
    </div>
    <Button type="submit" className={className}>
      {showTrial ? 'Start 7-day free trial' : label}
    </Button>
    <p class="mt-2 text-xs text-text-200 text-center">
      {showTrial ? `$0 today, then ${PLANS[plan].price}.` : `${PLANS[plan].price}.`} Cancel anytime.
    </p>
  </form>
{/if}
