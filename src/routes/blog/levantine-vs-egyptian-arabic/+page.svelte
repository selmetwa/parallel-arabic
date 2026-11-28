<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'levantine-vs-egyptian-arabic')!;

	const sentences = [
		["What's your name?", 'ismak eh?', 'shu ismak?'],
		['How are you?', 'izzayak?', 'kifak?'],
		['I want a coffee', '3ayez 2ahwa', 'biddi 2ahwe'],
		['Where are you going?', 'inta raye7 feen?', 'la wein raye7?'],
		["I don't know", 'mish 3aarif', 'ma ba3ref'],
		['What are you doing?', 'bti3mil eh?', 'shu 3am ta3mel?'],
		['Now', 'dilwa2ti', 'halla2'],
		['Very nice', '7ilw awi', 'ktir 7ilu'],
		['Like this', 'kida', 'heik']
	];
</script>

<BlogArticle
	{post}
	subtitle="They're the two closest major dialects, and the two most learned. The right pick depends on where you're going and what you want to watch."
>
	<p>
		Egyptian and Levantine are the two Arabic dialects most learners choose between. They're close:
		Egyptians and Levantines talk to each other without much trouble, the grammar runs in parallel,
		and most everyday vocabulary is shared. But a handful of very common words and sounds give each
		one away within a sentence.
	</p>
	<p>
		Levantine (or Shami) is spoken in Syria, Lebanon, Jordan and Palestine, by around 40 million
		people. Egyptian is spoken by over 100 million, and understood by far more.
	</p>

	<h2>The same sentences in both</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>English</th>
					<th>Egyptian</th>
					<th>Levantine</th>
				</tr>
			</thead>
			<tbody>
				{#each sentences as [en, eg, lev] (en)}
					<tr>
						<td>{en}</td>
						<td>{eg}</td>
						<td>{lev}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p>
		The question words do most of the work: Egyptian <strong>eh</strong> and <strong>feen</strong>,
		Levantine <strong>shu</strong> and <strong>wein</strong>. Learn those and you can tell the two
		apart instantly.
	</p>

	<h2>The sounds</h2>
	<ul>
		<li>
			<strong><span class="ar-text" lang="ar">ج</span></strong>: Egyptians say a hard
			<strong>g</strong> (gamal, camel). Levantines say <strong>j</strong>, or a soft
			<strong>zh</strong> in Lebanon and Syria (zhamal).
		</li>
		<li>
			<strong><span class="ar-text" lang="ar">ق</span></strong>: both city dialects turn it into a
			glottal stop: <strong>2ahwa</strong> / <strong>2ahwe</strong>, coffee. In rural Palestine and
			Jordan you'll also hear a g.
		</li>
		<li>
			<strong>Word endings</strong>: many words that end in -a in Egyptian end in -e in Levantine.
			School is <strong>madrasa</strong> in Cairo and <strong>madrase</strong> in Beirut.
		</li>
		<li>
			<strong>Rhythm</strong>: Egyptian is often described as heavier and more drawn out; Levantine as
			lighter and quicker, with a sing-song lilt.
		</li>
	</ul>

	<h2>The grammar</h2>
	<p>
		Both put <strong>b-</strong> on present-tense verbs and wrap negation around the verb. The main
		difference is the progressive: Levantine adds <strong>3am</strong> for something happening right
		now, <strong>3am ektob</strong>, I'm writing, where Egyptian just says
		<strong>baktib</strong>. Levantine also says <strong>biddi</strong> for "I want", where Egyptian
		uses <strong>3ayez</strong>.
	</p>

	<h2>How far each one carries</h2>
	<ul>
		<li>
			<strong>Egyptian</strong> has the bigger reach. Egyptian cinema, comedy and music have been the
			Arab world's mainstream for nearly a century, so most Arabs understand it, and there's far more
			learning material for it.
		</li>
		<li>
			<strong>Levantine</strong> is everywhere too: Turkish series dubbed into Syrian Arabic were a
			huge hit across the region, and Lebanese music is popular everywhere. Most Arabs understand it
			well, and Gulf speakers often find it easier than Egyptian.
		</li>
	</ul>

	<h2>Which should you learn?</h2>
	<ul>
		<li>
			<strong>Pick Levantine</strong> if you're going to live in or visit Jordan, Lebanon, Syria or
			Palestine, if your family or partner is Levantine, or if you love Lebanese music and Syrian
			drama.
		</li>
		<li>
			<strong>Pick Egyptian</strong> if you're going to Egypt, want the dialect understood by the most
			people, or want the most films, shows and learning material to practise with.
		</li>
		<li>
			<strong>Still undecided?</strong> Egyptian is the safe default. And whichever you choose, the
			second one comes quickly: once you know one, the other is mostly a matter of swapping a few
			dozen words.
		</li>
	</ul>

	<h2>Keep going</h2>
	<p>
		The <a href={resolve('/egyptian-arabic-vs-levantine')}>Egyptian vs Levantine page</a> compares
		more words side by side. For a closer look at Levantine itself,
		<a href={resolve('/blog/levantine-arabic-dialects-compared')}
			>how different are the Levantine dialects?</a
		> covers Syrian, Lebanese, Jordanian and Palestinian, and
		<a href={resolve('/blog/how-to-learn-levantine-arabic')}>how to learn Levantine Arabic</a> sets out
		a plan. Or just start: <a href={resolve('/egyptian-arabic')}>Egyptian</a> and
		<a href={resolve('/levantine')}>Levantine</a> both have lessons, stories and phrasebooks.
	</p>
</BlogArticle>
