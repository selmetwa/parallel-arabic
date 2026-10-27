<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'is-arabic-hard-to-learn')!;
</script>

<BlogArticle
	{post}
	subtitle="Harder than Spanish, yes. But mostly not for the reasons people expect."
>
	<p>
		The short answer is yes, Arabic is one of the harder languages for English speakers. The US
		Foreign Service Institute, which trains American diplomats, puts it in its hardest category,
		alongside Chinese, Japanese and Korean. It estimates about 2,200 class hours to reach
		professional working proficiency, against roughly 600 to 750 for Spanish or French.
	</p>
	<p>
		The longer answer is that most of that difficulty comes from one or two things, and they aren't
		the things that put people off. The script looks like the hard part, and it isn't.
	</p>

	<h2>What looks hard but isn't</h2>

	<h3>The alphabet</h3>
	<p>
		Twenty-eight letters, written right to left, most of them joined to their neighbours. It looks
		impenetrable, and it takes about two weeks. There are no capital letters, many letters are the
		same shape with different dots, and spelling is far more regular than English. Once you can
		read the letters, you can sound out almost any word. The
		<a href={resolve('/alphabet')}>interactive alphabet</a> is a good place to find out for
		yourself, and <a href={resolve('/blog/how-arabic-letters-connect')}>how Arabic letters
		connect</a> explains why words look different from the chart.
	</p>

	<h3>Writing right to left</h3>
	<p>
		This feels strange for about a day. Your eyes adjust far faster than you'd expect.
	</p>

	<h3>Vocabulary</h3>
	<p>
		Arabic shares few words with English, so you don't get the free head start you get in French.
		But Arabic builds words from three-letter roots, and once you see the pattern, vocabulary
		starts to multiply. From <strong>k-t-b</strong>, to do with writing, come
		<span class="ar-text" lang="ar">كِتاب</span> <em>kitaab</em> (book),
		<span class="ar-text" lang="ar">مَكْتَب</span> <em>maktab</em> (office, desk),
		<span class="ar-text" lang="ar">كاتِب</span> <em>kaatib</em> (writer) and
		<span class="ar-text" lang="ar">مَكْتوب</span> <em>maktoob</em> (written). Learn the root, and
		you can often guess a word you've never seen.
	</p>

	<h2>What is genuinely a bit hard</h2>

	<h3>A few new sounds</h3>
	<p>
		A handful of sounds don't exist in English: <span class="ar-text" lang="ar">ع</span>, a
		squeeze in the throat; <span class="ar-text" lang="ar">ح</span>, a breathy h;
		<span class="ar-text" lang="ar">خ</span>, like the ch in Scottish "loch"; and the "emphatic"
		letters, said with the tongue pulled back. They take a few weeks of listening and repeating.
		They're harder to hear than to say, and native speakers are forgiving.
	</p>

	<h3>Gender everywhere</h3>
	<p>
		Verbs, adjectives and even "you" change depending on whether you're talking to a man, a woman
		or a group. In Levantine, "how are you" is <em>kifak</em> to a man and <em>kifik</em> to a
		woman. It's a lot to track at first and becomes automatic with practice. The grammar guide
		explains <a href={resolve('/grammar/levantine/noun-gender')}>how to tell a noun's gender</a> and
		<a href={resolve('/grammar/levantine/pronouns')}>which "you" to use</a>.
	</p>

	<h3>Plurals</h3>
	<p>
		Many Arabic plurals are "broken": instead of adding an ending, the vowels inside the word change.
		<em>kitaab</em> (book) becomes <em>kutub</em> (books). There are patterns, but for a lot of
		nouns you learn the plural along with the word. See
		<a href={resolve('/grammar/egyptian-arabic/plurals')}>sound and broken plurals</a> for the common
		patterns, and <a href={resolve('/grammar/egyptian-arabic/numbers-counting')}>counting things</a>
		for why "thirty apple" is correct Arabic.
	</p>

	<h3>The missing short vowels</h3>
	<p>
		Everyday Arabic writing leaves out the short vowels, so <span class="ar-text" lang="ar">كتب</span>
		could be <em>kataba</em> (he wrote), <em>kutub</em> (books) or <em>kutiba</em> (it was written).
		Native readers fill them in from context. Learners read slowly at first, and it gets faster as
		vocabulary grows. <a href={resolve('/blog/harakat-arabic-vowel-marks')}>The vowel marks
		explained</a> covers how they work.
	</p>

	<h2>What actually makes Arabic hard</h2>
	<p>
		Arabic speakers write one language and speak another. Modern Standard Arabic, or Fusha, is the
		written standard shared across the Arab world, used for news, books and formal speeches. Nobody
		speaks it at home. At home, at work and in the street, people speak a dialect: Egyptian,
		Levantine, Moroccan Darija, Gulf and many others. The dialects share most of their grammar with
		Fusha, but differ in pronunciation, everyday words and verb forms.
	</p>
	<p>
		This is the real reason the FSI number is so large. Its 2,200 hours assume you want to read a
		newspaper, follow the news and talk to people, which means learning two varieties of Arabic.
		A lot of learners spend years on Fusha, arrive in Cairo or Beirut, and find they can't follow a
		conversation.
	</p>

	<h2>So, how to make it easier: choose the right Arabic</h2>
	<p>Pick the Arabic that matches what you want to do, and learn that one first:</p>
	<ul>
		<li>
			<strong>To talk to people,</strong> learn a dialect.
			<a href={resolve('/egyptian-arabic')}>Egyptian</a> is understood almost everywhere thanks to
			a century of Egyptian film and music.
			<a href={resolve('/levantine')}>Levantine</a> is the Arabic of Syria, Lebanon, Jordan and
			Palestine. <a href={resolve('/darija')}>Moroccan Darija</a> is the one to learn for Morocco.
		</li>
		<li>
			<strong>To read the news, literature or the Quran,</strong> learn
			<a href={resolve('/fusha')}>Fusha</a>.
		</li>
		<li>
			<strong>For both,</strong> start with the one you'll use first. The grammar transfers, and
			the second one comes much faster.
		</li>
	</ul>
	<p>
		Learned this way, a dialect is a much smaller job than the FSI figure suggests: simple
		conversation is realistic within a few months of daily practice.
		<a href={resolve('/blog/how-long-does-it-take-to-learn-arabic')}>How long it takes to learn
		Arabic</a> breaks down the timeline.
	</p>

	<h2>Is Arabic easier for some people?</h2>
	<p>
		Yes. Speakers of Hebrew and Maltese, both closely related to Arabic, have a big head start.
		Speakers of Persian, Urdu and Turkish recognise a large share of the vocabulary, and Persian and
		Urdu use the same script. Anyone who grew up hearing Arabic at home, even without speaking it,
		usually finds the sounds come easily.
	</p>

	<h2>Where to start</h2>
	<p>
		Learn the alphabet, pick a dialect, and get to whole phrases quickly. If you're not sure which
		Arabic to choose, <a href={resolve('/blog/fusha-egyptian-levantine-darija')}>here's how the
		four compare</a>, with a game to test whether you can already hear the difference.
	</p>
</BlogArticle>
