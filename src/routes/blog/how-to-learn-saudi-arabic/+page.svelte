<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'how-to-learn-saudi-arabic')!;
</script>

<BlogArticle
	{post}
	subtitle="Start with Hijazi, learn the letters, then get to kaifak and abgha as fast as you can."
>
	<p>
		Saudi Arabia doesn't have one dialect. Hijazi is spoken in the west, in Jeddah, Mecca, Medina
		and Taif. Najdi is spoken in the centre, around Riyadh. The east speaks something close to
		Gulf Arabic. Which one you learn depends on where you're going, but for most learners Hijazi is
		the place to start.
	</p>
	<p>
		Jeddah has welcomed pilgrims and traders from everywhere for centuries, and Hijazi grew into the
		Saudi dialect other Arabs find easiest to understand. It also shares a lot with Egyptian. Below
		is the order to learn it in, roughly how long each stage takes with an hour a day, and the page
		on this site that covers each one.
	</p>

	<h2>First, Hijazi or Najdi?</h2>
	<p>
		If your life will be in Jeddah, Mecca or Medina, or if you're visiting for Umrah or Hajj,
		learn Hijazi. It's what this site teaches. If you're moving to Riyadh or the Eastern Province,
		Gulf Arabic is the closer fit: <a href={resolve('/khaleeji-vs-saudi')}>Gulf vs Saudi Arabic</a>
		explains why.
	</p>

	<h2>1. Learn to read the alphabet (weeks 1–2)</h2>
	<p>
		Hijazi is written in Arabic script in messages and on social media, and transliteration differs
		from one source to the next. The 28 letters, most of which change shape depending on where they
		sit in a word, take about two weeks. It's the only part of Arabic that is pure memorisation, and
		it pays for itself almost immediately.
	</p>
	<p><a href={resolve('/alphabet')}>The interactive alphabet</a> drills the shapes and the sounds together.</p>

	<h2>2. Get the Hijazi sounds right (weeks 2–3)</h2>
	<p>A few changes from textbook Arabic make the biggest difference:</p>
	<ul>
		<li>
			The "th" sounds become t and d. <em>thalaatha</em> (three) is <strong>talaata</strong>, and
			<em>haadha</em> (this) is <strong>haada</strong>. Hijazis often spell them that way in casual
			messages too.
		</li>
		<li>
			<span class="ar-text" lang="ar">ق</span> is usually a hard g, as in
			<strong>gahwa</strong>, coffee. This is one of the clearest differences from Cairo, where it
			disappears into a glottal stop.
		</li>
		<li>
			<span class="ar-text" lang="ar">ج</span> stays j. Unlike Gulf Arabic, Hijazi doesn't turn it
			into a y.
		</li>
	</ul>

	<h2>3. Learn whole phrases first (weeks 3–8)</h2>
	<p>
		Greetings, ordering, asking prices, saying you don't understand. In real conversation these come
		out as single units, and learning them that way is faster than assembling them from grammar.
		Start with <span class="ar-text" lang="ar">هَلا</span> <strong>hala</strong>, hello, and
		<span class="ar-text" lang="ar">كيفَك؟</span> <strong>kaifak?</strong>, how are you
		(<strong>kaifik?</strong> to a woman, <strong>kaifukum?</strong> to a group). The answer is
		usually <strong>il-7amdulillah, tamaam</strong>: praise God, fine.
	</p>
	<p>
		Hijazis wrap a lot of their speech in blessings. A thank you often comes with
		<strong>ya3teek il-3aafya</strong>, God give you health. The
		<a href={resolve('/saudi/phrases')}>Saudi Arabic phrasebook</a> has the everyday phrases with
		audio and the forms for a man, a woman and a group.
	</p>

	<h2>4. Learn the words that carry every sentence (weeks 4–12)</h2>
	<p>
		A small set of words does a huge amount of work. These are the ones you'll hear first in
		Jeddah:
	</p>
	<ul>
		<li><span class="ar-text" lang="ar">أبغى</span> <strong>abgha</strong>: I want</li>
		<li><span class="ar-text" lang="ar">إيش</span> <strong>eesh</strong>: what</li>
		<li><span class="ar-text" lang="ar">فين</span> <strong>feen</strong>: where</li>
		<li><span class="ar-text" lang="ar">دحين</span> <strong>da7een</strong>: now</li>
		<li><span class="ar-text" lang="ar">مرّة</span> <strong>marra</strong>: very</li>
		<li><span class="ar-text" lang="ar">كدا</span> <strong>kida</strong>: like this</li>
	</ul>
	<p>
		<strong>marra</strong> catches learners out: everywhere else it means "once", but in Hijazi it's
		the word for "very". <strong>7ilu marra</strong> is "really nice", and you'll hear it in almost
		every conversation. Save the words you meet to your review deck and they come back just before
		you'd forget them.
	</p>

	<h2>5. Add the present, the future and the negative (months 2–4)</h2>
	<p>Three patterns cover most of what you'll want to say in a normal day:</p>
	<ul>
		<li>
			<strong>The present takes a b-.</strong> <em>baroo7</em> is "I go", just like Egyptian. For
			something happening right now, put <strong>ga3id</strong> in front: <em>ga3id aakul</em>, I'm
			eating.
		</li>
		<li>
			<strong>The future takes 7a-.</strong> <em>7aroo7</em>, I'll go. Again, the same as Egyptian.
		</li>
		<li>
			<strong>The negative is ma, or mu.</strong> <em>ma baroo7</em>, I don't go. Before adjectives
			and nouns it's <strong>mu</strong>.
		</li>
	</ul>
	<p>
		If you already know some Egyptian, these three will feel familiar, and Hijazi will come quickly.
		The <a href={resolve('/saudi/conjugations')}>Saudi Arabic conjugation tables</a> have every tense
		of 200 common verbs, affirmative and negative.
	</p>

	<h2>6. Follow a course for the structure (month 1 onwards)</h2>
	<p>
		Phrases and word lists get you talking. A course fills in the grammar between them in an order
		that builds on itself. The
		<a href={resolve('/lessons/structured/[dialect]', { dialect: 'saudi' })}>Saudi Arabic lessons</a>
		go from A1 to B2, one short lesson a day, with speaking practice in each.
	</p>
	<p>
		For listening outside the site, Saudi YouTube and TV comedy have grown fast, though much of it is
		in Najdi. Look for creators from Jeddah for Hijazi, put on something you'd watch anyway, with
		subtitles, and don't try to catch every word.
	</p>

	<h2>7. Start speaking before you feel ready (month 3 onwards)</h2>
	<p>
		The gap between people who understand Hijazi and people who speak it is almost entirely practice
		hours. Ways to get those hours in:
	</p>
	<ul>
		<li>
			<a href={resolve('/tutor')}>The AI Tutor</a> speaks Hijazi, answers out loud and corrects you
			as you go.
		</li>
		<li>
			<a href="{resolve('/scenarios')}?dialect=saudi&scene=cafe">The café scenario</a> sits you down
			with a barista who opens with <em>sabaa7 il-khair! eesh tibgha tishrab?</em> and expects an
			order back.
		</li>
		<li>
			A language exchange partner, once you can hold a couple of minutes, will teach you the slang no
			course has.
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
		Only if your main goal is reading, or the Quran. Nobody in a Jeddah café speaks Modern Standard
		Arabic, and learning it first means a second set of pronunciations, verb forms and everyday
		words before you can talk to anyone. Learn Hijazi to speak; add Fusha later for reading.
	</p>

	<h2>Is Hijazi close to Egyptian?</h2>
	<p>
		Closer than any other Gulf-region dialect. They share the b- present, the 7a- future and plenty
		of everyday words, and Jeddah has always had a large Egyptian community. The main differences are
		the ق, the question words and words like <em>da7een</em> and <em>abgha</em>.
		<a href={resolve('/saudi-vs-egyptian-arabic')}>Saudi vs Egyptian Arabic</a> goes through them.
	</p>

	<p>
		Ready to start? Everything above lives on the
		<a href={resolve('/saudi')}>Saudi Arabic page</a>, with the
		<a href={resolve('/lessons/structured/[dialect]', { dialect: 'saudi' })}>structured lessons</a>
		as the place to begin.
	</p>
</BlogArticle>
