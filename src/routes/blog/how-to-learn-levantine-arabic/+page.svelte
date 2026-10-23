<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'how-to-learn-levantine-arabic')!;
</script>

<BlogArticle
	{post}
	subtitle="Pick an accent, learn the letters, then get to biddi and kifak as fast as you can."
>
	<p>
		Levantine Arabic is the Arabic of Syria, Lebanon, Jordan and Palestine. Around 40 million
		people speak it at home, and Syrian and Lebanese television have made it the second most
		recognised dialect after Egyptian. Learners often find it the easiest dialect to listen to.
	</p>
	<p>
		It also has less learning material than Egyptian, so the order you learn things in matters
		more. Below is the order that works, roughly how long each stage takes with an hour a day, and
		the page on this site that covers each one.
	</p>

	<h2>First, pick an accent (but don't agonise over it)</h2>
	<p>
		"Levantine" is a family of closely related accents. A Syrian, a Lebanese, a Jordanian and a
		Palestinian understand each other without effort, but they don't sound the same. Most courses,
		including this one, are based on the speech of Damascus or Beirut, and that's understood
		everywhere in the region.
	</p>
	<p>
		If you have a reason to pick one (a partner from Amman, family in Haifa, a move to Beirut), learn
		that one. If you don't, learn the Damascus/Beirut standard and absorb the regional differences
		later. They're mostly a handful of words and a few vowel sounds, not a different grammar.
	</p>

	<h2>1. Learn to read the alphabet (weeks 1–2)</h2>
	<p>
		Every serious Levantine resource writes the dialect in Arabic script, and transliteration is
		inconsistent from one book to the next. Twenty-eight letters, most of which change shape
		depending on where they sit in a word, take about two weeks. It's the only part of Arabic that
		is pure memorisation, and it pays for itself almost immediately.
	</p>
	<p><a href={resolve('/alphabet')}>The interactive alphabet</a> drills the shapes and the sounds together.</p>

	<h2>2. Get the Levantine sounds right (week 2–3)</h2>
	<p>
		Levantine city speech changes a few letters from the way textbooks teach them, and learning
		this early stops you building an accent you'll need to undo:
	</p>
	<ul>
		<li>
			<span class="ar-text" lang="ar">ق</span> becomes a glottal stop in Damascus, Beirut and
			Amman: <em>qalb</em> (heart) is said <strong>albe</strong>. Rural and Druze speakers keep the
			q, and Bedouin varieties turn it into a g.
		</li>
		<li>
			The "th" letters soften. <span class="ar-text" lang="ar">ث</span> usually becomes t or s
			(<strong>tleteh</strong>, three), and <span class="ar-text" lang="ar">ذ</span> becomes d or z
			(<strong>dahab</strong>, gold).
		</li>
		<li>
			In much of Lebanon and northern Syria the long a leans towards e, so <em>baab</em> (door)
			comes out closer to <strong>beeb</strong>. This is a large part of what people mean when they
			call Levantine melodic.
		</li>
	</ul>

	<h2>3. Learn whole phrases first (weeks 3–8)</h2>
	<p>
		Greetings, ordering, asking prices, saying you don't understand. In real conversation these
		come out as single units, and learning them that way is faster than assembling them from
		grammar. Start with <span class="ar-text" lang="ar">مَرْحَبا</span> <strong>mar7aba</strong>,
		hello, and <span class="ar-text" lang="ar">كِيفَك؟</span> <strong>kifak?</strong>, how are you
		(<strong>kifik?</strong> to a woman). Levantine cares who you're talking to, and the endings
		are where it shows.
	</p>
	<p>
		The <a href={resolve('/levantine/phrases')}>Levantine phrasebook</a> has the everyday phrases
		with audio and the forms for a man, a woman and a group, and
		<a href={resolve('/blog/hello-in-levantine-arabic')}>how to say hello in Levantine</a> goes
		through the greetings and their replies.
	</p>

	<h2>4. Build the first few hundred words (weeks 4–12)</h2>
	<p>
		A small set of words does a huge amount of work. A few to learn on day one, because you'll use
		them in almost every sentence:
	</p>
	<ul>
		<li><span class="ar-text" lang="ar">بِدّي</span> <strong>biddi</strong>: I want</li>
		<li><span class="ar-text" lang="ar">شو</span> <strong>shu</strong>: what</li>
		<li><span class="ar-text" lang="ar">وين</span> <strong>wein</strong>: where</li>
		<li><span class="ar-text" lang="ar">هلّق</span> <strong>halla2</strong>: now</li>
		<li><span class="ar-text" lang="ar">كتير</span> <strong>ktir</strong>: very, a lot</li>
		<li><span class="ar-text" lang="ar">منيح</span> <strong>mni7</strong>: good</li>
	</ul>
	<p>
		<a href={resolve('/levantine/word')}>Common Levantine words</a> has each one with audio and
		example sentences, and you can save any word to a review deck that brings it back just before
		you'd forget it.
	</p>

	<h2>5. Add the present, the future and the negative (months 2–4)</h2>
	<p>Three patterns cover most of what you'll want to say in a normal day:</p>
	<ul>
		<li>
			<strong>The present takes a b-.</strong> <em>bektob</em> is "I write", <em>btektob</em> "you
			write". Add <strong>3am</strong> in front for right now: <em>3am bektob</em>, I'm writing.
		</li>
		<li>
			<strong>The future uses ra7 or 7a-.</strong> <em>ra7 rou7</em> or <em>7arou7</em>, I'll go.
			This is one of the clearest splits from Egyptian.
		</li>
		<li>
			<strong>The negative is usually just ma.</strong> <em>ma bektob</em>, I don't write. You'll
			also hear a trailing -sh in Palestinian and some Lebanese speech: <em>ma bektobsh</em>.
		</li>
	</ul>
	<p>
		The <a href={resolve('/levantine/conjugations')}>Levantine conjugation tables</a> have every
		tense of the common verbs, affirmative and negative.
	</p>

	<h2>6. Read and listen to something longer (month 3 onwards)</h2>
	<p>
		Graded stories are where words stop being a list. Reading with the English alongside isn't
		cheating at this stage: looking a word up twenty times is how it sticks.
		<a href="{resolve('/stories')}?dialect=levantine">Levantine stories</a> let you tap any word for its meaning and hear the whole
		thing read aloud.
	</p>
	<p>
		For listening outside the site, Syrian and Lebanese TV series are the richest source of
		natural Levantine, and a lot of Fairuz's songs are in Lebanese dialect rather than formal
		Arabic. Put on something you'd watch anyway, with subtitles, and don't try to catch every word.
	</p>

	<h2>7. Start speaking before you feel ready (month 3 onwards)</h2>
	<p>
		The gap between people who understand Levantine and people who speak it is almost entirely
		practice hours. Most learners never close it because the first conversations are
		uncomfortable. Ways to get those hours in:
	</p>
	<ul>
		<li>
			<a href={resolve('/tutor')}>The AI Tutor</a> speaks Levantine, answers out loud and corrects
			you as you go.
		</li>
		<li>
			<a href="{resolve('/scenarios')}?dialect=levantine&scene=cafe">The café scenario</a> sits you down with a barista who opens with
			<em>saba7 il-kheer, shu bt7ebb tishrab?</em> and expects an order back.
		</li>
		<li>
			A language exchange partner, once you can hold a couple of minutes, will teach you the slang
			no course has.
		</li>
	</ul>

	<h2>How long does it take?</h2>
	<p>With about an hour a day, roughly:</p>
	<ul>
		<li><strong>2 weeks:</strong> reading the alphabet slowly</li>
		<li><strong>2–3 months:</strong> greetings, ordering, directions, introducing yourself</li>
		<li><strong>6 months:</strong> simple conversations about everyday topics</li>
		<li><strong>1–2 years:</strong> comfortable conversation, and following most of a TV series</li>
	</ul>
	<p>
		The single biggest variable is how early you start speaking.
		<a href={resolve('/blog/how-long-does-it-take-to-learn-arabic')}>How long it takes to learn
		Arabic</a> breaks this down further.
	</p>

	<h2>Should I learn Modern Standard Arabic first?</h2>
	<p>
		Only if your main goal is reading. Nobody speaks Modern Standard Arabic in a café in Beirut, and
		learning it first means learning a second set of pronunciations, verb forms and everyday words
		before you can talk to anyone. Learn Levantine to speak; add Fusha later for news and books.
		The grammar you'll have built by then transfers well.
	</p>

	<h2>Is Levantine harder than Egyptian?</h2>
	<p>
		No. The grammar is very close, and speakers of the two understand each other with a little
		effort. Levantine just has less learning material and less media, so finding listening
		practice takes more work. If you have no particular reason to pick either, see
		<a href={resolve('/blog/fusha-egyptian-levantine-darija')}>how the four Arabics compare</a>.
	</p>

	<p>
		Ready to start? Everything above lives on the
		<a href={resolve('/levantine')}>Levantine Arabic page</a>, with the
		<a href={resolve('/lessons/structured/[dialect]', { dialect: 'levantine' })}>structured lessons</a>
		as the place to begin.
	</p>
</BlogArticle>
