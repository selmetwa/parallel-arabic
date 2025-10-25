<script lang="ts">
  //   Modules and libraries
  import { onMount } from "svelte";
  import { loadStripe } from "@stripe/stripe-js";

  // Types and variables
  import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from "$env/static/public";
  import { goto } from "$app/navigation";

  let { data } = $props();

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
<div class="flex justify-center min-h-screen py-4">
  <div class="border border-tile-500 w-2/3 bg-tile-300">
    <div id="checkout"></div>
  </div>
</div>