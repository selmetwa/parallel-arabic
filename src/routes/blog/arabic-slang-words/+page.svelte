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

	const post = blogPosts.find((p) => p.slug === 'arabic-slang-words')!;
	const pairs = getGame('memory-pairs')!;

	type Word = { arabic: string; said: string; meaning: string };

	const card = (w: Word, dialect: string): GameWord => ({
		id: w.said,
		arabic: w.arabic,
		plain: stripArabicDiacritics(w.arabic),
		english: w.meaning,
		transliteration: w.said,
		audioUrl: gameAudioUrl(w.arabic, dialect)
	});

	const everywhere: Word[] = [
		{ arabic: 'يلا', said: 'yalla', meaning: "let's go, come on, hurry up" },
		{ arabic: 'خلاص', said: 'khalas', meaning: "enough, done, that's it, okay then" },
		{ arabic: 'يعني', said: 'ya3ni', meaning: 'I mean, like, sort of. The Arabic "um"' },
		{ arabic: 'إن شاء الله', said: 'inshallah', meaning: 'God willing. Also a polite "maybe"' },
		{ arabic: 'ما شاء الله', said: 'mashallah', meaning: 'said to admire something without jinxing it' },
		{ arabic: 'تمام', said: 'tamam', meaning: 'fine, perfect, all good' }
	];

	const egyptian: Word[] = [
		{ arabic: 'معلش', said: 'ma3lesh', meaning: "never mind, sorry, it's okay" },
		{ arabic: 'أشطة', said: '2ashta', meaning: 'cool, great, deal' },
		{ arabic: 'جامد', said: 'gamed', meaning: 'awesome. Literally "solid"' },
		{ arabic: 'يا باشا', said: 'ya basha', meaning: 'boss, mate. Said to any man' },
		{ arabic: 'بجد', said: 'bgad', meaning: 'seriously, really?' },
		{ arabic: 'فكك', said: 'fakkak', meaning: 'forget it, let it go' },
		{ arabic: 'ظبط', said: 'zabat', meaning: 'sorted, sort it out' },
		{ arabic: 'يا سلام', said: 'ya salaam', meaning: 'wow, or "oh, really?" when sarcastic' }
	];

	const levantine: Word[] = [
		{ arabic: 'عنجد', said: '3anjad', meaning: 'seriously? really?' },
		{ arabic: 'زلمة', said: 'zalameh', meaning: 'man, dude' },
		{ arabic: 'كتير', said: 'ktir', meaning: 'very, a lot. ktir 7ilw, really nice' },
		{ arabic: 'يا حرام', said: 'ya 7aram', meaning: 'oh, poor thing' },
		{ arabic: 'صحتين', said: 'sa7tein', meaning: 'enjoy your meal. Literally "two healths"' },
		{ arabic: 'يسلمو', said: 'yislamo', meaning: 'thanks, especially for something handed to you' },
		{ arabic: 'هلق', said: 'halla2', meaning: 'now' },
		{ arabic: 'شو القصة', said: 'shu l-2ussa', meaning: "what's going on? Literally \"what's the story\"" }
	];

	const darija: Word[] = [
		{ arabic: 'واخا', said: 'wakha', meaning: 'okay, sure' },
		{ arabic: 'بزاف', said: 'bezzaf', meaning: 'a lot, very' },
		{ arabic: 'صافي', said: 'safi', meaning: "enough, that's it, okay" },
		{ arabic: 'دابا', said: 'daba', meaning: 'now' },
		{ arabic: 'زوين', said: 'zwin', meaning: 'nice, beautiful' },
		{ arabic: 'عافاك', said: '3afak', meaning: 'please' },
		{ arabic: 'لاباس', said: 'labas', meaning: "how are you? / I'm fine" },
		{ arabic: 'ماشي مشكل', said: 'mashi mushkil', meaning: 'no problem' }
	];

	const gulf: Word[] = [
		{ arabic: 'زين', said: 'zain', meaning: 'good, okay' },
		{ arabic: 'وايد', said: 'wayed', meaning: 'a lot, very' },
		{ arabic: 'إنزين', said: 'inzain', meaning: 'okay then, so' },
		{ arabic: 'الحين', said: 'il-7een', meaning: 'now' },
		{ arabic: 'أبي', said: 'abi', meaning: 'I want' },
		{ arabic: 'هلا والله', said: 'hala wallah', meaning: 'a warm hello, "welcome, truly"' },
		{ arabic: 'يعطيك العافية', said: 'ya3teek el-3afya', meaning: 'thanks for your effort, well done' },
		{ arabic: 'شلونك', said: 'shloonak', meaning: 'how are you?' }
	];

	const sections = [
		{ heading: 'Egyptian slang', intro: 'Cairo slang is the most widely understood in the Arab world, thanks to Egyptian films and TV.', words: egyptian, dialect: 'egyptian-arabic' },
		{ heading: 'Levantine slang', intro: 'From Syria, Lebanon, Jordan and Palestine. Soft, quick, and full of French in Beirut.', words: levantine, dialect: 'levantine' },
		{ heading: 'Moroccan Darija slang', intro: "The most distinctive of the four. Most of these words won't be understood in Cairo.", words: darija, dialect: 'darija' },
		{ heading: 'Gulf slang', intro: 'From the UAE, Kuwait, Qatar, Bahrain and Saudi Arabia.', words: gulf, dialect: 'khaleeji' }
	];

	const game = egyptian.slice(0, 6).map((w) => card(w, 'egyptian-arabic'));
