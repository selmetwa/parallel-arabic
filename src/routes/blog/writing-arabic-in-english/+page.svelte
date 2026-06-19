<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { blogPosts } from '$lib/constants/blog-posts';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { hue, theme } from '$lib/store/store';

	const post = blogPosts.find((p) => p.slug === 'writing-arabic-in-english')!;

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// On Safari and most mobile browsers, isolated Arabic letter forms don't render
	// connected. We swap in a version padded with Zero-Width Joiners so the example
	// still shows how the letters join.
	let useCursiveFallback = $state(false);

	function playLetter(letter: string) {
		const audio = new Audio(`/letters/audios/${letter}.mp3`);
		audio.play();
	}

	const installScript = `<script type="module" src="https://cdn.jsdelivr.net/npm/arabic-virtual-keyboard/+esm"><\/script>
<arabic-keyboard><\/arabic-keyboard>`;
	const installNpm = `npm i arabic-virtual-keyboard`;

	$effect(() => {
		const unsub = hue.subscribe(() => updateKeyboardStyle());
		return unsub;
	});

	$effect(() => {
		const unsub = theme.subscribe(() => updateKeyboardStyle());
		return unsub;
	});

	onMount(() => {
		updateKeyboardStyle();

		const ua = navigator.userAgent;
		const isSafari = /Safari/.test(ua) && !/Chrome|Chromium/.test(ua);
		const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
		if (isSafari || isMobile) {
			useCursiveFallback = true;
		}

		// The keyboard web component loads from a CDN, so re-apply styles once it's mounted.
		const timer = setTimeout(() => updateKeyboardStyle(), 100);
		return () => clearTimeout(timer);
	});
</script>

