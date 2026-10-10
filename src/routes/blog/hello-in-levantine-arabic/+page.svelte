<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import BlogGame from '$lib/components/blog/BlogGame.svelte';
	import MemoryPairs from '$lib/components/games/MemoryPairs.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';
	import { getGame } from '$lib/constants/games';
	import { openGate } from '$lib/games/open-gate';
	import type { GameWord } from '$lib/games/word-pool';
	import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';

	let { data } = $props();

	const post = blogPosts.find((p) => p.slug === 'hello-in-levantine-arabic')!;
	const pairs = getGame('memory-pairs')!;

	// From the Levantine phrasebook. Six cards per board, the game's board size.
	const card = (id: string, arabic: string, transliteration: string, english: string): GameWord => ({
		id,
		arabic,
		plain: stripArabicDiacritics(arabic),
		english,
		transliteration,
		audioUrl: null
	});

	const meeting = [
		card('hello', 'مَرْحَبا', 'mar7aba', 'hello'),
		card('hello-back', 'أَهْلَيْن', 'ahlayn', 'hello back ("two welcomes")'),
		card('morning', 'صَبَاح الخَيْر', 'saba7 el khayr', 'good morning'),
		card('morning-back', 'صَبَاح النُّور', 'saba7 el noor', 'good morning back ("morning of light")'),
		card('evening', 'مَسَا الخَيْر', 'masa l-kheir', 'good evening'),
		card('welcome', 'أَهْلاً وَسَهْلاً', 'ahlan wa sahlan', 'welcome')
	];

	const talking = [
		card('how-m', 'كِيفَك؟', 'kifak?', 'how are you? (to a man)'),
		card('how-f', 'كِيفِك؟', 'kifik?', 'how are you? (to a woman)'),
		card('good', 'مْنِيح', 'mni7', 'good, fine'),
		card('name', 'شُو اسْمَك؟', 'shu ismak?', "what's your name? (to a man)"),
		card('thanks', 'شُكْراً', 'shukran', 'thank you'),
		card('bye', 'مَع السَّلامَة', "ma3 as-salameh", 'goodbye')
	];

	const cafe = `${resolve('/scenarios')}?dialect=levantine&scene=cafe`;
</script>

<BlogArticle
	{post}
	subtitle="Mar7aba gets you started. The reply is where Levantine greetings get interesting."
