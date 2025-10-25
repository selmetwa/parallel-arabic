<section class="flex flex-col items-center justify-center min-h-[50vh] px-4">
  <div class="text-center bg-tile-300 border border-tile-500 p-8 rounded max-w-md">
    <h1 class="text-2xl font-bold text-text-300 mb-4">Authentication Error</h1>
    <p class="text-text-200 mb-6">
      Sorry, there was an error with your authentication. This could be due to:
    </p>
    <ul class="text-text-200 text-left mb-6 space-y-2">
      <li>• An expired or invalid authentication link</li>
      <li>• A network connection issue</li>
      <li>• The authentication process was cancelled</li>
    </ul>
    <div class="space-y-3">
      <a 
        href="/login" 
        class="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
      >
        Try Logging In Again
      </a>
      <a 
        href="/" 
        class="block w-full text-text-200 underline hover:text-text-300"
      >
        Return to Home
      </a>
    </div>
  </div>
</section>
