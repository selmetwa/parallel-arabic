<script lang="ts">
  //   Modules and libraries
  import { onMount } from "svelte";
  import { loadStripe } from "@stripe/stripe-js";

  // Types and variables
  import { PUBLIC_TEST_STRIPE_PUBLISHABLE_KEY } from "$env/static/public";
  import { goto } from "$app/navigation";

  export let data;

  /**
   * Checkout onMount
   *
   * We receive the client secret from load and then attempt to load the
   * embedded checkout form.
   *
   */
  onMount(async () => {
    const stripe = await loadStripe(PUBLIC_TEST_STRIPE_PUBLISHABLE_KEY);
    const clientSecret = data.clientSecret;

    if (stripe && clientSecret) {
      const checkout = await stripe.initEmbeddedCheckout({
        clientSecret,
      });

      if (checkout) {
        checkout.mount("#checkout");
        return;
      }
    }

    // If everything above fails, then reroute to the error page
    goto("/pricing/error");
  });
</script>
<div class="flex justify-center min-h-screen py-4">
  <div class="border border-tile-500 w-2/3 bg-tile-300">
    <div id="checkout"></div>
  </div>
</div>