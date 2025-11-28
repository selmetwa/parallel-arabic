<script lang="ts">
	let { data } = $props();

	const timestamp = data.user?.subscription_end_date ?? 0;
	const date = new Date(timestamp * 1000);
</script>

<section class="min-h-screen bg-tile-300 py-12 sm:py-16">
  <div class="max-w-4xl mx-auto px-4 sm:px-8">
    {#if !data?.user?.is_subscriber}
      <!-- Cancellation Confirmation -->
      <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-xl p-8 sm:p-12 text-center">
        <div class="mb-6">
          <div class="text-6xl mb-4">✅</div>
          <h1 class="text-3xl sm:text-4xl font-bold text-text-300 mb-4">
            Subscription Cancelled Successfully
          </h1>
          <p class="text-lg sm:text-xl text-text-200 leading-relaxed mb-6">
            Your subscription has been cancelled. You'll continue to have access to all premium features until your current billing period ends.
          </p>
        </div>

        <!-- Actions -->
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/pricing"
            class="inline-block px-6 py-3 bg-tile-500 text-text-300 font-semibold rounded-lg hover:bg-tile-600 transition-colors duration-300 shadow-md border-2 border-tile-600"
          >
            View Pricing
          </a>
          <a
            href="/profile"
            class="inline-block px-6 py-3 bg-tile-600 text-text-300 font-semibold rounded-lg hover:bg-tile-700 transition-colors duration-300 shadow-md"
          >
            Manage Account
          </a>
        </div>
      </div>
    {:else}
      <!-- Still Subscribed -->
      <div class="bg-green-50 border-2 border-green-300 rounded-lg shadow-xl p-8 sm:p-12 text-center">
        <div class="mb-6">
          <div class="text-6xl mb-4">✨</div>
          <h1 class="text-3xl sm:text-4xl font-bold text-green-800 mb-4">
            You Are Still Subscribed
          </h1>
          <p class="text-lg sm:text-xl text-green-700 leading-relaxed">
            Your subscription is active and you have full access to all premium features.
          </p>
        </div>

        <div class="mt-8">
          <a
            href="/profile"
            class="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-md"
          >
            Manage Subscription
          </a>
        </div>
      </div>
    {/if}
  </div>
</section>
