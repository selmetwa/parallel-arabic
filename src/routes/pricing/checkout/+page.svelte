<script lang="ts">
  //   Modules and libraries
  import { onMount } from "svelte";
  import { loadStripe } from "@stripe/stripe-js";

  // Types and variables
  import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from "$env/static/public";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  let { data } = $props();

  // Set by the subscribe action when the session carries a trial.
  const isTrial = $derived(page.url.searchParams.get('trial') === '1');

  /**
   * Checkout onMount
   *
   * We receive the client secret from load and then attempt to load the
   * embedded checkout form.
   *
   */
  onMount(async () => {
    console.log('🔧 [checkout] Loading Stripe with publishable key:', PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Present' : 'Missing');
    console.log('🔧 [checkout] Client secret from server:', data.clientSecret ? 'Present' : 'Missing');
    
    const stripe = await loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);
    const clientSecret = data.clientSecret;

    console.log('🔧 [checkout] Stripe loaded:', !!stripe);
    console.log('🔧 [checkout] About to initialize embedded checkout...');

    if (stripe && clientSecret) {
      const checkout = await stripe.initEmbeddedCheckout({
        clientSecret,
      });

      if (checkout) {
        console.log('✅ [checkout] Embedded checkout initialized successfully');
        checkout.mount("#checkout");
        return;
      } else {
        console.log('❌ [checkout] Failed to initialize embedded checkout');
      }
    } else {
      console.log('❌ [checkout] Missing stripe or clientSecret');
      console.log('❌ [checkout] stripe:', !!stripe);
      console.log('❌ [checkout] clientSecret:', !!clientSecret);
    }

    // If everything above fails, then reroute to the error page
    console.log('❌ [checkout] Redirecting to error page');
    // goto("/pricing/error");
  });
</script>

<section class="min-h-screen bg-tile-300 py-12 sm:py-16">
  <div class="max-w-4xl mx-auto px-4 sm:px-8">
    <!-- Header -->
    <header class="text-center mb-12">
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 leading-tight mb-6">
        {isTrial ? 'Start Your Free Trial' : 'Complete Your Subscription'}
      </h1>
      <p class="text-lg sm:text-xl text-text-200 leading-relaxed max-w-2xl mx-auto">
        {#if isTrial}
          You won't be charged today. Your card is saved so your subscription continues automatically after 7 days — cancel any time before then.
        {:else}
          Secure checkout powered by Stripe. Your payment information is encrypted and secure.
        {/if}
      </p>
    </header>

    <!-- Checkout Container -->
    <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-xl p-6 sm:p-8">
      <div id="checkout" class="min-h-[500px]"></div>
    </div>

    <!-- Security Notice -->
    <div class="mt-8 text-center">
      <p class="text-sm text-text-200 flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </div>
  </div>
</section>