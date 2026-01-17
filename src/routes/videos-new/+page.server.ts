import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, fetch }) => {
	const { session, isSubscribed } = await parent();
	
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
				initialShorts: [],
				nextPageToken: null,
				initialDialect: dialect,
				error: data.error || 'Failed to load shorts'
			};
		}
		
		return {
			session,
			isSubscribed,
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
			initialShorts: [],
			nextPageToken: null,
			initialDialect: dialect,
			error: 'Failed to load shorts'
		};
	}
};

