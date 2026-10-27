<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import BlogGame from '$lib/components/blog/BlogGame.svelte';
	import DialectMatch from '$lib/components/games/DialectMatch.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';
	import { getGame } from '$lib/constants/games';
	import { DIALECT_OPTIONS, saveDialect } from '$lib/games/themes';

	let { data } = $props();

	const post = blogPosts.find((p) => p.slug === 'fusha-egyptian-levantine-darija')!;
	const game = getGame('dialect-match')!;
</script>

<BlogArticle {post} subtitle="Four Arabics, one alphabet, and the handful of words that give each one away.">
	<p>
		Every Arabic course makes you choose before you've heard any of it. Egyptian, Levantine, Moroccan
		Darija, or Modern Standard Arabic, which most people call Fusha. The descriptions all sound
		reasonable and it is hard to tell from a paragraph which one you actually want.
	</p>
	<p>
		So this post does it the other way round. A short description of each, the words that give
		each one away, and then a game so you can find out whether you can already hear the difference.
		Most people can after about ten minutes. The tells are that consistent.
	</p>

	<h2>The short version</h2>
	<ul>
		<li>
			<strong>Fusha</strong> is the written standard: news, books, signs, speeches, the Quran in its
			classical form. Everyone who went to school in an Arab country reads it. Nobody speaks it at
			home.
		</li>
		<li>
			<strong>Egyptian</strong> is spoken by over a hundred million people in Egypt, and understood
			far beyond it, because Egyptian film, television and music have been everywhere for a century.
		</li>
		<li>
			<strong>Levantine</strong> covers Syria, Lebanon, Jordan and Palestine. City to city it shifts
			a little, but someone from Amman and someone from Beirut understand each other without effort.
		</li>
		<li>
			<strong>Darija</strong> is Moroccan Arabic. It drops vowels, borrows from French and Amazigh,
			and is the one the other three find hardest to follow.
		</li>
	</ul>
	<p>
		The three spoken dialects are not slang versions of Fusha. They are full languages with their
		own grammar (compare the grammar guides for
		<a href={resolve('/grammar/egyptian-arabic')}>Egyptian</a>,
		<a href={resolve('/grammar/levantine')}>Levantine</a>,
		<a href={resolve('/grammar/darija')}>Darija</a> and <a href={resolve('/grammar/fusha')}>Fusha</a>),
		and they share most of their vocabulary with Fusha and each other. What separates
		them is a small set of very common words, and a few sounds.
	</p>

	<h2>The words that give it away</h2>
	<p>
		You can identify most sentences from one word. These are the ones to listen for, because they
		come up constantly:
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
				<tr>
					<th>what?</th>
					<td><span class="ar-text" lang="ar">إيه</span> eh</td>
					<td><span class="ar-text" lang="ar">شو</span> shu</td>
					<td><span class="ar-text" lang="ar">شنو</span> shnu</td>
					<td><span class="ar-text" lang="ar">ماذا</span> madha</td>
				</tr>
				<tr>
					<th>I want</th>
					<td><span class="ar-text" lang="ar">عايز</span> 3ayiz</td>
					<td><span class="ar-text" lang="ar">بدّي</span> baddi</td>
					<td><span class="ar-text" lang="ar">بغيت</span> bghit</td>
					<td><span class="ar-text" lang="ar">أريد</span> uridu</td>
				</tr>
				<tr>
					<th>now</th>
					<td><span class="ar-text" lang="ar">دلوقتي</span> dilwa2ti</td>
					<td><span class="ar-text" lang="ar">هلّق</span> hallaq</td>
					<td><span class="ar-text" lang="ar">دابا</span> daba</td>
					<td><span class="ar-text" lang="ar">الآن</span> al-2ana</td>
				</tr>
				<tr>
					<th>why?</th>
					<td><span class="ar-text" lang="ar">ليه</span> leh</td>
					<td><span class="ar-text" lang="ar">ليش</span> laysh</td>
					<td><span class="ar-text" lang="ar">علاش</span> 3lash</td>
					<td><span class="ar-text" lang="ar">لماذا</span> limadha</td>
				</tr>
				<tr>
					<th>how much?</th>
					<td><span class="ar-text" lang="ar">بكام</span> bikam</td>
					<td><span class="ar-text" lang="ar">قدّيش</span> 2addaysh</td>
					<td><span class="ar-text" lang="ar">بشحال</span> bsh7al</td>
					<td><span class="ar-text" lang="ar">بكم</span> bikam</td>
				</tr>
				<tr>
					<th>this</th>
					<td><span class="ar-text" lang="ar">ده</span> da</td>
					<td><span class="ar-text" lang="ar">هيدا</span> hayda</td>
					<td><span class="ar-text" lang="ar">هادا</span> hada</td>
					<td><span class="ar-text" lang="ar">هذا</span> hadha</td>
				</tr>
				<tr>
					<th>very</th>
					<td><span class="ar-text" lang="ar">أوي</span> awi</td>
					<td><span class="ar-text" lang="ar">كتير</span> ktir</td>
					<td><span class="ar-text" lang="ar">بزاف</span> bezzaf</td>
					<td><span class="ar-text" lang="ar">جدًّا</span> jiddan</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		A few patterns are worth noticing. Fusha words are longer and end in vowels the dialects have
		dropped (<em>uridu</em> against <em>baddi</em>). Egyptian and Fusha sometimes agree, as with
		<em>bikam</em>, which is why Egyptian feels like the easiest bridge for people who learned
		Fusha first. Darija is the odd one out more often than not: <em>bghit</em>, <em>daba</em> and
		<em>bezzaf</em> have no lookalike in the other three.
	</p>
	<p>
		The numbers in the transliteration are the ones Arabic speakers use when texting: 3 is
		<span class="ar-text" lang="ar">ع</span>, 7 is <span class="ar-text" lang="ar">ح</span>, and 2
		is the glottal stop. There's <a href={resolve('/blog/franco-arabic')}>a whole post on why</a>.
	</p>

	<BlogGame
		title="Warm-up: which dialect is this?"
		blurb="Ten questions built from the words in the table above. Pick the dialect each one belongs to."
		accent={game.accent}
		deep={game.deep}
		roundLabel="10 questions"
		fullGame={{ href: '/learn/game/dialect-match', label: 'Play the full Dialect Match' }}
	>
		{#snippet children({ signedIn, onPlayAgain })}
			<DialectMatch items={data.warmUp} {signedIn} accent={game.accent} deep={game.deep} {onPlayAgain} />
		{/snippet}
	</BlogGame>

	<h2>The sounds that give it away</h2>
	<p>
		Words are the easy tell. Once you can hear these three letters, you can place a speaker from a
		single sentence even when the vocabulary overlaps.
	</p>
	<ul>
		<li>
			<strong><span class="ar-text" lang="ar">ق</span> (qaf).</strong> Fusha says a deep
			<em>q</em> from the back of the throat. Egyptians and city Levantines replace it with a glottal
			stop, so <em>qalb</em> (heart) becomes <em>2alb</em>. In Jordan, in rural Palestine and among
			Bedouin speakers it turns into a <em>g</em>: <em>galb</em>.
		</li>
		<li>
			<strong><span class="ar-text" lang="ar">ج</span> (jim).</strong> Egyptians say a hard
			<em>g</em>: <em>gamal</em>, a camel. In Lebanon and Syria it softens to the <em>s</em> in
			"measure": <em>zhamal</em>. Fusha, Jordan and Darija keep <em>j</em>.
		</li>
		<li>
			<strong><span class="ar-text" lang="ar">ث</span> (tha).</strong> Fusha keeps the
			<em>th</em> of "think". Egyptian and Levantine usually make it <em>t</em> or <em>s</em>:
			<em>talata</em>, three, against Fusha <em>thalatha</em>.
		</li>
	</ul>
	<p>
		And Darija has a sound you'll notice before any of these: it drops short vowels so freely that
		words turn into clusters of consonants. <em>Mzyan</em>, good, is two syllables at most. That
		alone tells you you're hearing Moroccan.
	</p>

	<h2>Now with the whole set</h2>
	<p>
		The second round draws from everything Dialect Match knows: about thirty everyday words,
		forty things you'd find in a kitchen or a restaurant, and the phrasebook. Some questions are
		recordings, so this is where the sounds above come in.
	</p>

	<BlogGame
		title="Ten more: some read, some heard"
		blurb="Mixed questions: which dialect is this word, which one did you hear, and how does each dialect say a given thing."
		accent={game.accent}
		deep={game.deep}
		roundLabel="10 questions"
		fullGame={{ href: '/learn/game/dialect-match', label: 'Keep going in Dialect Match' }}
	>
		{#snippet children({ signedIn, onPlayAgain })}
			<DialectMatch items={data.allItems} {signedIn} accent={game.accent} deep={game.deep} {onPlayAgain} />
		{/snippet}
	</BlogGame>

	<h2>So which one should you learn?</h2>
	<p>It depends almost entirely on who you want to talk to.</p>
	<ul>
		<li>
			<strong>Family, a partner, friends:</strong> learn their dialect, full stop. Nobody wants to
			be spoken to in news Arabic over dinner.
		</li>
		<li>
			<strong>No particular place in mind:</strong> Egyptian. It has the most speakers and the most
			films and series to learn from, and almost every Arab has heard enough of it to follow you.
		</li>
		<li>
			<strong>Living in Jordan, Lebanon, Syria or Palestine:</strong> Levantine.
		</li>
		<li>
			<strong>Living in Morocco:</strong> Darija. Fusha will help you read the signs and not much
			else.
		</li>
		<li>
			<strong>Reading, religion, or Arabic literature:</strong> Fusha. Add a dialect later if you
			want to talk to people too.
		</li>
	</ul>
	<p>
		Whichever you choose, you'll pick up some Fusha along the way, because it's what's written
		down. The reverse isn't true: years of Fusha won't teach you to say <em>shu baddak</em>.
	</p>
	<p>Pick one and every game will start in it:</p>
	<div class="dialect-links">
		{#each DIALECT_OPTIONS as option (option.value)}
			<a href={resolve('/learn/game')} class="dialect-link" onclick={() => saveDialect(option.value)}>
				<span aria-hidden="true">{option.emoji}</span>
				{option.label}
			</a>
		{/each}
	</div>
</BlogArticle>

<style>
	.dialect-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	/* Beats the article's link style. */
	.dialect-links .dialect-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.5rem 1rem;
		font-weight: 600;
		color: var(--text1);
		text-decoration: none;
	}

	.dialect-links .dialect-link:hover {
		border-color: var(--brand);
	}
</style>
