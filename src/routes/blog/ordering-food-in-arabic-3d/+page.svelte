<script lang="ts">
	import { resolve } from '$app/paths';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'ordering-food-in-arabic-3d')!;

	const MEDIA = '/images/feature-pages';

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

{#snippet still(name: string, alt: string, caption: string)}
	<figure>
		<img src="{MEDIA}/{name}.webp" width="2560" height="1440" {alt} loading="lazy" decoding="async" />
		<figcaption>{caption}</figcaption>
	</figure>
{/snippet}

{#snippet clip(name: string, poster: string, label: string, caption: string)}
	<figure>
		<!-- Silent screen recordings: muted, so browsers let them autoplay. -->
		<video
			src="{MEDIA}/{name}.mp4"
			poster="{MEDIA}/{poster}.webp"
			width="1280"
			height="720"
			aria-label={label}
			autoplay
			muted
			loop
			playsinline
			controls
			preload="metadata"
		></video>
		<figcaption>{caption}</figcaption>
	</figure>
{/snippet}

<section class="min-h-screen bg-tile-200">
	<article class="mx-auto max-w-2xl px-4 py-12 sm:px-8 sm:py-16">
		<a
			href={resolve('/blog')}
			class="mb-8 inline-flex items-center gap-2 text-sm text-text-200 transition-colors hover:text-text-300"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
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
			<p class="mb-4 text-lg text-text-200">
				A kitchen, a bathroom, a restaurant, and a waiter who only speaks Arabic.
			</p>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-200">
				<span>{formatDate(post.date)}</span>
				<span aria-hidden="true">·</span>
				<span>{post.readingTime}</span>
			</div>
		</header>

		<div
			class="post space-y-4 text-base leading-relaxed text-text-200 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text-300 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:text-text-300 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
		>
			{@render clip(
				'room-hunt-order',
				'room-hunt-order-served',
				'Ordering a meal from the waiter in Room Hunt, from the welcome to the bill',
				'The whole meal in about a minute. The waiter walks over, takes the order, goes to the kitchen and comes back with exactly what I asked for.'
			)}

			<p>
				I can tell you the Egyptian word for fridge is <span dir="rtl">تلاجة</span>. You'll forget
				it by Thursday. That isn't a comment on your memory, it's how vocabulary lists work: a word
				on a card has nowhere to live. The words that stick are the ones attached to something,
				usually a place and a moment. The fridge in your grandmother's kitchen. The waiter who
				corrected your order.
			</p>
			<p>
				So I built some places. <a
					href={resolve('/learn/game/room-hunt')}
					class="text-text-300 underline underline-offset-2">Room Hunt</a
				> drops you into a 3D kitchen, bathroom or restaurant in your browser and teaches you what everything
				in it is called, in Egyptian, Levantine, Moroccan Darija or Standard Arabic. Then it sits you
				down and makes you order dinner.
			</p>

			<h2>Four words, then find them</h2>
			<p>
				My first version just put you in the room and asked for things. That was a quiz for people
				who already knew the words, which is nobody on day one. You ended up tapping the toaster,
				then the kettle, then the fridge, until something lit up.
			</p>
			<p>
				So now each lesson teaches four objects first. The view turns to one, it glows, you hear its
				name and see it written with the transliteration, and you tap it to move on. Only then does
				the game ask for them, mixed in with a few words you learned last time.
			</p>

			{@render clip(
				'room-hunt-lesson',
				'room-hunt-learn',
				'A Room Hunt lesson: four kitchen words taught one at a time, then a round of finding them',
				'A lesson in the kitchen: fridge, stove, sink and cupboard, then "where is the sink?"'
			)}

			<p>
				The question isn't the bare word. It's what someone would actually say to you:
				<span dir="rtl">فين البوتاجاز؟</span> (where's the stove?) in Cairo,
				<span dir="rtl">وين الغاز؟</span> in Beirut. You learn the noun and the most useful question
				in the language at the same time, and you hear both, because every word and every question
				has a recording in each dialect.
			</p>
			<p>
				The dialects disagree more than you'd guess for a kitchen. The fridge is a
				<em>tallaga</em> in Egypt and a <em>barrad</em> in Lebanon. The stove is a
				<em>botagaz</em> in Cairo, <em>ghaz</em> in Beirut and <em>bota</em> in Casablanca. If you've
				only ever learned the Standard Arabic word, <span dir="rtl">موقد</span>, none of those three
				kitchens will know what you mean.
			</p>

			{@render still(
				'room-hunt-find',
				'A Find it question in the kitchen: where is the stove, in Egyptian Arabic with transliteration and English',
				'Easy mode shows the English too. Normal drops it, and Hard is listening only.'
			)}

			<h2>Getting it wrong on purpose</h2>
			<p>
				The part I like most is what happens when you miss. Tap the wrong thing and the game tells
				you what you tapped: "That's <span dir="rtl">دولاب</span>, the cupboard." A wrong answer is
				still a word. Miss twice and the right object glows amber and the view turns towards it, and
				that one doesn't earn XP.
			</p>
			<p>
				Anything you didn't get on the first try comes back three questions later. That's the
				oldest trick in spaced repetition and it works here for the same reason it works anywhere:
				you get a second go while the miss still stings a bit.
			</p>

			{@render still(
				'room-hunt-hint',
				'After two wrong taps the stove glows amber and the card says the last tap was the cupboard',
				'Two misses in: the stove glows, and the card names the cupboard I tapped by mistake.'
			)}

			<p>
				Once a room feels easy there's a harder mode that flips it around. An object glows and you
				name it, either by picking from four words or by pressing the microphone and saying it. The
				speech check compares what it heard with the word, so it cares more about whether you said
				the right thing than about your accent, which I think is the right way round.
			</p>

			<h2>Then the waiter</h2>
			<p>
				Finding a fork is fine, but nobody has ever needed to point at a fork in Arabic. What people
				actually need is the restaurant. So the restaurant has a second mode: you sit down at a
				table and a waiter walks over from the kitchen.
			</p>
			<p>
				Everything the waiter says appears on screen in Arabic, transliteration and English, and
				plays in their own voice, which is a different voice from yours so the conversation sounds
				like two people. You answer by picking one of a few replies or saying it out loud. Your reply
				is then spoken back in a native voice, so you hear how it should have sounded.
			</p>

			{@render still(
				'room-hunt-order-waiter',
				'The waiter welcomes you to the restaurant in Egyptian Arabic while you reply shukran',
				'"Welcome! Please, have a seat. Here is the menu." I went with shukran.'
			)}

			<p>
				The replies aren't all correct, and that's deliberate. When the waiter welcomes you, one
				option is "the bill, please". It's perfectly good Arabic and it's the wrong thing to say,
				so the waiter shakes their head and asks what you mean. I think knowing which phrase fits the
				moment matters more than knowing the phrase. Most phrasebooks give you the list and leave
				the timing to you.
			</p>
			<p>
				Then the waiter brings whatever you ordered. Tea or water, fish, chicken or soup, cake or
				no cake. They walk to the kitchen, come back, and put it on your table. It's a small thing
				and it took longer to get right than anything else in the game, but it changes how the
				choice feels. You aren't picking answer B, you're picking dinner.
			</p>

			{@render still(
				'room-hunt-order-served',
				'The waiter says here you go, enjoy your meal, in Egyptian Arabic, and the fish and tea are on the table',
				'"Itfaddal, bel hana wel shefa." Here you go, enjoy your meal. The fish and tea are the ones I ordered.'
			)}

			<p>
				At the end you get the bill, and a receipt of what you ate written in Arabic, and every
				phrase you used in the conversation with its recording and a button to save it to your
				review deck. Seven turns, about twenty phrases across the whole scene, two or three
				minutes.
			</p>

			{@render still(
				'room-hunt-order-receipt',
				'The end of the meal: the order in Arabic (tea, fish, cake) and the phrases used, each with audio and a save button',
				'Tea, fish, cake. The phrases are underneath, ready to save.'
			)}

			<h2>How it's made, and what's rough</h2>
			<p>
				It runs in the browser with three.js, no download. The furniture, food and people are from
				Kenney's free low-poly kits, which is why everything looks like a well-behaved toy. The
				recordings are made once per dialect rather than on the fly, so they're instant and free to
				replay as often as you want.
			</p>
			<p>A few honest caveats:</p>
			<ul>
				<li>
					The people are from a cartoon kit with enormous heads. Up close the waiter is mostly
					head, so they stand a polite distance from your table. Characters with more ordinary
					proportions would help.
				</li>
				<li>
					There's one scene so far. Ordering dinner is the obvious first one; a taxi, a pharmacy and
					a market are the next ones I'd want.
				</li>
				<li>
					The waiter's lines are fixed. You choose between replies rather than saying anything you
					like. For open conversation the
					<a href={resolve('/tutor')} class="text-text-300 underline underline-offset-2">tutor</a> is
					the better tool. This is the rehearsal before that.
				</li>
			</ul>

			<h2>Try it</h2>
			<p>
				<a href={resolve('/learn/game/room-hunt')} class="text-text-300 underline underline-offset-2"
					>Room Hunt is here</a
				>, with two free lessons and no account needed. Start in the kitchen, and when the
				restaurant opens up, sit down and order. There's a
				<a
					href={resolve('/features/learn-arabic-in-3d')}
					class="text-text-300 underline underline-offset-2">longer tour of the features</a
				> if you'd rather look before you play.
			</p>
		</div>
	</article>
</section>

<style>
	.post :global(figure) {
		margin-block: 1.75rem;
	}

	.post :global(figure img),
	.post :global(figure video) {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 0.9rem;
		border: 1px solid var(--tile5);
		background: var(--tile3);
	}

	.post :global(figcaption) {
		margin-top: 0.5rem;
		font-size: 0.85rem;
		color: var(--text2);
	}
</style>
