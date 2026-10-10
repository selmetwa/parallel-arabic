<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import BlogGame from '$lib/components/blog/BlogGame.svelte';
	import HarakatPick from '$lib/components/games/HarakatPick.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';
	import { VOCAB, wordFor } from '$lib/games/room-hunt/round';

	const post = blogPosts.find((p) => p.slug === 'harakat-arabic-vowel-marks')!;

	// Room Hunt's Fusha words: fully voweled, each with a native recording.
	const words = Object.keys(VOCAB).map((id) => wordFor(id, 'fusha'));
	const accent = '#8b5cf6';
	const deep = '#6d28d9';
</script>

<BlogArticle
	{post}
	subtitle="The small marks that tell you how to say a word, why they usually aren't there, and how to type them."
>
	<p>
		Arabic writes its long vowels as letters and mostly leaves the short ones out.
		<span class="ar-text" lang="ar">كتب</span> is three consonants, k-t-b, and on its own it could be
		<em>kataba</em> (he wrote), <em>kutub</em> (books) or <em>kutiba</em> (it was written). A native
		reader knows which from the sentence. A learner doesn't.
	</p>
	<p>
		The marks that fill the gap are called <strong>harakat</strong>, or
		<strong>tashkeel</strong> for the whole system. There are only a handful, and you can learn to
		read them in an afternoon. Learning to hear them is the part that takes practice, so this post
		finishes with a game for exactly that.
	</p>

	<h2>The marks</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Mark</th>
					<th>Name</th>
					<th>Sound</th>
					<th>Example</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><span class="ar-text mark" lang="ar">بَ</span></td>
					<td>fatha</td>
					<td>short <em>a</em>, a small line above</td>
					<td><span class="ar-text" lang="ar">سَمَك</span> samak, fish</td>
				</tr>
				<tr>
					<td><span class="ar-text mark" lang="ar">بِ</span></td>
					<td>kasra</td>
					<td>short <em>i</em>, a small line below</td>
					<td><span class="ar-text" lang="ar">مِلْح</span> mil7, salt</td>
				</tr>
				<tr>
					<td><span class="ar-text mark" lang="ar">بُ</span></td>
					<td>damma</td>
					<td>short <em>u</em>, a small curl above</td>
					<td><span class="ar-text" lang="ar">خُبْز</span> khubz, bread</td>
				</tr>
				<tr>
					<td><span class="ar-text mark" lang="ar">بْ</span></td>
					<td>sukun</td>
					<td>no vowel after the letter, a small circle above</td>
					<td><span class="ar-text" lang="ar">قِدْر</span> qidr, a pot</td>
				</tr>
				<tr>
					<td><span class="ar-text mark" lang="ar">بّ</span></td>
					<td>shadda</td>
					<td>the letter is doubled, a small w above</td>
					<td><span class="ar-text" lang="ar">سِكِّين</span> sikkin, a knife</td>
				</tr>
				<tr>
					<td><span class="ar-text mark" lang="ar">بً بٍ بٌ</span></td>
					<td>tanween</td>
					<td>a doubled vowel: <em>-an</em>, <em>-in</em>, <em>-un</em> at the end of a word</td>
					<td><span class="ar-text" lang="ar">شُكْرًا</span> shukran, thanks</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		Shadda sits on top of the vowel marks rather than replacing them, so a doubled letter with a
		short <em>a</em> carries both: <span class="ar-text" lang="ar">ثَلَّاجَة</span> thallaja, a
		fridge, has a shadda and a fatha on its <span class="ar-text" lang="ar">ل</span>.
	</p>

	<h2>Why you almost never see them</h2>
	<p>
		Open an Arabic newspaper, a menu or a text message and there will be no harakat at all, apart
		from the odd shadda or a mark added where a word would otherwise be ambiguous. Adults who grew
		up reading Arabic don't need them, in the same way you don't need stress marks to know how to
		say "record" in "record a song".
	</p>
	<p>You will see them in full in four places:</p>
	<ul>
		<li>the Quran, where every vowel is marked so nothing can be misread;</li>
		<li>children's books and school textbooks;</li>
		<li>dictionaries, and poetry where the metre matters;</li>
		<li>material written for learners.</li>
	</ul>
	<p>
		So harakat are scaffolding. They're how you learn a word's pronunciation in the first place.
		After that the word is in your head and the bare letters are enough, which is why a learner's
		goal isn't to read harakat forever but to need them less every month.
	</p>
	<p>
		One thing to know if you learn a dialect: the spoken dialects drop most of Fusha's final vowels
		and shift some of the inner ones, so dialect words are often written with fewer marks, or with
		the vowels the dialect actually uses. The marks always follow the pronunciation, not the other
		way round.
	</p>

	<h2>Hearing them</h2>
	<p>
		Reading the marks is a lookup. Hearing them is a skill, because short vowels are short: in
		normal speech the difference between <em>a</em> and <em>i</em> in an unstressed syllable is easy
		to miss. The way to get better at it is to listen to a word and check what you heard
		against the spelling, many times, with words you'll actually use.
	</p>
	<p>
		That's what the game below does. You hear a recorded word in Modern Standard Arabic, and pick
		which of three spellings matches. The letters are identical in all three. Only the harakat
		change.
	</p>

	<BlogGame
		title="Hear it, pick the vowels"
		blurb="Eight recorded words. Same letters in every option, different vowel marks. Turn your sound on."
		{accent}
		{deep}
		roundLabel="8 words"
		fullGame={{ href: '/learn/game/listen-and-spell', label: 'Next: hear a word, pick its spelling in Listen & Spell' }}
	>
		{#snippet children({ signedIn, onPlayAgain })}
			<HarakatPick {words} dialect="fusha" {signedIn} {accent} {deep} {onPlayAgain} />
		{/snippet}
	</BlogGame>

	<h2>How to type them</h2>
	<p>
		On a standard Arabic keyboard the harakat are on the shift layer. With the Windows "Arabic
		(101)" layout:
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Mark</th>
					<th>Keys</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>fatha <span class="ar-text" lang="ar">َ</span></td><td>Shift + Q</td></tr>
				<tr><td>damma <span class="ar-text" lang="ar">ُ</span></td><td>Shift + E</td></tr>
				<tr><td>kasra <span class="ar-text" lang="ar">ِ</span></td><td>Shift + A</td></tr>
				<tr><td>sukun <span class="ar-text" lang="ar">ْ</span></td><td>Shift + X</td></tr>
				<tr><td>shadda <span class="ar-text" lang="ar">ّ</span></td><td>Shift + the ذ key (left of 1)</td></tr>
				<tr>
					<td>tanween <span class="ar-text" lang="ar">ً ٌ ٍ</span></td>
					<td>Shift + W, Shift + R, Shift + S</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		Type the letter first, then its mark. For a doubled letter with a vowel, type the shadda and
		then the vowel. Other layouts, including the ones on Mac and on phones, put the marks in
		different places; your system's keyboard viewer will show you where.
	</p>
	<p>
		If you don't have an Arabic layout, or don't want to learn one, the
		<a href={resolve('/keyboard')}>phonetic keyboard</a> on this site types Arabic from English
		letters by sound. For harakat, add <strong>=</strong> after the vowel: <strong>a=</strong> for
		fatha, <strong>i=</strong> for kasra, <strong>u=</strong> for damma, <strong>h=</strong> for
		sukun and <strong>s=</strong> for shadda.
		<a href={resolve('/blog/writing-arabic-in-english')}>How it works, and why those keys</a>.
	</p>
</BlogArticle>

<style>
	.mark {
		font-size: 1.6rem;
	}
</style>
