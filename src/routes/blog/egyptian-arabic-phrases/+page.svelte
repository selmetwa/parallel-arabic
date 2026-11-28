<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import BlogGame from '$lib/components/blog/BlogGame.svelte';
	import MemoryPairs from '$lib/components/games/MemoryPairs.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';
	import { getGame } from '$lib/constants/games';
	import { gameAudioUrl } from '$lib/games/game-audio';
	import { openGate } from '$lib/games/open-gate';
	import type { GameWord } from '$lib/games/word-pool';
	import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';

	let { data } = $props();

	const post = blogPosts.find((p) => p.slug === 'egyptian-arabic-phrases')!;
	const pairs = getGame('memory-pairs')!;

	type Phrase = { arabic: string; said: string; meaning: string };

	const card = (p: Phrase): GameWord => ({
		id: p.said,
		arabic: p.arabic,
		plain: stripArabicDiacritics(p.arabic),
		english: p.meaning,
		transliteration: p.said,
		audioUrl: gameAudioUrl(p.arabic, 'egyptian-arabic')
	});

	const greetings: Phrase[] = [
		{ arabic: 'أهلاً', said: 'ahlan', meaning: 'hi, welcome' },
		{ arabic: 'إزيك؟', said: 'izzayak? / izzayik?', meaning: 'how are you? (to a man / to a woman)' },
		{ arabic: 'الحمد لله', said: 'il7amdulillah', meaning: "fine, thank God. The standard answer" },
		{ arabic: 'صباح الخير', said: 'saba7 il-kheir', meaning: 'good morning' },
		{ arabic: 'صباح الفل', said: 'saba7 il-ful', meaning: 'good morning back. "Morning of jasmine"' },
		{ arabic: 'اسمك إيه؟', said: 'ismak eh?', meaning: "what's your name?" },
		{ arabic: 'مع السلامة', said: 'ma3a s-salaama', meaning: 'goodbye' }
	];

	const shopping: Phrase[] = [
		{ arabic: 'بكام ده؟', said: 'bikam da?', meaning: 'how much is this?' },
		{ arabic: 'عايز / عايزة', said: '3ayez / 3ayza', meaning: 'I want (man / woman speaking)' },
		{ arabic: 'فيه...؟', said: 'fi...?', meaning: 'is there...? do you have...?' },
		{ arabic: 'غالي أوي', said: 'ghali awi', meaning: 'too expensive' },
		{ arabic: 'آخر كلام؟', said: 'akhir kalam?', meaning: "what's your final price?" },
		{ arabic: 'الحساب لو سمحت', said: 'il-7isaab law sama7t', meaning: 'the bill, please' }
	];

	const taxi: Phrase[] = [
		{ arabic: 'يا أسطى', said: 'ya osta', meaning: 'driver! The polite way to address him' },
		{ arabic: 'على طول', said: '3ala tool', meaning: 'straight ahead' },
		{ arabic: 'يمين / شمال', said: 'yimeen / shimaal', meaning: 'right / left' },
		{ arabic: 'هنا كويس', said: 'hena kwayyis', meaning: 'here is fine' },
		{ arabic: 'بالراحة', said: 'bir-raa7a', meaning: 'slow down, take it easy' }
	];

	const politeness: Phrase[] = [
		{ arabic: 'لو سمحت', said: 'law sama7t', meaning: 'please, excuse me (law sama7ti to a woman)' },
		{ arabic: 'شكراً', said: 'shukran', meaning: 'thank you. Also very common: mersi' },
		{ arabic: 'عفواً', said: '3afwan', meaning: "you're welcome, and also excuse me" },
		{ arabic: 'آسف / آسفة', said: 'aasif / asfa', meaning: "I'm sorry (man / woman speaking)" },
		{ arabic: 'مش فاهم', said: 'mish faahim', meaning: "I don't understand (mish fahma for a woman)" },
		{ arabic: 'إن شاء الله', said: 'inshallah', meaning: 'God willing, hopefully, maybe' }
	];

	const reactions: Phrase[] = [
		{ arabic: 'معلش', said: 'ma3lesh', meaning: "never mind, sorry, it's fine. The most useful word in Egypt" },
		{ arabic: 'يلا', said: 'yalla', meaning: "let's go, come on" },
		{ arabic: 'خلاص', said: 'khalas', meaning: "done, that's enough, okay then" },
		{ arabic: 'بجد؟', said: 'bgad?', meaning: 'seriously? really?' },
		{ arabic: 'يا سلام', said: 'ya salaam', meaning: 'wow! (or, sarcastically, "oh really?")' },
		{ arabic: 'تمام', said: 'tamam', meaning: 'fine, perfect, got it' },
		{ arabic: 'ماشي', said: 'mashi', meaning: 'okay, fine' }
	];

	const game = [reactions[0], reactions[1], reactions[2], shopping[0], taxi[1], politeness[0]].map(card);
