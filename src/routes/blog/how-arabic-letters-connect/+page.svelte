<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import BlogGame from '$lib/components/blog/BlogGame.svelte';
	import LetterHunt from '$lib/components/games/LetterHunt.svelte';
	import WordScramble from '$lib/components/games/WordScramble.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';
	import { getGame } from '$lib/constants/games';
	import { openGate } from '$lib/games/open-gate';
	import { wordFor } from '$lib/games/room-hunt/round';

	let { data } = $props();

	const post = blogPosts.find((p) => p.slug === 'how-arabic-letters-connect')!;
	const letterHunt = getGame('letter-hunt')!;
	const scramble = getGame('word-scramble')!;

	// Short words from Room Hunt, several with a letter that won't join forwards
	// (باب, شاي, خبز, كرسي), so the gaps from the post turn up in the tiles.
	const pool = [
		'door',
		'tea',
		'fish',
		'salt',
		'bread',
		'chair',
		'plate',
		'fork',
		'knife',
		'window',
		'spoon',
		'cake',
		'lamp',
		'mirror'
	].map((id) => wordFor(id, 'fusha'));
</script>

<BlogArticle
	{post}
	subtitle="Why كتاب doesn't look like ك + ت + ا + ب, and the six letters that leave gaps in the middle of words."
