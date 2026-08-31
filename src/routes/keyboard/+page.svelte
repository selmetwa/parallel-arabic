<script lang="ts">
	import { onMount } from 'svelte';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { hue, theme } from '$lib/store/store';
	import { type Keyboard } from '$lib/types';
	import { Howl } from 'howler';
	import { KEYBOARD_FAQS } from '$lib/constants/keyboard-faqs';

	let keyboardValue = $state('');
	let isPlayingAudio = $state(false);
	let currentSound: Howl | null = null;

	$effect(() => {
		hue.subscribe(() => {
			updateKeyboardStyle();
		});
	});

	$effect(() => {
		theme.subscribe(() => {
			updateKeyboardStyle();
		});
	});

	onMount(() => {
		updateKeyboardStyle();

		const keyboardEl = document.querySelector('arabic-keyboard') as Keyboard | null;

		const handleKeyboardUpdate = () => {
			const value = keyboardEl && keyboardEl.getTextAreaValue();
			if (typeof value === 'string') {
				keyboardValue = value;
			}
		};

		keyboardEl?.addEventListener('keydown', handleKeyboardUpdate);
		keyboardEl?.addEventListener('click', handleKeyboardUpdate);

		return () => {
			keyboardEl?.removeEventListener('keydown', handleKeyboardUpdate);
			keyboardEl?.removeEventListener('click', handleKeyboardUpdate);
		};
	});

	function clearText() {
		keyboardValue = '';
		if (typeof window !== 'undefined') {
			const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
			if (keyboard) {
				keyboard.resetValue();
			}
		}
	}

	function copyText() {
		if (navigator.clipboard && keyboardValue) {
			navigator.clipboard.writeText(keyboardValue);
		}
	}

	async function speakArabic() {
		if (!keyboardValue.trim()) return;

		isPlayingAudio = true;

		// Stop any currently playing sound
		if (currentSound) {
			currentSound.stop();
		}

		try {
			const res = await fetch('/api/text-to-speech', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ text: keyboardValue, dialect: 'egyptian-arabic' })
			});

			if (!res.ok) {
				throw new Error(`TTS request failed: ${res.statusText}`);
			}

			// Get playback rate from response headers
			const playbackRate = parseFloat(res.headers.get('X-Playback-Rate') || '1.0');

			// Convert response to a blob
			const audioBlob = await res.blob();

			// Create a URL for the audio blob
			const audioUrl = URL.createObjectURL(audioBlob);

			// Create a Howl instance to play the audio
			currentSound = new Howl({
				src: [audioUrl],
				autoplay: true,
				rate: playbackRate,
				format: ['mp3', 'wav'],
				onend: () => {
					isPlayingAudio = false;
					URL.revokeObjectURL(audioUrl);
				},
				onloaderror: (id, error) => {
					console.error('Audio load error:', error);
					isPlayingAudio = false;
				},
				onplayerror: (id, error) => {
					console.error('Audio play error:', error);
					isPlayingAudio = false;
				}
			});

			// Play the audio
			currentSound.play();
		} catch (error) {
			console.error('Audio playback failed:', error);
			isPlayingAudio = false;
		}
	}
</script>

