<script lang="ts">
	import { resolve } from '$app/paths';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'arabic-games')!;

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<section class="min-h-screen bg-tile-200">
	<article class="mx-auto max-w-2xl px-4 py-12 sm:px-8 sm:py-16">
		<a
			href={resolve('/blog')}
			class="mb-8 inline-flex items-center gap-2 text-sm text-text-200 transition-colors hover:text-text-300"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
					clip-rule="evenodd"
				/>
			</svg>
			<span>All posts</span>
		</a>

		<header class="mb-8">
			<h1 class="mb-3 text-3xl font-bold leading-tight text-text-300 sm:text-4xl">{post.title}</h1>
			<p class="mb-4 text-lg text-text-200">
				Most of them teach you words you'll never say out loud.
			</p>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-200">
				<span>{formatDate(post.date)}</span>
				<span aria-hidden="true">·</span>
				<span>{post.readingTime}</span>
			</div>
		</header>

		<div
			class="space-y-4 text-base leading-relaxed text-text-200 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text-300 [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-text-300 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:text-text-300 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
		>
			<p>
				Search for Arabic games and you get two kinds of result. Kids' apps with a cartoon camel
				that sing the alphabet, and vocabulary quizzes that show you a photo of an apple next to
				four Arabic words. Both are fine at what they do. Neither will get you to the point of
				saying anything.
			</p>
			<p>
				One disclosure before the list: I built one of the things on it. I'll say which one and you
				can discount it accordingly.
			</p>

			<h2>Why Arabic breaks most game formats</h2>
			<p>
				This is worth understanding before you judge any particular app, because a lot of what feels
				wrong about Arabic games isn't laziness. Most word game mechanics were designed for the
				Latin alphabet and they don't survive the trip.
			</p>
			<ul>
				<li>
					<strong>Letter tiles and anagrams.</strong> Arabic letters change shape depending on where
					they sit in the word. <span dir="rtl">ع</span> alone is
					<span dir="rtl">ع</span>, at the start it's <span dir="rtl">عـ</span>, in the middle
					<span dir="rtl">ـعـ</span>, at the end <span dir="rtl">ـع</span>. Break a word into
					shuffled tiles and a beginner sees four shapes they don't yet recognise as one letter.
					Games usually solve this by showing isolated forms only, which trains you to read the form
					you'll see least often in real text.
				</li>
				<li>
					<strong>Spelling and hangman.</strong> Short vowels mostly aren't written.
					<span dir="rtl">كتب</span> is katab (he wrote), kutub (books), or kutiba (it was written),
					all three letters identical. "Spell this word" doesn't have one answer without a sentence around
					it.
				</li>
				<li>
					<strong>Typing races.</strong> Unless the learner already has an Arabic layout in their
					fingers, you're timing how fast they can hunt for <span dir="rtl">ض</span>, which is not
					an Arabic skill.
				</li>
			</ul>
			<p>
				The formats that do survive are the ones built on meaning and sound instead of letter
				manipulation. Match the word to what it means. Hear it and pick it. Say it and find out if
				you were understood. Fill the gap in a sentence. Less impressive in a screenshot, and much
				more likely to leave something behind.
			</p>

			<h2>The four questions I ask</h2>
			<p>Before the list, here's what I'm actually judging these against.</p>
			<ol>
				<li>
					<strong>Is there audio, in the Arabic you're learning?</strong> A vocabulary game with no sound
					is teaching you to recognise a shape on a screen. You will not catch that word when someone
					says it at conversational speed.
				</li>
				<li>
					<strong>Does the word ever turn up in a sentence?</strong> Isolated nouns are the easiest
					thing to build and the least useful thing to own.
					<span dir="rtl">قطة</span> is cat. Fine. You still can't say the cat is under the chair.
				</li>
				<li>
					<strong>Does it come back?</strong> If a word you missed on Tuesday doesn't reappear on Friday,
					you played a quiz, not a study tool.
				</li>
				<li>
					<strong>Is it the Arabic you want?</strong> Almost everything defaults to Modern Standard Arabic.
					If your goal is talking to your in-laws in Alexandria, an MSA word list is teaching you a register
					they'd find funny.
				</li>
			</ol>
			<p>Most apps pass the first. Some pass the third. Very few pass two and four together.</p>

			<h2>What's out there</h2>

			<h3>Clozemaster</h3>
			<p>
				Sentence-based gap filling, drawn from a translation corpus. It passes the sentence test and
				the repetition test without any fuss, which already puts it ahead of most of the category.
				The Arabic is Standard, and because the sentences come from a corpus rather than a
				curriculum, some of them are strange in a way that's occasionally distracting. Best once
				you're past beginner and want volume.
			</p>

			<h3>Drops</h3>
			<p>
				Five minute sessions, illustrated vocabulary, genuinely nice to use, very good at getting
				people to come back. It's nouns in isolation though, so it fails the sentence test
				completely. Treat it as a way to build a recognition base rather than a course.
			</p>

			<h3>Digital Dialects</h3>
			<p>
				Free, no account, looks like it was built in 2009 because it roughly was. Numbers, phrases,
				basic vocabulary, click and go. It shows up in my search traffic more than you would expect,
				and I think the reason is exactly that: sometimes people want four minutes of practice
				without a signup flow and an onboarding survey.
			</p>

			<h3>Duolingo</h3>
			<p>
				The alphabet section is decent and worth doing if you're at zero. After that the Arabic
				course is noticeably weaker than the ones it's famous for, and it's Standard Arabic, so
				you're learning to translate sentences that no speaker of any dialect would produce.
			</p>

			<h3>Anki</h3>
			<p>
				Not a game, and included anyway, because it's the only thing here that reliably passes the
				repetition test. A decent shared deck of the thousand most common Egyptian words will do
				more for your vocabulary in three months than anything above. The cost is that it's dry and
				you have to do it every day. You can also
				<a href={resolve('/anki-decks')} class="text-text-300 underline underline-offset-2"
					>export decks from here</a
				> by dialect and topic if you'd rather not go hunting on AnkiWeb.
			</p>

			<h3>The one I built</h3>
			<p>
				<a href={resolve('/learn/game')} class="text-text-300 underline underline-offset-2"
					>Parallel Arabic's games</a
				> run in Egyptian, Levantine, Darija or Standard Arabic, and the word list and the audio both
				change with the dialect, so you're not learning Fusha vocabulary with an Egyptian accent bolted
				on top. There are three modes:
			</p>
			<ul>
				<li><strong>Multiple choice</strong>, for finding out fast which words haven't stuck.</li>
				<li>
					<strong>Listening</strong>, where you hear the word and pick the meaning. This is the one
					that closes the gap between reading a word and catching it in speech.
				</li>
				<li>
					<strong>Speaking</strong>, where you say it and get scored on whether you were understood.
					Mostly useful for <span dir="rtl">ع</span>, <span dir="rtl">ح</span>,
					<span dir="rtl">ق</span> and the emphatic letters.
				</li>
			</ul>
			<p>
				Words you get wrong go into a review deck that brings them back, and you can play against
				your own saved vocabulary instead of a preset topic. It's free to play without an account.
				Where it's weakest is the sentence test: the sentence modes exist but there's less material
				there than in the word modes.
			</p>

			<h2>If everything looks like it's aimed at children</h2>
			<p>
				This is a common complaint and it's a fair one. The problem isn't really the cartoon
				styling, it's the word lists underneath. Apps built for kids teach animals, colours, shapes
				and fruit, because that's what you teach a six year old in any language. An adult who wants
				to actually use Arabic needs transport, money, work, being ill, being late, disagreeing with
				someone politely, and explaining that you already have a taxi.
			</p>
			<p>
				So the thing to look for isn't a serious visual style, it's whether you get to choose the
				topic. If the app decides you're learning zoo animals this week, it wasn't built for you.
			</p>

			<h2>Where games actually fit</h2>
			<p>
				Games work on the recognition layer. They move a word from "never seen it" to "I know that
				one", and they do that well and fairly painlessly. What they don't do is get it to "I said
				it to a person without a three second pause first". That's a different exercise, and no
				amount of matching pairs will substitute for it.
			</p>
			<p>
				Which is fine, as long as you know that's the deal. Use them for the fifteen minutes at the
				end of the day when you're too tired to study properly. Fifteen tired minutes is worth
				considerably more than the ninety minute session you keep planning and not doing.
			</p>
			<p>
				When you want the harder version, that's <a
					href={resolve('/tutor')}
					class="text-text-300 underline underline-offset-2">talking to something</a
				>
				instead of clicking on it.
			</p>
		</div>
	</article>
</section>
