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

<section class="min-h-screen bg-tile-200">
	<!-- Hero -->
	<header class="border-b border-tile-500">
		<div class="max-w-7xl mx-auto px-3 sm:px-8 py-10 sm:py-12">
			<div class="text-left max-w-3xl">
				<div class="inline-flex items-center gap-2 px-4 py-2 bg-tile-400 border border-tile-600 rounded-full text-sm text-text-200 mb-6">
					<span>📖</span>
					<span>Arabic Learning</span>
				</div>
				<h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-2 tracking-tight">
					Learn Arabic Your Way
				</h1>
				<p class="text-text-200 text-lg sm:text-xl leading-snug">
					Choose your learning path — follow a structured curriculum or create custom lessons tailored to your interests.
				</p>
			</div>
		</div>
	</header>

	<!-- Path Cards -->
	<section class="py-10">
		<div class="px-3 sm:px-8">
			<h2 class="text-lg sm:text-xl font-bold text-text-300 text-left mb-6">Choose Your Path</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Structured Lessons -->
				<a href="/lessons/structured" onclick={() => trackEvent('lessons_path_selected', { path: 'structured' })} class="group block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300">
					<article class="flex flex-col h-full bg-tile-400 border border-tile-500 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0">
						<div class="w-14 h-14 bg-tile-300 border border-tile-500 rounded-xl flex items-center justify-center mb-4">
							<span class="text-3xl">📚</span>
						</div>
						<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-2">Structured Lessons</h3>
						<p class="text-text-200 leading-relaxed mb-4 flex-grow">
							Follow a curriculum path organized by modules and topics. Progress through lessons in a logical sequence designed for systematic learning.
						</p>
						<ul class="space-y-2 text-text-200 mb-5 text-sm">
							<li class="flex items-center gap-2"><span class="text-green-700">✓</span><span>Curated curriculum modules</span></li>
							<li class="flex items-center gap-2"><span class="text-green-700">✓</span><span>Progressive difficulty</span></li>
							<li class="flex items-center gap-2"><span class="text-green-700">✓</span><span>Track your progress</span></li>
						</ul>
						<div class="flex items-center gap-2 text-text-300 font-semibold">
							<span>Explore Curriculum</span>
							<span aria-hidden="true">→</span>
						</div>
					</article>
				</a>

				<!-- Customizable Lessons (purple accent) -->
				<a href="/lessons/custom" onclick={() => trackEvent('lessons_path_selected', { path: 'custom' })} class="group block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300">
					<article class="flex flex-col h-full bg-tile-400 border border-purple-500/50 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0">
						<div class="w-14 h-14 bg-purple-500/15 border border-purple-500/40 rounded-xl flex items-center justify-center mb-4">
							<span class="text-3xl">🎨</span>
						</div>
						<h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-2">Customizable Lessons</h3>
						<p class="text-text-200 leading-relaxed mb-4 flex-grow">
							Create custom lessons on any topic. Search, filter, and browse lessons tailored to your interests and learning goals.
						</p>
						<ul class="space-y-2 text-text-200 mb-5 text-sm">
							<li class="flex items-center gap-2"><span class="text-purple-500">✓</span><span>Custom content</span></li>
							<li class="flex items-center gap-2"><span class="text-purple-500">✓</span><span>Any topic, any level</span></li>
							<li class="flex items-center gap-2"><span class="text-purple-500">✓</span><span>All 4 Arabic dialects</span></li>
						</ul>
						<div class="flex items-center gap-2 text-text-300 font-semibold">
							<span>Browse Lessons</span>
							<span aria-hidden="true">→</span>
						</div>
					</article>
				</a>
			</div>
		</div>
	</section>

	<!-- What's Included -->
	<section class="py-10 border-y border-tile-500">
		<div class="max-w-7xl mx-auto px-3 sm:px-8">
			<h2 class="text-lg sm:text-xl font-bold text-text-300 text-left mb-6">What's Included in Every Lesson</h2>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<article class="bg-tile-400 border border-tile-500 rounded-xl p-4 shadow-sm text-left">
					<div class="text-3xl mb-3">🎯</div>
					<h3 class="text-lg font-bold text-text-300 mb-2">Interactive Exercises</h3>
					<p class="text-text-200 leading-relaxed">
						Test your knowledge with multiple-choice quizzes and fill-in-the-blank exercises after each topic.
					</p>
				</article>

				<article class="bg-tile-400 border border-tile-500 rounded-xl p-4 shadow-sm text-left">
					<div class="text-3xl mb-3">🔊</div>
					<h3 class="text-lg font-bold text-text-300 mb-2">Native Audio</h3>
					<p class="text-text-200 leading-relaxed">
						Every Arabic word and sentence includes audio playback so you can hear the correct pronunciation.
					</p>
				</article>

				<article class="bg-tile-400 border border-tile-500 rounded-xl p-4 shadow-sm text-left">
					<div class="text-3xl mb-3">🌍</div>
					<h3 class="text-lg font-bold text-text-300 mb-2">Dialect Comparison</h3>
					<p class="text-text-200 leading-relaxed">
						See how expressions vary across Egyptian, Levantine, Moroccan, and Modern Standard Arabic.
					</p>
				</article>
			</div>
		</div>
	</section>
</section>
