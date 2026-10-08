<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { RevenueCatService, type StorePlans } from '$lib/services/revenuecat.service';
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

  let plan = $state<PlanId>('annual');

  // Native only: Apple's plans with StoreKit prices. Until they load, or if
  // they fail to, the native branch renders today's single button. Raw, so the
  // package handed to the Capacitor bridge is a plain object, not a proxy.
  let storePlans = $state.raw<StorePlans | null>(null);
  const nativePeriod = $derived(plan === 'annual' && storePlans?.annual ? 'year' : 'month');
  const nativePlan = $derived(
    storePlans && (nativePeriod === 'year' ? storePlans.annual : storePlans.monthly)
  );

  let isPurchasing = $state(false);
  let isRestoring = $state(false);
  let purchaseError = $state<string | null>(null);
  let purchaseSuccess = $state<string | null>(null);

  onMount(() => {
    isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    const userId = page.data.user?.id;
    if (isNative && userId) {
      RevenueCatService.getPlans(userId).then((plans) => (storePlans = plans));
    }
  });

  /**
   * Saves an active entitlement to our DB and reloads. Returns false, with
   * purchaseError set, when the save didn't go through.
   */
  async function saveAppleEntitlement(customerInfo: unknown): Promise<boolean> {
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
      return false;
    }

    if (verifyData?.active === false) {
      purchaseError =
        'Payment succeeded but your subscription has not propagated yet. It should activate within a minute — refresh the page.';
      return false;
    }

    purchaseSuccess = 'Subscription activated. Enjoy Parallel Arabic Premium!';
    RevenueCatService.clearPlans();

    // Force a full page reload to guarantee every loader and cached component
    // sees the new is_subscriber state. invalidateAll() alone is not enough
    // inside the Capacitor WebView where users cannot pull-to-refresh.
    await invalidateAll();
    setTimeout(() => {
      window.location.reload();
    }, 1200);
    return true;
  }

  async function handleRestore() {
    isRestoring = true;
    purchaseError = null;
    purchaseSuccess = null;
    try {
      const userId = page.data.user?.id;
      if (!userId) {
        purchaseError = 'Please sign in before restoring purchases.';
        return;
      }
      await RevenueCatService.initialize(userId);
      const customerInfo = await RevenueCatService.restorePurchases();
      if (!RevenueCatService.isEntitlementActive(customerInfo)) {
        purchaseError = 'No active subscription found for this Apple ID.';
        return;
      }
      await saveAppleEntitlement(customerInfo);
    } catch (err: any) {
      purchaseError = err?.message || 'Restore failed. Please try again.';
      console.error('Apple restore failed:', err);
    } finally {
      isRestoring = false;
    }
  }

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

      const pkg = (nativePlan ?? (await RevenueCatService.getPlans(userId))?.monthly)?.pkg;
      if (!pkg) {
        purchaseError = 'No subscription products available. Please try again later.';
        return;
      }

      const customerInfo = await RevenueCatService.purchasePackage(pkg);

      if (!RevenueCatService.isEntitlementActive(customerInfo)) {
        purchaseError = 'Payment succeeded but the subscription is not yet active. Please contact support if this persists.';
        return;
      }

      await saveAppleEntitlement(customerInfo);
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

{#snippet planToggle(sublabel: (id: PlanId) => string)}
  <div role="radiogroup" aria-label="Billing period" class="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-tile-600 bg-tile-300 p-1">
    {#each ['monthly', 'annual'] as const as id (id)}
      <label
        class="flex cursor-pointer flex-col items-center rounded-md px-2 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tile-600 {plan === id
          ? 'bg-tile-500 text-text-300 font-semibold shadow-sm'
          : 'text-text-200 hover:text-text-300'}"
      >
        <input type="radio" name="plan" value={id} bind:group={plan} class="sr-only" />
        <span>{PLANS[id].label}</span>
        <span class="text-xs font-normal">{sublabel(id)}</span>
      </label>
    {/each}
  </div>
{/snippet}

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
  <!-- Apple prices and trial only. Never Stripe prices or PLANS copy (App Store 3.1.1). -->
  {#if storePlans?.annual}
    {@render planToggle((id) =>
      id === 'annual'
        ? storePlans!.annual!.pricePerMonthString
          ? `${storePlans!.annual!.pricePerMonthString}/mo`
          : `${storePlans!.annual!.priceString}/yr`
        : `${storePlans!.monthly.priceString}/mo`
    )}
  {/if}
  <Button
    type="button"
    onClick={handleApplePurchase}
    disabled={isPurchasing || isRestoring}
    className={className}
  >
    {isPurchasing ? 'Loading...' : nativePlan?.trialDays ? `Start ${nativePlan.trialDays}-day free trial` : label}
  </Button>
  {#if nativePlan}
    <p class="mt-2 text-xs text-text-200 text-center">
      {nativePlan.trialDays
        ? `Free for ${nativePlan.trialDays} days, then ${nativePlan.priceString}/${nativePeriod}.`
        : `${nativePlan.priceString}/${nativePeriod}.`}
      Cancel anytime in Settings.
    </p>
  {/if}
  <button
    type="button"
    onclick={handleRestore}
    disabled={isPurchasing || isRestoring}
    class="mt-2 block w-full text-center text-xs text-text-200 underline hover:text-text-300 disabled:opacity-50"
  >
    {isRestoring ? 'Restoring…' : 'Restore purchases'}
  </button>
{:else}
  <form method="POST" action="/?/subscribe">
    {@render planToggle((id) =>
      id === 'annual' ? `${PLANS.annual.perMonth} · ${PLANS.annual.savings}` : PLANS.monthly.price
    )}
    <Button type="submit" className={className}>
      {showTrial ? 'Start 7-day free trial' : label}
    </Button>
    <p class="mt-2 text-xs text-text-200 text-center">
      {showTrial ? `$0 today, then ${PLANS[plan].price}.` : `${PLANS[plan].price}.`} Cancel anytime.
    </p>
  </form>
{/if}
