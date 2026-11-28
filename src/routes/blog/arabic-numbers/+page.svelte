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

	const post = blogPosts.find((p) => p.slug === 'arabic-numbers')!;
	const pairs = getGame('memory-pairs')!;

	const card = (id: string, arabic: string, transliteration: string, english: string): GameWord => ({
		id,
		arabic,
		plain: stripArabicDiacritics(arabic),
		english,
		transliteration,
		audioUrl: gameAudioUrl(arabic, 'egyptian-arabic')
	});

	// Egyptian, the dialect most learners start with. Six cards per board.
	const oneToSix = [
		card('1', 'واحِد', 'waa7id', '1'),
		card('2', 'اِتْنين', 'itneen', '2'),
		card('3', 'تَلاتة', 'talaata', '3'),
		card('4', 'أَرْبَعة', 'arba3a', '4'),
		card('5', 'خَمْسة', 'khamsa', '5'),
		card('6', 'سِتّة', 'sitta', '6')
	];

	const digits = [
		['0', '٠', 'صِفْر', 'sifr'],
		['1', '١', 'واحِد', 'waa7id'],
		['2', '٢', 'اِثْنان', 'ithnaan'],
		['3', '٣', 'ثَلاثة', 'thalaatha'],
		['4', '٤', 'أَرْبَعة', 'arba3a'],
		['5', '٥', 'خَمْسة', 'khamsa'],
		['6', '٦', 'سِتّة', 'sitta'],
		['7', '٧', 'سَبْعة', 'sab3a'],
		['8', '٨', 'ثَمانِية', 'thamaaniya'],
		['9', '٩', 'تِسْعة', 'tis3a'],
		['10', '١٠', 'عَشَرة', '3ashara']
	];

	// Transliteration only, so seven dialects fit across a phone screen.
	const dialects = ['Egyptian', 'Levantine', 'Darija', 'Iraqi', 'Gulf', 'Saudi'];
	const oneToTen = [
		['1', 'waa7id', 'waa7ad', 'wa7ed', 'waa7id', 'waa7id', 'waa7id'],
		['2', 'itneen', 'tnein', 'jooj', 'thneen', 'ithnain', 'itnein'],
		['3', 'talaata', 'tlaate', 'tlata', 'tlaatha', 'thalaatha', 'talaata'],
		['4', 'arba3a', 'arb3a', 'rb3a', 'arba3a', 'arba3a', 'arba3a'],
		['5', 'khamsa', 'khamse', 'khamsa', 'khamsa', 'khamsa', 'khamsa'],
		['6', 'sitta', 'sitte', 'stta', 'sitta', 'sitta', 'sitta'],
		['7', 'sab3a', 'sab3a', 'sb3a', 'sab3a', 'sab3a', 'sab3a'],
		['8', 'tamanya', 'tmanye', 'tmnya', 'thmanya', 'thamanya', 'tamanya'],
		['9', 'tis3a', 'tis3a', 'ts3od', 'tis3a', 'tis3a', 'tis3a'],
		['10', '3ashara', '3ashra', '3ashra', '3ashra', '3ashara', '3ashara']
	];

	const teens = [
		['11', '7idaashar', '7da3sh', '7daash'],
		['12', 'itnaashar', 'tna3sh', 'tnaash'],
		['13', 'talattaashar', 'tlatta3sh', 'tlettaash'],
		['14', 'arba3taashar', 'arba3ta3sh', 'rb3taash'],
		['15', 'khamastaashar', 'khamsta3sh', 'khmstaash'],
		['16', 'sittaashar', 'sitta3sh', 'sttaash'],
		['17', 'saba3taashar', 'saba3ta3sh', 'sb3taash'],
		['18', 'tamantaashar', 'tmanta3sh', 'tmntaash'],
		['19', 'tisa3taashar', 'tis3ta3sh', 'ts3taash']
	];

	const tens = [
		['20', '3ishreen', '3ishreen', '3ishreen', '3ishruun'],
		['30', 'talateen', 'tlateen', 'tlateen', 'thalaathuun'],
		['40', 'arbe3een', 'arb3een', 'rb3een', 'arba3uun'],
		['50', 'khamseen', 'khamseen', 'khamseen', 'khamsuun'],
		['60', 'sitteen', 'sitteen', 'stteen', 'sittuun'],
		['70', 'sab3een', 'sab3een', 'sb3een', 'sab3uun'],
		['80', 'tamaneen', 'tmaneen', 'tmaneen', 'thamaanuun'],
		['90', 'tis3een', 'tis3een', 'ts3een', 'tis3uun'],
		['100', 'miyya', 'miyye', 'mya', 'mi2a']
	];
