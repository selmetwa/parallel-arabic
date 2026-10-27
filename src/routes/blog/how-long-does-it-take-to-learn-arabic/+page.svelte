<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'how-long-does-it-take-to-learn-arabic')!;
</script>

<BlogArticle
	{post}
	subtitle="Two weeks to read the letters, a few months to hold a simple conversation, and years for the news. It depends which Arabic you mean."
>
	<p>
		The number usually quoted comes from the US Foreign Service Institute, which trains American
		diplomats. It puts Arabic in its hardest category for English speakers and estimates about
		<strong>88 weeks, or 2,200 class hours</strong>, to reach professional working proficiency. For
		comparison, Spanish and French take around 600 to 750 hours.
	</p>
	<p>
		That number is accurate, but it's not the answer most learners need. It describes diplomats
		studying full time, with homework on top, aiming to work professionally in Arabic. At an hour a
		day, 2,200 hours is about six years. Most people want something smaller, and get there much
		sooner.
	</p>

	<h2>"Learning Arabic" means two different things</h2>
	<p>
		Arabic speakers write <a href={resolve('/fusha')}>Modern Standard Arabic</a> (Fusha), the
		formal language of news and books, and speak a dialect, such as
		<a href={resolve('/egyptian-arabic')}>Egyptian</a>, <a href={resolve('/levantine')}>Levantine</a>
		or <a href={resolve('/darija')}>Moroccan Darija</a>. The FSI figure covers enough of both to
		read a newspaper and hold a professional conversation.
	</p>
	<p>
		If your goal is to talk to people, you can focus on one dialect and skip most of that. If your
		goal is to read, you can focus on Fusha. Either way, the timeline shrinks a lot.
		<a href={resolve('/blog/is-arabic-hard-to-learn')}>Is Arabic hard to learn?</a> goes into why.
	</p>

	<h2>Milestones, at about an hour a day</h2>
	<p>
		These are realistic ranges for an adult English speaker learning a dialect, studying most days
		and speaking from early on. Fusha milestones for reading are further down.
	</p>
	<ul>
		<li>
			<strong>1–2 weeks: read the alphabet.</strong> Slowly, letter by letter, but you can sound
			out words. This is the fastest win in Arabic and the one people most overestimate.
		</li>
		<li>
			<strong>1–3 months: survival Arabic.</strong> Greetings, numbers, prices, directions,
			ordering food, introducing yourself, "I don't understand".
		</li>
		<li>
			<strong>3–6 months: simple conversations.</strong> Talking about your day, your family and
			your work in short sentences, with plenty of pauses.
		</li>
		<li>
			<strong>1–2 years: comfortable conversation.</strong> Following people speaking at normal
			speed on everyday topics, and most of a TV series with subtitles.
		</li>
		<li>
			<strong>3+ years: fluency.</strong> Jokes, arguments, fast speech between native speakers,
			films without subtitles.
		</li>
	</ul>
	<p>
		Darija usually runs a little slower than Egyptian or Levantine, mainly because listening
		material is harder to find.
	</p>

	<h2>If you're learning Fusha to read</h2>
	<ul>
		<li><strong>1–2 weeks:</strong> the alphabet</li>
		<li>
			<strong>3–6 months:</strong> simple texts with vowel marks, and the
			<a href={resolve('/grammar/fusha')}>core grammar</a> of nouns and verbs
		</li>
		<li>
			<strong>1–2 years:</strong> simplified news and graded readers without vowel marks
		</li>
		<li>
			<strong>3+ years:</strong> newspapers, novels and formal speech with a dictionary nearby
		</li>
	</ul>

	<h2>What changes the timeline most</h2>
	<h3>How early you start speaking</h3>
	<p>
		This is the biggest one. People who read and do exercises for a year before speaking often find
		they understand far more than they can say. Speaking from the first month, even badly, closes
		that gap.
	</p>

	<h3>Learning the script early</h3>
	<p>
		Relying on transliteration feels faster for a few weeks, then becomes a wall: every serious
		resource uses Arabic script, and transliteration is inconsistent between them. Two weeks on the
		<a href={resolve('/alphabet')}>alphabet</a> at the start saves months later.
	</p>

	<h3>Hours, not years</h3>
	<p>
		Twenty minutes every day beats three hours on Sunday. Spaced review, where words come back just
		before you'd forget them, makes each hour go further.
	</p>

	<h3>A head start</h3>
	<p>
		Hebrew and Maltese speakers, people who grew up hearing Arabic at home, and speakers of Persian,
		Urdu or Turkish all move faster, because the sounds or the vocabulary are already partly
		familiar.
	</p>

	<h3>Immersion</h3>
	<p>
		Living in an Arabic-speaking country helps a lot, but only if you actually use the language.
		Plenty of people live in Dubai for years without learning any. A daily routine at home can beat
		passive immersion abroad.
	</p>

	<h2>How to go faster</h2>
	<ol>
		<li>Pick one Arabic, based on what you want to do, and stick with it for the first year.</li>
		<li>Learn the alphabet in the first two weeks.</li>
		<li>Learn whole phrases before grammar tables.</li>
		<li>Read and listen to graded stories as soon as you have a few hundred words.</li>
		<li>Speak from the first month, with a tutor, an exchange partner, or out loud to yourself.</li>
	</ol>
	<p>
		If you're starting with a dialect, there's a step-by-step path for each:
		<a href={resolve('/egyptian-arabic/beginners')}>how to learn Egyptian Arabic</a>,
		<a href={resolve('/blog/how-to-learn-levantine-arabic')}>how to learn Levantine Arabic</a> and
		<a href={resolve('/blog/how-to-learn-moroccan-arabic')}>how to learn Moroccan Arabic</a>.
	</p>
</BlogArticle>