</script>

{#snippet list(items: Phrase[])}
	<ul>
		{#each items as p (p.said)}
			<li>
				<span class="ar-text" lang="ar">{p.arabic}</span> <strong>{p.said}</strong>: {p.meaning}
			</li>
		{/each}
	</ul>
{/snippet}

<BlogArticle
	{post}
	subtitle="The phrases for a day in Cairo: saying hello, buying things, getting a taxi, and reacting like you live there."
>
	<p>
		Egyptian Arabic is the most widely understood Arabic dialect, because generations of Arabs grew up
		on Egyptian films, TV and music. The phrases below are the ones you'll use most in Egypt, grouped by
		situation, and almost all of them will be understood anywhere in the Arab world.
	</p>
	<p>
		(In the transliteration, 3 is <span class="ar-text" lang="ar">ع</span>, 7 is the breathy
		<span class="ar-text" lang="ar">ح</span>, and 2 is a glottal stop. Egyptians pronounce
		<span class="ar-text" lang="ar">ج</span> as a hard g, so you'll see g where other dialects have
		j.)
	</p>

	<h2>Greetings</h2>
	{@render list(greetings)}
	<p>
		Egyptian greetings come in pairs. Someone says <strong>saba7 il-kheir</strong>, morning of
		goodness, and you answer with something even nicer: <strong>saba7 il-ful</strong>, morning of
		jasmine, or <strong>saba7 in-noor</strong>, morning of light.
	</p>

	<h2>In shops and markets</h2>
	{@render list(shopping)}
	<p>
		Prices in markets are usually a starting point. <strong>ghali awi</strong> with a smile, and
		<strong>akhir kalam?</strong> when you're close, are how bargaining begins.
	</p>

	<h2>In a taxi</h2>
	{@render list(taxi)}

	<BlogGame
		title="Match the phrases"
		blurb="Six phrases from this post. Flip two cards at a time and match each one to its meaning, or switch to Sound ↔ Arabic and match what you hear."
		accent={pairs.accent}
		deep={pairs.deep}
		showStart={false}
		fullGame={{ href: '/learn/game/memory-pairs', label: 'Play Memory Pairs with more Egyptian words' }}
	>
		{#snippet children({ signedIn })}
			<MemoryPairs
				pool={game}
				dialect="egyptian-arabic"
				gate={openGate()}
				{signedIn}
				isSubscribed={!!data.isSubscribed}
				accent={pairs.accent}
				deep={pairs.deep}
			/>
		{/snippet}
	</BlogGame>

	<h2>Being polite</h2>
	{@render list(politeness)}
	<p>
		Many phrases change slightly depending on who you're talking to. <strong>law sama7t</strong> to
		a man becomes <strong>law sama7ti</strong> to a woman. When you're the one speaking, words like
		"sorry" and "I want" take an -a ending if you're a woman.
	</p>

	<h2>The reactions you'll hear all day</h2>
	<p>These are the words that fill a Cairo conversation. Learn these and you'll sound local fast.</p>
	{@render list(reactions)}
	<p>
		<strong>ma3lesh</strong> deserves special mention. Someone bumps into you: ma3lesh, sorry. You
		missed the bus: ma3lesh, never mind. A friend is upset: ma3lesh, it's okay. It's the word that
		keeps Cairo moving.
	</p>

	<h2>Keep going</h2>
	<p>
		The <a href={resolve('/egyptian-arabic/phrases')}>Egyptian phrasebook</a> has each of these with
		audio, variants for men and women, and example sentences, including
		<a href={resolve('/egyptian-arabic/phrases/how-much-is-this')}>how much is this?</a> and
		<a href={resolve('/egyptian-arabic/phrases/excuse-me')}>excuse me</a>. For a structured path,
		the <a href={resolve('/lessons/structured/egyptian-arabic')}>Egyptian lessons</a> start from the
		alphabet. And for more of the casual side, see the
		<a href={resolve('/blog/arabic-slang-words')}>Arabic slang post</a>.
	</p>
</BlogArticle>
