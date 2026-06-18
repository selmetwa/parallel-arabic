<script lang="ts">
	import { resolve } from '$app/paths';
	import { blogPosts } from '$lib/constants/blog-posts';

	const post = blogPosts.find((p) => p.slug === 'egyptian-arabic-alphabet')!;

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
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
				Same letters as everywhere else. Different sounds.
			</p>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-200">
				<span>{formatDate(post.date)}</span>
				<span aria-hidden="true">·</span>
				<span>{post.readingTime}</span>
			</div>
		</header>

		<div class="space-y-4 text-base leading-relaxed text-text-200 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text-300 [&_strong]:text-text-300 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
			<p>
				You find a nice Arabic alphabet chart, you learn that ج is "jeem" and makes a "j" sound, you
				feel good about yourself, and then you watch an Egyptian movie and nobody is saying "j"
				anywhere.
			</p>
			<p>
				This is the alphabet again, but with the sounds you'll actually hear in Egypt. Same 28
				letters, same shapes. Just the everyday spoken version rather than the formal one.
			</p>
			<p>
				One note before we start: I'm going to write the sounds in <strong>franco</strong> (the Arabic
				chat alphabet), where numbers stand in for letters English doesn't have. 7 is ح, 3 is ع, 2 is
				a hamza. You'll pick it up as we go.
			</p>

			<h2>The letters that change in Egyptian</h2>
			<p>
				Most letters are straightforward. ب is "b", م is "m", ف is "f". What you see is what you get.
				But a handful change in Egyptian, and these are the ones to learn first, since they trip up
				most beginners.
			</p>

			<div class="space-y-4 rounded-xl border border-green-600/40 bg-green-500/10 p-5">
				<div>
					<p class="font-bold text-text-300"><span dir="rtl">ج</span> is a hard G.</p>
					<p class="mt-1">
						Not "j", unless you're reading the news. <span dir="rtl">جمل</span> is
						<strong>gamal</strong> (camel), <span dir="rtl">جميل</span> is
						<strong>gameel</strong> (beautiful), <span dir="rtl">جديد</span> is
						<strong>gedeed</strong> (new). "Jameel" will be understood, but it sounds like a textbook.
					</p>
				</div>
				<div>
					<p class="font-bold text-text-300"><span dir="rtl">ق</span> usually just… disappears.</p>
					<p class="mt-1">
						This is the famous one. In Standard Arabic ق is a deep "q" from the back of the throat.
						In Cairo it mostly turns into a hamza, the little catch in your throat in "uh-oh". So
						<span dir="rtl">قلب</span> (heart) becomes <strong>alb</strong>, not qalb.
						<span dir="rtl">قهوة</span> (coffee) becomes <strong>2ahwa</strong>.
					</p>
					<p class="mt-2">
						Not always, though. More formal words keep the q. <span dir="rtl">قرآن</span> stays
						<strong>Qor'an</strong>. <span dir="rtl">قانون</span> (law) stays <strong>qanoon</strong>.
						There's no clean rule. You learn which words keep it word by word, the way English
						speakers know "colonel" is "kernel".
					</p>
				</div>
				<div>
					<p class="font-bold text-text-300">
						<span dir="rtl">ث ذ ظ</span>, the "th" letters nobody pronounces.
					</p>
					<p class="mt-1">
						Standard Arabic has the English "th" sounds. Egyptian mostly doesn't. They collapse:
					</p>
					<ul class="mt-2">
						<li>
							ث becomes <strong>T</strong> or <strong>S</strong>. <span dir="rtl">ثوم</span> (garlic)
							is Tom, <span dir="rtl">ثانوية</span> (secondary) is sanaweya.
						</li>
						<li>
							ذ becomes <strong>Z</strong> (sometimes D). <span dir="rtl">ذهب</span> (gold) is dahab,
							<span dir="rtl">إذاعة</span> (radio) is eza3a.
						</li>
						<li>
							ظ becomes a heavy <strong>Z</strong>. <span dir="rtl">ظرف</span> (envelope) is zarf.
						</li>
					</ul>
				</div>
			</div>

			<p>
				If you grew up being told Arabic has those nice "th" sounds, quietly let them go in Egypt.
			</p>

			<h2>The throat letters</h2>
			<p>
				Now the hard ones. There's a group of letters made deep in the throat, and these are the
				sounds English just doesn't have. No shortcut here. You have to hear them and copy them.
			</p>
			<ul>
				<li>
					<span dir="rtl">ح</span> (7a): like fogging up a mirror, but tighter.
					<span dir="rtl">حبيب</span> is 7abib (beloved).
				</li>
				<li>
					<span dir="rtl">خ</span> (kh): the sound at the end of "Bach".
					<span dir="rtl">خير</span> is kheer (goodness).
				</li>
				<li>
					<span dir="rtl">ع</span> (3ein): the tricky one. A tightening in the throat, with no
					English equivalent. <span dir="rtl">عربي</span> is 3arabi (Arabic).
				</li>
				<li>
					<span dir="rtl">غ</span> (gh): like a French R, a soft gargle.
					<span dir="rtl">غالي</span> is ghali (expensive).
				</li>
				<li><span dir="rtl">ه</span> (h): soft, like an English "h".</li>
				<li>and the hamza <span dir="rtl">ء</span>, the glottal stop from earlier.</li>
			</ul>
			<p>
				ع takes time, and it's fine to be bad at it for a while. You'll get it by imitation, not from
				a written description.
			</p>
			<p>
				One thing that helped me: a lot of teachers group the alphabet by where the sound is made:
				throat, tongue and teeth, lips. Once you start feeling where a letter sits in your mouth, the
				throat letters feel less random.
			</p>

			<h2>They all connect, except six</h2>
			<p>
				Arabic is cursive. Letters join up, so each one has a slightly different shape depending on
				whether it's at the start, middle, or end of a word. Your eyes sort this out faster than
				you'd think, and you stop noticing the four forms fairly quickly.
			</p>
			<p>The part worth knowing up front is the six kicking letters:</p>
			<p class="py-2 text-center text-3xl font-bold text-text-300" dir="rtl">ا و د ذ ر ز</p>
			<p>
				These six connect to the letter <strong>before</strong> them, but not the letter
				<strong>after</strong>, so they leave a small gap mid-word. Look at
				<span dir="rtl">دكتور</span> (doktor, doctor) and notice how it breaks apart after the
				<span dir="rtl">د</span>
				and the <span dir="rtl">و</span>. Once you know these six, a lot of "why is there a space
				there" questions answer themselves.
			</p>

			<h2>Three letters that get their own paragraph</h2>
			<p>A few odds and ends the charts tend to skip:</p>
			<p>
				<strong><span dir="rtl">لا</span> (lam-alif).</strong> When
				<span dir="rtl">ل</span> and <span dir="rtl">ا</span> meet they fuse into one shape,
				<span dir="rtl">لا</span>. It's not a new letter, it just looks like one. You'll see it
				constantly. <span dir="rtl">لا</span> literally means "no".
			</p>
			<p>
				<strong><span dir="rtl">ة</span> (taa marbuta).</strong> The little circle-with-dots at the
				end of words, almost always feminine ones. <span dir="rtl">مدرسة</span> (madrasa, school),
				<span dir="rtl">قطة</span> (2otta, cat). It sounds like a soft "a", and sometimes a "t" when
				the grammar calls for it. Don't overthink it yet.
			</p>
			<p>
				<strong><span dir="rtl">ء</span> (hamza),</strong> one more time. The unofficial 29th letter,
				a glottal stop, and it likes to perch on top of other letters:
				<span dir="rtl">أ</span> on an alif, <span dir="rtl">ؤ</span> on a waw,
				<span dir="rtl">ئ</span> on a ya, or just float on its own. Which seat it takes depends on
				the vowels around it, and that's honestly a whole post of its own.
			</p>

			<h2>So where does that leave you</h2>
			<p>
				Same 28 letters everyone learns. The shapes don't change. What changes is a small set of
				sounds (<span dir="rtl">ج ق ث ذ ظ</span>) and a handful of throat letters that take time and a
				lot of listening. Learn those distinctions first and the gap between the chart and how people
				actually talk mostly closes.
			</p>
			<p>
				If you want to actually click through the letters and hear each one, I built an interactive
				version of all of this: the full alphabet with the Egyptian sounds, the articulation groups,
				and the kicking letters.
			</p>
			<p>
				<a
					href={resolve('/alphabet-new')}
					class="font-semibold text-text-300 underline underline-offset-4 hover:text-text-200"
				>
					It's here →
				</a>
			</p>
			<p>That's the gist. The rest is listening.</p>
		</div>
	</article>
</section>
