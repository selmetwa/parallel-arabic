<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'how-to-learn-gulf-arabic')!;
</script>

<BlogArticle
	{post}
	subtitle="Aim for the shared Gulf forms, learn the letters, then get to abi gahwa and shloonak as fast as you can."
>
	<p>
		Gulf Arabic, or Khaleeji, is the Arabic of the UAE, Kuwait, Qatar and Bahrain, and of parts of
		Oman and eastern Saudi Arabia. If you live or work in Dubai, Abu Dhabi, Kuwait City or Doha, it's
		the Arabic your colleagues and neighbours speak at home.
	</p>
	<p>
		It's also a dialect many people never get around to learning, because English works for most
		daily errands in the Gulf. That's exactly why a little Khaleeji goes so far: people notice. Below
		is the order to learn it in, roughly how long each stage takes with an hour a day, and the page
		on this site that covers each one.
	</p>

	<h2>First, which Gulf accent?</h2>
	<p>
		Emirati, Kuwaiti, Qatari and Bahraini Arabic differ in accent and in a handful of words, but Gulf
		speakers understand each other without effort. Learn the shared Gulf forms, which sit closest to
		Emirati and Kuwaiti speech, and you'll be understood in all four. That's what this site teaches.
	</p>
	<p>
		If you know where you'll be living, lean into that country's words once you're there. They're
		a short list, not a different grammar.
	</p>

	<h2>1. Learn to read the alphabet (weeks 1–2)</h2>
	<p>
		Gulf Arabic is written in Arabic script in messages, on social media and on every shop sign, and
		transliteration differs from one source to the next. The 28 letters, most of which change shape
		depending on where they sit in a word, take about two weeks. It's the only part of Arabic that is
		pure memorisation, and it pays for itself almost immediately.
	</p>
	<p><a href={resolve('/alphabet')}>The interactive alphabet</a> drills the shapes and the sounds together.</p>

	<h2>2. Get the Gulf sounds right (weeks 2–3)</h2>
	<p>Three changes from textbook Arabic make the biggest difference:</p>
	<ul>
		<li>
			<span class="ar-text" lang="ar">ج</span> often becomes y. <em>jadeed</em> (new) is
			<strong>yideed</strong>, and <em>dijaaj</em> (chicken) is <strong>diyaay</strong>. Not every
			speaker does it every time, but it's the clearest Gulf sound.
		</li>
		<li>
			<span class="ar-text" lang="ar">ق</span> is a hard g. <em>qahwa</em> (coffee) is
			<strong>gahwa</strong>.
		</li>
		<li>
			<span class="ar-text" lang="ar">ك</span> can become ch, especially in the ending for "you" to a
			woman: <strong>shloonich?</strong>, how are you?
		</li>
	</ul>

	<h2>3. Learn whole phrases first (weeks 3–8)</h2>
	<p>
		Greetings, ordering, asking prices, saying you don't understand. In real conversation these come
		out as single units, and learning them that way is faster than assembling them from grammar.
		Start with <span class="ar-text" lang="ar">هَلا</span> <strong>hala</strong>, hello, and
		<span class="ar-text" lang="ar">شلونَك؟</span> <strong>shloonak?</strong>, how are you
		(<strong>shloonich?</strong> to a woman). Thank a man with
		<span class="ar-text" lang="ar">مَشكور</span> <strong>mashkoor</strong>, and a woman with
		<strong>mashkoora</strong>.
	</p>
	<p>
		Gulf greetings are long. After hala come questions about your health and your family, and
		a guest is welcomed with <strong>7ayyaak alla</strong>, God greet you. The
		<a href={resolve('/khaleeji/phrases')}>Gulf Arabic phrasebook</a> has the everyday phrases with
		audio and the forms for a man, a woman and a group.
	</p>

	<h2>4. Learn the words that carry every sentence (weeks 4–12)</h2>
	<p>
		A small set of words does a huge amount of work. These are the ones that make a sentence sound
		Gulf rather than Egyptian or Levantine:
	</p>
	<ul>
		<li><span class="ar-text" lang="ar">أبي</span> <strong>abi</strong>: I want</li>
		<li><span class="ar-text" lang="ar">وايد</span> <strong>waayid</strong>: a lot, very</li>
		<li><span class="ar-text" lang="ar">الحين</span> <strong>il-7een</strong>: now</li>
		<li><span class="ar-text" lang="ar">شلون</span> <strong>shloon</strong>: how</li>
		<li><span class="ar-text" lang="ar">وين</span> <strong>wain</strong>: where</li>
		<li><span class="ar-text" lang="ar">زين</span> <strong>zein</strong>: good, fine</li>
	</ul>
	<p>
		Three of them already make a full sentence: <strong>abi gahwa il-7een</strong>, I want coffee
		now. Save the words you meet to your review deck and they come back just before you'd forget
		them.
	</p>

	<h2>5. Add the present, the future and the negative (months 2–4)</h2>
	<p>Three patterns cover most of what you'll want to say in a normal day:</p>
	<ul>
		<li>
			<strong>The plain present has no prefix.</strong> <em>aroo7</em> is "I go". Where Egyptian and
			Levantine add a b-, Gulf Arabic doesn't. For something happening right now, put
			<strong>gaa3id</strong> in front: <em>gaa3id aakil</em>, I'm eating.
		</li>
		<li>
			<strong>The future uses raa7 or ba-.</strong> <em>raa7 aroo7</em>, I'll go. You'll hear the
			short <em>baroo7</em> just as often.
		</li>
		<li>
			<strong>The negative is ma, or mu.</strong> <em>ma aroo7</em>, I don't go. Before adjectives
			and nouns it's <strong>mu</strong>: <em>mu zein</em>, not good.
		</li>
	</ul>
	<p>
		The <a href={resolve('/khaleeji/conjugations')}>Gulf Arabic conjugation tables</a> have every
		tense of 72 common verbs, affirmative and negative.
	</p>

	<h2>6. Follow a course for the structure (month 1 onwards)</h2>
	<p>
		Phrases and word lists get you talking. A course fills in the grammar between them in an order
		that builds on itself. The
		<a href={resolve('/lessons/structured/[dialect]', { dialect: 'khaleeji' })}>Gulf Arabic lessons</a>
		go from A1 to B2, one short lesson a day, with speaking practice in each.
	</p>
	<p>
		For listening outside the site, Kuwaiti TV drama has been watched across the Gulf for decades,
		and Emirati and Kuwaiti YouTube is full of everyday speech. Put on something you'd watch anyway,
		with subtitles, and don't try to catch every word.
	</p>

	<h2>7. Start speaking before you feel ready (month 3 onwards)</h2>
	<p>
		In the Gulf the hard part isn't finding someone to talk to. It's that people switch to English
		the moment you hesitate. Get your first few hundred hesitant sentences out somewhere they won't:
	</p>
	<ul>
		<li>
			<a href={resolve('/tutor')}>The AI Tutor</a> speaks Gulf Arabic, answers out loud and corrects
			you as you go.
		</li>
		<li>
			<a href="{resolve('/scenarios')}?dialect=khaleeji&scene=cafe">The café scenario</a> sits you
			down with a barista who opens with <em>sabaa7 il-khair! shu tabi tishrab?</em> and expects an
			order back.
		</li>
		<li>
			Colleagues and neighbours, once you can hold a couple of minutes. Ask them to stay in Arabic;
			most will be happy to.
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
		Only if your main goal is reading. Modern Standard Arabic is on every sign and document in the
		Gulf, but nobody speaks it over coffee, and learning it first means a second set of
		pronunciations, verb forms and everyday words before you can talk to anyone. Learn Khaleeji to
		speak; add Fusha later for reading.
	</p>

	<h2>Gulf, Iraqi or Saudi?</h2>
	<p>
		Gulf Arabic and Iraqi are close cousins that share the g, the ch and words like
		<em>shloon</em> and <em>zein</em>. Hijazi, the Saudi dialect of Jeddah and Mecca, is further
		away and closer to Egyptian. For Riyadh and eastern Saudi Arabia, Khaleeji is actually the
		better fit of the two.
		<a href={resolve('/iraqi-vs-khaleeji')}>Iraqi vs Gulf Arabic</a> and
		<a href={resolve('/khaleeji-vs-saudi')}>Gulf vs Saudi Arabic</a> go through the differences.
	</p>

	<p>
		Ready to start? Everything above lives on the
		<a href={resolve('/khaleeji')}>Gulf Arabic page</a>, with the
		<a href={resolve('/lessons/structured/[dialect]', { dialect: 'khaleeji' })}>structured lessons</a>
		as the place to begin.
	</p>
</BlogArticle>
