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

	const post = blogPosts.find((p) => p.slug === 'moroccan-darija-words-and-phrases')!;
	const pairs = getGame('memory-pairs')!;

	type Entry = { arabic: string; said: string; meaning: string };

	const card = (e: Entry): GameWord => ({
		id: e.said,
		arabic: e.arabic,
		plain: stripArabicDiacritics(e.arabic),
		english: e.meaning,
		transliteration: e.said,
		audioUrl: gameAudioUrl(e.arabic, 'darija')
	});

	const basics: Entry[] = [
		{ arabic: 'دابا', said: 'daba', meaning: 'now' },
		{ arabic: 'بزاف', said: 'bezzaf', meaning: 'a lot, very' },
		{ arabic: 'شوية', said: 'shwiya', meaning: 'a little' },
		{ arabic: 'واخا', said: 'wakha', meaning: 'okay' },
		{ arabic: 'مزيان', said: 'mzyan', meaning: 'good' },
		{ arabic: 'زوين', said: 'zwin', meaning: 'nice, beautiful' },
		{ arabic: 'بغيت', said: 'bghit', meaning: 'I want' },
		{ arabic: 'عافاك', said: '3afak', meaning: 'please' }
	];

	const questions: Entry[] = [
		{ arabic: 'شنو', said: 'shnu', meaning: 'what' },
		{ arabic: 'فين', said: 'fin', meaning: 'where' },
		{ arabic: 'علاش', said: '3lash', meaning: 'why' },
		{ arabic: 'كيفاش', said: 'kifash', meaning: 'how' },
		{ arabic: 'شحال', said: 'sh7al', meaning: 'how much, how many' },
		{ arabic: 'واش', said: 'wash', meaning: 'turns a sentence into a yes/no question' }
	];

	const loans: Entry[] = [
		{ arabic: 'طوموبيل', said: 'tomobil', meaning: 'car, from French automobile' },
		{ arabic: 'طوبيس', said: 'tobis', meaning: 'bus, from French autobus' },
		{ arabic: 'فريجو', said: 'frigo', meaning: 'fridge, from French' },
		{ arabic: 'فرشيطة', said: 'forshita', meaning: 'fork, from French fourchette' },
		{ arabic: 'سيمانة', said: 'simana', meaning: 'week, from Spanish semana (in the north)' },
		{ arabic: 'كوزينة', said: 'kuzina', meaning: 'kitchen, from Spanish cocina' }
	];

	const phrases: Entry[] = [
		{ arabic: 'السلام عليكم', said: 'salam 3alaykum', meaning: 'hello' },
		{ arabic: 'لاباس؟', said: 'labas?', meaning: 'how are you? (and the answer: labas, fine)' },
		{ arabic: 'كيداير؟', said: 'kidayr?', meaning: 'how are you doing? (kidayra to a woman)' },
		{ arabic: 'بخير، الحمد لله', said: 'bikhir, l7amdulillah', meaning: "I'm well, thank God" },
		{ arabic: 'سميتي...', said: 'smiti...', meaning: 'my name is...' },
		{ arabic: 'شنو سميتك؟', said: 'shnu smitek?', meaning: "what's your name?" },
		{ arabic: 'ما فهمتش', said: 'ma fhemtsh', meaning: "I didn't understand" },
		{ arabic: 'شحال هادا؟', said: 'sh7al hada?', meaning: 'how much is this?' },
		{ arabic: 'غالي بزاف', said: 'ghali bezzaf', meaning: 'too expensive' },
		{ arabic: 'شكرا بزاف', said: 'shukran bezzaf', meaning: 'thanks a lot' },
		{ arabic: 'ما كاين مشكل', said: 'ma kayn mushkil', meaning: 'no problem' },
		{ arabic: 'بسلامة', said: 'bslama', meaning: 'goodbye' }
	];

	const sayings: Entry[] = [
		{
			arabic: 'اللي بغا العسل يصبر لقريص النحل',
			said: 'lli bgha l-3sel ysber l-qris n-n7el',
			meaning: 'whoever wants honey puts up with the bee stings'
		},
		{ arabic: 'اللي فات مات', said: 'lli fat mat', meaning: "what's past is dead. Let it go" },
		{ arabic: 'دير الخير وانساه', said: 'dir l-khir w nsah', meaning: 'do good and forget about it' }
	];

	const game = basics.slice(0, 6).map(card);
