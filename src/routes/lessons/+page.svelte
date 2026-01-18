<script lang="ts">
	import PaywallModal from '$lib/components/PaywallModal.svelte';

	let { data } = $props();
	let isModalOpen = $state(false);

	// Search and filter state
	let searchQuery = $state('');
	let filterDialect = $state<string>('all');
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

			// Use database metadata first (faster), fall back to lesson_body JSON if needed
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

	// Level order for sorting
	const levelOrder: Record<string, number> = {
		'beginner': 1,
		'intermediate': 2,
		'advanced': 3,
	};

	// Filter and sort lessons
	const filteredAndSortedLessons = $derived.by(() => {
		let filtered = [...userGeneratedLessons];

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(lesson =>
				lesson.title?.toLowerCase().includes(query) ||
				lesson.description?.toLowerCase().includes(query)
			);
		}

		// Filter by dialect
		if (filterDialect !== 'all') {
			filtered = filtered.filter(lesson => lesson.dialect === filterDialect);
		}

		// Filter by level
		if (filterLevel !== 'all') {
			filtered = filtered.filter(lesson => 
				lesson.level?.toLowerCase() === filterLevel.toLowerCase()
			);
		}

		// Sort
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

	// Get dialect badge color
	function getDialectBadgeColor(dialect: string) {
		const colors = {
			'egyptian-arabic': 'bg-tile-500 text-text-300',
			'levantine': 'bg-orange-100 text-orange-800',
			'darija': 'bg-green-100 text-green-800',
			'fusha': 'bg-purple-100 text-purple-800',
		};
		return colors[dialect as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	}

	// Get level badge color
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

<section class="px-3 mt-6 sm:px-8 max-w-7xl mx-auto">
	<div class="text-left mb-12">
		<h1 class="text-4xl sm:text-5xl text-text-300 font-bold mb-4 tracking-tight">Lessons</h1>
		<p class="text-text-200 text-lg sm:text-xl leading-relaxed opacity-90 max-w-3xl">Choose your learning path - structured curriculum or customizable lessons.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
		<!-- Structured Lessons Card -->
		<a
			href="/lessons/structured"
			class="group relative overflow-hidden flex flex-col bg-gradient-to-br from-tile-400 to-tile-500 border-2 border-tile-600 rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-tile-400 active:scale-95"
		>
			<!-- Shine effect on hover -->
			<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
				<div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
			</div>

			<div class="text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10">📚</div>
			<h2 class="text-3xl font-bold text-text-300 mb-4 group-hover:text-text-200 transition-colors relative z-10">
				Structured Lessons
			</h2>
			<p class="text-text-200 text-lg leading-relaxed mb-6 flex-grow relative z-10">
				Follow a structured curriculum path organized by modules and topics. Progress through lessons in a logical sequence designed for systematic learning.
			</p>
			<div class="flex items-center gap-2 text-tile-700 font-semibold group-hover:gap-4 transition-all relative z-10">
				<span>Explore Curriculum</span>
				<svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		<!-- Customizable Lessons Card -->
		<a
			href="/lessons/custom"
			class="group relative overflow-hidden flex flex-col bg-gradient-to-br from-purple-400 to-purple-500 border-2 border-purple-600 rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-purple-400 active:scale-95"
		>
			<!-- Shine effect on hover -->
			<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
				<div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
			</div>

			<div class="text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10">🎨</div>
			<h2 class="text-3xl font-bold text-white mb-4 group-hover:text-purple-100 transition-colors relative z-10">
				Customizable Lessons
			</h2>
			<p class="text-white text-lg leading-relaxed mb-6 flex-grow opacity-95 relative z-10">
				Create and explore custom AI-generated lessons. Search, filter, and browse lessons tailored to your specific interests and learning goals.
			</p>
			<div class="flex items-center gap-2 text-purple-900 font-semibold group-hover:gap-4 transition-all relative z-10">
				<span>Browse Lessons</span>
				<svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</a>
	</div>
</section>