<script lang="ts">
	import { resolve } from '$app/paths';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'learning-arabic-with-ai')!;

	// The worked example throughout: one line from the café scenario, in Egyptian.
	const gloss = [
		{ arabic: 'عايز', translit: '3ayiz', english: 'wanting' },
		{ arabic: 'قهوة', translit: 'ahwa', english: 'coffee' },
		{ arabic: 'من', translit: 'min', english: 'from' },
		{ arabic: 'فضلك', translit: 'fadlak', english: 'your kindness' }
	];

	const replySchema = `{
  "arabic":          "أهلاً! تحب قهوة إيه؟",
  "english":         "Welcome! What kind of coffee would you like?",
  "transliteration": "ahlan! tiheb ahwa eh?",
  "wordAlignments":  [ { "arabic": "أهلاً", "english": "welcome", "transliteration": "ahlan" }, … ]
}`;

	const levels = [
		{
			level: 'A1',
			rule: 'One very short sentence, about 4–8 words. Most common everyday words, simple present tense. No idioms, no subordinate clauses.'
		},
		{
			level: 'A2',
			rule: '1–2 short sentences. Common vocabulary, basic past and present. Simple grammar, still no idioms.'
		},
		{
			level: 'B1',
			rule: '2–3 sentences. New vocabulary is allowed when context makes it clear. Connectors, a mix of tenses.'
		},
		{
			level: 'B2',
			rule: '3–4 sentences. Richer vocabulary, a range of tenses, the occasional idiom, more abstract topics.'
		},
		{
			level: 'C1–C2',
			rule: 'Natural near-native speech and then simply natural speech: nuance, idiom, cultural reference, whatever length fits.'
		}
	];

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
				The model was never the hard part. Knowing what to say next is.
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
				Getting a language model to speak Egyptian Arabic takes about an afternoon. Getting a
				beginner to survive four turns of that conversation took considerably longer, and almost
				none of the work was in the model.
			</p>
			<p>
				A raw chat window fails a beginner twice, in a specific order. First they can't read the
				reply — it comes back as unvowelled Arabic script, and even a learner who knows the alphabet
				is now doing archaeology instead of talking. Then, once that's solved, they hit the wall
				that actually ends conversations: they understand the question perfectly and have no idea
				how to answer it. They know maybe two hundred words. The reply they want to give needs a
				word they don't have.
			</p>
			<p>
				Two of our decisions come straight out of those two failures: every tutor message arrives as
				three lines rather than one, and every turn ends with a suggestion for what you could say
				next. Here's the reasoning, and the implementation underneath it.
			</p>

			<h2>One message, three lines</h2>
			<p>
				A tutor turn isn't a string. The model is given a JSON schema it has to fill, and the reply
				only renders if all of the fields come back:
			</p>
			<pre
				class="my-4 overflow-x-auto rounded-lg bg-tile-400 p-4 font-mono text-sm text-text-300"><code
					>{replySchema}</code
				></pre>
			<p>
				<strong>Arabic</strong> is the thing being learned, and it's always there, always first.
				<strong>English</strong> and <strong>transliteration</strong> exist because they answer different
				questions, and a learner mid-sentence usually only has one of them.
			</p>
			<p>
				English answers <em>what does this mean</em>. Transliteration answers
				<em>how does this come out of my mouth</em>. Those come apart more often than people expect:
				you can know exactly what <span dir="rtl">تحب قهوة إيه؟</span> means and still stall on
				whether that first word is <em>tiheb</em> or <em>tuhib</em> — a distinction that happens to be
				the whole difference between sounding Egyptian and sounding like a newsreader. Arabic writes
				three of its vowels and leaves the short ones off, so the script systematically withholds the
				one thing a speaker needs. Transliteration is not a softer version of the Arabic. It's the missing
				half of it.
			</p>
			<p>
				Then there's a fourth field, <strong>wordAlignments</strong>, which is the one that took the
				most prompt-wrangling to get reliable: one entry per Arabic word, in order, with the
				<em>literal</em> gloss rather than a share of the sentence translation. That turns the message
				into an interlinear text you can scan:
			</p>
			<div class="my-4 rounded-lg border border-tile-500 bg-tile-300 p-4">
				<div class="flex flex-wrap gap-x-5 gap-y-3" dir="rtl">
					{#each gloss as word (word.arabic)}
						<div class="flex flex-col items-center gap-0.5">
							<span class="text-xs text-text-200" dir="ltr">{word.english}</span>
							<span class="text-2xl text-text-300">{word.arabic}</span>
							<span class="text-xs italic text-text-200" dir="ltr">{word.translit}</span>
						</div>
					{/each}
				</div>
				<p class="mt-3 border-t border-tile-500 pt-3 text-sm">
					<span class="italic">3ayiz ahwa min fadlak.</span> — "I want a coffee, please."
				</p>
			</div>
			<p>
				A sentence-level translation tells you the line means "please". The word level tells you
				that
				<span dir="rtl">من فضلك</span> is literally "from your kindness", which is the kind of fact that
				makes a phrase stop being four syllables to memorise. It also lets you find the one word you
				missed without re-reading everything, which is what beginners actually do with translations.
			</p>

			<h3>Why they're toggles</h3>
			<p>
				Everything above is also the standard case against transliteration, and it's a fair one: a
				learner who can read the Latin line will read it first, every time, and never build the
				reflex of reading the script. We take that seriously — the site's general position is
				<a
					class="text-text-300 underline underline-offset-2 hover:text-text-200"
					href={resolve('/blog/franco-arabic')}>read franco, write Arabic</a
				>.
			</p>
			<p>
				So the three lines are independently switchable, with a global default and a per-message
				override. The per-word gloss, the transliteration line and the full translation each turn on
				and off, and a message remembers what you did to it while the rest of the thread stays at
				your default. The intended path is that you turn the transliteration off somewhere around
				month two and flick it back on for a single confusing message rather than for the whole
				conversation.
			</p>
			<p>
				That's the honest framing: the crutch is real, and the alternative — a beginner who can't
				pronounce anything they're reading — is worse. Making it one tap to remove is better than
				arguing about which learner is right.
			</p>

			<h2>The thing that actually stops people</h2>
			<p>
				Reading comprehension is a solvable problem. Production is the one that kills sessions. The
				tutor asks you something reasonable, you know what it means, and your Arabic runs out. A
				human tutor handles this without being asked — they feed you the phrase, you repeat it, the
				conversation keeps moving. In a chat window you just sit there, and then you close the tab.
			</p>
			<p>
				So after every tutor reply we make a second, separate call for a single suggested next line,
				with its own prompt whose stated priority isn't correctness or even usefulness. It's
				momentum:
			</p>
			<blockquote
				class="my-4 border-l-2 border-tile-500 pl-4 text-sm italic leading-relaxed text-text-200"
			>
				The MOST IMPORTANT goal: the line must KEEP THE CONVERSATION GOING and give the other
				speaker a clear reason to reply.
			</blockquote>
			<p>
				To do that, the suggestion has to do at least one of three things — ask a relevant question
				back, offer a new detail about you that invites a follow-up, or open the next natural
				sub-topic for the scenario. And a set of prohibitions that exist because the first version
				broke all of them:
			</p>
			<ul>
				<li>
					<strong>No dead ends.</strong> "Thanks", "I'm good", "Okay", goodbyes — banned unless the conversation
					is genuinely wrapping up. A polite closing line is the easiest thing for a model to suggest
					and it ends the practice session.
				</li>
				<li>
					<strong>No repeats, no echoes.</strong> Don't reuse a line you've already said, and don't hand
					the tutor's own question back unchanged.
				</li>
				<li>
					<strong>Blanks, not inventions.</strong> If the line needs a name or a place, it comes
					back with a <code class="rounded bg-tile-400 px-1 py-0.5 text-sm">___</code> for you to fill
					in, rather than the model deciding you're called Sara and live in Maadi.
				</li>
				<li>
					<strong>Pitched at your level.</strong> At A1 and A2 a suggestion is three to eight words and
					usually a short question, because an open question is the cheapest way for a beginner to keep
					a turn alive.
				</li>
			</ul>
			<p>
				It arrives in the same three lines as everything else — Arabic, transliteration, English —
				with audio, so you can hear it before you attempt it:
			</p>
			<div class="my-4 rounded-lg border border-dashed border-sky-400/70 bg-tile-300 p-4">
				<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-text-200">
					💡 Hint — try saying
				</p>
				<p class="text-2xl text-text-300" dir="rtl">ممكن واحد سادة، وإنت بتشرب إيه؟</p>
				<p class="mt-1 text-sm italic text-text-200">mumkin wahid sada, w inta bitishrab eh?</p>
				<p class="text-sm text-text-200">Could I have one without sugar — and what do you drink?</p>
			</div>
			<p>
				The detail I'd defend hardest is what happens when you tap <strong>Use</strong>. It does not
				send the message. It switches the composer to text, forces the keyboard to Arabic, and drops
				the hint's Arabic into the box with the cursor in it. You can send it as-is, or change a
				word, or delete half of it and write your own ending — and in practice people edit it,
				because once a sentence is in front of you the hard part is over. Auto-sending would have
				been one fewer tap and a completely different product: you'd be watching two models talk.
				The hint is scaffolding, and scaffolding you have to type is the only kind that teaches
				anything.
			</p>
			<p>
				Hints have a switch too, and turning them off stops us requesting them at all. The first
				hint in a scripted scenario isn't even generated — it's the opening student line from the
				hand-written dialog, so the very first suggestion you ever see is one a human wrote.
			</p>

			<h2>Correction happens to your sentence, not the tutor's</h2>
			<p>
				A tutor that stops to grade every utterance isn't having a conversation. So when you send a
				turn, two calls go out at once: one for the tutor's reply, and one that quietly works on
				what
				<em>you</em> just said. Your message appears in the thread immediately with the raw transcript,
				then gets patched in place with its own translation, transliteration, per-word gloss and — if
				there's anything to say — feedback.
			</p>
			<p>
				The rule that took the most tuning is when to show you a corrected version of your sentence.
				A model asked to improve a beginner's Arabic will rewrite it endlessly, because there is
				always a more natural phrasing, and being handed a better sentence every single turn is
				demoralising in a way that being ignored is not. So the corrected-sentence field is only
				allowed to appear for objective errors: a wrong conjugation, a pronoun that doesn't agree, a
				bad word form. If the sentence is grammatical but a native speaker would have said it
				differently, the field is left out entirely. Notes about naturalness can live in the
				feedback panel, which is a pill you can ignore. "Here's what you should have written" cannot
				be ignored, so it's reserved for cases where you were actually wrong.
			</p>
			<p>
				Pronunciation scoring in the scripted drills is deliberately dumber: we normalise the Arabic
				(strip tashkeel, fold the alef and ya variants together) and take an edit distance against
				the transcript, pass at 60%, and surface a skip button after three attempts. Word-level
				matching turned out to be far too harsh — a single wrong letter scored zero — and no learner
				needs a third opinion on their <span dir="rtl">ع</span> before they're allowed to continue.
			</p>

			<h2>Level is the most important line in the prompt</h2>
			<p>
				Left alone, a language model answers a beginner's four-word question with a confident,
				idiomatic, four-sentence paragraph. It's good Arabic. It's useless, and it's the single most
				common way an AI tutor fails: the learner can't parse the reply, so they switch to English,
				so the practice stops.
			</p>
			<p>
				The system prompt therefore carries a per-level instruction, marked as overriding every
				other instruction about length, and says plainly that a reply above the learner's level is a
				failure even if it's otherwise perfect:
			</p>
			<div class="my-4 space-y-2">
				{#each levels as row (row.level)}
					<div class="rounded-lg border border-tile-500 bg-tile-300 p-3">
						<span class="mr-2 font-bold text-text-300">{row.level}</span>
						<span class="text-sm">{row.rule}</span>
					</div>
				{/each}
			</div>
			<p>
				The level comes from your profile, defaults to A1, and is the setting most worth getting
				right. Everything else in the prompt is advice; this one is a constraint.
			</p>

			<h2>What it remembers</h2>
			<p>
				Each conversation is stitched to the previous one if you come back within half an hour, so
				closing the tab mid-session doesn't start you over. Longer-term, the tutor is given a block
				of context before it answers: your level and why you said you're learning, summaries and
				topics from your last five sessions, and — the part that matters most — two vocabulary lists
				pulled from your
				<a
					class="text-text-300 underline underline-offset-2 hover:text-text-200"
					href={resolve('/review')}>review deck</a
				>: words you've already got to a decent mastery level, which it's told to use freely, and
				words you're currently learning, which it's told to work in.
			</p>
			<p>
				That's the loop we actually care about. The words you're drilling on flashcards show up in
				conversation while they're still shaky, and at the end of a session the Arabic from the
				transcript comes back the other way — every word the tutor used is offered as a card, you
				untick the ones you don't want, and the rest enter the deck at day zero. Conversation feeds
				the deck, the deck steers the conversation.
			</p>
			<p>
				It also accumulates observations — weaknesses, strengths, topics you keep returning to — and
				a note only gains confidence by being derived again in a later session. One-off guesses stay
				weak, which is about the right amount of trust to put in a model's read of your grammar.
			</p>

			<h2>Speaking, and the latency tax</h2>
			<p>
				The composer opens in voice, not text, because the point is speaking. Recording goes to
				Google's Chirp 3 with a dialect-specific language code — Egyptian gets <code
					class="rounded bg-tile-400 px-1 py-0.5 text-sm">ar-EG</code
				>, Levantine <code class="rounded bg-tile-400 px-1 py-0.5 text-sm">ar-LB</code>, MSA
				<code class="rounded bg-tile-400 px-1 py-0.5 text-sm">ar-SA</code> — and there's a language
				toggle so you can ask a question in English ("how do I say I'm allergic to nuts") and still
				get the answer in Arabic. Playback is ElevenLabs with a per-dialect voice, all of them
				slowed to 0.9, plus a small patch table for words the voices get wrong: the Egyptian
				<span dir="rtl">إزيك</span> is swapped for its transliteration before synthesis, which is a funny
				inversion — the Latin spelling exists in the pipeline because it's the only way to make the machine
				pronounce the Arabic correctly.
			</p>
			<p>
				All of which is slow, so most of the engineering is latency. The two model calls per turn
				run in parallel. Database writes are fired without waiting. Your own message is on screen
				before either call returns. History is truncated hard — six turns for the reply, eight for
				the hint. And model "thinking" is switched off on the conversational endpoints, both because
				a structured three-field reply doesn't need reasoning and because with a prompt this heavy
				the model would occasionally spend its entire output budget thinking and return nothing at
				all.
			</p>
			<p>
				There's also more JSON defence than I'd like to admit: markdown fences stripped from
				responses that were supposed to be raw JSON, control characters escaped, trailing commas
				repaired, arrays unwrapped when the model returns a list where an object was asked for. And
				a final check that refuses to render a message whose <code
					class="rounded bg-tile-400 px-1 py-0.5 text-sm">arabic</code
				> field starts with a brace — because failing loudly beats printing a JSON blob in an Arabic
				font.
			</p>

			<h2>Where it still falls down</h2>
			<ul>
				<li>
					<strong>Dialect drift.</strong> Every Arabic model's centre of gravity is Fusha, because that's
					what's written down. Ask for Egyptian and you will periodically get an MSA sentence with case
					endings, especially on abstract topics. Naming the dialect in the prompt helps and doesn't
					fix it; the per-dialect phonology rules we wrote for the lesson generator are the obvious next
					thing to push into the tutor.
				</li>
				<li>
					<strong>Transliteration isn't standardised.</strong> There's no romanisation table in the
					code — the model writes the Latin line freehand, and the house style comes mostly from the
					hand-written scenario dialogs it's seen. So you'll get <em>3afwan</em> and
					<em>afwan</em> in the same session. A fixed scheme is the right answer and we haven't shipped
					it.
				</li>
				<li>
					<strong>Resumed conversations lose the gloss.</strong> We persist the three lines, not the
					per-word alignment, so reopening an old conversation falls back to splitting on spaces.
				</li>
				<li>
					<strong>It will tell you your accent is great.</strong> Edit distance on a transcript measures
					whether the recogniser heard roughly the right word, which is not the same as pronouncing it
					well. Treat the percentage as a progress bar, not a verdict.
				</li>
			</ul>
			<p>
				The broader honest version: an AI tutor is unmatched at the thing human tutors are worst at,
				which is being available at 1am for the fifteenth attempt at the same sentence with no
				social cost. It is not a substitute for a person who will hold you to a schedule, and it
				doesn't notice when you quit. What it can do is make sure that the reason you stopped wasn't
				that you didn't know what to say next.
			</p>

			<h2>Try it</h2>
			<ul>
				<li>
					<a
						class="text-text-300 underline underline-offset-2 hover:text-text-200"
						href={resolve('/tutor')}
					>
						The tutor
					</a> — pick Egyptian, Levantine or MSA, start with a scenario or just say hello.
				</li>
				<li>
					<a
						class="text-text-300 underline underline-offset-2 hover:text-text-200"
						href={resolve('/speak')}
					>
						Speaking practice
					</a> — the same speech pipeline, sentence by sentence, without a conversation to hold up.
				</li>
				<li>
					<a
						class="text-text-300 underline underline-offset-2 hover:text-text-200"
						href={resolve('/blog/franco-arabic')}
					>
						Franco Arabic
					</a> — why the transliteration has digits in it, and why you should only ever read them.
				</li>
			</ul>
		</div>
	</article>
</section>
