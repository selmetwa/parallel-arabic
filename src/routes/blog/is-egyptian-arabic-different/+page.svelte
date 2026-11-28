<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'is-egyptian-arabic-different')!;

	const pairs = [
		['What do you want?', 'maadha turiid?', '3ayez eh?'],
		['Where are you going?', 'ila ayna tadh-hab?', 'inta raye7 feen?'],
		["I don't know", 'laa a3rif', 'mish 3aarif'],
		['I will write', 'sa-aktub', '7aktib'],
		['This house', 'haadha l-bayt', 'il-beit da'],
		['Why?', 'limaadha?', 'leh?'],
		['How?', 'kayfa?', 'izzay?'],
		['Now', 'al-aan', 'dilwa2ti']
	];
</script>

<BlogArticle
	{post}
	subtitle="Yes, in sound, grammar and everyday words. No, in that it's still Arabic, and the two meet in the middle every day."
>
	<p>
		When people say "regular Arabic", they usually mean <strong>Modern Standard Arabic</strong>, or
		Fusha: the Arabic of books, news and formal speeches, the same across all Arab countries. Nobody
		speaks it at home. Egyptians speak <strong>Egyptian Arabic</strong>, or Masri, and so does
		everyone in Egyptian films, songs and TV.
	</p>
	<p>
		So the answer is yes, Egyptian Arabic is different, roughly the way spoken Swiss German differs from
		the Standard German Swiss people read and write. The vocabulary
		overlaps heavily, but the sounds, the grammar of everyday sentences and many of the most common
		words change. Here's what actually differs.
	</p>

	<h2>Side by side</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>English</th>
					<th>Modern Standard</th>
					<th>Egyptian</th>
				</tr>
			</thead>
			<tbody>
				{#each pairs as [en, msa, eg] (en)}
					<tr>
						<td>{en}</td>
						<td>{msa}</td>
						<td><strong>{eg}</strong></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p>
		Some words are the same, some are related but worn down, and some, like <strong>3ayez</strong>
		for "want" or <strong>dilwa2ti</strong> for "now", are completely different.
	</p>

	<h2>The sounds</h2>
	<ul>
		<li>
			<span class="ar-text" lang="ar">ج</span> is a hard <strong>g</strong>. Camel is
			<strong>gamal</strong>, not jamal. This is the giveaway that someone is Egyptian.
		</li>
		<li>
			<span class="ar-text" lang="ar">ق</span> becomes a glottal stop. Heart,
			<strong>qalb</strong> in Fusha, is <strong>2alb</strong>. Coffee is
			<strong>2ahwa</strong>.
		</li>
		<li>
			<span class="ar-text" lang="ar">ث</span> (th) becomes <strong>t</strong> or
			<strong>s</strong>: three is <strong>talaata</strong>, and "for example",
			<strong>mathalan</strong>, is <strong>masalan</strong>.
		</li>
		<li>
			<span class="ar-text" lang="ar">ذ</span> (the "th" of "this") becomes <strong>d</strong> or
			<strong>z</strong>: "this" is <strong>da</strong>, not haadha.
		</li>
	</ul>

	<h2>The grammar</h2>
	<ul>
		<li>
			<strong>The present tense takes b-.</strong> "I write" is <strong>baktib</strong>, where Fusha
			says aktub. Without the b-, the verb follows words like "want" and "can":
			<strong>3ayez aktib</strong>, I want to write.
		</li>
		<li>
			<strong>The future takes 7a-.</strong> "I will write" is <strong>7aktib</strong>, where Fusha
			says sa-aktub.
		</li>
		<li>
			<strong>Negation wraps around the verb.</strong> "I didn't write" is
			<strong>ma katabtish</strong>, with ma before and -sh after. Fusha uses separate words: lam
			aktub.
		</li>
		<li>
			<strong>Question words go at the end.</strong> "Where are you going?" is
			<strong>inta raye7 feen?</strong>, "you going where?".
		</li>
		<li>
			<strong>"This" comes after the noun.</strong> <strong>il-beit da</strong>, "the house this".
		</li>
		<li>
			<strong>Case endings disappear.</strong> Fusha marks nouns with -u, -a and -i endings depending
			on their role. Egyptian, like every spoken dialect, drops them.
		</li>
	</ul>

	<h2>Is it a different language?</h2>
	<p>
		Linguists argue about this, but for a learner the practical answer is no. Egyptians read and
		write Fusha at school, hear it on the news and in religion, and mix the two all the time: a TV
		presenter might start a sentence in Fusha and finish it in Masri. If you learn Egyptian, a lot of
		Fusha vocabulary comes for free. If you learn Fusha, Egyptian will sound familiar but you'll
		struggle to follow a conversation at first.
	</p>
	<p>
		And because Egyptian media reaches the whole Arab world, Egyptian is the one dialect that almost
		every Arab understands. That's a big part of why it's the most popular dialect to learn.
	</p>

	<h2>Which should you learn?</h2>
	<p>
		If you want to talk to people, start with a dialect: Egyptian, if you don't have a reason to pick
		another one. If you want to read the news, the Quran or literature, you'll need Fusha. Most
		serious learners end up with some of both. The
		<a href={resolve('/blog/fusha-egyptian-levantine-darija')}
			>comparison of Fusha, Egyptian, Levantine and Darija</a
		> goes into the trade-offs, and the
		<a href={resolve('/egyptian-arabic-vs-fusha')}>Egyptian vs Fusha page</a> sets more words side by
		side.
	</p>
	<p>
		Ready to start? The <a href={resolve('/egyptian-arabic')}>Egyptian Arabic course</a> begins with
		the alphabet and the sounds above, and works up to stories and conversations.
	</p>
</BlogArticle>