>
	<p>
		If you only learn one word, learn <span class="ar-text" lang="ar">مَرْحَبا</span>
		<em>mar7aba</em>. It means hello, it works with anyone, at any time of day, in Damascus, Beirut,
		Amman or Jerusalem, and nobody will find it too formal or too casual.
	</p>
	<p>
		But a Levantine greeting is rarely one word. It's a call and a response, and the response is
		usually bigger than the call. Someone says hello, you say "two hellos". Someone wishes you a
		morning of goodness, you wish them a morning of light. Getting the reply right is what makes
		you sound like you've actually been there.
	</p>
	<p>
		(The 7 in <em>mar7aba</em> is the breathy <span class="ar-text" lang="ar">ح</span> sound, and 3
		is <span class="ar-text" lang="ar">ع</span>. It's how people write Arabic in Latin letters when
		texting.)
	</p>

	<h2>Hello, and hello back</h2>
	<ul>
		<li>
			<span class="ar-text" lang="ar">مَرْحَبا</span> <strong>mar7aba</strong>: hello. Literally
			"welcome".
		</li>
		<li>
			Reply with <span class="ar-text" lang="ar">مَرْحَبْتَيْن</span> <strong>mar7abtayn</strong>,
			"two hellos", or <span class="ar-text" lang="ar">أَهْلَيْن</span> <strong>ahlayn</strong>,
			"two welcomes". Feeling generous: <span class="ar-text" lang="ar">مِيَّة هَلا</span>
			<strong>miyyet hala</strong>, a hundred welcomes.
		</li>
		<li>
			<span class="ar-text" lang="ar">يا هَلا</span> <strong>ya hala</strong> is the warm,
			pleased-to-see-you version, common in Jordan and Palestine.
		</li>
		<li>
			<span class="ar-text" lang="ar">السَلامُ عَلَيْكُم</span>
			<strong>as-salamu 3alaykum</strong>, peace be upon you, is the formal and traditional one,
			often said walking into a shop or joining a group.
		</li>
		<li>
			In Beirut and among younger people in the cities you'll hear plain <strong>hi</strong>, and in
			Lebanon <strong>bonjour</strong>, mixed in with the Arabic without anyone blinking.
		</li>
	</ul>

	<h2>Good morning, good evening</h2>
	<p>
		<span class="ar-text" lang="ar">صَبَاح الخَيْر</span> <strong>saba7 el khayr</strong>, morning
		of goodness, is good morning until about noon. The usual reply is
		<span class="ar-text" lang="ar">صَبَاح النُّور</span> <strong>saba7 el noor</strong>, morning of
		light. If you want to be charming, <strong>saba7 el ward</strong> (morning of roses) or
		<strong>saba7 el yasmeen</strong> (morning of jasmine).
	</p>
	<p>
		From late afternoon it becomes <span class="ar-text" lang="ar">مَسَا الخَيْر</span>
		<strong>masa l-kheir</strong>, and the reply follows the same pattern:
		<strong>masa n-nour</strong>, evening of light.
	</p>

	<h2>Welcome</h2>
	<p>
		<span class="ar-text" lang="ar">أَهْلاً وَسَهْلاً</span> <strong>ahlan wa sahlan</strong> is what
		you say to someone arriving at your home, your shop or your country. It's often shortened to
		<strong>ahlan</strong>. The reply sends it back: <strong>ahlan feek</strong> to a man,
		<strong>ahlan feeki</strong> to a woman, "welcome to you too".
	</p>

	<BlogGame
		title="Match the greetings"
		blurb="Six greetings from above. Flip two cards at a time and match each Arabic phrase to what it means."
		accent={pairs.accent}
		deep={pairs.deep}
		showStart={false}
		fullGame={{ href: '/learn/game/memory-pairs', label: 'Play Memory Pairs with more Levantine words' }}
	>
		{#snippet children({ signedIn })}
			<MemoryPairs
				pool={meeting}
				dialect="levantine"
				gate={openGate()}
				{signedIn}
				isSubscribed={!!data.isSubscribed}
				accent={pairs.accent}
				deep={pairs.deep}
			/>
		{/snippet}
	</BlogGame>

	<h2>How are you?</h2>
	<p>
		This is where Levantine starts caring who you're talking to.
		<span class="ar-text" lang="ar">كِيفَك؟</span> <strong>kifak?</strong> is how are you to a man,
		<span class="ar-text" lang="ar">كِيفِك؟</span> <strong>kifik?</strong> to a woman, and
		<strong>kifkon?</strong> to a group. The ending is the only difference, and getting it wrong is
		the most common beginner slip, so it's worth practising out loud.
	</p>
	<p>The answers, from most to least common:</p>
	<ul>
		<li>
			<span class="ar-text" lang="ar">الْحَمْدُ لِلّٰه</span> <strong>al7amdu lillah</strong>, praise
			be to God. It means "fine", and people say it whether or not they're religious.
		</li>
		<li>
			<span class="ar-text" lang="ar">مْنِيح</span> <strong>mni7</strong>, good, if you're a man;
			<strong>mni7a</strong> if you're a woman.
		</li>
		<li><span class="ar-text" lang="ar">تَمَام</span> <strong>tamam</strong>, great, all good.</li>
	</ul>
	<p>
		<strong>Shu akhbarak?</strong>, what's your news, is the more casual way to ask, and
		<strong>kif 7alak?</strong> the slightly more formal one.
	</p>

	<h2>Names</h2>
	<p>
		<span class="ar-text" lang="ar">شُو اسْمَك؟</span> <strong>shu ismak?</strong> asks a man his
		name (<strong>shu ismik?</strong> for a woman). Answer with
		<span class="ar-text" lang="ar">اِسْمِي</span> <strong>ismi</strong> and your name. The polite
		follow-up is <span class="ar-text" lang="ar">تَشَرَّفْنَا</span> <strong>tsharafna</strong>,
		"we are honoured", which is how Levantines say nice to meet you.
	</p>

	<h2>Thank you, and goodbye</h2>
	<ul>
		<li>
			<span class="ar-text" lang="ar">شُكْراً</span> <strong>shukran</strong> is thank you
			everywhere. When someone hands you something, you'll often hear
			<span class="ar-text" lang="ar">يِسْلَموا</span> <strong>yeslamo</strong> instead, literally
			"may your hands be safe".
		</li>
		<li>
			<span class="ar-text" lang="ar">مَع السَّلامَة</span> <strong>ma3 as-salameh</strong>, go
			with safety, is the standard goodbye. Casually: <strong>yalla bye</strong>, which is exactly
			what it sounds like.
		</li>
		<li>
			<span class="ar-text" lang="ar">بْشُوفَك بَعْدِين</span> <strong>bshoofak ba3den</strong>, see
			you later. To a woman, <strong>bshoofek ba3den</strong>.
		</li>
	</ul>

	<BlogGame
		title="Match the conversation"
		blurb="How are you, fine, what's your name, thanks and goodbye. Watch the endings: two of these differ by one vowel."
		accent={pairs.accent}
		deep={pairs.deep}
		showStart={false}
		fullGame={{ href: '/learn/game/memory-pairs', label: 'Play Memory Pairs with more Levantine words' }}
	>
		{#snippet children({ signedIn })}
			<MemoryPairs
				pool={talking}
				dialect="levantine"
				gate={openGate()}
				{signedIn}
				isSubscribed={!!data.isSubscribed}
				accent={pairs.accent}
				deep={pairs.deep}
			/>
		{/snippet}
	</BlogGame>

	<h2>Now say it to someone</h2>
	<p>
		Matching cards gets the words into your head. Saying them to a person is a different skill. The
		closest thing to that here is a scenario: a café where the barista opens with
		<strong>saba7 il-kheer! shu bt7ebb tishrab?</strong>, good morning, what would you like to drink,
		and you answer, order, and pay, in Levantine.
	</p>
	<p>
		<a href={cafe}>Try the café scenario in Levantine</a>, or browse the full
		<a href={resolve('/levantine/phrases')}>Levantine phrasebook</a> for the replies, the variants
		for men, women and groups, and example sentences for every phrase here.
	</p>
</BlogArticle>
