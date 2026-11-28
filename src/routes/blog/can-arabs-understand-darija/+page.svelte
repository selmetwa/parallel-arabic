<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'can-arabs-understand-darija')!;

	const words = [
		['now', 'daba', 'dilwa2ti', 'halla2'],
		['a lot', 'bezzaf', 'awi / kteer', 'ktir'],
		['I want', 'bghit', '3ayez', 'biddi'],
		['okay', 'wakha', 'mashi / tamam', 'tayyeb / tamam'],
		['what?', 'shnu?', 'eh?', 'shu?'],
		['nice', 'zwin', '7ilw', '7ilu']
	];
</script>

<BlogArticle
	{post}
	subtitle="Often, yes. And it's mostly one-way: Moroccans understand Egyptians and Levantines far better than the other way round."
>
	<p>
		Ask an Egyptian or a Syrian which Arabic dialect is hardest to understand, and most will say
		Moroccan Darija. Ask a Moroccan the same question about Egyptian, and they'll probably laugh,
		because they grew up watching Egyptian films. Both reactions are fair, and the reasons are worth
		knowing if you're learning Darija.
	</p>

	<h2>Why Darija sounds so different</h2>
	<h3>The short vowels disappear</h3>
	<p>
		Darija drops most short vowels, so words collapse into tight clusters of consonants. "I wrote" is
		<strong>ktebt</strong>, where Egyptian says katabt. "In the market" is
		<strong>f-ssouq</strong>. To an Eastern ear, a Moroccan sentence can sound like it's missing
		half its syllables, and it is.
	</p>
	<h3>The most common words are different</h3>
	<p>
		Two dialects can share most of their vocabulary and still be hard to follow, if the words that
		differ are the ones you hear in every sentence. That's the case here:
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th></th>
					<th>Darija</th>
					<th>Egyptian</th>
					<th>Levantine</th>
				</tr>
			</thead>
			<tbody>
				{#each words as [en, ma, eg, lev] (en)}
					<tr>
						<td>{en}</td>
						<td><strong>{ma}</strong></td>
						<td>{eg}</td>
						<td>{lev}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<h3>The verbs start with n- and ka-</h3>
	<p>
		In Darija, <strong>n-</strong> marks "I" in the present, and <strong>ka-</strong> marks an
		ongoing action. "I write" is <strong>kanekteb</strong>. In Egyptian it's
		<strong>baktib</strong>. The same n- in Egyptian or Levantine means "we", so a sentence about
		yourself can sound like it's about a group.
	</p>
	<h3>Amazigh, French and Spanish words</h3>
	<p>
		Darija grew up alongside Amazigh, the indigenous language of North Africa, and took on French
		and Spanish words during the colonial period: <strong>tomobil</strong> for car,
		<strong>tobis</strong> for bus, <strong>simana</strong> for week in the north. An Egyptian
		knows none of these from home.
	</p>

	<h2>Why it's one-way</h2>
	<p>
		Exposure. For decades the Arab world's films, series, songs and talk shows have come mostly from
		Egypt and the Levant, and more recently from the Gulf. Moroccans hear those dialects constantly.
		Egyptians and Levantines rarely hear Darija, outside of a few songs and football commentators.
	</p>
	<p>
		Algerians and Tunisians are the exception: their dialects are close relatives of Darija, and
		they generally understand Moroccans well.
	</p>

	<h2>What Moroccans do about it</h2>
	<p>
		When Moroccans talk to Egyptians, Levantines or Gulf Arabs, they adjust. They swap in the Eastern
		words (<strong>dilwa2ti</strong> instead of daba, <strong>kteer</strong> instead of bezzaf),
		pronounce their vowels, and lean on Modern Standard Arabic. Many Moroccans can do a convincing
		Egyptian accent. The conversation happens in a kind of middle Arabic, and most of the effort is
		on the Moroccan side.
	</p>

	<h2>What it means if you're learning Darija</h2>
	<ul>
		<li>
			Darija is the Arabic you need in Morocco. Moroccans will switch to French or English rather than
			struggle with Fusha, so Darija is what gets you into real conversations.
		</li>
		<li>
			It won't carry you as far outside North Africa as Egyptian or Levantine would. If that matters,
			add one of those later; the grammar is similar enough that the second dialect is much easier.
		</li>
		<li>
			Listening is the hard part, so start early. Darija material is scarce compared with Egyptian,
			which is why graded stories with audio help so much.
		</li>
	</ul>

	<h2>Keep going</h2>
	<p>
		The <a href={resolve('/darija')}>Moroccan Darija course</a> has lessons, stories with audio and a
		phrasebook. <a href={resolve('/blog/how-to-learn-moroccan-arabic')}
			>How to learn Moroccan Arabic</a
		> sets out the order to learn it in, and the
		<a href={resolve('/egyptian-arabic-vs-darija')}>Egyptian vs Darija page</a> compares the two word
		by word. For a quick start, here are the
		<a href={resolve('/blog/moroccan-darija-words-and-phrases')}>Darija words and phrases</a> you'll
		hear most.
	</p>
</BlogArticle>
