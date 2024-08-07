<script lang="ts">
	const sections = [
		{
			name: 'Animals',
			path: 'animals',
			count: 156
		},
		{
			name: 'Vocabulary from around the house',
			path: 'vocabulary_from_around_the_house',
			count: 253
		},
		{
			name: 'City and transportation',
			path: 'city_and_transportation',
			count: 184
		},
		{
			name: 'Clothing',
			path: 'clothing',
			count: 117
		},
		{
			name: 'Colors',
			path: 'colors',
			count: 59
		},
		{
			name: 'Education',
			path: 'education',
			count: 144
		},
		{
			name: 'Emotions and personality traits',
			path: 'emotions__and__personality_traits',
			count: 214
		},
		{
			name: 'Food',
			path: 'food',
			count: 192
		},
		{
			name: 'Geography',
			path: 'geography',
			count: 90
		},
		{
			name: 'Human body',
			path: 'human_body',
			count: 221
		},
		{
			name: 'Mankind and kinship',
			path: 'mankind_and_kinship',
			count: 151
		},
		{
			name: 'Media and the arts',
			path: 'media_and_the_arts',
			count: 271
		},
		{
			name: 'Medicine',
			path: 'medicine',
			count: 148
		},
		{
			name: 'Nature and weather',
			path: 'nature__and__weather',
			count: 173
		},
		{
			name: 'Religion',
			path: 'religion',
			count: 135
		},
		{
			name: 'Sports and hobbies',
			path: 'sports__and__hobbies',
			count: 136
		},
		{
			name: 'Technology',
			path: 'technology',
			count: 85
		},
		{
			name: 'Time',
			path: 'time',
			count: 103
		},
		{
			name: 'Work and money',
			path: 'work_and_money',
			count: 176
		},
		{
			name: 'Media',
			path: 'media',
			count: 252
		},
		{
			name: 'Media 2',
			path: 'media_2',
			count: 224
		},
		{
			name: 'Media 3',
			path: 'media_3',
			count: 153
		},
		{
			name: 'Crime and punishment',
			path: 'crime_and_punishment',
			count: 73
		},
		{
			name: 'Government and politics',
			path: 'government_and_politics',
			count: 225
		},
		{
			name: 'War',
			path: 'war',
			count: 172
		},
		{
			name: 'Verbs',
			path: 'verbs',
			count: 97
		}
	];
</script>

<p class="mt-12 pl-8 text-xl text-text-200">
	Practice over 4,000 words with fun multiple choice quizzes.
</p>
<section class="mb-12 grid grid-cols-1 gap-3 p-8 sm:grid-cols-3">
	{#each sections as section}
		<a
			class="transitional-all cursor-pointer border-2 border-tile-600 bg-tile-400 p-4 text-center font-semibold duration-300 hover:bg-tile-500"
			href={`vocab/${section.path}`}
		>
			{section.name}
			<p class="text-sm font-light">{section.count} words</p>
		</a>
	{/each}
</section>