<section class="min-h-screen bg-tile-200">
	<!-- Hero Section -->
	<header class="border-b border-tile-600">
		<div class="mx-auto max-w-7xl px-3 py-12 sm:px-8 sm:py-16">
			<div class="max-w-3xl text-left">
				<div
					class="mb-6 inline-flex items-center gap-2 rounded-full border border-tile-600 bg-tile-400 px-4 py-2 text-sm text-text-200"
				>
					<span>⌨️</span>
					<span>Virtual Keyboard</span>
				</div>
				<h1 class="mb-6 text-3xl font-bold leading-tight text-text-300 sm:text-4xl lg:text-5xl">
					Arabic Virtual Keyboard
				</h1>
				<p class="text-lg leading-relaxed text-text-200 sm:text-xl">
					Type in Arabic without installing any software. This virtual keyboard helps English
					speakers write in Arabic with support for all letters, numbers, diacritical marks, special
					characters, and text-to-speech in Egyptian Arabic.
				</p>
			</div>
		</div>
	</header>

	<!-- Keyboard Section -->
	<section class="py-12 sm:py-16">
		<div class="mx-auto max-w-7xl px-3 sm:px-8">
			<!-- Output Display -->
			<div class="mb-6">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-xl font-bold text-text-300">Your Arabic Text</h2>
					<div class="flex gap-2">
						<button
							onclick={speakArabic}
							disabled={!keyboardValue || isPlayingAudio}
							class="flex items-center gap-2 rounded-lg border-2 border-green-700 bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
							title="Listen in Egyptian Arabic"
						>
							{#if isPlayingAudio}
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							{:else}
								<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
							Listen
						</button>
						<button
							onclick={copyText}
							disabled={!keyboardValue}
							class="flex items-center gap-2 rounded-lg border-2 border-tile-600 bg-tile-500 px-4 py-2 text-sm font-semibold text-text-300 transition-colors hover:bg-tile-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
							Copy
						</button>
						<button
							onclick={clearText}
							disabled={!keyboardValue}
							class="rounded-lg border-2 border-tile-600 bg-tile-500 px-4 py-2 text-sm font-semibold text-text-300 transition-colors hover:bg-tile-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Clear
						</button>
					</div>
				</div>
				<div
					class="font-arabic min-h-32 rounded-xl border-2 border-tile-600 bg-tile-400 p-6 text-3xl text-text-300"
					dir="rtl"
				>
					{keyboardValue || 'اكتب هنا...'}
				</div>
			</div>

			<!-- Virtual Keyboard -->
			<div class="rounded-xl border-2 border-tile-600 bg-tile-400 p-4 shadow-lg sm:p-6">
				<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
			</div>
		</div>
	</section>

	<!-- How It Works Section -->
	<section class="border-y border-tile-600 bg-tile-200 py-12 sm:py-16">
		<div class="mx-auto max-w-7xl px-3 sm:px-8">
			<h2 class="mb-8 text-left text-2xl font-bold text-text-300 sm:text-3xl">How It Works</h2>

			<div class="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 text-left shadow-lg">
					<div class="mb-4 text-4xl">📝</div>
					<h3 class="mb-3 text-xl font-bold text-text-300">Type Naturally</h3>
					<p class="leading-relaxed text-text-200">
						Most Arabic letters correspond to English letters. Type 'a' for ا, 'b' for ب, 't' for ت,
						and so on.
					</p>
				</div>

				<div class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 text-left shadow-lg">
					<div class="mb-4 text-4xl">🔠</div>
					<h3 class="mb-3 text-xl font-bold text-text-300">Special Characters</h3>
					<p class="leading-relaxed text-text-200">
						Use capital letters for emphatic sounds (S for ص, D for ض) and apostrophes for special
						letters (s' for ش).
					</p>
				</div>

				<div class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 text-left shadow-lg">
					<div class="mb-4 text-4xl">✨</div>
					<h3 class="mb-3 text-xl font-bold text-text-300">Diacritics & More</h3>
					<p class="leading-relaxed text-text-200">
						Add diacritical marks using combinations like 'a=' for fatha (َ), 'u=' for damma (ُ),
						and 'i=' for kasra (ِ).
					</p>
				</div>

				<div class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 text-left shadow-lg">
					<div class="mb-4 text-4xl">🔊</div>
					<h3 class="mb-3 text-xl font-bold text-text-300">Listen & Learn</h3>
					<p class="leading-relaxed text-text-200">
						Click the Listen button to hear your text pronounced in Egyptian Arabic with
						native-quality text-to-speech.
					</p>
				</div>
			</div>

			<!-- Detailed Documentation -->
			<div class="rounded-xl border-2 border-tile-600 bg-tile-400 p-6 shadow-lg sm:p-8">
				<h3 class="mb-6 text-left text-2xl font-bold text-text-300">Keyboard Reference Guide</h3>

				<div class="mb-6 rounded-lg border border-tile-500 bg-tile-300 p-4 text-left">
					<p class="leading-relaxed text-text-300">
						This keyboard is a tool that helps English speakers write in Arabic without having a
						dedicated Arabic keyboard installed on their computer. The keyboard is fully featured
						and contains support for all letters, numbers, special characters, diacritical marks,
						and text-to-speech in Egyptian Arabic.
					</p>
					<p class="mt-2 text-text-200">
						Type your Arabic text using the virtual keyboard, then click the <strong
							class="text-green-600">Listen</strong
						>
						button to hear it pronounced in Egyptian Arabic. If you are not comfortable with the
						Arabic alphabet yet, please head over to
						<a href="/alphabet" class="text-text-300 underline hover:text-text-100"
							>the alphabet learning section</a
						>.
					</p>
				</div>

				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Letters Table -->
					<div class="rounded-lg border border-tile-500 bg-tile-300 p-4">
						<h4 class="mb-3 text-left text-lg font-bold text-text-300">Letters</h4>
						<details class="mb-3">
							<summary class="cursor-pointer font-medium text-text-300">More Info</summary>
							<div class="mt-2 space-y-2 text-sm text-text-200">
								<p>
									Most letters in the Arabic alphabet have a corresponding letter in English. For
									example, <strong class="text-text-300">ا</strong> roughly corresponds to the
									letter <strong class="text-text-300">a</strong> in English.
								</p>
								<p>
									Arabic has emphatic letters. <strong class="text-text-300">ص</strong> and
									<strong class="text-text-300">ض</strong>
									are emphatic versions of <strong class="text-text-300">س</strong> and
									<strong class="text-text-300">د</strong>
									respectively. The emphatic letters are represented by capital letters in English,
									<strong class="text-text-300">S</strong>
									and <strong class="text-text-300">D</strong> respectively.
								</p>
								<p>
									There are some letters that have no corresponding letter in English such as <strong
										class="text-text-300">ش</strong
									>
									and <strong class="text-text-300">ث</strong>. These letters can be generated by
									typing the closest corresponding English letter followed by an apostrophe
									<strong class="text-text-300">'</strong>. For example
									<strong class="text-text-300">s'</strong>
									and <strong class="text-text-300">t'</strong> respectively.
								</p>
							</div>
						</details>
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead class="bg-tile-500">
									<tr>
										<th class="border border-tile-600 px-3 py-2 text-left text-text-300">English</th
										>
										<th class="border border-tile-600 px-3 py-2 text-left text-text-300">Arabic</th>
									</tr>
								</thead>
								<tbody class="text-text-200">
									<tr
										><td class="border border-tile-600 px-3 py-2">a</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ا</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">b</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ب</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">t</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ت</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">t + '</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ث</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">j</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ج</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">H</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ح</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">x</td><td
											class="border border-tile-600 px-3 py-2 text-xl">خ</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">d</td><td
											class="border border-tile-600 px-3 py-2 text-xl">د</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">d + '</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ذ</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">r</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ر</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">z</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ز</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">s</td><td
											class="border border-tile-600 px-3 py-2 text-xl">س</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">s + '</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ش</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">S</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ص</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">D</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ض</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">T</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ط</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">Z</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ظ</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">g</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ع</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">g + '</td><td
											class="border border-tile-600 px-3 py-2 text-xl">غ</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">f</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ف</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">q</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ق</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">k</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ك</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">l</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ل</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">m</td><td
											class="border border-tile-600 px-3 py-2 text-xl">م</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">n</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ن</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">h</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ه</td
										></tr
									>
									<tr
										><td class="border border-tile-600 px-3 py-2">w</td><td
											class="border border-tile-600 px-3 py-2 text-xl">و</td
										></tr
									>
									<tr class="bg-tile-400"
										><td class="border border-tile-600 px-3 py-2">y</td><td
											class="border border-tile-600 px-3 py-2 text-xl">ي</td
										></tr
									>
								</tbody>
							</table>
						</div>
					</div>

					<!-- Special Characters, Diacritics, and Numbers -->
					<div class="space-y-6">
						<!-- Special Characters -->
						<div class="rounded-lg border border-tile-500 bg-tile-300 p-4">
							<h4 class="mb-3 text-left text-lg font-bold text-text-300">Special Characters</h4>
							<details class="mb-3">
								<summary class="cursor-pointer font-medium text-text-300">More Info</summary>
								<div class="mt-2 space-y-2 text-sm text-text-200">
									<p>
										<strong class="text-text-300">Hamza (ء‎)</strong> is a letter in the Arabic alphabet
										which represents the glottal stop.
									</p>
									<p>
										To achieve this character, type <strong class="text-text-300">-</strong> in
										English, and to achieve the
										<strong class="text-text-300">hamza below alif (إ)</strong>
										type <strong class="text-text-300">a--</strong> in English.
									</p>
								</div>
							</details>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead class="bg-tile-500">
										<tr>
											<th class="border border-tile-600 px-3 py-2 text-left text-text-300"
												>English</th
											>
											<th class="border border-tile-600 px-3 py-2 text-left text-text-300"
												>Arabic</th
											>
										</tr>
									</thead>
									<tbody class="text-text-200">
										<tr
											><td class="border border-tile-600 px-3 py-2">-</td><td
												class="border border-tile-600 px-3 py-2 text-xl">ء</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">a--</td><td
												class="border border-tile-600 px-3 py-2 text-xl">إ</td
											></tr
										>
										<tr
											><td class="border border-tile-600 px-3 py-2">A--</td><td
												class="border border-tile-600 px-3 py-2 text-xl">أ</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">A</td><td
												class="border border-tile-600 px-3 py-2 text-xl">آ</td
											></tr
										>
										<tr
											><td class="border border-tile-600 px-3 py-2">u--</td><td
												class="border border-tile-600 px-3 py-2 text-xl">ؤ</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">y--</td><td
												class="border border-tile-600 px-3 py-2 text-xl">ئ</td
											></tr
										>
										<tr
											><td class="border border-tile-600 px-3 py-2">Y</td><td
												class="border border-tile-600 px-3 py-2 text-xl">ى</td
											></tr
										>
									</tbody>
								</table>
							</div>
						</div>

						<!-- Diacritics -->
						<div class="rounded-lg border border-tile-500 bg-tile-300 p-4">
							<h4 class="mb-3 text-left text-lg font-bold text-text-300">Diacritics</h4>
							<details class="mb-3">
								<summary class="cursor-pointer font-medium text-text-300">More Info</summary>
								<div class="mt-2 space-y-2 text-sm text-text-200">
									<p>
										In Arabic, diacritic marks are symbols used to indicate the pronunciation of
										letters and to clarify the correct reading of words. These marks are called
										"harakat" (حركات) or "tashkil" (تشكيل).
									</p>
									<ul class="list-inside list-disc space-y-1">
										<li>بَ - Ba with Fatha - Pronounced "ba" as in "bat."</li>
										<li>بُ - Ba with Damma - Pronounced "bu" as in "but."</li>
										<li>بِ - Ba with Kasra - Pronounced "bi" as in "bit."</li>
										<li>بّ - Ba with Shadda - Indicates a doubled or emphasized "b" sound.</li>
										<li>
											بْ - Ba with Sukun - Indicates that the letter is a consonant with no
											associated vowel sound.
										</li>
									</ul>
								</div>
							</details>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead class="bg-tile-500">
										<tr>
											<th class="border border-tile-600 px-3 py-2 text-left text-text-300"
												>English</th
											>
											<th class="border border-tile-600 px-3 py-2 text-left text-text-300"
												>Arabic</th
											>
										</tr>
									</thead>
									<tbody class="text-text-200">
										<tr
											><td class="border border-tile-600 px-3 py-2">a + =</td><td
												class="border border-tile-600 px-3 py-2 text-3xl">َ</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">an + =</td><td
												class="border border-tile-600 px-3 py-2 text-3xl">ً</td
											></tr
										>
										<tr
											><td class="border border-tile-600 px-3 py-2">u + =</td><td
												class="border border-tile-600 px-3 py-2 text-3xl">ُ</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">un + =</td><td
												class="border border-tile-600 px-3 py-2 text-3xl">ٌ</td
											></tr
										>
										<tr
											><td class="border border-tile-600 px-3 py-2">i + =</td><td
												class="border border-tile-600 px-3 py-2 text-3xl">ِ</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">in + =</td><td
												class="border border-tile-600 px-3 py-2 text-3xl">ٍ</td
											></tr
										>
										<tr
											><td class="border border-tile-600 px-3 py-2">s + =</td><td
												class="border border-tile-600 px-3 py-2 text-3xl">ّ</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">h + =</td><td
												class="border border-tile-600 px-3 py-2 text-3xl">ْ</td
											></tr
										>
									</tbody>
								</table>
							</div>
						</div>

						<!-- Numbers -->
						<div class="rounded-lg border border-tile-500 bg-tile-300 p-4">
							<h4 class="mb-3 text-left text-lg font-bold text-text-300">Numbers</h4>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead class="bg-tile-500">
										<tr>
											<th class="border border-tile-600 px-3 py-2 text-left text-text-300"
												>English</th
											>
											<th class="border border-tile-600 px-3 py-2 text-left text-text-300"
												>Arabic</th
											>
										</tr>
									</thead>
									<tbody class="text-text-200">
										<tr
											><td class="border border-tile-600 px-3 py-2">0</td><td
												class="border border-tile-600 px-3 py-2 text-xl">٠</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">1</td><td
												class="border border-tile-600 px-3 py-2 text-xl">١</td
											></tr
										>
										<tr
											><td class="border border-tile-600 px-3 py-2">2</td><td
												class="border border-tile-600 px-3 py-2 text-xl">٢</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">3</td><td
												class="border border-tile-600 px-3 py-2 text-xl">٣</td
											></tr
										>
										<tr
											><td class="border border-tile-600 px-3 py-2">4</td><td
												class="border border-tile-600 px-3 py-2 text-xl">٤</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">5</td><td
												class="border border-tile-600 px-3 py-2 text-xl">٥</td
											></tr
										>
										<tr
											><td class="border border-tile-600 px-3 py-2">6</td><td
												class="border border-tile-600 px-3 py-2 text-xl">٦</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">7</td><td
												class="border border-tile-600 px-3 py-2 text-xl">٧</td
											></tr
										>
										<tr
											><td class="border border-tile-600 px-3 py-2">8</td><td
												class="border border-tile-600 px-3 py-2 text-xl">٨</td
											></tr
										>
										<tr class="bg-tile-400"
											><td class="border border-tile-600 px-3 py-2">9</td><td
												class="border border-tile-600 px-3 py-2 text-xl">٩</td
											></tr
										>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
	<!-- FAQ: written against the questions people actually search for -->
	<section class="py-12 sm:py-16">
		<div class="mx-auto max-w-4xl px-3 sm:px-8">
			<h2 class="mb-8 text-left text-2xl font-bold text-text-300 sm:text-3xl">Common questions</h2>
			<div class="space-y-4">
				{#each KEYBOARD_FAQS as faq (faq.question)}
					<div class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 shadow-lg">
						<h3 class="mb-2 text-lg font-bold text-text-300">{faq.question}</h3>
						<p class="leading-relaxed text-text-200">{faq.answer}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>
</section>
