<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'what-does-wallah-mean')!;
</script>

<BlogArticle
	{post}
	subtitle="Literally, 'I swear by God'. In practice: honestly, really, and really?"
>
	<p>
		<span class="ar-text" lang="ar">والله</span> <strong>wallah</strong> is two words run together:
		<strong>wa</strong>, the old Arabic "by" used in oaths, and <strong>allah</strong>, God. So it
		literally means "by God", or "I swear to God".
	</p>
	<p>
		That's what it means in a courtroom. In a café it's much lighter. Most of the time wallah is
		closer to "honestly", "seriously" or "I mean it", and with a question mark it means "really?".
		Arabs of every religion say it, many times a day, usually without thinking of it as an oath at
		all.
	</p>

	<h2>Wallah, wallahi and wallahi el-3azeem</h2>
	<p>There are three common forms, and they go up in strength:</p>
	<ul>
		<li>
			<span class="ar-text" lang="ar">والله</span> <strong>wallah</strong>: the everyday one. "Wallah
			it was good" just means it really was good.
		</li>
		<li>
			<span class="ar-text" lang="ar">والله</span> <strong>wallahi</strong>: the same word with the
			final vowel pronounced, as in the Quranic recitation. It sounds a little more emphatic, and
			it's the form you hear when someone is actually promising something.
		</li>
		<li>
			<span class="ar-text" lang="ar">والله العظيم</span> <strong>wallahi el-3azeem</strong>, "by
			God the Almighty": the serious oath. In Egypt in particular, this is what someone says when
			they need you to believe them.
		</li>
	</ul>
	<p>
		Both wallah and wallahi are written the same way in Arabic script. The difference is only in how
		you say the end.
	</p>

	<h2>The ways people really use it</h2>
	<h3>To mean "honestly" or "seriously"</h3>
	<p>
		<strong>wallah ma ba3ref</strong> (Levantine), "honestly, I don't know".
		<strong>wallahi mish 3aref</strong> (Egyptian), the same thing. Dropped into a sentence, it adds
		sincerity, the way "honestly" does in English.
	</p>
	<h3>As a question: "really?"</h3>
	<p>
		Someone tells you some news, you say <strong>wallah?</strong> with a rising voice. It's the
		Arabic "no way" or "are you serious?". The answer, if it's true, is often
		<strong>wallah!</strong> back.
	</p>
	<h3>Insisting, as a host or a guest</h3>
	<p>
		Arab hospitality runs on polite insisting, and wallah is how it's done. The host says
		<strong>wallahi lazem takul</strong>, "by God, you have to eat". The guest says
		<strong>wallahi shab3aan</strong>, "honestly, I'm full". Paying the bill is the same:
		<strong>wallahi la</strong>, "no, I swear", from both sides of the table, until someone wins.
	</p>
	<h3>Approval</h3>
	<p>
		<strong>wallah 7ilw</strong> (Levantine) or <strong>wallahi gamed</strong> (Egyptian), "that's
		really nice". In the Gulf, <strong>hala wallah</strong> is a warm hello: "welcome, truly".
	</p>

	<h2>Wallah in each dialect</h2>
	<ul>
		<li>
			<strong>Egyptian</strong>: <strong>wallahi</strong> is very common, and
			<strong>wallahi el-3azeem</strong> is the serious version. You'll also hear
			<strong>wallahi bgad</strong>, "honestly, seriously".
		</li>
		<li>
			<strong>Levantine</strong>: <strong>wallah</strong> everywhere, often as
			<strong>wallah ya zalameh</strong>, "I swear, man". <strong>3anjad?</strong>, "seriously?", is
			the other way to ask "really?".
		</li>
		<li>
			<strong>Moroccan Darija</strong>: <strong>wallah</strong>, and the very Moroccan
			<strong>wallah ila</strong>, "I swear that...", as in <strong>wallah ila zwin</strong>, "I
			swear it's lovely".
		</li>
		<li>
			<strong>Gulf</strong>: <strong>wallah</strong>, and <strong>hala wallah</strong> as a
			greeting. <strong>wallah?</strong> for "really?" works here too.
		</li>
	</ul>

	<h2>Is it okay for learners to say it?</h2>
	<p>
		Yes. Nobody will be surprised to hear wallah from a foreigner, and it often gets a smile,
		because it's such a natural word. A couple of things to know:
	</p>
	<ul>
		<li>
			It's still an oath. Some religious people avoid swearing by God casually, and it's not something
			to say about a small lie.
		</li>
		<li>
			Overusing it sounds like overdoing "literally" in English. Once or twice in a conversation is
			normal.
		</li>
		<li>
			<strong>wallahi</strong> has also become slang in English, especially in London. That's the
			same word, borrowed with the same "I swear" meaning.
		</li>
	</ul>

	<h2>More words like this</h2>
	<p>
		Wallah belongs to a family of everyday expressions built on God, like inshallah and mashallah,
		that work more like punctuation than prayers. The <a href={resolve('/blog/arabic-slang-words')}
			>Arabic slang post</a
		> covers the other words you'll hear in every conversation, and
		<a href={resolve('/blog/what-does-habibi-mean')}>what habibi means</a> is its natural next
		question. For hearing them in context, the
		<a href={resolve('/stories')}>graded stories</a> let you tap any word to see what it means.
	</p>
</BlogArticle>