>
	<p>
		You learn the alphabet from a chart: twenty-eight letters, each in its own box. Then you look
		at a real word and can't find half of them. <span class="ar-text" lang="ar">كتاب</span> (kitab,
		a book) is four letters from the chart, and only the last one looks anything like its box.
	</p>
	<p>
		Nothing is wrong with you or the chart. Arabic is always joined up, in print as well as by hand,
		and letters change shape to join. Once you know the three rules below, the shapes stop being
		random.
	</p>

	<h2>Rule 1: every letter has up to four shapes</h2>
	<p>
		A letter's shape depends on where it sits: alone, at the start of a word, in the middle, or at
		the end. The chart shows the alone shape, which is the one you'll see least.
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Letter</th>
					<th>Alone</th>
					<th>Start</th>
					<th>Middle</th>
					<th>End</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>3ayn</th>
					<td><span class="ar-text" lang="ar">ع</span></td>
					<td><span class="ar-text" lang="ar">عـ</span></td>
					<td><span class="ar-text" lang="ar">ـعـ</span></td>
					<td><span class="ar-text" lang="ar">ـع</span></td>
				</tr>
				<tr>
					<th>ha</th>
					<td><span class="ar-text" lang="ar">ه</span></td>
					<td><span class="ar-text" lang="ar">هـ</span></td>
					<td><span class="ar-text" lang="ar">ـهـ</span></td>
					<td><span class="ar-text" lang="ar">ـه</span></td>
				</tr>
				<tr>
					<th>kaf</th>
					<td><span class="ar-text" lang="ar">ك</span></td>
					<td><span class="ar-text" lang="ar">كـ</span></td>
					<td><span class="ar-text" lang="ar">ـكـ</span></td>
					<td><span class="ar-text" lang="ar">ـك</span></td>
				</tr>
				<tr>
					<th>ya</th>
					<td><span class="ar-text" lang="ar">ي</span></td>
					<td><span class="ar-text" lang="ar">يـ</span></td>
					<td><span class="ar-text" lang="ar">ـيـ</span></td>
					<td><span class="ar-text" lang="ar">ـي</span></td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		The good news is that for most letters the change is a trimmed tail, not a new letter. The
		start and middle shapes lose the flourish at the end so they can join onto the next letter.
		<span class="ar-text" lang="ar">ه</span> is the exception everybody complains about: its four
		shapes barely resemble each other, so it's worth learning on its own.
	</p>

	<h2>Rule 2: some letters are only told apart by dots</h2>
	<p>
		Trim the tails off and several letters share the same body.
		<span class="ar-text" lang="ar">ب ت ث ن ي</span> all become the same small tooth at the start
		or in the middle of a word, with one dot below, two above, three above, one above, or two below.
		<span class="ar-text" lang="ar">ج ح خ</span> share a body, and so do
		<span class="ar-text" lang="ar">د ذ</span>, <span class="ar-text" lang="ar">ر ز</span>,
		<span class="ar-text" lang="ar">س ش</span>, <span class="ar-text" lang="ar">ص ض</span>,
		<span class="ar-text" lang="ar">ط ظ</span> and <span class="ar-text" lang="ar">ع غ</span>.
	</p>
	<p>
		This is where most early reading mistakes come from, so it's what the game below drills: the
		wrong answers are always letters with the same body and different dots.
	</p>

	<BlogGame
		title="Find the right shape"
		blurb="Ten letters. Name a letter from one of its shapes, pick its shape for a position in a word, or tap the letter you hear."
		accent={letterHunt.accent}
		deep={letterHunt.deep}
		roundLabel="10 letters"
		fullGame={{ href: '/learn/game/letter-hunt', label: 'Play the full Letter Hunt' }}
	>
		{#snippet children({ signedIn, onPlayAgain })}
			<LetterHunt {signedIn} accent={letterHunt.accent} deep={letterHunt.deep} {onPlayAgain} />
		{/snippet}
	</BlogGame>

	<h2>Rule 3: six letters never join forwards</h2>
	<p>
		This is the rule the chart never mentions and the one that explains the gaps. Six letters join
		to the letter before them but never to the letter after:
	</p>
	<p class="six" lang="ar" dir="rtl">ا د ذ ر ز و</p>
	<p>
		So after any of them, the next letter starts again as if it were the start of a new word, even
		though it isn't. That's why Arabic words have gaps in the middle:
	</p>
	<ul>
		<li>
			<span class="ar-text" lang="ar">كتاب</span> kitab: <span class="ar-text" lang="ar">كـ</span>
			joins <span class="ar-text" lang="ar">ـتـ</span> joins <span class="ar-text" lang="ar">ـا</span>,
			and then alif stops. The final <span class="ar-text" lang="ar">ب</span> stands on its own, in
			its alone shape.
		</li>
		<li>
			<span class="ar-text" lang="ar">دار</span> dar, a house: three letters, and none of them is
			joined forwards, so all three stand apart.
		</li>
		<li>
			<span class="ar-text" lang="ar">ورد</span> ward, roses: the same again. A word can be made
			entirely of non-joining letters.
		</li>
		<li>
			<span class="ar-text" lang="ar">مدرسة</span> madrasa, a school: <span class="ar-text" lang="ar">مد</span>,
			a gap, <span class="ar-text" lang="ar">ر</span>, a gap, <span class="ar-text" lang="ar">سة</span>.
			One word, three pieces.
		</li>
	</ul>
	<p>
		A gap inside a word is not a space between words. Spaces between words are wider, and with a
		little practice your eye separates the two without trying.
	</p>
	<p>
		One last thing: <span class="ar-text" lang="ar">ل</span> followed by
		<span class="ar-text" lang="ar">ا</span> is always written as the single shape
		<span class="ar-text" lang="ar">لا</span> (la). It's the only joined pair you have to learn as a
		shape of its own.
	</p>

	<h2>Putting words back together</h2>
	<p>
		The best way to make the rules stick is to build words from their letters and watch the shapes
		change as you go. In the game below, each word is broken into tiles. Tap them in order, right to
		left, and the word joins up as you build it. Several of the words have a non-joining letter, so
		look out for the gap.
	</p>

	<BlogGame
		title="Build the word"
		blurb="Five words, each scrambled into letters. Tap the letters in order to put the word back together."
		accent={scramble.accent}
		deep={scramble.deep}
		showStart={false}
		fullGame={{ href: '/learn/game/word-scramble', label: 'Play Word Scramble with your own topics' }}
	>
		{#snippet children({ signedIn })}
			<WordScramble
				{pool}
				dialect="fusha"
				gate={openGate()}
				{signedIn}
				isSubscribed={!!data.isSubscribed}
				accent={scramble.accent}
				deep={scramble.deep}
			/>
		{/snippet}
	</BlogGame>

	<h2>Typing it</h2>
	<p>
		You never pick a shape when you type Arabic. You press the letter and the font chooses the shape
		from its neighbours, gaps included. If you don't have an Arabic layout, the
		<a href={resolve('/keyboard')}>phonetic keyboard</a> maps English keys to Arabic sounds, so you
		can type by sound instead of hunting for letters.
	</p>
	<p>
		And if you're still learning which letter is which, the
		<a href={resolve('/alphabet')}>alphabet page</a> plays every letter's sound and shows all four
		shapes side by side.
	</p>
</BlogArticle>

<style>
	.six {
		font-size: 2rem;
		letter-spacing: 0.4em;
		text-align: center;
		color: var(--text1);
	}
</style>
