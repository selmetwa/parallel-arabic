<script lang="ts">
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import { getDefaultDialect } from '$lib/helpers/get-default-dialect';
	import { trackEvent } from '$lib/analytics';

	let { data } = $props();
	let isModalOpen = $state(false);

	// Search and filter state
	let searchQuery = $state('');
	let filterDialect = $state<string>(getDefaultDialect(data.user));
	let filterLevel = $state<string>('all');
	let sortBy = $state<'newest' | 'oldest' | 'level' | 'title'>('newest');

	let userGeneratedLessons = $derived.by(() => {
		const output = [];

		for (const lesson of data.user_generated_lessons) {
			const lessonData = lesson as {
				id: string;
				title?: string;
				title_arabic?: string;
				description?: string;
				level: string;
				dialect: string;
				dialect_name?: string;
				created_at: string;
				sub_lesson_count?: number;
				estimated_duration?: number;
				lesson_body?: {
					title?: { english?: string; arabic?: string };
					description?: { english?: string };
					subLessons?: unknown[];
					estimatedDuration?: number;
					level?: string;
				};
			};

			const lessonBody = lessonData.lesson_body;

			const subLessonCount = lessonData.sub_lesson_count ?? lessonBody?.subLessons?.length ?? 0;
			const estimatedDuration = lessonData.estimated_duration ?? lessonBody?.estimatedDuration ?? null;

			output.push({
				id: lessonData.id,
				title: lessonBody?.title?.english || lessonData.title || '',
				description: lessonData.description || lessonBody?.description?.english || '',
				createdAt: lessonData.created_at,
				level: lessonData.level || lessonBody?.level || 'beginner',
				dialect: lessonData.dialect,
				dialectName: lessonData.dialect_name,
				subLessonCount: subLessonCount,
				estimatedDuration: estimatedDuration
			});
		}
		return output;
	});

	function openPaywallModal() {
		isModalOpen = true;
	}

	function handleCloseModal() {
		isModalOpen = false;
	}

	const dialectOptions = [
		{ value: 'egyptian-arabic', label: 'Egyptian Arabic' },
		{ value: 'fusha', label: 'Modern Standard Arabic' },
		{ value: 'levantine', label: 'Levantine Arabic' },
		{ value: 'darija', label: 'Moroccan Darija' },
	];

	const filterDialectOptions = [
		{ value: 'all', label: 'All Dialects' },
		...dialectOptions
	];

	const levelOptions = [
		{ value: 'all', label: 'All Levels' },
		{ value: 'beginner', label: 'Beginner' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
	];

	const levelOrder: Record<string, number> = {
		'beginner': 1,
		'intermediate': 2,
		'advanced': 3,
	};

	const filteredAndSortedLessons = $derived.by(() => {
		let filtered = [...userGeneratedLessons];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(lesson =>
				lesson.title?.toLowerCase().includes(query) ||
				lesson.description?.toLowerCase().includes(query)
			);
		}

		if (filterDialect !== 'all') {
			filtered = filtered.filter(lesson => lesson.dialect === filterDialect);
		}

		if (filterLevel !== 'all') {
			filtered = filtered.filter(lesson =>
				lesson.level?.toLowerCase() === filterLevel.toLowerCase()
			);
		}

		if (sortBy === 'newest') {
			filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		} else if (sortBy === 'oldest') {
			filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		} else if (sortBy === 'level') {
			filtered.sort((a, b) => {
				const aLevel = levelOrder[a.level?.toLowerCase() || 'beginner'] || 0;
				const bLevel = levelOrder[b.level?.toLowerCase() || 'beginner'] || 0;
				return aLevel - bLevel;
			});
		} else if (sortBy === 'title') {
			filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
		}

		return filtered;
	});

	function getDialectBadgeColor(dialect: string) {
		const colors = {
			'egyptian-arabic': 'bg-tile-500 text-text-300',
			'levantine': 'bg-orange-100 text-orange-800',
			'darija': 'bg-green-100 text-green-800',
			'fusha': 'bg-purple-100 text-purple-800',
		};
		return colors[dialect as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	}

	function getLevelBadgeColor(level: string) {
		const colors = {
			beginner: 'bg-green-100 text-green-800',
			intermediate: 'bg-yellow-100 text-yellow-800',
			advanced: 'bg-red-100 text-red-800',
		};
		return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	}

	function getDialectLabel(dialect: string, originalName?: string) {
		if (dialect === 'fusha') return 'MSA';
		return originalName || dialect;
	}

	function capitalizeFirst(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
</script>

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>

<section class="min-h-screen">

	<!-- Compact page header -->
	<header class="max-w-5xl mx-auto px-4 sm:px-8 pt-10 pb-8 border-b border-tile-500">
		<h1 class="text-4xl sm:text-5xl font-black text-text-300 tracking-tight leading-none">Lessons</h1>
		<p class="mt-3 text-text-200 text-base sm:text-lg max-w-lg leading-relaxed">
			A structured curriculum or custom lessons on any topic — in four Arabic dialects.
		</p>
	</header>

	<!-- Path cards -->
	<div class="max-w-5xl mx-auto px-4 sm:px-8 py-8">
		<p class="text-[10px] uppercase tracking-[0.2em] text-text-200 font-semibold mb-4">Choose your path</p>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">

			<!-- STRUCTURED card -->
			<a
				href="/lessons/structured"
				onclick={() => trackEvent('lessons_path_selected', { path: 'structured' })}
				class="group relative overflow-hidden flex flex-col bg-tile-400 border border-tile-500 border-l-4 border-l-[--brand] rounded-2xl p-6 sm:p-8 min-h-[280px] transition-all duration-200 hover:bg-tile-500 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
			>
				<!-- Arabic watermark background -->
				<!-- <span class="absolute bottom-2 right-3 text-[9rem] font-bold text-text-300 opacity-[0.04] leading-none pointer-events-none select-none" dir="rtl" aria-hidden="true">منهج</span> -->

				<!-- Top row -->
				<div class="flex items-center gap-2 mb-6">
					<span class="text-[10px] uppercase tracking-[0.18em] font-bold text-text-200">Structured</span>
					<span class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)] border border-[color-mix(in_srgb,var(--brand)_25%,transparent)]">Curriculum</span>
				</div>

				<!-- Content -->
				<div class="flex-1">
					<h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-3 leading-tight">Structured Path</h2>
					<p class="text-text-200 text-sm leading-relaxed max-w-[38ch]">A curated sequence from alphabet to fluency. Progress through modules designed for systematic learning.</p>
				</div>

				<!-- Dialect flags row -->
				<div class="flex items-center gap-2 mt-5 mb-4">
					<span class="text-xl" title="Egyptian Arabic">🇪🇬</span>
					<span class="text-xl" title="Moroccan Darija">🇲🇦</span>
					<span class="text-xl" title="Levantine Arabic">🇱🇧</span>
					<span class="text-xl" title="Modern Standard Arabic">📖</span>
					<span class="text-xs text-text-200 ml-1">4 dialects</span>
				</div>

				<!-- CTA -->
				<div class="flex items-center gap-2 text-sm font-bold text-text-300 group-hover:gap-3 transition-all duration-200">
					<span>Explore curriculum</span>
					<span aria-hidden="true">→</span>
				</div>
			</a>

			<!-- CUSTOM card -->
			<a
				href="/lessons/custom"
				onclick={() => trackEvent('lessons_path_selected', { path: 'custom' })}
				class="group relative overflow-hidden flex flex-col bg-tile-400 border border-purple-500/30 rounded-2xl p-6 sm:p-8 min-h-[280px] transition-all duration-200 hover:bg-tile-500 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
			>
				<!-- Arabic watermark -->
				<!-- <span class="absolute bottom-2 right-3 text-[9rem] font-bold text-purple-400 opacity-[0.06] leading-none pointer-events-none select-none" dir="rtl" aria-hidden="true">إنشاء</span> -->

				<!-- Top row -->
				<div class="flex items-center gap-2 mb-6">
					<span class="text-[10px] uppercase tracking-[0.18em] font-bold text-text-200">Custom</span>
					<span class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/25">Any topic</span>
				</div>

				<!-- Content -->
				<div class="flex-1">
					<h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-3 leading-tight">Custom Lessons</h2>
					<p class="text-text-200 text-sm leading-relaxed max-w-[38ch]">Create lessons on any topic — food, travel, culture, business. Search, filter, and browse the community library.</p>
				</div>

				<!-- Feature tags -->
				<div class="flex flex-wrap gap-2 mt-5 mb-4">
					<span class="text-[11px] px-2 py-0.5 rounded-full bg-tile-500 border border-tile-600 text-text-200">Any level</span>
					<span class="text-[11px] px-2 py-0.5 rounded-full bg-tile-500 border border-tile-600 text-text-200">4 dialects</span>
					<span class="text-[11px] px-2 py-0.5 rounded-full bg-tile-500 border border-tile-600 text-text-200">Community library</span>
				</div>

				<!-- CTA -->
				<div class="flex items-center gap-2 text-sm font-bold text-text-300 group-hover:gap-3 transition-all duration-200">
					<span>Browse lessons</span>
					<span aria-hidden="true">→</span>
				</div>
			</a>

		</div>
	</div>

	<!-- What's in every lesson: compact horizontal strip -->
	<!-- <div class="max-w-5xl mx-auto px-4 sm:px-8 pb-12">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<div class="bg-tile-400 border border-tile-500 rounded-xl p-4 flex items-start gap-3">
				<span class="text-2xl shrink-0" aria-hidden="true">🎯</span>
				<div>
					<h3 class="text-sm font-bold text-text-300">Interactive exercises</h3>
					<p class="text-xs text-text-200 mt-0.5 leading-relaxed">Multiple-choice and fill-in-the-blank after each topic.</p>
				</div>
			</div>
			<div class="bg-tile-400 border border-tile-500 rounded-xl p-4 flex items-start gap-3">
				<span class="text-2xl shrink-0" aria-hidden="true">🔊</span>
				<div>
					<h3 class="text-sm font-bold text-text-300">Native audio</h3>
					<p class="text-xs text-text-200 mt-0.5 leading-relaxed">Every word and sentence includes audio playback.</p>
				</div>
			</div>
			<div class="bg-tile-400 border border-tile-500 rounded-xl p-4 flex items-start gap-3">
				<span class="text-2xl shrink-0" aria-hidden="true">🌍</span>
				<div>
					<h3 class="text-sm font-bold text-text-300">Dialect comparison</h3>
					<p class="text-xs text-text-200 mt-0.5 leading-relaxed">See how expressions vary across all 4 dialects.</p>
				</div>
			</div>
		</div>
	</div> -->

</section>
