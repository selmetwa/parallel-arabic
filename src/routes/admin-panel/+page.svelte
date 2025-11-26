<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Type for user object based on server structure
	type AdminUser = {
		id: string;
		email: string;
		is_subscriber: boolean;
		subscriber_id: string | null;
		subscription_end_date: number | null;
		verb_conjugation_tenses_viewed: number;
		sentences_viewed: number;
		savedWords: string[];
		auth_provider: string;
		google_id: string | null;
		current_streak?: number | null;
		longest_streak?: number | null;
		total_reviews?: number | null;
		total_sentences_viewed?: number | null;
		total_stories_viewed?: number | null;
		total_lessons_viewed?: number | null;
		total_saved_words?: number | null;
		reviews_this_week?: number | null;
		sentences_viewed_this_week?: number | null;
		stories_viewed_this_week?: number | null;
		lessons_viewed_this_week?: number | null;
		saved_words_this_week?: number | null;
	};

	// Calculate engagement metrics
	const engagementLevels = [
		{ threshold: 25, label: '25+' },
		{ threshold: 50, label: '50+' },
		{ threshold: 100, label: '100+' }
	];

	function getEngagementData(threshold: number) {
		const users = data.users as AdminUser[];
		return {
			sentences: users.filter(user => user.sentences_viewed > threshold).length,
			verbTenses: users.filter(user => user.verb_conjugation_tenses_viewed > threshold).length,
			savedWords: users.filter(user => user.savedWords.length > threshold).length
		};
	}

	// Get users who meet specific thresholds for detailed lists
	function getUsersByThreshold(threshold: number) {
		const users = data.users as AdminUser[];
		return {
			sentences: users.filter(user => user.sentences_viewed > threshold),
			verbTenses: users.filter(user => user.verb_conjugation_tenses_viewed > threshold),
			savedWords: users.filter(user => user.savedWords.length > threshold)
		};
	}

	// Stats for overview cards
	const users = data.users as AdminUser[];
	const stats = {
		totalUsers: data.userCount,
		subscribers: data.subscriberCount,
		googleAuth: users.filter(user => user.auth_provider === 'google').length,
		emailAuth: users.filter(user => user.auth_provider === 'email').length,
		// Activity stats
		totalReviews: users.reduce((sum, u) => sum + (u.total_reviews || 0), 0),
		totalStories: users.reduce((sum, u) => sum + (u.total_stories_viewed || 0), 0),
		totalLessons: users.reduce((sum, u) => sum + (u.total_lessons_viewed || 0), 0),
		activeStreaks: users.filter(u => (u.current_streak || 0) > 0).length,
		avgStreak: users.length > 0 
			? (users.reduce((sum, u) => sum + (u.current_streak || 0), 0) / users.length).toFixed(1)
			: '0',
		weeklyActivity: users.reduce((sum, u) => sum + (u.reviews_this_week || 0) + (u.lessons_viewed_this_week || 0) + (u.stories_viewed_this_week || 0), 0)
	};

	const subscriptionRate = ((stats.subscribers / stats.totalUsers) * 100).toFixed(1);

	// Filter subscribers for dedicated table
	const subscribers = users.filter(user => user.is_subscriber);
</script>

