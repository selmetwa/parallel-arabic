<script lang="ts">
	import { resolve } from '$app/paths';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'how-many-egyptian-arabic-words')!;

	// Recomputed from src/lib/constants/common-words.ts, a 2,404-entry frequency
	// list built from a 29.3M-token Egyptian corpus. Percentages are share of
	// the tokens those 2,404 words account for.
	const coverage = [
		{ rank: 10, pct: '16.7%' },
		{ rank: 25, pct: '26.7%' },
		{ rank: 50, pct: '35.2%' },
		{ rank: 100, pct: '44.9%' },
		{ rank: 300, pct: '62.2%' },
		{ rank: 500, pct: '70.6%' },
		{ rank: 1000, pct: '83.1%' },
		{ rank: 2404, pct: '100%' }
	];

	const topTwenty = [
		{ ar: 'من', tr: 'men', en: 'from' },
		{ ar: 'في', tr: 'fi', en: 'in' },
		{ ar: 'يا', tr: 'ya', en: 'oh' },
		{ ar: 'الله', tr: 'Allah', en: 'God' },
		{ ar: 'مش', tr: 'mesh', en: 'not' },
		{ ar: 'لا', tr: 'la2', en: 'no' },
		{ ar: 'بس', tr: 'bas', en: 'but' },
		{ ar: 'ما', tr: 'ma', en: 'what' },
		{ ar: 'اللي', tr: 'elly', en: 'who / which' },
		{ ar: 'على', tr: '3ala', en: 'on' },
		{ ar: 'والله', tr: 'wallah', en: 'by God' },
		{ ar: 'ولا', tr: 'wala', en: 'nor' },
		{ ar: 'ده', tr: 'da', en: 'this' },
		{ ar: 'يارب', tr: 'ya rab', en: 'oh Lord' },
		{ ar: 'علي', tr: '3ali', en: 'Ali' },
		{ ar: 'هو', tr: 'howa', en: 'he' },
		{ ar: 'ان', tr: 'en', en: 'that' },
		{ ar: 'انت', tr: 'enta', en: 'you' },
		{ ar: 'دي', tr: 'di', en: 'this (f.)' },
		{ ar: 'ربنا', tr: 'rabbena', en: 'our Lord' }
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
				The honest answer involves admitting that the first hundred are useless to study.
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
				The usual figure quoted for a language is that 1,000 words gets you 80% of ordinary speech.
				I wanted to check it against Egyptian Arabic specifically, so I ran the numbers on the
				frequency list this site is built from: 2,404 words drawn from a corpus of 29.3 million
				tokens of written Egyptian.
			</p>
			<p>The headline number holds up almost exactly. Everything interesting is underneath it.</p>

			<h2>The curve</h2>
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left">
					<thead>
						<tr class="border-b-2 border-tile-600 text-sm">
							<th scope="col" class="py-2 pr-4">Top N words</th>
							<th scope="col" class="py-2">Share of all tokens</th>
						</tr>
					</thead>
					<tbody>
						{#each coverage as row (row.rank)}
							<tr class="border-b border-tile-500">
								<td class="py-2 pr-4">{row.rank.toLocaleString()}</td>
								<td class="py-2 font-semibold text-text-300">{row.pct}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p>
				Ten words cover a sixth of everything. A hundred cover close to half. The thousand-word
				figure lands at 83%, and the last 1,400 words on the list buy you the remaining 17%.
			</p>
			<p>
				One caveat that matters, because most articles quoting numbers like these skip it: these
				percentages are shares of the tokens <em>this list</em> accounts for, not of all Egyptian Arabic
				ever written. The list stops at 2,404 words, so the real corpus is bigger and the true coverage
				of running text at any rank is somewhat lower than the figure above. The shape of the curve is
				right. Treat the exact numbers as an upper bound.
			</p>

			<h2>Now look at what the first twenty words actually are</h2>
			<div
				class="grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg border border-tile-500 bg-tile-300 p-5 sm:grid-cols-2"
			>
				{#each topTwenty as word, i (word.ar)}
					<div class="flex items-baseline gap-2 text-sm">
						<span class="w-5 shrink-0 text-text-200">{i + 1}</span>
						<span class="text-lg text-text-300" dir="rtl">{word.ar}</span>
						<span class="text-text-200">{word.en}</span>
					</div>
				{/each}
			</div>
			<p>
				There is nothing there you can study. <strong>52 of the top 100 are function words</strong>
				— prepositions, pronouns, particles, conjunctions. They carry grammar, not meaning. You cannot
				usefully put <span dir="rtl">اللي</span> on a flashcard, because knowing that it means "who"
				or "which" tells you nothing about how to use it; you learn it by seeing it four hundred times
				in sentences until the shape of a relative clause feels normal.
			</p>
			<p>
				The share drops as you go down the list — 52% in the first hundred, 37% between 100 and 300,
				23% between 300 and 500 — and that decline is the actual answer to "where do I start
				studying vocabulary". Not at the top.
			</p>

			<h2>The corpus has a personality</h2>
			<p>
				Four of the top 50 words are invocations of God: <span dir="rtl">الله</span>,
				<span dir="rtl">والله</span>, <span dir="rtl">يارب</span>, <span dir="rtl">ربنا</span>.
				<span dir="rtl">حبيبي</span> ("my dear") sits at rank 100.
				<span dir="rtl">قلبي</span> ("my heart") is inside the top 30.
			</p>
			<p>
				That is not what a transcript of people buying vegetables looks like. It is what song lyrics
				and social media look like, which is where this kind of corpus generally comes from. The
				religious vocabulary is genuinely high-frequency in real Egyptian speech —
				<span dir="rtl">إن شاء الله</span> and <span dir="rtl">الحمد لله</span> punctuate ordinary conversation
				constantly — but the romantic vocabulary is inflated by the source material.
			</p>
			<p>
				There is straightforward noise in there too. Rank 15 is <span dir="rtl">علي</span>, glossed
				as the name Ali, which is almost certainly <span dir="rtl">على</span> ("on") written without
				its final hamza and counted separately. Any frequency list assembled from raw text has artefacts
				like this. It is worth knowing they exist before you treat rank order as gospel.
			</p>

			<h2>So what should you actually do</h2>
			<p>
				<strong>Do not study the first hundred words as vocabulary.</strong> Read and listen enough that
				they become invisible. They will, quickly, because they are in every sentence.
			</p>
			<p>
				<strong>Start deliberate study somewhere around rank 150.</strong> That is roughly where content
				words start outnumbering grammar words, and where a flashcard begins to be worth making.
			</p>
			<p>
				<strong>Switch from frequency to topics after the first few hundred.</strong> Past that
				point, frequency rank stops predicting usefulness. Whether
				<span dir="rtl">مطار</span> ("airport") is word 800 or word 1,600 matters much less than whether
				you are about to fly to Cairo. This is why the vocabulary on this site is grouped by subject
				rather than served as one long ranked list.
			</p>
			<p>
				<strong>Expect the curve to flatten and keep going anyway.</strong> Getting from 83% to 90% takes
				another 500 words, and that last stretch is where the difference between following a conversation
				and participating in one actually lives.
			</p>

			<h2>Try it</h2>
			<p>
				The top of the frequency list is on the site, ranked and with the raw occurrence counts, so
				you can see the shape of it for yourself rather than take my word for it.
			</p>
			<ul>
				<li>
					<a
						class="text-text-300 underline underline-offset-2 hover:text-text-200"
						href={resolve('/egyptian-arabic/vocabulary/[topic]', { topic: 'most-common' })}
					>
						The 500 most common Egyptian Arabic words
					</a> — ranked, with occurrence counts.
				</li>
				<li>
					<a
						class="text-text-300 underline underline-offset-2 hover:text-text-200"
						href={resolve('/egyptian-arabic/vocabulary')}
					>
						Vocabulary by topic
					</a> — the useful band, sorted by subject instead.
				</li>
				<li>
					<a
						class="text-text-300 underline underline-offset-2 hover:text-text-200"
						href={resolve('/egyptian-arabic/beginners')}
					>
						Egyptian Arabic for beginners
					</a> — where vocabulary fits in the wider order of things.
				</li>
			</ul>
		</div>
	</article>
</section>
