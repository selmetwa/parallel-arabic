<script lang="ts">
	import { resolve } from '$app/paths';
	import BlogArticle from '$lib/components/blog/BlogArticle.svelte';
	import AudioClip from '$lib/components/AudioClip.svelte';
	import { blogPosts } from '$lib/constants/blog-posts';
	import { getVarietyInfo } from '$lib/constants/varieties';
	import {
		COMPARE_SENTENCES,
		COMPARE_WORDS,
		LEVANTINE_VARIETIES,
		SHARED_VOICE,
		SHARED_WORDS,
		clipPath,
		type LevantineVariety
	} from '$lib/constants/levantine-compare';

	const post = blogPosts.find((p) => p.slug === 'levantine-arabic-dialects-compared')!;
	const varieties = LEVANTINE_VARIETIES.map((key) => getVarietyInfo(key)!);
	const sentence = (id: string) => COMPARE_SENTENCES.find((s) => s.id === id)!;
	const word = (id: string) => COMPARE_WORDS.find((w) => w.id === id)!;
</script>

<!-- A word in one variety: Arabic, romanised, and its recording. -->
{#snippet say(kind: 'sentence' | 'word', id: string, v: LevantineVariety)}
	{@const form = kind === 'sentence' ? sentence(id).forms[v] : word(id).forms[v]}
	<span class="ar-text" lang="ar">{form.arabic}</span> <strong>{form.transliteration}</strong>
	<AudioClip src={clipPath(kind, id, v)} label="{getVarietyInfo(v)?.shortName}: {form.transliteration}" />
{/snippet}

<!-- One word across all four, as a list. -->
{#snippet acrossAll(id: string)}
	<ul>
		{#each varieties as v (v.key)}
			<li>{v.flag} {v.shortName}: {@render say('word', id, v.key as LevantineVariety)}</li>
		{/each}
	</ul>
{/snippet}

<BlogArticle
	{post}
	subtitle="Four accents of one dialect. Press play on any example to hear it in a native voice from that country."
>
	<p>
		Syrian, Lebanese, Jordanian and Palestinian Arabic are usually grouped as one dialect: Levantine,
		or Shami. If you're deciding which to learn, or you've noticed your Lebanese friend and your
		Jordanian colleague don't sound quite the same, the question is how far apart they really are.
	</p>
	<p>
		Not very. A Damascene and a Ramallah native talk to each other without a second thought. The
		grammar is the same, and almost every everyday word is the same. What changes is a short list of
		very common words and the melody of the sentence. That short list is exactly what makes each
		accent recognisable, so it's worth knowing.
	</p>

	<h2>One sentence, four accents</h2>
	<p>Here's "What do you want to do now?" in each:</p>
	<ul>
		{#each varieties as v (v.key)}
			<li>{v.flag} {v.shortName}: {@render say('sentence', 'what-now', v.key as LevantineVariety)}</li>
		{/each}
	</ul>
	<p>
		Same structure, same verb, same <strong>baddak</strong> (you want). The differences are the word
		for "now", the Palestinian <strong>eesh</strong> for "what", and the vowels: Syrians and Lebanese
		tend to say <strong>baddak</strong>, Jordanians and Palestinians <strong>biddak</strong>. Listen
		for the melody too. It's hard to write down, and it's often the first thing a native notices.
	</p>

	<h2>"Now": the quickest tell</h2>
	<p>If you only learn one difference, make it this one:</p>
	{@render acrossAll('now')}
	<p>
		Syrians and Lebanese say <strong>halla2</strong>, Jordanians say <strong>hassa</strong>, and many
		Palestinians say <strong>halla2eet</strong>. In practice the lines blur: you'll hear hassa in
		parts of Palestine too, and every Levantine speaker understands all three.
	</p>

	<h2>"This": hada, hayda or hay</h2>
	{@render acrossAll('this')}
	<p>
		<strong>Hayda</strong> marks a Lebanese speaker straight away. With feminine words the split is
		similar: Lebanese say <strong>hayde</strong>, Jordanians and Palestinians <strong>hay</strong>.
		Hear it in a full sentence, "This is really nice":
	</p>
	<ul>
		<li>🇸🇾 Syrian: {@render say('sentence', 'this-is-nice', 'syrian')}</li>
		<li>🇱🇧 Lebanese: {@render say('sentence', 'this-is-nice', 'lebanese')}</li>
	</ul>

	<h2>"What" and "thing": shu or eesh, shi or ishi</h2>
	<p>
		Everyone in the Levant says <strong>shu</strong> for "what", and that's the one to learn.
		Palestinians also say {@render say('word', 'what', 'palestinian')}, which you won't hear much
		further north. "Something" splits along a similar line:
	</p>
	{@render acrossAll('thing')}
	<p>"Is something wrong?" in Damascus and in Amman:</p>
	<ul>
		<li>🇸🇾 Syrian: {@render say('sentence', 'anything', 'syrian')}</li>
		<li>🇯🇴 Jordanian: {@render say('sentence', 'anything', 'jordanian')}</li>
	</ul>

	<h2>"Not" and "yes"</h2>
	<p>
		Before a noun or an adjective, Syrians say {@render say('word', 'not', 'syrian')} where everyone
		else says {@render say('word', 'not', 'lebanese')}. Verbs take <strong>ma</strong> everywhere:
		<em>ma ba3ref</em>, I don't know. "Yes" comes in three flavours:
	</p>
	{@render acrossAll('yes')}

	<h2>The qaf</h2>
	<p>
		The letter <span class="ar-text" lang="ar">ق</span> is where accents differ most, and it changes
		with region and background more than with borders. In the cities, Damascus, Beirut and Jerusalem
		alike, it's a glottal stop: <strong>2albi</strong>, my heart. Many Jordanians, especially men,
		say a hard g: <strong>galbi</strong>. In many Palestinian villages <span class="ar-text" lang="ar">ك</span>
		becomes ch. You don't need to choose: the city glottal stop is understood everywhere, and it's
		what the recordings on this page use.
	</p>

	<h2>Lebanese and French</h2>
	<p>
		Lebanese stands out for one more reason: French. Greetings and thanks often switch language mid
		sentence, and <span class="ar-text" lang="ar">ميرسي كتير</span> <strong>merci kteer</strong>
		<AudioClip src="/audio/varieties/lebanese-2.mp3" label="Lebanese: merci kteer" /> is how many
		Lebanese say "thanks a lot". You don't need any French to learn Lebanese; you'll pick these up as
		you go.
	</p>

	<h2>What they all share</h2>
	<p>Far more than they don't. These work everywhere from Aleppo to Gaza:</p>
	<ul>
		{#each SHARED_WORDS as w (w.id)}
			<li>
				<span class="ar-text" lang="ar">{w.arabic}</span> <strong>{w.transliteration}</strong>: {w.english}
				<AudioClip src={clipPath('shared', w.id, SHARED_VOICE)} label={w.transliteration} />
			</li>
		{/each}
	</ul>
	<p>
		Add the shared grammar, the <strong>b-</strong> on present-tense verbs (<em>bi7ki</em>, I speak)
		and <strong>ra7</strong> for the future (<em>ra7 rou7</em>, I'll go), and you have the core of all
		four.
	</p>

	<h2>So which should you learn?</h2>
	<p>
		The one spoken by the people you want to talk to. Heritage learners should go with their family's
		accent; if you're moving to Amman, learn Jordanian. If you have no particular country in mind,
		learn general Levantine: it's understood across all four, and switching to one accent later means
		learning the handful of words above, not a new grammar.
	</p>
	<p>
		That's how <a href={resolve('/levantine')}>Levantine Arabic</a> works here. The
		<a href={resolve('/lessons/structured/[dialect]', { dialect: 'levantine' })}>lessons</a> teach the
		shared core, and you pick your accent: your audio, <a href={resolve('/tutor')}>your tutor</a> and
		the stories written for you then sound
		<a href={resolve('/syrian-arabic')}>Syrian</a>,
		<a href={resolve('/lebanese-arabic')}>Lebanese</a>,
		<a href={resolve('/jordanian-arabic')}>Jordanian</a> or
		<a href={resolve('/palestinian-arabic')}>Palestinian</a>.
	</p>
	<p>
		Want to hear more side by side? <a href={resolve('/levantine-dialects')}>The Levantine dialects
		compared</a> has every example on this page in all four voices, with a play-all button for each
		sentence. And if you're just starting,
		<a href={resolve('/blog/how-to-learn-levantine-arabic')}>how to learn Levantine Arabic</a> lays out
		the order to learn it in.
	</p>
</BlogArticle>