<div class="p-6 space-y-8">
	<!-- Header -->
	<div class="text-center space-y-2">
		<h1 class="text-4xl font-bold text-text-300">Admin Dashboard</h1>
		<p class="text-text-200 text-lg">User analytics and engagement metrics</p>
	</div>

	<!-- Overview Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-text-200 text-sm font-medium">Total Users</p>
					<p class="text-3xl font-bold text-text-300">{stats.totalUsers}</p>
				</div>
				<div class="w-12 h-12 bg-tile-500 rounded-lg flex items-center justify-center">
					<span class="text-2xl">👥</span>
				</div>
			</div>
		</div>

		<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-text-200 text-sm font-medium">Subscribers</p>
					<p class="text-3xl font-bold text-text-300">{stats.subscribers}</p>
					<p class="text-text-200 text-xs">({subscriptionRate}% conversion)</p>
				</div>
				<div class="w-12 h-12 bg-green1 rounded-lg flex items-center justify-center">
					<span class="text-2xl">⭐</span>
				</div>
			</div>
		</div>

		<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-text-200 text-sm font-medium">Active Streaks</p>
					<p class="text-3xl font-bold text-text-300">{stats.activeStreaks}</p>
					<p class="text-text-200 text-xs">Avg: {stats.avgStreak} days</p>
				</div>
				<div class="w-12 h-12 bg-tile-500 rounded-lg flex items-center justify-center">
					<span class="text-2xl">🔥</span>
				</div>
			</div>
		</div>

		<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-text-200 text-sm font-medium">Total Reviews</p>
					<p class="text-3xl font-bold text-text-300">{stats.totalReviews.toLocaleString()}</p>
					<p class="text-text-200 text-xs">All-time</p>
				</div>
				<div class="w-12 h-12 bg-tile-500 rounded-lg flex items-center justify-center">
					<span class="text-2xl">📚</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Activity Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-text-200 text-sm font-medium">Total Stories</p>
					<p class="text-3xl font-bold text-text-300">{stats.totalStories.toLocaleString()}</p>
					<p class="text-text-200 text-xs">Viewed</p>
				</div>
				<div class="w-12 h-12 bg-tile-500 rounded-lg flex items-center justify-center">
					<span class="text-2xl">📖</span>
				</div>
			</div>
		</div>

		<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-text-200 text-sm font-medium">Total Lessons</p>
					<p class="text-3xl font-bold text-text-300">{stats.totalLessons.toLocaleString()}</p>
					<p class="text-text-200 text-xs">Viewed</p>
				</div>
				<div class="w-12 h-12 bg-tile-500 rounded-lg flex items-center justify-center">
					<span class="text-2xl">🎓</span>
				</div>
			</div>
		</div>

		<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-text-200 text-sm font-medium">This Week</p>
					<p class="text-3xl font-bold text-text-300">{stats.weeklyActivity.toLocaleString()}</p>
					<p class="text-text-200 text-xs">Activities</p>
				</div>
				<div class="w-12 h-12 bg-tile-500 rounded-lg flex items-center justify-center">
					<span class="text-2xl">📊</span>
				</div>
			</div>
		</div>

		<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-text-200 text-sm font-medium">Google Auth</p>
					<p class="text-3xl font-bold text-text-300">{stats.googleAuth}</p>
					<p class="text-text-200 text-xs">({((stats.googleAuth / stats.totalUsers) * 100).toFixed(1)}%)</p>
				</div>
				<div class="w-12 h-12 bg-tile-500 rounded-lg flex items-center justify-center">
					<span class="text-2xl">🔐</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Engagement Analysis -->
	<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
		<h2 class="text-2xl font-bold text-text-300 mb-6">User Engagement Levels</h2>
		
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			{#each engagementLevels as level}
				{@const engagementData = getEngagementData(level.threshold)}
				{@const usersData = getUsersByThreshold(level.threshold)}
				<div class="space-y-4">
					<h3 class="text-xl font-semibold text-text-300 text-center">{level.label} Activity</h3>
					
					<!-- Sentences Progress Bar -->
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-text-200">Sentences Viewed</span>
							<span class="text-text-300 font-medium">{engagementData.sentences}</span>
						</div>
						<div class="w-full bg-tile-500 rounded-full h-3">
							<div 
								class="bg-green1 h-3 rounded-full transition-all duration-500" 
								style="width: {Math.min((engagementData.sentences / stats.totalUsers) * 100, 100)}%"
							></div>
						</div>
						<div class="text-xs text-text-200 text-center">
							{((engagementData.sentences / stats.totalUsers) * 100).toFixed(1)}% of users
						</div>
						<!-- User List for Sentences -->
						{#if usersData.sentences.length > 0}
							<div class="mt-3 p-3 bg-tile-400 rounded-lg">
								<h4 class="text-sm font-medium text-text-300 mb-2">Users with {level.label} sentences:</h4>
								<div class="space-y-1 max-h-32 overflow-y-auto">
									{#each usersData.sentences.slice(0, 10) as user}
										<div class="flex justify-between text-xs">
											<span class="text-text-200 truncate max-w-[150px]">{user.email}</span>
											<span class="text-text-300 font-medium">{user.sentences_viewed}</span>
										</div>
									{/each}
									{#if usersData.sentences.length > 10}
										<div class="text-xs text-text-200 text-center pt-1">
											...and {usersData.sentences.length - 10} more
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<!-- Verb Tenses Progress Bar -->
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-text-200">Verb Tenses Viewed</span>
							<span class="text-text-300 font-medium">{engagementData.verbTenses}</span>
						</div>
						<div class="w-full bg-tile-500 rounded-full h-3">
							<div 
								class="bg-tile-600 h-3 rounded-full transition-all duration-500" 
								style="width: {Math.min((engagementData.verbTenses / stats.totalUsers) * 100, 100)}%"
							></div>
						</div>
						<div class="text-xs text-text-200 text-center">
							{((engagementData.verbTenses / stats.totalUsers) * 100).toFixed(1)}% of users
						</div>
						<!-- User List for Verb Tenses -->
						{#if usersData.verbTenses.length > 0}
							<div class="mt-3 p-3 bg-tile-400 rounded-lg">
								<h4 class="text-sm font-medium text-text-300 mb-2">Users with {level.label} verb tenses:</h4>
								<div class="space-y-1 max-h-32 overflow-y-auto">
									{#each usersData.verbTenses.slice(0, 10) as user}
										<div class="flex justify-between text-xs">
											<span class="text-text-200 truncate max-w-[150px]">{user.email}</span>
											<span class="text-text-300 font-medium">{user.verb_conjugation_tenses_viewed}</span>
										</div>
									{/each}
									{#if usersData.verbTenses.length > 10}
										<div class="text-xs text-text-200 text-center pt-1">
											...and {usersData.verbTenses.length - 10} more
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<!-- Saved Words Progress Bar -->
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-text-200">Saved Words</span>
							<span class="text-text-300 font-medium">{engagementData.savedWords}</span>
						</div>
						<div class="w-full bg-tile-500 rounded-full h-3">
							<div 
								class="h-3 rounded-full transition-all duration-500" 
								style="width: {Math.min((engagementData.savedWords / stats.totalUsers) * 100, 100)}%; background-color: var(--brand);"
							></div>
						</div>
						<div class="text-xs text-text-200 text-center">
							{((engagementData.savedWords / stats.totalUsers) * 100).toFixed(1)}% of users
						</div>
						<!-- User List for Saved Words -->
						{#if usersData.savedWords.length > 0}
							<div class="mt-3 p-3 bg-tile-400 rounded-lg">
								<h4 class="text-sm font-medium text-text-300 mb-2">Users with {level.label} saved words:</h4>
								<div class="space-y-1 max-h-32 overflow-y-auto">
									{#each usersData.savedWords.slice(0, 10) as user}
										<div class="flex justify-between text-xs">
											<span class="text-text-200 truncate max-w-[150px]">{user.email}</span>
											<span class="text-text-300 font-medium">{user.savedWords.length}</span>
										</div>
									{/each}
									{#if usersData.savedWords.length > 10}
										<div class="text-xs text-text-200 text-center pt-1">
											...and {usersData.savedWords.length - 10} more
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Subscribers Table -->
	<div class="bg-tile-300 border-2 border-tile-600 rounded-lg overflow-hidden">
		<div class="p-6 border-b border-tile-600">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-2xl font-bold text-text-300">Active Subscribers</h2>
					<p class="text-text-200 mt-1">Your paying customers and their engagement</p>
				</div>
				<div class="bg-green1 px-4 py-2 rounded-lg">
					<span class="text-text-300 font-bold text-lg">{subscribers.length}</span>
				</div>
			</div>
		</div>
		
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-green1">
					<tr>
						<th class="px-4 py-3 text-left text-sm font-medium text-text-300">Email</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-text-300">Streak</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-text-300">Reviews</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-text-300">Stories</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-text-300">Lessons</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-text-300">Saved Words</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-text-300">Auth</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-text-300">Subscription End</th>
					</tr>
				</thead>
				<tbody>
					{#each subscribers as subscriber, index}
						{@const typedUser = subscriber as AdminUser}
						<tr class="{index % 2 === 0 ? 'bg-tile-200' : 'bg-tile-300'} hover:bg-tile-400 transition-colors">
							<td class="px-4 py-3 text-sm text-text-300 max-w-xs truncate font-medium">
								{typedUser.email}
							</td>
							<td class="px-4 py-3 text-right text-sm text-text-300 font-medium">
								{#if typedUser.current_streak && typedUser.current_streak > 0}
									<span class="flex items-center justify-end gap-1">
										🔥 {typedUser.current_streak}
									</span>
								{:else}
									<span class="text-text-200">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-sm text-text-300 font-medium">
								{typedUser.total_reviews ?? 0}
							</td>
							<td class="px-4 py-3 text-right text-sm text-text-300 font-medium">
								{typedUser.total_stories_viewed ?? 0}
							</td>
							<td class="px-4 py-3 text-right text-sm text-text-300 font-medium">
								{typedUser.total_lessons_viewed ?? 0}
							</td>
							<td class="px-4 py-3 text-right text-sm text-text-300 font-medium">
								{typedUser.savedWords.length ?? 0}
							</td>
							<td class="px-4 py-3 text-sm text-text-300">
								<span class="capitalize">{typedUser.auth_provider}</span>
							</td>
							<td class="px-4 py-3 text-sm text-text-200">
								{#if typedUser.subscription_end_date}
									<span class="font-medium">
										{new Date(Number(typedUser.subscription_end_date) * 1000).toLocaleDateString()}
									</span>
								{:else}
									<span class="text-yellow-400">No end date</span>
								{/if}
							</td>
						</tr>
					{/each}
					{#if subscribers.length === 0}
						<tr>
							<td colspan="8" class="px-4 py-8 text-center text-text-200">
								No active subscribers yet
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Detailed User Table -->
	<div class="bg-tile-300 border-2 border-tile-600 rounded-lg overflow-hidden">
		<div class="p-6 border-b border-tile-600">
			<h2 class="text-2xl font-bold text-text-300">All Users</h2>
			<p class="text-text-200 mt-1">Complete user information and activity data</p>
		</div>
		
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-tile-600">
					<tr>
						<th class="px-4 py-3 text-left text-sm font-medium text-text-300">Email</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-text-300">Status</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-text-300">Streak</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-text-300">Reviews</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-text-300">Stories</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-text-300">Lessons</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-text-300">Saved Words</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-text-300">Auth</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-text-300">Subscription</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as user, index}
						{@const typedUser = user as AdminUser}
						<tr class="{index % 2 === 0 ? 'bg-tile-200' : 'bg-tile-300'} hover:bg-tile-400 transition-colors">
							<td class="px-4 py-3 text-sm text-text-300 max-w-xs truncate">
								{typedUser.email}
							</td>
							<td class="px-4 py-3">
								{#if typedUser.is_subscriber}
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green1 text-text-300">
										Subscriber
									</span>
								{:else}
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-tile-500 text-text-300">
										Free
									</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-sm text-text-300 font-medium">
								{#if typedUser.current_streak && typedUser.current_streak > 0}
									<span class="flex items-center justify-end gap-1">
										🔥 {typedUser.current_streak}
									</span>
								{:else}
									<span class="text-text-200">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-sm text-text-300 font-medium">
								{typedUser.total_reviews ?? 0}
							</td>
							<td class="px-4 py-3 text-right text-sm text-text-300 font-medium">
								{typedUser.total_stories_viewed ?? 0}
							</td>
							<td class="px-4 py-3 text-right text-sm text-text-300 font-medium">
								{typedUser.total_lessons_viewed ?? 0}
							</td>
							<td class="px-4 py-3 text-right text-sm text-text-300 font-medium">
								{typedUser.savedWords.length ?? 0}
							</td>
							<td class="px-4 py-3 text-sm text-text-300">
								<span class="capitalize">{typedUser.auth_provider}</span>
							</td>
							<td class="px-4 py-3 text-sm text-text-200">
								{#if typedUser.subscription_end_date}
									{new Date(Number(typedUser.subscription_end_date) * 1000).toLocaleDateString()}
								{:else}
									—
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	/* Custom scrollbar for the table */
	.overflow-x-auto::-webkit-scrollbar {
		height: 6px;
	}
	
	.overflow-x-auto::-webkit-scrollbar-track {
		background: var(--tile4);
		border-radius: 3px;
	}
	
	.overflow-x-auto::-webkit-scrollbar-thumb {
		background: var(--tile6);
		border-radius: 3px;
	}
	
	.overflow-x-auto::-webkit-scrollbar-thumb:hover {
		background: var(--text3);
	}
</style>