{#snippet kbd(text: string)}<code class="rounded bg-tile-400 px-1.5 py-0.5 font-mono text-sm text-text-300">{text}</code>{/snippet}

{#snippet keyboard()}
	<div class="my-6 rounded-xl border-2 border-tile-600 bg-tile-400 p-3 shadow-sm sm:p-5">
		<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
	</div>
{/snippet}

{#snippet mapBtn(value: string, eng: string, ar: string, name: string)}
	<button
		onclick={() => playLetter(value)}
		class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-tile-500 bg-tile-300 px-3 py-3 text-text-200 transition-colors hover:bg-tile-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
	>
		{@render kbd(eng)} = <span class="ar">{ar}</span> ({name})
	</button>
{/snippet}

{#snippet audioBtn(value: string, ar: string, name: string)}
	<button
		onclick={() => playLetter(value)}
		class="flex w-full items-center justify-center rounded-lg border border-tile-500 bg-tile-300 px-3 py-3 text-text-200 transition-colors hover:bg-tile-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
	>
		<span class="ar">{ar}</span> <span class="ml-1 text-sm text-text-200">({name})</span>
	</button>
{/snippet}

<section class="min-h-screen bg-tile-200">
	<article class="mx-auto max-w-5xl px-4 py-12 sm:px-8 sm:py-16">
		<a
			href={resolve('/blog')}
			class="mb-8 inline-flex items-center gap-2 text-sm text-text-200 transition-colors hover:text-text-300"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
				<path
					fill-rule="evenodd"
					d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
					clip-rule="evenodd"
				/>
			</svg>
			<span>All posts</span>
		</a>

		<header class="mb-8">
			<h1 class="mb-3 text-3xl font-bold leading-tight text-text-300 sm:text-4xl">{post.title}</h1>
			<p class="mb-4 text-lg text-text-200">My journey in creating a phonetic Arabic keyboard.</p>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-200">
				<span>{formatDate(post.date)}</span>
				<span aria-hidden="true">·</span>
				<span>{post.readingTime}</span>
			</div>
		</header>

		<div class="space-y-4 text-base leading-relaxed text-text-200">
			<p>
				A phonetic keyboard is a type of keyboard layout designed to make typing in a particular
				language easier by mapping characters or letters to sounds rather than their traditional
				positions on the keyboard.
			</p>
			<p>
				This makes it easier for beginners or casual users to engage with the language without the
				learning curve of mastering an entirely different keyboard layout.
			</p>
			<p>However there are a few problems we have to overcome when creating a phonetic Arabic keyboard.</p>

			<ul class="list-disc space-y-1 pl-5 [&_a]:text-text-300 [&_a]:underline [&_a]:underline-offset-2">
				<li><a href="#rtl">Arabic is written from right to left</a></li>
				<li><a href="#cursive">Arabic is a cursive script</a></li>
				<li><a href="#mapping">Connecting English letters to sounds in Arabic</a></li>
				<li><a href="#other">Not all Arabic letters have an equivalent in English</a></li>
				<li><a href="#hamza">Arabic has a special character called Hamza</a></li>
				<li><a href="#diacritics">Arabic has diacritics to provide pronunciation hints</a></li>
				<li><a href="#implementation">Technical details</a></li>
			</ul>

			<!-- RTL -->
			<section id="rtl" class="scroll-mt-8">
				<h2 class="mb-3 mt-10 text-xl font-bold text-text-300">Arabic is written from right to left</h2>
				<p>This actually wasn't a problem as we could just use our old friend.</p>
				<pre class="my-4 overflow-x-auto rounded-lg bg-tile-400 p-4 font-mono text-sm text-text-300"><code>direction: rtl;</code></pre>
			</section>

			<!-- CURSIVE -->
			<section id="cursive" class="scroll-mt-8">
				<h2 class="mb-3 mt-10 text-xl font-bold text-text-300">Arabic is a cursive script</h2>
				<p>
					This means letters are connected to each other and look different depending on their
					position in a word.
				</p>
				<p>Let's take the letter <span class="ar">ب</span> (baa) for example.</p>

				<div class="my-4 space-y-2 rounded-lg border border-tile-500 bg-tile-300 p-4">
					{#if useCursiveFallback}
						<p>
							- Beginning of the word:
							<span class="ar"><span class="hl">&#x200D;ب&#x200D;</span>&#x200D;يت&#x200D;</span>
							(house - byt)
						</p>
						<p dir="rtl">
							- Middle of the word:
							<span class="ar">&#x200D;ح&#x200D;<span class="hl">&#x200D;ب&#x200D;</span>&#x200D;ي&#x200D;<span class="hl">&#x200D;ب&#x200D;</span>&#x200D;ي&#x200D;</span>
							(my love - habibi)
						</p>
						<p>
							- End of the word:
							<span class="ar">&#x200D;كت&#x200D;<span class="hl">&#x200D;ب&#x200D;</span></span>
							(write - ktb)
						</p>
					{:else}
						<p>
							- Beginning of the word:
							<span class="ar"><span class="hl">ب</span>يت</span> (house - byt)
						</p>
						<p dir="rtl">
							- Middle of the word:
							<span class="ar">ح<span class="hl">ب</span>ي<span class="hl">ب</span>ي</span>
							(my love - habibi)
						</p>
						<p>
							- End of the word:
							<span class="ar">كت<span class="hl">ب</span></span> (write - ktb)
						</p>
					{/if}
					<p>
						- Isolated: <span class="ar">كِتَا<span class="hl">ب</span></span> (book - ktab)
					</p>
				</div>

				<p>
					Luckily the web browser (mostly) handles this for us, so we don't have to worry about it.
					Thank you UTF-8.
				</p>
				<p>
					Except on Safari where we have to use a Zero-Width Joiner (ZWJ) {@render kbd('‍')}
					<a
						href="http://www.w3c.org.ma/Tests/joiningColoredLetters.html"
						target="_blank"
						rel="noreferrer"
						class="text-text-300 underline underline-offset-2">More on that here</a
					>
				</p>
				<p>
					As an aside look at how the word for (write) <span class="ar">كت<span class="hl">ب</span></span>
					closely resembles the word for (book) <span class="ar">كِتَا<span class="hl">ب</span></span>.
					This is because Arabic is a root based language, where the meaning is derived from a root of
					3 or 4 letters.
					<a
						href="https://arabicforbeginners.com/topic/arabic-root-system-overview/"
						target="_blank"
						rel="noreferrer"
						class="text-text-300 underline underline-offset-2">More on that here</a
					>
				</p>
				<p>And don't mind the marks around the word (book), we will get to that in a bit.</p>
			</section>

			<!-- MAPPING -->
			<section id="mapping" class="scroll-mt-8">
				<h2 class="mb-3 mt-10 text-xl font-bold text-text-300">Mapping English to Arabic</h2>
				<p>
					If we want a phonetic keyboard we need to map Arabic letters to the English keys in a way
					that makes sense for someone that is used to typing in English.
				</p>
				<p>
					So if someone types the letter {@render kbd('b')}, we want to spit out the closest
					corresponding Arabic letter. In this case <span class="ar">ب</span> (baa).
				</p>
				<p>
					Lucky for us, 17 of the 28 Arabic letters have a rough equivalent in English. And multiple
					English letters actually map to the same sound in Arabic. (Click for audio.)
				</p>

				<ul class="my-5 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
					<li>{@render mapBtn('alif', 'a', 'ا', 'alif')}</li>
					<li>{@render mapBtn('ba', 'b', 'ب', 'baa')}</li>
					<li>{@render mapBtn('ta', 't', 'ت', 'ta')}</li>
					<li>{@render mapBtn('jeem', 'j', 'ج', 'jeem')}</li>
					<li>{@render mapBtn('dal', 'd', 'د', 'dal')}</li>
					<li>{@render mapBtn('ra', 'r', 'ر', 'ra')}</li>
					<li>{@render mapBtn('zay', 'z', 'ز', 'zay')}</li>
					<li>{@render mapBtn('seen', 's,c', 'س', 'seen')}</li>
					<li>{@render mapBtn('fa', 'f', 'ف', 'fa')}</li>
					<li>{@render mapBtn('qaf', 'q', 'ق', 'qaf')}</li>
					<li>{@render mapBtn('kaf', 'k', 'ك', 'kaf')}</li>
					<li>{@render mapBtn('lam', 'l', 'ل', 'lam')}</li>
					<li>{@render mapBtn('meem', 'm', 'م', 'meem')}</li>
					<li>{@render mapBtn('noon', 'n', 'ن', 'noon')}</li>
					<li>{@render mapBtn('ha', 'h', 'ه', 'ha')}</li>
					<li>{@render mapBtn('waw', 'w,u,o', 'و', 'waw')}</li>
					<li>{@render mapBtn('yaa', 'y,e,i', 'ي', 'ya')}</li>
				</ul>

				<p>
					This case is pretty simple to handle. We can just map the English letter to the Arabic
					letter, and then write a simple lookup function.
				</p>
			</section>

			<!-- OTHER -->
			<section id="other" class="scroll-mt-8">
				<h2 class="mb-3 mt-10 text-xl font-bold text-text-300">What about the other 11 letters?</h2>
				<p>
					I decided to break up these remaining 11 letters into two categories. The first category are
					the letters that bear some similarity to the simple letters we have already looked at.
				</p>
				<p>
					For the sake of this post let's call these <strong class="text-text-300">"Emphatic"</strong>
					letters, of which there are five.
				</p>
				<p>
					The second category are the letters that don't really bear any resemblance to English
					letters.
				</p>

				<h3 class="mb-3 mt-8 text-lg font-bold text-text-300">Emphatic Letters</h3>
				<p>
					These letters are pronounced from the back of the throat, and don't really have a direct
					equivalent in English, but they do bear some resemblance to other Arabic letters in
					<em>my opinion.</em>
				</p>

				<ul class="my-5 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
					<li>{@render audioBtn('haa', 'ح', 'haa')}</li>
					<li>{@render audioBtn('saad', 'ص', 'saad')}</li>
					<li>{@render audioBtn('dhaad', 'ض', 'daad')}</li>
					<li>{@render audioBtn('taa', 'ط', 'taa')}</li>
					<li>{@render audioBtn('dhaa', 'ظ', 'dhaa')}</li>
				</ul>

				<p>
					If you are being very generous I think you can recognize some similarities between these
					letters and some of the simpler letters we have already looked at.
				</p>
				<p>
					To me <span class="ar">ح ص ض ط</span> and <span class="ar">ظ</span> are similar-ish to
					<span class="ar">ه س د ت</span> and <span class="ar">ز</span> respectively. Just with a
					little more umph.
				</p>
				<p>What do you think? (Click on the letters for audio.)</p>

				<ul class="my-5 list-none space-y-3 p-0">
					<li class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-tile-500 p-4 sm:flex-row">
						{@render audioBtn('haa', 'ح', 'haa')}
						<p class="shrink-0">is a stronger version of</p>
						{@render audioBtn('ha', 'ه', 'ha - h')}
					</li>
					<li class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-tile-500 p-4 sm:flex-row">
						{@render audioBtn('saad', 'ص', 'saad')}
						<p class="shrink-0">is a stronger version of</p>
						{@render audioBtn('seen', 'س', 'seen - s')}
					</li>
					<li class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-tile-500 p-4 sm:flex-row">
						{@render audioBtn('dhaad', 'ض', 'daad')}
						<p class="shrink-0">is a stronger version of</p>
						{@render audioBtn('dal', 'د', 'dal - d')}
					</li>
					<li class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-tile-500 p-4 sm:flex-row">
						{@render audioBtn('taa', 'ط', 'taa')}
						<p class="shrink-0">is a stronger version of</p>
						{@render audioBtn('ta', 'ت', 'ta - t')}
					</li>
					<li>
						<p class="text-center"><em>This is probably the most questionable one of all 👇</em></p>
					</li>
					<li class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-tile-500 p-4 sm:flex-row">
						{@render audioBtn('dhaa', 'ظ', 'dhaa')}
						<p class="shrink-0">is a stronger version of</p>
						{@render audioBtn('zay', 'ز', 'zay - z')}
					</li>
				</ul>

				<p>
					Anyway. You can probably see where I am going with this. We can map these emphatic letters
					to the uppercase versions of the letters they resemble.
				</p>
				<p>
					So <span class="ar">ح ص ض ط</span> and <span class="ar">ظ</span> would map to H, S, D, T,
					and Z respectively.
				</p>
				<p>
					In our code we keep each row of the keyboard as two arrays: one for the base case, and one
					for when the user is holding shift, or has pressed caps lock. And then we swap between the
					two arrays depending on the state of the keyboard.
				</p>
				<p>And then we can reuse our lookup function from before.</p>

				<h3 class="mb-3 mt-8 text-lg font-bold text-text-300">Unique letters</h3>
				<p>
					I don't have a good name for these letters... let's call them "Unique" letters, of which
					there are six. These letters don't really have an equivalent in English, and don't really
					bear any resemblance to the letters we have already looked at.
				</p>

				<ul class="my-5 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
					<li>{@render audioBtn('sheen', 'ش', 'sheen')}</li>
					<li>{@render audioBtn('dhal', 'ذ', 'dha')}</li>
					<li>{@render audioBtn('tha', 'ث', 'tha')}</li>
					<li>{@render audioBtn('khaa', 'خ', 'khaa')}</li>
					<li>{@render audioBtn('ayn', 'ع', 'ayn')}</li>
					<li>{@render audioBtn('ghayn', 'غ', 'ghayn')}</li>
				</ul>

				<p>So yeah, these letters are a bit of a problem. So we have to get a bit creative.</p>
				<p>
					However if you notice, the shape of these letters look similar to ones we have already seen.
					Just with some dots sprinkled on top.
				</p>

				<ul class="my-5 list-none space-y-3 p-0">
					<li class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-tile-500 p-4 sm:flex-row">
						{@render audioBtn('seen', 'س', 'seen - s')}
						<p class="shrink-0">+ some dots gives us</p>
						{@render audioBtn('sheen', 'ش', 'sheen')}
					</li>
					<li class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-tile-500 p-4 sm:flex-row">
						{@render audioBtn('dal', 'د', 'dal - d')}
						<p class="shrink-0">+ one dot gives us</p>
						{@render audioBtn('dhal', 'ذ', 'dha')}
					</li>
					<li class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-tile-500 p-4 sm:flex-row">
						{@render audioBtn('ta', 'ت', 'ta - t')}
						<p class="shrink-0">+ one dot gives us</p>
						{@render audioBtn('tha', 'ث', 'tha')}
					</li>
					<li class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-tile-500 p-4 sm:flex-row">
						{@render audioBtn('haa', 'ح', 'haa - H')}
						<p class="shrink-0">+ one dot gives us</p>
						{@render audioBtn('khaa', 'خ', 'khaa')}
					</li>
					<li>
						<p class="text-center">
							<em>I ended up just using g for ayn. I don't really have a good reason but I needed a key.</em>
						</p>
					</li>
					<li class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-tile-500 p-4 sm:flex-row">
						{@render audioBtn('ayn', 'ع', 'ayn - g')}
						<p class="shrink-0">+ one dot gives us</p>
						{@render audioBtn('ghayn', 'غ', 'ghayn')}
					</li>
				</ul>

				<p>So how can we sprinkle dots? Because we are quickly running out of keys.</p>
				<p>
					I landed on {@render kbd("'")} as being our dot sprinkler. So {@render kbd("s'")} would
					give us <span class="ar">ش</span> (sheen).
				</p>
				<p>
					{@render kbd("H'")} would give us <span class="ar">خ</span>
					<em>(remember capital H because this is emphatic)</em>.
				</p>
				<p>{@render kbd("t'")} would give us <span class="ar">ث</span> etc...</p>
				<p>I think you can see how we're quickly coming up with our own little shorthand.</p>

				<p>
					Okay that's a lot of reading, how about we take a break and do some writing using the
					keyboard below.
				</p>
				<p>Why don't you try writing my name <strong class="text-text-300">Sherif</strong> {@render kbd("s'ryf")}</p>
				<p>Or <strong class="text-text-300">house</strong> {@render kbd('byt')}</p>
				<p>Or <strong class="text-text-300">dog</strong> {@render kbd('klb')}</p>
				<p>Or <strong class="text-text-300">I like to drink tea</strong> {@render kbd("ana bHb as'rb s'ay")}</p>
				<ul class="list-disc space-y-1 pl-5">
					<li><span class="ar">أنا</span> (ana) = I</li>
					<li><span class="ar">بحب</span> (bahib) = like</li>
					<li><span class="ar">أشرب</span> (ashrab) = drink</li>
					<li><span class="ar">شاي</span> (shay) = tea</li>
				</ul>
				<p>
					PS. Notice the little mark above the first <span class="ar">ا</span> in I, and drink?
					That's <strong class="text-text-300">Hamza</strong> <span class="ar">ء</span>. We will get
					to him in a bit.
				</p>
				<p>
					PPS. Notice how the word for tea <span class="ar">شاي</span> (shay) is somewhat similar to
					chai, or tea even.
				</p>

				{@render keyboard()}

				<p>
					There we go, we are now able to write all 28 Arabic letters, but there is still more to be
					done!
				</p>
			</section>

			<!-- HAMZA -->
			<section id="hamza" class="scroll-mt-8">
				<h2 class="mb-3 mt-10 text-xl font-bold text-text-300">Hamza <span class="ar-lg">ء</span></h2>
				<p>
					Hamza is the unofficial 29th letter of the Arabic alphabet. It is used to represent a
					glottal stop.
				</p>
				<p>
					It can appear with three letters. <span class="ar-lg">ا</span> (alif),
					<span class="ar-lg">و</span> (waw), and <span class="ar-lg">ي</span> (ya).
				</p>
				<p>
					Above or below alif it is written as <span class="ar-lg">أ</span> or
					<span class="ar-lg">إ</span>
				</p>
				<p>Above waw it is written as <span class="ar-lg">ؤ</span></p>
				<p>
					Above ya it is written as <span class="ar-lg">ئ</span>. This version is often used at the
					middle or end of a word.
				</p>
				<p>
					So how can we represent hamza in our keyboard? I decided on {@render kbd('-')} to represent
					hamza. And if you are adding hamza to a letter you can simply type {@render kbd('--')}
				</p>
				<p>
					Since hamza can appear above or below alif, {@render kbd('A--')} will give us
					<span class="ar-lg">أ</span> and {@render kbd('a--')} will give us <span class="ar-lg">إ</span>
				</p>
				<p>Let's look at some examples shall we. Let's try typing on our keyboard below.</p>
				<p>- Why don't you try writing the name <strong class="text-text-300">Ahmed</strong> {@render kbd('A--Hmd')}</p>
				<p>- Or Ra'is {@render kbd('ry--ys')} which means president</p>
				<p>- Or Izzay {@render kbd('a--zay')} "How?"</p>

				{@render keyboard()}

				<p>
					So that's it, we are now Hamza compatible. Not the most interesting feature, but a necessary
					one.
				</p>
			</section>

			<!-- DIACRITICS -->
			<section id="diacritics" class="scroll-mt-8">
				<h2 class="mb-3 mt-10 text-xl font-bold text-text-300">Diacritics</h2>
				<p>
					Remember those marks we saw earlier around <span class="ar-lg">كِتَاب</span>. The things
					below the first letter and above the second letter.
				</p>
				<p>Those are diacritics.</p>
				<p>
					Arabic diacritics are marks that are placed on or around the letter that can define how the
					word can be pronounced, and therefore how it can be understood.
				</p>
				<p>
					Arabic is a consonant based language, and short vowels are often left out of written text.
					However they are important for pronunciation and grammar. Sometimes they are used to
					differentiate between words that are spelled the same but have different meanings.
				</p>

				<h3 class="mb-3 mt-8 text-lg font-bold text-text-300">Let's look at an example</h3>
				<p><span class="ar-lg">كَتَب</span> <span class="ar">(katab) - "He wrote."</span></p>
				<p><span class="ar-lg">كُتُب</span> <span class="ar">(kutub) - "Books."</span></p>
				<p>To cut to the chase, we will be using {@render kbd('=')} as our hotkey for diacritics.</p>
				<p>The diacritics we will implement are the following:</p>

				<div class="my-4 rounded-lg border border-tile-500 bg-tile-300 p-4">
					<h3 class="mb-3 text-lg font-bold text-text-300">Fatha (short a)</h3>
					<div class="flex flex-col items-center gap-4 sm:flex-row">
						<div class="ar-huge w-32 shrink-0 text-center">َ</div>
						<div class="space-y-2">
							<p>
								This mark is written as a very tiny line above the letter. Fatha is what makes the
								sound pronounced as an extra (a) sound added to the word. You can consider the A in
								the word 'car' a Fatha.
							</p>
							<p>
								Since this mark is used to indicate a short "a", we can type {@render kbd('a=')} to add
								a Fatha to the letter.
							</p>
						</div>
					</div>
				</div>

				<div class="my-4 rounded-lg border border-tile-500 bg-tile-300 p-4">
					<h3 class="mb-3 text-lg font-bold text-text-300">Kasrah (short i)</h3>
					<div class="flex flex-col items-center gap-4 sm:flex-row">
						<div class="ar-huge w-32 shrink-0 text-center">ِ</div>
						<div class="space-y-2">
							<p>
								This mark is written as a very tiny line below the letter. Kasrah is what makes the
								sound pronounced as an extra (i) sound added to the word. You can consider the I in
								the word 'sit' a Kasrah.
							</p>
							<p>
								Since this mark is used to indicate a short "i", we can type {@render kbd('i=')} to add
								a Kasrah to the letter.
							</p>
						</div>
					</div>
				</div>

				<div class="my-4 rounded-lg border border-tile-500 bg-tile-300 p-4">
					<h3 class="mb-3 text-lg font-bold text-text-300">Dhammah (short u)</h3>
					<div class="flex flex-col items-center gap-4 sm:flex-row">
						<div class="ar-huge w-32 shrink-0 text-center">ُ</div>
						<div class="space-y-2">
							<p>
								This mark is written as a very tiny <em>I don't know</em> above the letter. Dhammah is
								what makes the sound pronounced as an extra (u) sound added to the word.
							</p>
							<p>
								<span class="ar-lg">كُتُب</span>
								<span class="ar">(kutub) - "Books."</span> is a good example here.
							</p>
							<p>
								Since this mark is used to indicate a short "u", we can type {@render kbd('u=')} to add
								a Dhammah to the letter.
							</p>
						</div>
					</div>
				</div>

				<div class="my-4 rounded-lg border border-tile-500 bg-tile-300 p-4">
					<h3 class="mb-3 text-lg font-bold text-text-300">Sukun (de-emphasize)</h3>
					<div class="flex flex-col items-center gap-4 sm:flex-row">
						<div class="ar-huge w-32 shrink-0 text-center">ْ</div>
						<div class="space-y-2">
							<p>
								This mark is written as a very tiny circle above the letter. Sukun is what makes the
								sound pronounced as a stop. It is used to indicate that a letter is not followed by a
								vowel.
							</p>
							<p>
								We can type {@render kbd('h=')} to add a Sukun to the letter. I'm not sure how I landed
								on h, but I did.
							</p>
						</div>
					</div>
				</div>

				<div class="my-4 rounded-lg border border-tile-500 bg-tile-300 p-4">
					<h3 class="mb-3 text-lg font-bold text-text-300">Shaddah (emphasize)</h3>
					<div class="flex flex-col items-center gap-4 sm:flex-row">
						<div class="ar-huge w-32 shrink-0 text-center">ّ</div>
						<div class="space-y-2">
							<p>
								This mark is written as a very tiny squiggle above the letter. Shaddah is what makes
								the sound pronounced as an extra emphasis on the letter. It is used to indicate that a
								letter is doubled.
							</p>
							<p>
								Since the name of this mark starts with the letter s, we can type {@render kbd('s=')}
								to add a Shaddah to the letter.
							</p>
						</div>
					</div>
				</div>

				<h3 class="mb-3 mt-8 text-lg font-bold text-text-300">Tanwin</h3>
				<p>
					It is written above the final letter of a word. It is pronounced as the letters AN, IN, or
					UN added to a word, and comes in three forms.
				</p>

				<div class="my-4 rounded-lg border border-tile-500 bg-tile-300 p-4">
					<h3 class="mb-3 text-lg font-bold text-text-300">Tanwin (an)</h3>
					<div class="flex flex-col items-center gap-4 sm:flex-row">
						<div class="ar-huge w-32 shrink-0 text-center">ً</div>
						<div class="space-y-2">
							<p>
								Tanween is always added to the last letter of the word. In this case it adds an "an"
								sound to the word.
							</p>
							<p>If you notice it looks like two Fathas <span class="ar-lg">َ</span>, which gave us our short a sound.</p>
							<p>
								Since this mark is used to indicate a short "an", we can type {@render kbd('an=')} to
								add a Tanween to the letter.
							</p>
						</div>
					</div>
				</div>

				<div class="my-4 rounded-lg border border-tile-500 bg-tile-300 p-4">
					<h3 class="mb-3 text-lg font-bold text-text-300">Tanwin (in)</h3>
					<div class="flex flex-col items-center gap-4 sm:flex-row">
						<div class="ar-huge w-32 shrink-0 text-center">ٍ</div>
						<div class="space-y-2">
							<p>In this case it adds an "in" sound to the word.</p>
							<p>If you notice it looks like two Kasrahs <span class="ar-lg">ِ</span>, which gave us our short i sound.</p>
							<p>
								Since this mark is used to indicate a short "in", we can type {@render kbd('in=')} to
								add a Tanween to the letter.
							</p>
						</div>
					</div>
				</div>

				<div class="my-4 rounded-lg border border-tile-500 bg-tile-300 p-4">
					<h3 class="mb-3 text-lg font-bold text-text-300">Tanwin (un)</h3>
					<div class="flex flex-col items-center gap-4 sm:flex-row">
						<div class="ar-huge w-32 shrink-0 text-center">ٌ</div>
						<div class="space-y-2">
							<p>In this case it adds an "un" sound to the word.</p>
							<p>If you notice it sorta kinda looks like two Dhammahs <span class="ar-lg">ُ</span>, which gave us our short u sound.</p>
							<p>
								Since this mark is used to indicate a short "un", we can type {@render kbd('un=')} to
								add a Tanween to the letter.
							</p>
						</div>
					</div>
				</div>

				<p>Let's take a look at some examples.</p>
				<p>
					The word for bag is Shanta, and is written as <span class="ar">شنطة</span> ({@render kbd("s'nTh'")})
					but without diacritics we lose some pronunciation hints.
				</p>
				<p>Here it is with diacritics <span class="ar-lg">شَنْطَة</span> (shanta)</p>
				<p>Let's try typing it without diacritics first {@render kbd("s'nTh'")}</p>
				<p>And now with diacritics {@render kbd("s'a=nh=Th'")}</p>
				<p>
					If you press the audio button in the keyboard you can hear the slight difference in
					pronunciation.
				</p>
				<p>
					Let's write a longer sentence now. Let's try, I like tea with milk.
					<span class="ar">أَنَا بَحِبّ الشاي بِاللِّبَن</span> (ana bahib al shay bil laban). We can
					write that on our keyboard with full diacritics as {@render kbd('A--a=na=a ba=Hi=bs= als\'ay bi=alla=s=ba=n')}
				</p>

				{@render keyboard()}

				<p>
					So there we go, we can now write Arabic in English, kinda. Is it a good idea? Is it
					practical? I don't know. But it was fun to work on.
				</p>
			</section>

			<!-- IMPLEMENTATION -->
			<section id="implementation" class="scroll-mt-8">
				<h2 class="mb-3 mt-10 text-xl font-bold text-text-300">Implementation</h2>
				<p>
					The keyboard was built as a web component for ease of portability. You can view the
					<a
						href="https://github.com/selmetwa/arabic-virtual-keyboard"
						target="_blank"
						rel="noreferrer"
						class="text-text-300 underline underline-offset-2">source code here</a
					>
				</p>
				<p>It can be easily added to any website by adding the following code to your html file.</p>
				<pre class="my-4 overflow-x-auto rounded-lg bg-tile-400 p-4 font-mono text-sm text-text-300"><code>{installScript}</code></pre>
				<p>Or you can install it via npm.</p>
				<pre class="my-4 overflow-x-auto rounded-lg bg-tile-400 p-4 font-mono text-sm text-text-300"><code>{installNpm}</code></pre>
				<p>
					You can read more about the project here
					<a
						href="https://selmetwa.github.io/arabic-virtual-keyboard-demo/"
						target="_blank"
						rel="noreferrer"
						class="text-text-300 underline underline-offset-2">Documentation</a
					>
				</p>
				<p>
					The keyboard is used throughout Parallel Arabic, a language learning platform for Egyptian
					Arabic.
					<a
						href={resolve('/about')}
						class="text-text-300 underline underline-offset-2">Check it out here</a
					>
				</p>
			</section>
		</div>
	</article>
</section>

<style>
	.ar {
		font-size: 1.6rem;
		line-height: 1;
	}
	.ar-lg {
		font-size: 2.5rem;
		line-height: 1;
	}
	.ar-huge {
		font-size: 6rem;
		line-height: 1;
	}
	.hl {
		color: var(--color-green-600, #16a34a);
		font-weight: 600;
	}
</style>
