<script>
	import Checkmark from '$lib/components/Checkmark.svelte';
  import Button from '$lib/components/Button.svelte';
  import { PUBLIC_PRICE_ID } from '$env/static/public'
</script>

<div class="min-h-screen bg-tile-300">
    <header class="py-16 sm:py-24 text-center px-4">
         <div class="max-w-4xl mx-auto">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-300 mb-6 tracking-tight">Pricing</h1>
            <p class="text-xl text-text-200 max-w-2xl mx-auto leading-relaxed">
                Master multiple Arabic dialects with AI-powered learning. All for the price of one lesson on
                <a class="underline text-text-300 hover:text-tile-500 transition-colors" target="_blank" href="https://www.italki.com/en/teachers/arabic?from%5B0%5D=EG&speaks%5B0%5D=english">Italki</a> per month.
            </p>
        </div>
    </header>

    <section class="pb-20 px-4 sm:px-8">
        <div class="max-w-7xl mx-auto">
            <div class="flex flex-col lg:flex-row gap-8 justify-center items-start">
                <!-- Free Tier -->
                <div class="flex-1 w-full lg:max-w-lg bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
                    <div class="bg-tile-300 border-b border-tile-600 p-8 text-center">
                        <h2 class="text-2xl font-bold text-text-300 mb-2">Free Tier</h2>
                        <h3 class="text-4xl font-bold text-text-300">$0<span class="text-lg font-normal text-text-200">/month</span></h3>
                    </div>
                    <div class="p-8">
                        <ul class="flex flex-col gap-4 text-text-200">
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Access to one conversation with native audio</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>5 AI-generated practice sentences across multiple dialects <span class="text-text-200 text-sm italic">*requires account</span></span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Basic speaking practice with pronunciation feedback</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Access to one verb for verb conjugation practice</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Access to 156 vocabulary words for writing and handwriting practice</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Access to 156 vocabulary words and multiple choice quizzes</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Access to Arabic Alphabet learning with audio</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Save keywords and phrases to personal wordbank</span>
                            </li>
                        </ul>
                        <div class="mt-8">
                             <a href="/signup" class="block w-full text-center py-3 px-4 bg-tile-300 border-2 border-tile-600 rounded-md text-text-300 font-semibold hover:bg-tile-500 transition-colors">
                                Sign Up Free
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Pro Tier -->
                <div class="flex-1 w-full lg:max-w-lg bg-tile-400 border-2 border-tile-500 rounded-lg shadow-xl overflow-hidden relative transform lg:-translate-y-4">
                    <div class="absolute top-0 right-0 bg-tile-500 text-text-300 text-xs font-bold px-3 py-1 rounded-bl-lg border-b border-l border-tile-600">
                        POPULAR
                    </div>
                    <div class="bg-tile-500 border-b border-tile-600 p-8 text-center">
                        <h2 class="text-2xl font-bold text-text-300 mb-2">Monthly Subscription</h2>
                        <h3 class="text-4xl font-bold text-text-300">$10<span class="text-lg font-normal text-text-300">/month</span></h3>
                    </div>
                    <div class="p-8">
                         <ul class="flex flex-col gap-4 text-text-200">
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span><strong class="text-text-300">Structured lessons:</strong> Comprehensive learning paths organized by modules and topics for all dialects</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span><strong class="text-text-300">Multiple Arabic dialects:</strong> Egyptian, Levantine, Moroccan & Fusha</span>
                            </li>
                             <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span><strong class="text-text-300">AI Tutor:</strong> Practice speaking with an AI tutor with real-time feedback</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span><strong class="text-text-300">Spaced repetition system</strong> to remember words and sentences effectively</span>
                            </li>
                             <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span><strong class="text-text-300">Interactive videos</strong> with transcripts, translations, and transliterations</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Access to all stories and conversations with native audio</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span><strong class="text-text-300">Unlimited AI-generated practice sentences</strong> for all skill levels</span>
                            </li>
                             <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span><strong class="text-text-300">Advanced speaking practice</strong> with real-time pronunciation feedback</span>
                            </li>
                             <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Access to <strong class="text-text-300">over 20,000 vocabulary words</strong> with multiple choice quizzes</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Access to all verbs for comprehensive verb conjugation practice</span>
                            </li>
                             <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Writing and handwriting practice with custom virtual keyboard</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Complete Arabic Alphabet mastery with native pronunciation</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <div class="shrink-0 mt-1"><Checkmark /></div>
                                <span>Access to custom built Anki decks for all dialects</span>
                            </li>
                        </ul>
                         <form method="POST" action="/?/subscribe" class="mt-8">
                            <input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
                            <Button type="submit" className="!py-3 !text-lg w-full">
                            Subscribe Now
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>