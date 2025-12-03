<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import PaywallModal from '$lib/components/PaywallModal.svelte';
    import LessonPlayer from '$lib/components/LessonPlayer.svelte';
    import type { GeneratedLesson } from '$lib/schemas/curriculum-schema';
	
	let { data } = $props();
	let isModalOpen = $state(false);
    let activeLesson = $state<GeneratedLesson | null>(null);
	
	// Transform curriculum into a flat list of lesson nodes for the path
	let lessonPositions = $derived.by(() => {
		const nodes = [];
		let index = 0;
		
		for (const module of data.curriculum) {
			// Optional: Add a "Module Start" marker if desired, but for now just topics
			for (const topic of module.topics) {
				const lessonInfo = data.existingLessons[topic.id];
				const exists = lessonInfo?.exists ?? false;
				
				// Determine status logic (simplified for now)
				// If it exists, it's active/completed. If not, locked.
				// In a real app, you'd check user progress.
				let status = exists ? 'active' : 'locked';
				
				// Temporary hack: Make first one active regardless so you can try it
				if (index === 0 && !exists) status = 'locked'; 
                if (exists) status = 'active';

				// Sine wave pattern for X offset
				const xOffset = Math.sin(index * 0.8) * 100; // Amplitude 100
				
				nodes.push({
					id: topic.id,
					title: topic.title,
					description: topic.description,
					moduleTitle: module.title,
					level: 'Beginner', // Placeholder, could vary by module
					dialect: 'egyptian-arabic', // This might need to be dynamic or user-selected
					status: status,
					x: xOffset,
					y: index * 140 // Step Height 140
				});
				index++;
			}
		}
		return nodes;
	});

    // Calculate SVG Path
    let pathD = $derived.by(() => {
        if (lessonPositions.length === 0) return { d: '', goalX: 0, goalY: 0 };

        const first = lessonPositions[0];
        let d = `M ${first.x} ${first.y}`;
        const STEP_HEIGHT = 140;
        const AMPLITUDE = 100;
        
        for (let i = 0; i < lessonPositions.length - 1; i++) {
            const current = lessonPositions[i];
            const next = lessonPositions[i + 1];
            
            const cp1x = current.x;
            const cp1y = current.y + STEP_HEIGHT * 0.5;
            
            const cp2x = next.x;
            const cp2y = next.y - STEP_HEIGHT * 0.5;
            
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }
        
        // Add line to goal
        const last = lessonPositions[lessonPositions.length - 1];
        const goalY = last.y + STEP_HEIGHT;
        const goalX = Math.sin(lessonPositions.length * 0.8) * AMPLITUDE;
        
        const cp1x = last.x;
        const cp1y = last.y + STEP_HEIGHT * 0.5;
        const cp2x = goalX;
        const cp2y = goalY - STEP_HEIGHT * 0.5;
        
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${goalX} ${goalY}`;

        return { d, goalX, goalY };
    });

	function handleCloseModal() {
		isModalOpen = false;
	}

	function getDialectColor(status: string) {
        if (status === 'locked') return 'bg-gray-400 border-gray-600';
        if (status === 'completed') return 'bg-green-500 border-green-700';
		return 'bg-tile-500 border-tile-700'; // Active
	}
    
    async function handleLessonClick(lessonNode: any) {
        if (lessonNode.status === 'locked') return;
        
        try {
            // In a real app, we might fetch this from an API endpoint
            // But here we need to load the JSON file content.
            // Since we can't read files in the browser, we need an API route to fetch the lesson content.
            // Let's quickly add a fetch call to a new endpoint or just reuse the +page.server load if we loaded it there?
            // Better to fetch on demand.
            
            // Try to load lesson - if dialect is specified in the node, use it
            const dialect = lessonNode.dialect ? `?dialect=${encodeURIComponent(lessonNode.dialect)}` : '';
            const response = await fetch(`/api/lessons/${lessonNode.id}${dialect}`);
            if (!response.ok) throw new Error('Failed to load lesson');
            const lessonData = await response.json();
            
            activeLesson = lessonData;
        } catch (e) {
            console.error(e);
            alert('Could not load lesson content. Please try regenerating it.');
        }
    }
</script>

{#if activeLesson}
    <LessonPlayer 
        lesson={activeLesson}
        user={data?.user}
        onClose={() => activeLesson = null}
        onLessonComplete={async (nextLessonId) => {
            if (nextLessonId) {
                try {
                    // Find the dialect from current lesson
                    const currentDialect = activeLesson?.dialect || 'egyptian-arabic';
                    const dialect = `?dialect=${encodeURIComponent(currentDialect)}`;
                    const response = await fetch(`/api/lessons/${nextLessonId}${dialect}`);
                    
                    if (response.ok) {
                        const nextLessonData = await response.json();
                        activeLesson = nextLessonData;
                    } else {
                        // Next lesson doesn't exist yet, close the player
                        activeLesson = null;
                    }
                } catch (e) {
                    console.error('Failed to load next lesson:', e);
                    activeLesson = null;
                }
            } else {
                // No next lesson, just close
                activeLesson = null;
            }
        }}
    />
{/if}

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>

<div class="min-h-screen bg-tile-100 overflow-x-hidden relative font-sans pb-20">
	<!-- Background decorative elements -->
	<div class="fixed top-0 left-0 w-full h-full opacity-10 pointer-events-none select-none z-0">
		<div class="absolute top-10 left-10 text-9xl text-tile-500">ا</div>
		<div class="absolute bottom-20 right-20 text-9xl text-tile-500">ب</div>
		<div class="absolute top-1/2 left-1/3 text-8xl text-tile-500">ج</div>
	</div>

	<div class="relative z-10 max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
		<header class="mb-12 text-center">
			<h1 class="text-3xl sm:text-4xl font-bold text-text-300 mb-2">Learning Path</h1>
			<p class="text-text-200">Your journey to fluency</p>
		</header>

		<!-- Path Container -->
		<div class="relative w-full max-w-xs sm:max-w-sm mx-auto mt-20" style="height: {pathD.goalY + 150}px;">
			
            <!-- SVG Line Layer -->
            <svg 
                class="absolute top-0 left-1/2 -translate-x-1/2 overflow-visible pointer-events-none"
                width="400"
                height={pathD.goalY + 150}
                viewBox="-200 0 400 {pathD.goalY + 150}"
                style="z-index: 0;"
            >
                <!-- Background line -->
                <path d={pathD.d} stroke="#cbd5e1" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-sm" />
                <!-- Dashed overlay -->
                <path d={pathD.d} stroke="#fbbf24" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="20 20" class="opacity-60 animate-[dash_60s_linear_infinite]">
                    <style>
                        @keyframes dash {
                            to {
                                stroke-dashoffset: -1000;
                            }
                        }
                    </style>
                </path>
            </svg>

			<!-- Nodes Layer -->
			{#each lessonPositions as lesson, i}
				{@const labelSideClass = lesson.x > 0 ? 'right-full mr-4' : 'left-full ml-4'}
				<div 
					class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center w-24 z-10"
					style="transform: translate(calc(-50% + {lesson.x}px), {lesson.y}px);"
				>
                    <!-- Module Label (show only on first topic of module?) -->
                    {#if i === 0 || lessonPositions[i-1].moduleTitle !== lesson.moduleTitle}
                        <div class="absolute -top-16 w-40 text-center bg-tile-200 text-tile-800 text-xs font-bold py-1 px-2 rounded-full shadow-sm border border-tile-300">
                            {lesson.moduleTitle}
                        </div>
                    {/if}

					<!-- Tooltip/Label -->
					<div class="absolute top-1/2 -translate-y-1/2 {labelSideClass} w-48 bg-white p-3 rounded-xl shadow-lg border-2 border-tile-200 hidden sm:block transition-opacity hover:opacity-100 z-20">
						<h3 class="font-bold text-text-300 text-sm line-clamp-2">{lesson.title}</h3>
						<p class="text-[10px] text-text-200 mt-1 leading-tight opacity-70">{lesson.description}</p>
                         <div class="absolute top-1/2 -translate-y-1/2 {lesson.x > 0 ? '-right-1.5' : '-left-1.5'} w-3 h-3 bg-white border-t-2 border-r-2 border-tile-200 rotate-45"></div>
					</div>

					<!-- Node Button -->
					<button 
						class="
							w-24 h-24 rounded-full flex items-center justify-center text-3xl shadow-[0_6px_0_0_rgba(0,0,0,0.2)]
							border-b-8 active:border-b-0 active:translate-y-2 active:shadow-none transition-all
							cursor-pointer
							{getDialectColor(lesson.status)}
							text-white
                            hover:brightness-110
                            relative
						"
                        onclick={() => handleLessonClick(lesson)}
					>
						{#if lesson.status === 'completed'}
							<span class="text-4xl drop-shadow-md">✓</span>
						{:else if lesson.status === 'locked'}
							<span class="opacity-50 text-2xl drop-shadow-md">🔒</span>
						{:else}
							<span class="text-4xl animate-pulse drop-shadow-md">★</span>
						{/if}

                        <!-- Mobile-only label below -->
                        <div class="sm:hidden absolute top-full mt-3 w-32 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-tile-200 text-center z-30">
                            <span class="text-xs font-bold text-text-300 block truncate">{lesson.title}</span>
                        </div>
					</button>
				</div>
			{/each}
            
            <!-- Goal Node -->
            <div 
                class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center w-28 z-10"
                style="transform: translate(calc(-50% + {pathD.goalX}px), {pathD.goalY}px);"
            >
                <div class="w-28 h-28 rounded-full bg-yellow-400 border-b-8 border-yellow-600 flex items-center justify-center shadow-[0_8px_0_0_rgba(0,0,0,0.2)] hover:scale-110 transition-transform cursor-pointer">
                    <span class="text-5xl drop-shadow-md">🏆</span>
                </div>
                <div class="absolute top-full mt-4 bg-yellow-100 px-4 py-1 rounded-full border border-yellow-300 shadow-sm">
                    <span class="text-xs font-bold text-yellow-800 uppercase tracking-wider">Goal</span>
                </div>
            </div>

		</div>
	</div>
</div>
