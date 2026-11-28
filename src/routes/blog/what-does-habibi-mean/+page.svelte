<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'what-does-habibi-mean')!;
</script>

<BlogArticle
	{post}
	subtitle="It means 'my dear', and it's said to lovers, children, friends and the man who sold you bread."
>
	<p>
		<span class="ar-text" lang="ar">حبيبي</span> <strong>habibi</strong> (more precisely
		<strong>7abibi</strong>, with the breathy <span class="ar-text" lang="ar">ح</span>) means "my
		love" or "my dear". It's <strong>7abib</strong>, beloved, plus <strong>-i</strong>, my.
	</p>
	<p>
		It can be romantic, but usually it isn't. Arabs say habibi to their children, their parents, their
		friends, their colleagues, and to strangers they're being friendly with. Men say it to other men
		all the time. Think of it as somewhere between "dear", "mate" and "love" in British English,
		depending on who's saying it.
	</p>

	<h2>Habibi, habibti and habaybi</h2>
	<ul>
		<li>
			<span class="ar-text" lang="ar">حبيبي</span> <strong>7abibi</strong>: to a man or a boy.
		</li>
		<li>
			<span class="ar-text" lang="ar">حبيبتي</span> <strong>7abibti</strong>: to a woman or a girl.
		</li>
		<li>
			<span class="ar-text" lang="ar">حبايبي</span> <strong>7abaybi</strong>: to a group, "my dear
			ones". Common when greeting friends or signing off a message.
		</li>
	</ul>
	<p>
		In practice, the line blurs. In Lebanon and Egypt you'll often hear <strong>7abibi</strong> said
		to a woman too, especially as a casual "darling" between friends or from older relatives.
	</p>

	<h2>Ya habibi</h2>
	<p>
		<strong>ya</strong> is how Arabic calls out to someone, the old "O" in "O Romeo".
		<strong>ya 7abibi</strong> is "my dear!" said directly to a person, and it's the form you'll hear
		most. It also works on its own as a reaction: <strong>ya 7abibi!</strong> to something lovely, or,
		with a sigh, to something that's gone wrong.
	</p>
	<p>
		<strong>7abib 2albi</strong>, "love of my heart", is the stronger, more affectionate version, and
		it's all over Arabic pop songs.
	</p>

	<h2>Other terms of endearment, by dialect</h2>
	<p>
		Habibi works everywhere, but each dialect has its own favourites that sound more local.
	</p>
	<h3>Egyptian</h3>
	<ul>
		<li>
			<strong>ya basha</strong>, "pasha": to a man, half joking, like "boss". Waiters and shopkeepers
			use it constantly.
		</li>
		<li><strong>ya 7abibi</strong>, always. And <strong>ya 2amar</strong>, "moon", for someone lovely.</li>
		<li><strong>ya 7aga</strong> or <strong>ya 7ag</strong>: a respectful way to address an older woman or man.</li>
	</ul>
	<h3>Levantine</h3>
	<ul>
		<li><strong>ya 2albi</strong>, "my heart", and <strong>ya rou7i</strong>, "my soul".</li>
		<li>
			<strong>ta2burni</strong>, "may you bury me", which sounds alarming. It means "I hope I die
			before you, because I couldn't live without you", and it's said to children with a smile.
		</li>
		<li><strong>7abibi</strong> to everyone, often in the same breath as "merci" and "bonjour" in Beirut.</li>
	</ul>
	<h3>Moroccan Darija</h3>
	<ul>
		<li>
			Darija calls out with <strong>a</strong> rather than ya: <strong>a 7bibi</strong>, and
			<strong>a 7bibti</strong> to a woman.
		</li>
		<li><strong>a sa7bi</strong>, "my friend", and <strong>a khoya</strong>, "my brother", are more common between men.</li>
	</ul>
	<h3>Gulf</h3>
	<ul>
		<li><strong>7abibi</strong>, and <strong>ya galbi</strong>, "my heart", with the Gulf g for ق.</li>
		<li><strong>ya 3umri</strong>, "my life", to someone very close.</li>
	</ul>
	<h3>Iraqi</h3>
	<ul>
		<li>
			<strong>3eeni</strong>, "my eye", is the classic Iraqi "dear": <strong>shlonak 3eeni?</strong>,
			how are you, dear?
		</li>
	</ul>

	<h2>Can I say habibi as a learner?</h2>
	<p>
		With friends, yes, and it will sound warm. With people you've just met, follow their lead: if
		someone calls you habibi, saying it back is natural. Between men and women who don't know each
		other well, it can come across as too familiar in more conservative places, so let them use it
		first.
	</p>

	<h2>Keep going</h2>
	<p>
		Habibi has a lot of company. <a href={resolve('/blog/what-does-wallah-mean')}
			>What "wallah" means</a
		> and the <a href={resolve('/blog/arabic-slang-words')}>Arabic slang words post</a> cover the
		other words you'll hear in every conversation. To hear terms like these used naturally, try the
		<a href={resolve('/stories')}>graded stories</a>, or practise with the
		<a href={resolve('/tutor')}>AI Tutor</a> in the dialect you're learning.
	</p>
</BlogArticle>
