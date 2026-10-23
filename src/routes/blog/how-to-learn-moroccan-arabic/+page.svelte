<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'how-to-learn-moroccan-arabic')!;
</script>

<BlogArticle
	{post}
	subtitle="The most distinctive Arabic dialect, the hardest to find material for, and the one Moroccans light up when you speak."
>
	<p>
		Darija is the Arabic people speak in Morocco: about 30 million people at home, in the street, in
		the souk and on Moroccan YouTube. It's also the Arabic most learners find hardest to get
		started with. Most Arabic courses teach Modern Standard Arabic or Egyptian, most Arabic TV is
		Egyptian or Levantine, and Darija sounds unlike either.
	</p>
	<p>
		That's the bad news. The good news is that Moroccans respond warmly to anyone who makes the
		effort, and a little Darija goes a lot further in Morocco than fluent Modern Standard Arabic.
		Here's the order to learn it in, roughly how long each stage takes with an hour a day, and the
		page on this site that covers each one.
	</p>

	<h2>What makes Darija different</h2>
	<ul>
		<li>
			<strong>Short vowels disappear.</strong> "I wrote" is <em>ktebt</em>, and "in the market" is
			<em>fessooq</em>. Strings of consonants that look unpronounceable on paper are normal.
		</li>
		<li>
			<strong>The vocabulary is mixed.</strong> Everyday words come from Tamazight (the
			indigenous Berber languages), French and, in the north, Spanish: <em>tomobil</em> for car,
			<em>forshita</em> for fork.
		</li>
		<li>
			<strong>The grammar is still Arabic.</strong> Verb patterns, pronouns and the wrap-around
			negative will feel familiar if you know any other dialect.
		</li>
	</ul>
	<p>
		Moroccans also switch into French mid-sentence all the time, especially in cities. You don't
		need French to learn Darija, but don't be surprised when it shows up.
	</p>

	<h2>1. Learn to read the alphabet anyway (weeks 1–2)</h2>
	<p>
		Moroccans often text Darija in Latin letters, with numbers for the sounds English doesn't have:
		<strong>3</strong> for <span class="ar-text" lang="ar">ع</span>,
		<strong>7</strong> for <span class="ar-text" lang="ar">ح</span> and
		<strong>9</strong> for <span class="ar-text" lang="ar">ق</span>. It's worth being able to read
		that. But learn the Arabic script as well: it takes about two weeks, and without it you're
		locked out of signs, menus and most written material.
	</p>
	<p><a href={resolve('/alphabet')}>The interactive alphabet</a> drills the shapes and sounds together.</p>

	<h2>2. Train your ear for the consonant clusters (weeks 2–4)</h2>
	<p>
		The dropped vowels are what make Darija hard to follow at first, so listen before you worry
		about grammar. Take short phrases, play them several times, and repeat them out loud until the
		clusters stop feeling like a stumble. Unlike Egyptian and Levantine city speech,
		<span class="ar-text" lang="ar">ق</span> is mostly kept as a q, though some words and regions
		use a g.
	</p>

	<h2>3. Learn whole phrases first (weeks 3–8)</h2>
	<p>
		Greetings, prices, directions, "I don't understand". Learn them as single units rather than
		building them from grammar. The <a href={resolve('/darija/phrases')}>Darija phrasebook</a>
		has the everyday ones with audio and the forms for a man, a woman and a group.
	</p>

	<h2>4. Learn the words that do the most work (weeks 4–12)</h2>
	<p>A handful of words show up in almost every Darija conversation:</p>
	<ul>
		<li><span class="ar-text" lang="ar">بغيت</span> <strong>bghit</strong>: I want</li>
		<li><span class="ar-text" lang="ar">شنو</span> <strong>shnu</strong>: what</li>
		<li><span class="ar-text" lang="ar">فين</span> <strong>fin</strong>: where</li>
		<li><span class="ar-text" lang="ar">كيفاش</span> <strong>kifash</strong>: how</li>
		<li><span class="ar-text" lang="ar">دابا</span> <strong>daba</strong>: now</li>
		<li><span class="ar-text" lang="ar">بزاف</span> <strong>bzzaf</strong>: a lot, very</li>
		<li><span class="ar-text" lang="ar">واخا</span> <strong>wakha</strong>: OK</li>
	</ul>
	<p>
		The <a href="{resolve('/vocabulary')}?dialect=darija">vocabulary explorer</a> lets you search Darija words, hear them, and
		save them to a review deck that brings each one back just before you'd forget it.
	</p>

	<h2>5. Add the present, the future and the negative (months 2–4)</h2>
	<ul>
		<li>
			<strong>The present takes ka- (or ta-).</strong> <em>kanktb</em> is "I write", where Egyptian
			says <em>baktib</em>. Which prefix you hear depends on the region.
		</li>
		<li>
			<strong>The future uses ghadi.</strong> <em>ghadi nmshi</em>, I'm going to go.
		</li>
		<li>
			<strong>The negative wraps the verb in ma...sh.</strong> <em>ma kanfhemsh</em>, I don't
			understand. You'll use that one a lot at first.
		</li>
	</ul>
	<p>
		The <a href={resolve('/darija/conjugations')}>Darija conjugation tables</a> cover the common
		verbs in every tense.
	</p>

	<h2>6. Find listening practice (month 3 onwards)</h2>
	<p>
		This is the hard part with Darija. There's no equivalent of Egyptian cinema flooding the region,
		so you have to look for it. <a href="{resolve('/stories')}?dialect=darija">Darija stories</a> on this site are graded, with
		audio and a tap-to-translate glossary. Outside the site, Moroccan YouTube and vlogs, Moroccan TV
		series and Moroccan podcasts are the richest sources of natural speech. Pick things you'd watch
		anyway, and accept that you'll catch very little for the first few weeks.
	</p>

	<h2>7. Speak to Moroccans (month 3 onwards)</h2>
	<p>
		Nothing replaces this, and Darija is a dialect where people are delighted to help. A language
		exchange partner online, a Moroccan community near you, or a trip to Morocco will move you
		faster than any amount of study. Use the phrases you know, ask <em>kifash katgoul ...?</em>
		("how do you say ...?"), and write down what you hear.
	</p>

	<h2>How long does it take?</h2>
	<p>With about an hour a day, roughly:</p>
	<ul>
		<li><strong>2 weeks:</strong> reading the alphabet slowly</li>
		<li><strong>2–3 months:</strong> greetings, bargaining, directions, introducing yourself</li>
		<li><strong>6–9 months:</strong> simple everyday conversations</li>
		<li><strong>1–2 years:</strong> comfortable conversation, if you've had regular speaking practice</li>
	</ul>
	<p>
		Darija tends to take a little longer than Egyptian or Levantine to reach conversation, mostly
		because listening practice is harder to find.
	</p>

	<h2>Should I learn Egyptian or Modern Standard Arabic first?</h2>
	<p>
		Not if Morocco is the goal. Moroccans understand Egyptian and Modern Standard Arabic from TV
		and school, so you'll be understood, but you won't understand their replies, and Fusha in a
		café marks you as a foreigner. Learn Darija if you're going to Morocco or have Moroccan family.
		If you want an Arabic that travels further across the region,
		<a href={resolve('/blog/fusha-egyptian-levantine-darija')}>here's how the four compare</a>.
	</p>

	<p>
		Ready to start? Everything above lives on the
		<a href={resolve('/darija')}>Moroccan Darija page</a>, with the
		<a href={resolve('/lessons/structured/[dialect]', { dialect: 'darija' })}>structured lessons</a>
		as the place to begin.
	</p>
</BlogArticle>