</script>

<BlogArticle
	{post}
	subtitle="Ten words get you most of the way. The dialects disagree on two and eight, and they all agree that 21 is one-and-twenty."
>
	<p>
		Arabic numbers are easier than they look. There are ten digits, the words for one to ten are
		almost the same in every dialect, and the numbers above twenty are built from parts you already
		know. This post covers the digits, the words in seven dialects, and the one grammar rule about
		which form of the noun comes after a number.
	</p>
	<p>
		(In the transliteration, 3 is the <span class="ar-text" lang="ar">ع</span> sound, 7 is the
		breathy <span class="ar-text" lang="ar">ح</span>, and 2 is the glottal stop, the catch in the
		middle of "uh-oh".)
	</p>

	<h2>The Arabic digits</h2>
	<p>
		The digits used in Egypt, the Levant, Iraq and the Gulf are the Eastern Arabic numerals, and
		they're what you'll see on prices, phone numbers and number plates. Morocco, Algeria and Tunisia
		use the same 0–9 as English. Either way, <strong>numbers are written left to right</strong>, even
		inside right-to-left Arabic text, so ١٢٥ is 125.
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Number</th>
					<th>Digit</th>
					<th>Word</th>
					<th>Said</th>
				</tr>
			</thead>
			<tbody>
				{#each digits as [n, digit, word, said] (n)}
					<tr>
						<td>{n}</td>
						<td><span class="ar-text" lang="ar">{digit}</span></td>
						<td><span class="ar-text" lang="ar">{word}</span></td>
						<td>{said}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p>
		Those are the Modern Standard Arabic words, the ones you'd read in a newspaper. Two digits are
		easy to mix up: <span class="ar-text" lang="ar">٥</span> is 5 (not 0), and
		<span class="ar-text" lang="ar">٦</span> is 6. Zero is a small dot,
		<span class="ar-text" lang="ar">٠</span>.
	</p>

	<h2>One to ten in seven dialects</h2>
	<p>
		Here are the six spoken dialects; the seventh, Fusha, is in the table above. Spoken Arabic
		barely changes for the small numbers. The differences come from how each dialect
		pronounces the letter <span class="ar-text" lang="ar">ث</span> (th): Egyptian and Saudi Hijazi
		turn it into a t, so three is <strong>talaata</strong>, while Iraqi and Gulf keep the th. Darija
		drops most of the short vowels and has its own word for two.
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th></th>
					{#each dialects as d (d)}
						<th>{d}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each oneToTen as [n, ...words] (n)}
					<tr>
						<td><strong>{n}</strong></td>
						{#each words as w, i (i)}
							<td>{w}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p>
		The two that stand out are Moroccan <span class="ar-text" lang="ar">جوج</span>
		<strong>jooj</strong> for two, and <span class="ar-text" lang="ar">تسعود</span>
		<strong>ts3od</strong> for nine. Everywhere else, if you can count to ten in one dialect you can
		count to ten in all of them.
	</p>

	<BlogGame
		title="Match one to six"
		blurb="The Egyptian numbers from above. Match each word to its digit, or switch to Sound ↔ Arabic and match what you hear."
		accent={pairs.accent}
		deep={pairs.deep}
		showStart={false}
		fullGame={{ href: '/learn/game/memory-pairs', label: 'Play Memory Pairs with more Egyptian words' }}
	>
		{#snippet children({ signedIn })}
			<MemoryPairs
				pool={oneToSix}
				dialect="egyptian-arabic"
				gate={openGate()}
				{signedIn}
				isSubscribed={!!data.isSubscribed}
				accent={pairs.accent}
				deep={pairs.deep}
			/>
		{/snippet}
	</BlogGame>

	<h2>Eleven to nineteen</h2>
	<p>
		The teens are the number plus a squashed form of ten: <strong>-aashar</strong> in Egyptian,
		<strong>-a3sh</strong> in Levantine, <strong>-aash</strong> in Darija. Say them quickly and they
		run together into one word.
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th></th>
					<th>Egyptian</th>
					<th>Levantine</th>
					<th>Darija</th>
				</tr>
			</thead>
			<tbody>
				{#each teens as [n, eg, lev, ma] (n)}
					<tr>
						<td><strong>{n}</strong></td>
						<td>{eg}</td>
						<td>{lev}</td>
						<td>{ma}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p>
		Iraqi, Gulf and Saudi Arabic follow the Levantine pattern: eleven is <strong>7da3ash</strong> and
		twelve is <strong>thna3ash</strong> in Iraq and the Gulf, and <strong>7da3sh</strong> and
		<strong>itna3sh</strong> in the Hijaz.
	</p>

	<h2>The tens, and a hundred</h2>
	<p>
		From twenty up, the tens are the unit plus <strong>-een</strong>: four is arba3a, forty is
		arbe3een. Modern Standard Arabic uses <strong>-uun</strong> instead, which is the one place the
		written and spoken numbers clearly differ.
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th></th>
					<th>Egyptian</th>
					<th>Levantine</th>
					<th>Darija</th>
					<th>Fusha</th>
				</tr>
			</thead>
			<tbody>
				{#each tens as [n, eg, lev, ma, fu] (n)}
					<tr>
						<td><strong>{n}</strong></td>
						<td>{eg}</td>
						<td>{lev}</td>
						<td>{ma}</td>
						<td>{fu}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p>
		A hundred is <span class="ar-text" lang="ar">مِيّة</span> <strong>miyya</strong> in speech and
		<span class="ar-text" lang="ar">مِئة</span> <strong>mi2a</strong> in writing. Two hundred uses
		the "two of" ending: <strong>miteen</strong>. A thousand is <strong>alf</strong> everywhere.
	</p>

	<h2>21 to 99: the units come first</h2>
	<p>
		This is the one thing that trips up English speakers. Arabic says the units before the tens,
		joined by <strong>w</strong>, "and", the way old English said "four and twenty blackbirds".
	</p>
	<ul>
		<li><strong>21</strong>: waa7id w 3ishreen, "one and twenty"</li>
		<li><strong>35</strong>: khamsa w talateen, "five and thirty"</li>
		<li><strong>99</strong>: tis3a w tis3een, "nine and ninety"</li>
		<li>
			<strong>150</strong>: miyya w khamseen. Hundreds come first, then units, then tens: 365 is
			<strong>tultumiyya khamsa w sitteen</strong>.
		</li>
	</ul>
	<p>
		Prices are where you'll hear this most. In a Cairo shop, <strong>khamsa w 3ishreen</strong> is
		25 pounds, and you'll often catch the unit before you've worked out the ten.
	</p>

	<h2>Which form of the noun comes next</h2>
	<p>
		Arabic nouns change form depending on how many there are. Spoken Arabic keeps this simple, but
		you'll still hear it in every sentence with a number in it:
	</p>
	<ul>
		<li>
			<strong>One</strong>: the noun, then the number, if you want to stress it.
			<strong>kitaab waa7id</strong>, one book.
		</li>
		<li>
			<strong>Two</strong>: the dual ending, <strong>-een</strong>, with no number at all.
			<strong>kitabeen</strong>, two books.
		</li>
		<li>
			<strong>Three to ten</strong>: a short form of the number, then the plural.
			<strong>talat kutub</strong>, three books; <strong>khamas sanawaat</strong>, five years.
		</li>
		<li>
			<strong>Eleven and up</strong>: the number, then the singular.
			<strong>7idaashar kitaab</strong>, eleven book; <strong>miyya geneeh</strong>, a hundred
			pound.
		</li>
	</ul>
	<p>
		Darija does it differently: two is <strong>jooj d</strong> plus the plural,
		<strong>jooj d-l-ktub</strong>, and three to ten take a <strong>d-</strong> too:
		<strong>tlata d-l-ktub</strong>.
	</p>

	<h2>Where to go next</h2>
	<p>
		Numbers stick when you use them. The <a href={resolve('/egyptian-arabic/phrases/how-much-is-this')}
			>"how much is this?" phrase</a
		> in the Egyptian phrasebook gets you asking prices, and the
		<a href={resolve('/lessons/structured/egyptian-arabic')}>Egyptian lessons</a> cover numbers,
		prices and time in order. For the other dialects, the
		<a href={resolve('/levantine/phrases')}>Levantine</a> and
		<a href={resolve('/darija/phrases')}>Darija</a> phrasebooks have the same phrases with audio.
	</p>
</BlogArticle>
