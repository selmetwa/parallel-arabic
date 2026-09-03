<script lang="ts">
	import { resolve } from '$app/paths';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'franco-arabic')!;

	const numerals = [
		{
			digit: '2',
			letter: 'ء',
			name: 'hamza',
			why: 'The glottal stop. Also stands in for ق in Egyptian, where the q is pronounced as a glottal stop anyway.',
			example: 'أهوة → 2ahwa (coffee)'
		},
		{
			digit: '3',
			letter: 'ع',
			name: '3ayn',
			why: 'A mirror image of ع, which is where the choice comes from. No English sound is close.',
			example: 'عربي → 3arabi (Arabic)'
		},
		{
			digit: '5',
			letter: 'خ',
			name: 'kha',
			why: 'From خمسة (khamsa, "five"). Competes with "kh", which is more common in Egypt.',
			example: 'خلاص → 5alas or khalas (enough)'
		},
		{
			digit: '6',
			letter: 'ط',
			name: 'Ta',
			why: 'The emphatic t. Rarer than the others; many people just write t.',
			example: 'طويل → 6aweel or taweel (tall)'
		},
		{
			digit: '7',
			letter: 'ح',
			name: 'Ha',
			why: 'The breathy throat h, as opposed to ه. The digit resembles the letter.',
			example: 'حبيبي → 7abibi (my dear)'
		},
		{
			digit: '8',
			letter: 'غ',
			name: 'ghayn',
			why: 'The gargled r. Usually written "gh" instead, which most people find easier to read.',
			example: 'غالي → 8aly or ghaly (expensive)'
		},
		{
			digit: '9',
			letter: 'ص',
			name: 'Sad',
			why: 'The emphatic s. Like 6, frequently skipped in favour of plain s.',
			example: 'صعب → 9a3b or sa3b (difficult)'
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
				The digits aren't slang. They're the letters English doesn't have.
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
				If you have ever been added to a group chat with Egyptians, you have seen messages like
				<em>ana 7abetha awi</em> or <em>3amel eh</em>, and wondered what the numbers are doing
				there. They are letters. Arabic has six or seven sounds with no Latin equivalent, and rather
				than invent diacritics that nobody can type, people reached for the digits that look like
				the Arabic letters.
			</p>
			<p>
				It goes by several names — franco, franco-arab, Arabizi, Arabish, or just "Arabic chat" —
				and it is entirely unofficial. Nobody standardised it. It spread because it worked.
			</p>

			<h2>The substitutions</h2>
			<div class="space-y-3">
				{#each numerals as row (row.digit)}
					<div class="rounded-lg border border-tile-500 bg-tile-300 p-4">
						<div class="mb-1 flex items-baseline gap-3">
							<span class="text-2xl font-bold text-text-300">{row.digit}</span>
							<span class="text-2xl text-text-300" dir="rtl">{row.letter}</span>
							<span class="text-sm text-text-200">{row.name}</span>
						</div>
						<p class="mb-2 text-sm">{row.why}</p>
						<p class="text-sm text-text-300">{row.example}</p>
					</div>
				{/each}
			</div>
			<p>
				Everything else maps onto Latin letters the way you would guess. The pattern behind the
				digits is visual rather than phonetic: <strong>3</strong> is a mirrored
				<span dir="rtl">ع</span>, <strong>7</strong> has the shape of <span dir="rtl">ح</span>,
				<strong>2</strong> resembles the hamza. Where the shape does not help, people fall back on
				the first letter of the Arabic numeral itself — <strong>5</strong> for
				<span dir="rtl">خ</span> comes from <span dir="rtl">خمسة</span>.
			</p>

			<h2>Where it came from</h2>
			<p>
				Early mobile phones and the early web could not handle Arabic script. SMS in the late
				nineties either had no Arabic support or charged you roughly double per message for it,
				because Arabic characters ate more of the message limit. Chat clients mangled the encoding.
				Writing Arabic in Latin letters was the only option, and the digits were the workaround for
				the sounds that ran out of letters.
			</p>
			<p>
				That constraint is long gone. Every phone sold today has an Arabic keyboard a long-press
				away. Franco did not go away with it, which is the more interesting half of the story.
			</p>

			<h2>Why it survived</h2>
			<p>
				Switching keyboards mid-sentence is genuinely annoying, and a lot of conversation is
				bilingual — a sentence of Arabic with an English word in the middle of it. Typing the whole
				thing in Latin letters is faster than toggling twice.
			</p>
			<p>
				It also solves a problem that the Arabic script has and Latin does not: the script does not
				write short vowels. <span dir="rtl">كتب</span> could be <em>katab</em> ("he wrote"),
				<em>kutub</em> ("books"), or <em>kutiba</em> ("it was written"). Franco spells the vowels out.
				For dialect in particular, where the vowels are exactly what differs between Cairo and Beirut,
				that is a real advantage. Written Egyptian in Arabic script is inherently a little ambiguous
				about pronunciation. Franco is not.
			</p>
			<p>
				And there is a register to it. Franco reads as casual and young. Nobody sends a work email
				in it. It belongs to the same category as lowercase and no punctuation in English — a signal
				about the relationship, not just a way of encoding words.
			</p>

			<h2>The inconsistency is real</h2>
			<p>
				Because nothing was ever standardised, the same word has several accepted spellings and
				everyone reads all of them without effort.
			</p>
			<ul>
				<li><span dir="rtl">خلاص</span> is <em>khalas</em>, <em>5alas</em>, or <em>7'alas</em>.</li>
				<li><span dir="rtl">شكرا</span> is <em>shokran</em> or <em>shukran</em>.</li>
				<li>
					<span dir="rtl">إزيك</span> is <em>ezayak</em>, <em>izzayak</em>, or <em>ezzayk</em>.
				</li>
			</ul>
			<p>
				Regional habits differ too. Egyptians lean on <em>kh</em> and <em>gh</em> where Gulf writers
				are more likely to use 5 and 8. The emphatic letters (6 for
				<span dir="rtl">ط</span>, 9 for <span dir="rtl">ص</span>) get dropped by plenty of people
				who just write t and s and let context handle it.
			</p>

			<h2>Should you learn it?</h2>
			<p>
				Learn to <em>read</em> it, because you will be sent it. It takes about five minutes; the table
				above is most of what there is.
			</p>
			<p>
				Do not use it as your way into the language. Franco cannot teach you the script, and the
				script is not optional — every book, sign, subtitle and news article is in it, and the two
				weeks it takes to learn is the best trade available in Arabic. Read franco when a friend
				writes it. Write Arabic in Arabic.
			</p>
			<p>
				The one genuine exception is a search box. If you do not have an Arabic keyboard set up yet,
				franco is how you look a word up, which is why every word on this site carries its franco
				spelling next to the Arabic.
			</p>

			<h2>Next</h2>
			<ul>
				<li>
					<a
						class="text-text-300 underline underline-offset-2 hover:text-text-200"
						href={resolve('/blog/writing-arabic-in-english')}
					>
						Writing Arabic in English
					</a> — building a keyboard that maps English keys to Arabic sounds, and the problems that came
					with it.
				</li>
				<li>
					<a
						class="text-text-300 underline underline-offset-2 hover:text-text-200"
						href={resolve('/keyboard')}
					>
						The virtual Arabic keyboard
					</a> — type Arabic without installing a layout.
				</li>
				<li>
					<a
						class="text-text-300 underline underline-offset-2 hover:text-text-200"
						href={resolve('/egyptian-arabic/vocabulary')}
					>
						Egyptian Arabic vocabulary
					</a> — every word with its Arabic spelling, its pronunciation and its franco form.
				</li>
			</ul>
		</div>
	</article>
</section>