</script>

{#snippet wordList(words: Word[])}
	<ul>
		{#each words as w (w.said)}
			<li>
				<span class="ar-text" lang="ar">{w.arabic}</span> <strong>{w.said}</strong>: {w.meaning}
			</li>
		{/each}
	</ul>
{/snippet}

<BlogArticle
	{post}
	subtitle="Textbooks teach you how to talk. Slang is how people actually do. Here's the everyday kind, no swearing."
>
	<p>
		There's no single "Arabic slang". Every dialect has its own, and a word that's everywhere in
		Cairo can get a blank look in Casablanca. But a handful of words cross every border, and each
		dialect has a short list that, once you know it, makes conversations suddenly make sense.
	</p>
	<p>
		This is everyday slang, the words you'd use with friends, in shops and on the phone. Nothing here
		is rude. (In the transliteration, 3 is <span class="ar-text" lang="ar">ع</span>, 7 is the breathy
		<span class="ar-text" lang="ar">ح</span> and 2 is a glottal stop.)
	</p>

	<h2>The words every Arab understands</h2>
	{@render wordList(everywhere)}
	<p>
		Two more belong on this list but need their own explanation:
		<a href={resolve('/blog/what-does-wallah-mean')}>wallah</a>, "I swear", and
		<a href={resolve('/blog/what-does-habibi-mean')}>habibi</a>, "my dear".
	</p>

	{#each sections as s, i (s.heading)}
		<h2>{s.heading}</h2>
		<p>{s.intro}</p>
		{@render wordList(s.words)}
		<p>
			For the full phrases, with audio and example sentences, see the
			<a href={resolve('/[dialect=dialect]/phrases', { dialect: s.dialect })}>phrasebook</a>.
		</p>

		{#if i === 0}
			<BlogGame
				title="Match the Egyptian slang"
				blurb="Six Egyptian words from above. Flip two cards at a time and match each one to its meaning, or switch to Sound ↔ Arabic and match what you hear."
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
		{/if}
	{/each}

	<h2>How to pick slang up</h2>
	<p>
		Slang is the part of a language that word lists teach worst. You learn it by hearing it in a
		sentence, from someone who sounds like they mean it. The
		<a href={resolve('/stories')}>graded stories</a> are written in everyday dialect, so words like
		these turn up naturally, and you can tap any of them for a definition. To compare a word across
		dialects, the <a href={resolve('/arabic-dialects')}>Arabic dialects guide</a> sets them side by
		side.
	</p>
</BlogArticle>