</script>

{#snippet list(entries: Entry[])}
	<ul>
		{#each entries as e (e.said)}
			<li>
				<span class="ar-text" lang="ar">{e.arabic}</span> <strong>{e.said}</strong>: {e.meaning}
			</li>
		{/each}
	</ul>
{/snippet}

<BlogArticle
	{post}
	subtitle="Daba, bezzaf, wakha. A few dozen words and phrases that do most of the work in Morocco."
>
	<p>
		Moroccan Arabic, Darija, shares its grammar and much of its vocabulary with other Arabic dialects,
		but the words you hear most often are its own. Many of them come from Amazigh, the indigenous
		language of North Africa, or from French and Spanish. That's why a Moroccan conversation can be
		hard to follow even if you speak Egyptian or Levantine, and why a short list of everyday words
		goes such a long way.
	</p>
	<p>
		(In the transliteration, 3 is <span class="ar-text" lang="ar">ع</span>, 7 is the breathy
		<span class="ar-text" lang="ar">ح</span>, and gh is a gargled r, like the French r.)
	</p>

	<h2>Everyday words</h2>
	{@render list(basics)}

	<BlogGame
		title="Match the Darija words"
		blurb="Six words from above. Flip two cards at a time and match each one to its meaning, or switch to Sound ↔ Arabic and match what you hear."
		accent={pairs.accent}
		deep={pairs.deep}
		showStart={false}
		fullGame={{ href: '/learn/game/memory-pairs', label: 'Play Memory Pairs with more Darija words' }}
	>
		{#snippet children({ signedIn })}
			<MemoryPairs
				pool={game}
				dialect="darija"
				gate={openGate()}
				{signedIn}
				isSubscribed={!!data.isSubscribed}
				accent={pairs.accent}
				deep={pairs.deep}
			/>
		{/snippet}
	</BlogGame>

	<h2>Question words</h2>
	<p>
		These are the words Egyptian and Levantine speakers find most foreign. Egyptian asks
		<strong>eh?</strong> for "what", Levantine <strong>shu?</strong>, Darija <strong>shnu?</strong>.
	</p>
	{@render list(questions)}
	<p>
		<strong>wash</strong> has no English equivalent: put it at the start of a statement and it becomes
		a question. <strong>wash nta mghribi?</strong>, are you Moroccan?
	</p>

	<h2>Words from French and Spanish</h2>
	<p>
		French arrived with the protectorate and stayed in daily life, especially for technology, food and
		transport. Spanish is strongest in the north, around Tangier and Tetouan. These are some of the
		most common:
	</p>
	{@render list(loans)}
	<p>
		Many Moroccans switch between Darija and French mid-sentence. If you speak French, you'll
		understand more Darija than you expect.
	</p>

	<h2>Phrases for getting around</h2>
	{@render list(phrases)}
	<p>
		Darija drops most short vowels, so phrases sound shorter and denser than they look:
		<strong>ma fhemtsh</strong> is three syllables in Egyptian (<strong>mafhimtish</strong>) and two in
		Darija. Listening to it spoken is the fastest way to get used to it.
	</p>

	<h2>Three sayings Moroccans use</h2>
	{@render list(sayings)}

	<h2>Keep going</h2>
	<p>
		The <a href={resolve('/darija/phrases')}>Darija phrasebook</a> has all of these phrases with
		audio, variants for men and women, and example sentences. For a learning plan, see
		<a href={resolve('/blog/how-to-learn-moroccan-arabic')}>how to learn Moroccan Arabic</a>, and if
		you're wondering why Darija sounds so different, read
		<a href={resolve('/blog/can-arabs-understand-darija')}
			>whether other Arabs understand Moroccan Arabic</a
		>.
	</p>
</BlogArticle>
