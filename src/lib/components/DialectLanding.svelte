<script lang="ts">
	import { onMount } from 'svelte';
	import { currentDialect } from '$lib/store/store';
	import { DIALECT_LANDING } from '$lib/constants/dialect-landing';
	import type { Dialect } from '$lib/types/index';

	interface Props {
		dialect: Dialect;
		/** Whether the phrasebook has been generated for this dialect. */
		hasPhrases?: boolean;
		/** Whether word pages have been built for this dialect. */
		hasWords?: boolean;
	}

	let { dialect, hasPhrases = false, hasWords = false }: Props = $props();

	const content = $derived(DIALECT_LANDING[dialect]);

	const links = $derived([
		{
			href: `/lessons/structured/${dialect}`,
			title: 'Lessons',
			description: 'Structured lessons covering greetings, family, food, travel and more.'
		},
		...(hasPhrases
			? [
					{
						href: `/${dialect}/phrases`,
						title: 'Phrases',
						description: `How to say hello, thank you, happy birthday and the rest, with audio and the forms for a man, a woman or a group.`
					}
				]
			: []),
		...(hasWords
			? [
					{
						href: `/${dialect}/word`,
						title: 'Common Words',
						description:
							'The words you meet most often, each with audio and real example sentences from our stories.'
					}
				]
			: []),
		{
			href: `/stories?dialect=${dialect}`,
			title: 'Stories',
			description: `Read and listen to ${content.heading} stories with translation and a vocabulary glossary.`
		},
		{
			href: `/vocabulary?dialect=${dialect}`,
			title: 'Vocabulary',
			description: 'Search the word database, hear each word, and save it to your review deck.'
		},
		...(content.extraLinks ?? []),
		{
			href: '/tutor',
			title: 'Conversation Practice',
			description: `Talk to the AI tutor in ${content.heading} and get corrections as you go.`
		}
	]);

	onMount(() => {
		currentDialect.set(dialect);
	});
</script>

<section class="mx-auto mt-6 max-w-5xl px-3 sm:px-8">
	<header class="mb-6 text-left">
		<h1 class="mb-1 text-3xl font-bold tracking-tight text-text-300 sm:text-4xl">
			{content.heading}
			<span class="ms-2 text-2xl font-normal text-text-200" dir="rtl">{content.nativeName}</span>
		</h1>
		<p class="text-lg leading-snug text-text-200 sm:text-xl">{content.tagline}</p>
	</header>

	<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
		{#each links as link (link.href)}
			<a
				href={link.href}
				class="group flex transform cursor-pointer flex-col gap-1 border-2 border-tile-600 bg-tile-400 px-3 py-4 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-tile-500 hover:bg-tile-500 hover:shadow-xl"
			>
				<h2
					class="text-xl font-bold text-text-300 transition-colors duration-300 group-hover:text-text-200"
				>
					{link.title}
				</h2>
				<p
					class="text-sm font-medium leading-tight text-text-300 opacity-90 transition-opacity duration-300 group-hover:opacity-100"
				>
					{link.description}
				</p>
			</a>
		{/each}
	</div>

	<section class="mt-12">
		<h2 class="mb-3 text-2xl font-bold text-text-300">Where {content.heading} is spoken</h2>
		<p class="text-lg leading-relaxed text-text-200">{content.whereSpoken}</p>
	</section>

	<section class="mt-10">
		<h2 class="mb-4 text-2xl font-bold text-text-300">
			What makes {content.heading} different
		</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each content.features as feature (feature.title)}
				<div class="rounded-xl border border-tile-500 bg-tile-300 p-5">
					<h3 class="mb-2 text-lg font-bold text-text-300">{feature.title}</h3>
					<p class="leading-relaxed text-text-200">{feature.body}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="mb-12 mt-10">
		<h2 class="mb-4 text-2xl font-bold text-text-300">Common questions</h2>
		<div class="space-y-4">
			{#each content.faqs as faq (faq.question)}
				<div class="rounded-xl border border-tile-500 bg-tile-300 p-5">
					<h3 class="mb-2 text-lg font-bold text-text-300">{faq.question}</h3>
					<p class="leading-relaxed text-text-200">{faq.answer}</p>
				</div>
			{/each}
		</div>
	</section>
</section>
