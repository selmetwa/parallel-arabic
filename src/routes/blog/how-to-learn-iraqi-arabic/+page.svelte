<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'how-to-learn-iraqi-arabic')!;
</script>

<BlogArticle
	{post}
	subtitle="Learn the letters, get the g and the ch right, then get to shlonak and shaku maku as fast as you can."
>
	<p>
		Iraqi Arabic is the Arabic of Baghdad, Basra and everywhere in between: over 40 million people
		in Iraq, plus large communities in Europe, North America and the Gulf. It's direct, warm, and
		full of words picked up from Persian, Turkish and English over the centuries.
	</p>
	<p>
		It also has much less learning material than Egyptian or Levantine, and far less of it is
		watched outside Iraq. That makes the order you learn things in matter more. Below is the order
		that works, roughly how long each stage takes with an hour a day, and the page on this site that
		covers each one.
	</p>

	<h2>First, which Iraqi?</h2>
	<p>
		Learn Baghdadi. It's the Iraqi you hear on television and the one understood across the country.
		Southern speech, around Basra, is close to it and shades into Gulf Arabic. The north is the
		real exception: Mosul has its own older variety that sounds noticeably different, with a q where
		Baghdad says g.
	</p>
	<p>
		If your family is from Mosul, you'll pick up its features once you're there. If not, Baghdadi is
		the standard, and it's what this site teaches.
	</p>

	<h2>1. Learn to read the alphabet (weeks 1–2)</h2>
	<p>
		Iraqis write their dialect in Arabic script, in messages, on social media and in subtitles, and
		transliteration differs from one source to the next. The 28 letters, most of which change shape
		depending on where they sit in a word, take about two weeks. It's the only part of Arabic that is
		pure memorisation, and it pays for itself almost immediately.
	</p>
	<p><a href={resolve('/alphabet')}>The interactive alphabet</a> drills the shapes and the sounds together.</p>

	<h2>2. Get the Iraqi sounds right (weeks 2–3)</h2>
	<p>
		Three changes from textbook Arabic do most of the work of making you sound Iraqi rather than
		like a news reader:
	</p>
	<ul>
		<li>
			<span class="ar-text" lang="ar">ق</span> becomes a hard g. <em>qahwa</em> (coffee) is
			<strong>gahwa</strong>, and <em>qalb</em> (heart) is <strong>galub</strong>.
		</li>
		<li>
			<span class="ar-text" lang="ar">ك</span> often becomes ch. <em>kalb</em> (dog) is
			<strong>chalib</strong>, and the ending for "you" to a woman is <strong>-ich</strong>:
			<strong>shloonich?</strong>, how are you?
		</li>
		<li>
			The "th" sounds stay. Unlike Cairo or Damascus, Baghdad keeps
			<span class="ar-text" lang="ar">ث</span> and <span class="ar-text" lang="ar">ذ</span> as
			th, so <em>thalaatha</em> (three) sounds much like the textbook.
		</li>
	</ul>
	<p>
		The ch is the one to get right. Not every ك turns into it, and only exposure tells you which
		ones do, but it's the sound other Arabs use to recognise an Iraqi.
	</p>

	<h2>3. Learn whole phrases first (weeks 3–8)</h2>
	<p>
		Greetings, ordering, asking prices, saying you don't understand. In real conversation these
		come out as single units, and learning them that way is faster than assembling them from
		grammar. Start with <span class="ar-text" lang="ar">هَلا</span> <strong>hala</strong>, hello,
		and <span class="ar-text" lang="ar">شلونَك؟</span> <strong>shloonak?</strong>, how are you
		(<strong>shloonich?</strong> to a woman, <strong>shloonkum?</strong> to a group). It literally
		asks "what's your colour?", and the answer is <strong>zein, il-7amdilla</strong>: good, thank
		God.
	</p>
	<p>
		Iraqis rarely stop at one greeting. A hello turns into questions about your health, your
		family and your work, each with its own blessing in reply. The
		<a href={resolve('/iraqi/phrases')}>Iraqi phrasebook</a> has the
		everyday phrases with audio and the forms for a man, a woman and a group.
	</p>

	<h2>4. Learn the words that carry every sentence (weeks 4–12)</h2>
	<p>
		A small set of words does a huge amount of work, and several of them are pure Iraqi. Learn these
		in the first week, because you'll hear them in almost every conversation:
	</p>
	<ul>
		<li><span class="ar-text" lang="ar">أكو</span> <strong>aku</strong>: there is</li>
		<li><span class="ar-text" lang="ar">ماكو</span> <strong>maku</strong>: there isn't</li>
		<li><span class="ar-text" lang="ar">هسّة</span> <strong>hassa</strong>: now</li>
		<li><span class="ar-text" lang="ar">شكد</span> <strong>shgadd</strong>: how much</li>
		<li><span class="ar-text" lang="ar">باچر</span> <strong>baachir</strong>: tomorrow</li>
		<li><span class="ar-text" lang="ar">هواية</span> <strong>hwaaya</strong>: a lot, very</li>
	</ul>
	<p>
		Put the first two together and you have <strong>shaku maku?</strong>, "what's there and what's
		not?", the classic Iraqi "what's up?". Save the words you meet to your review deck and they come
		back just before you'd forget them.
	</p>

	<h2>5. Add the present, the future and the negative (months 2–4)</h2>
	<p>Three patterns cover most of what you'll want to say in a normal day:</p>
	<ul>
		<li>
			<strong>The plain present has no prefix.</strong> <em>aroo7</em> is "I go". Where Egyptian and
			Levantine add a b-, Iraqi doesn't. Put <strong>da-</strong> in front for something
			happening right now: <em>da-aroo7</em>, I'm going.
		</li>
		<li>
			<strong>The future uses raa7.</strong> <em>raa7 aroo7</em>, I'll go. It's the same word as
			"he went", and context keeps them apart.
		</li>
		<li>
			<strong>The negative is ma, or mu.</strong> <em>ma aroo7</em>, I don't go. Before adjectives
			and nouns it's <strong>mu</strong>: <em>mu zein</em>, not good.
		</li>
	</ul>
	<p>
		The <a href={resolve('/iraqi/conjugations')}>Iraqi conjugation
		tables</a> have every tense of 200 common verbs, affirmative and negative.
	</p>

	<h2>6. Follow a course for the structure (month 1 onwards)</h2>
	<p>
		Phrases and word lists get you talking. A course fills in the grammar between them in an order
		that builds on itself. The
		<a href={resolve('/lessons/structured/[dialect]', { dialect: 'iraqi' })}>Iraqi lessons</a> go
		from A1 to B2, one short lesson a day, with speaking practice in each.
	</p>
	<p>
		For listening outside the site, Iraqi YouTube, comedy sketches and TV dramas are the best source
		of natural Baghdadi. Put on something you'd watch anyway, with subtitles, and don't try to catch
		every word.
	</p>

	<h2>7. Start speaking before you feel ready (month 3 onwards)</h2>
	<p>
		The gap between people who understand Iraqi and people who speak it is almost entirely practice
		hours. With fewer Iraqi teachers around than for other dialects, it's worth finding those hours
		early:
	</p>
	<ul>
		<li>
			<a href={resolve('/tutor')}>The AI Tutor</a> speaks Iraqi, answers out loud and corrects you as
			you go.
		</li>
		<li>
			<a href="{resolve('/scenarios')}?dialect=iraqi&scene=cafe">The café scenario</a> sits you down
			with a barista who opens with <em>sabaa7 il-khair! shtishrab?</em> and expects an order back.
		</li>
		<li>
			A language exchange partner, once you can hold a couple of minutes. Iraqis abroad are often
			delighted to meet someone learning their dialect rather than Egyptian.
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
		Only if your main goal is reading. Nobody orders tea in Baghdad in Modern Standard Arabic, and
		learning it first means a second set of pronunciations, verb forms and everyday words before you
		can talk to anyone. Learn Iraqi to speak; add Fusha later for news and books. Iraqi keeps more of
		the textbook sounds than most dialects, so the switch is easier than you'd expect.
	</p>

	<h2>Is Iraqi close to Gulf Arabic?</h2>
	<p>
		Very. Both say g for ق and ch for many ك, and they share words like <em>zein</em> and
		<em>shloon</em>. Learning one makes the other quick to pick up.
		<a href={resolve('/iraqi-vs-khaleeji')}>Iraqi vs
		Gulf Arabic</a> goes through the differences, and
		<a href={resolve('/iraqi-vs-levantine')}>Iraqi vs
		Levantine</a> covers the other neighbour.
	</p>

	<p>
		Ready to start? Everything above lives on the
		<a href={resolve('/iraqi')}>Iraqi Arabic page</a>, with the
		<a href={resolve('/lessons/structured/[dialect]', { dialect: 'iraqi' })}>structured lessons</a>
		as the place to begin.
	</p>
</BlogArticle>
