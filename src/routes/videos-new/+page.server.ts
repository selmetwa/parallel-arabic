import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Free users can watch 5 shorts before hitting the paywall
const FREE_SHORTS_LIMIT = 5;

export const load: PageServerLoad = async ({ parent, fetch }) => {
	const { session, isSubscribed, user } = await parent();
	
	// Require authentication
	if (!session || !user) {
		throw redirect(303, '/login?redirect=/videos-new&message=Sign in to watch Arabic shorts');
	}
	
	// Get user's shorts view count
	const totalShortsViewed = user.total_shorts_viewed || 0;
	const hasReachedLimit = !isSubscribed && totalShortsViewed >= FREE_SHORTS_LIMIT;
	const remainingFreeViews = Math.max(0, FREE_SHORTS_LIMIT - totalShortsViewed);
	
	// Only Egyptian Arabic available for now
	const dialect = 'egyptian-arabic';
	
	try {
		// Fetch initial shorts from our API
		const response = await fetch(`/api/youtube-shorts?dialect=${dialect}`);
		const data = await response.json();
		
		if (!response.ok) {
			console.error('Error fetching shorts:', data.error);
			return {
				session,
				isSubscribed,
				totalShortsViewed,
				hasReachedLimit,
				remainingFreeViews,
				freeLimit: FREE_SHORTS_LIMIT,
				initialShorts: [],
				nextPageToken: null,
				initialDialect: dialect,
				error: data.error || 'Failed to load shorts'
			};
		}
		
		return {
			session,
			isSubscribed,
			totalShortsViewed,
			hasReachedLimit,
			remainingFreeViews,
			freeLimit: FREE_SHORTS_LIMIT,
			initialShorts: data.shorts || [],
			nextPageToken: data.nextPageToken,
			initialDialect: dialect,
			cached: data.cached,
			error: null
		};
	} catch (error) {
		console.error('Error in videos-new load:', error);
		return {
			session,
			isSubscribed,
			totalShortsViewed,
			hasReachedLimit,
			remainingFreeViews,
			freeLimit: FREE_SHORTS_LIMIT,
			initialShorts: [],
			nextPageToken: null,
			initialDialect: dialect,
			error: 'Failed to load shorts'
		};
	}
};

