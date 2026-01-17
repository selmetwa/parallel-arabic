import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { env } from '$env/dynamic/private';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Search terms for each dialect - focused on Arabic learning content
// Each dialect has multiple query strategies for better results
const DIALECT_SEARCH_CONFIG: Record<string, { searchTerms: string[]; channelIds?: string[] }> = {
	'egyptian-arabic': {
		searchTerms: [
			'learn Egyptian Arabic word',
			'Egyptian Arabic vocabulary shorts',
			'كلمة مصرية',
			'تعلم كلمات مصري',
			'Egyptian dialect lesson',
			'ArabicPod101 Egyptian'
		],
		// Curated Egyptian Arabic learning channels
		channelIds: [
			'UCKKXkVhetveWBhmbYYY6tMw', // Speak Like An Egyptian
			'UCnKn_OpBA2c1qBWEBr_e-qg', 
			'UCkwOyylAOUEwfvYPnps6yzg',
			'UCZ7UQg54PpQjnOTj2QgHU4g',
			'UCMBR4-IMxWaSOk_6HMBOmsw',
			'UCjbhe1RW9q8keU0EpqEgeeg',
			'UCPqO0VTjG3O6BZXa2bMoA1A'
		]
	},
	'levantine': {
		searchTerms: [
			'learn Lebanese Arabic word',
			'Levantine Arabic vocabulary',
			'Syrian Arabic phrase',
			'تعلم كلمة لبنانية',
			'شامي للمبتدئين',
			'Arabic101 Levantine'
		],
		channelIds: []
	},
	'darija': {
		searchTerms: [
			'learn Moroccan Arabic word',
			'Darija vocabulary lesson',
			'تعلم كلمة دارجة',
			'Moroccan dialect for beginners',
			'كلمات مغربية',
			'Morocco Arabic phrase'
		],
		channelIds: []
	},
	'fusha': {
		searchTerms: [
			'Arabic word of the day',
			'learn Arabic vocabulary',
			'كلمة عربية',
			'تعلم العربية للمبتدئين',
			'Arabic language lesson shorts',
			'فصحى للمبتدئين',
			'ArabicPod101'
		],
		channelIds: []
	},
	'khaleeji': {
		searchTerms: [
			'learn Gulf Arabic word',
			'Emirati Arabic vocabulary',
			'تعلم كلمة خليجية',
			'UAE Arabic phrase',
			'خليجي للمبتدئين',
			'Khaleeji Arabic lesson'
		],
		channelIds: []
	}
};

interface YouTubeShort {
	id: string;
	title: string;
	channelTitle: string;
	thumbnail: string;
	publishedAt: string;
}

interface CacheEntry {
	shorts: YouTubeShort[];
	nextPageToken: string | null;
}

/**
 * Check if we have a valid cache entry for this dialect
 */
async function getCachedShorts(dialect: string): Promise<CacheEntry | null> {
	const { data, error } = await supabase
		.from('youtube_shorts_cache')
		.select('response, next_page_token, expires_at')
		.eq('dialect', dialect)
		.single();

	if (error || !data) {
		return null;
	}

	// Check if cache has expired
	const expiresAt = new Date(data.expires_at);
	if (expiresAt < new Date()) {
		// Cache expired, delete it
		await supabase
			.from('youtube_shorts_cache')
			.delete()
			.eq('dialect', dialect);
		return null;
	}

	return {
		shorts: data.response as YouTubeShort[],
		nextPageToken: data.next_page_token
	};
}

/**
 * Save shorts to cache
 */
async function cacheShorts(dialect: string, shorts: YouTubeShort[], nextPageToken: string | null): Promise<void> {
	// Delete existing cache entry for this dialect
	await supabase
		.from('youtube_shorts_cache')
		.delete()
		.eq('dialect', dialect);

	// Insert new cache entry
	const { error } = await supabase
		.from('youtube_shorts_cache')
		.insert({
			dialect,
			search_query: DIALECT_SEARCH_CONFIG[dialect]?.searchTerms.join(' | ') || dialect,
			response: shorts,
			next_page_token: nextPageToken
		});

	if (error) {
		console.error('Error caching shorts:', error);
	}
}

/**
 * Parse ISO 8601 duration to seconds
 */
function parseDuration(duration: string): number {
	const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return 0;
	
	const hours = parseInt(match[1] || '0');
	const minutes = parseInt(match[2] || '0');
	const seconds = parseInt(match[3] || '0');
	
	return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch shorts from YouTube API - prioritizes curated channels, falls back to search
 */
async function fetchFromYouTube(dialect: string, pageToken?: string): Promise<{ shorts: YouTubeShort[]; nextPageToken: string | null }> {
	const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY;
	
	if (!YOUTUBE_API_KEY) {
		throw new Error('YouTube API key not configured');
	}

	const config = DIALECT_SEARCH_CONFIG[dialect];
	if (!config) {
		throw new Error(`Invalid dialect: ${dialect}`);
	}

	const allShorts: YouTubeShort[] = [];
	const seenIds = new Set<string>();
	let lastPageToken: string | null = null;

	// PRIORITY 1: Fetch from curated channels first
	if (config.channelIds && config.channelIds.length > 0 && !pageToken) {
		console.log(`Fetching from ${config.channelIds.length} curated channels for ${dialect}`);
		
		for (const channelId of config.channelIds) {
			try {
				// Search for shorts from this specific channel
				const searchParams = new URLSearchParams({
					part: 'snippet',
					channelId: channelId,
					type: 'video',
					videoDuration: 'short',
					maxResults: '10',
					key: YOUTUBE_API_KEY,
					order: 'date' // Get recent content
				});

				const searchResponse = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`);

				if (!searchResponse.ok) {
					console.error(`YouTube API error for channel ${channelId}`);
					continue;
				}

				const searchData = await searchResponse.json();
				
				if (!searchData.items || searchData.items.length === 0) {
					continue;
				}

				// Get video IDs for detailed info
				const videoIds = searchData.items
					.map((item: any) => item.id?.videoId)
					.filter((id: string) => id && !seenIds.has(id))
					.join(',');

				if (!videoIds) continue;

				// Get video details to verify duration
				const detailsParams = new URLSearchParams({
					part: 'contentDetails,snippet',
					id: videoIds,
					key: YOUTUBE_API_KEY
				});

				const detailsResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${detailsParams}`);

				if (!detailsResponse.ok) continue;

				const detailsData = await detailsResponse.json();

				// Filter for actual Shorts (< 60 seconds)
				for (const video of detailsData.items) {
					const duration = parseDuration(video.contentDetails?.duration || '');
					if (duration > 0 && duration <= 60 && !seenIds.has(video.id)) {
						seenIds.add(video.id);
						allShorts.push({
							id: video.id,
							title: video.snippet?.title || 'Untitled',
							channelTitle: video.snippet?.channelTitle || 'Unknown Channel',
							thumbnail: video.snippet?.thumbnails?.maxres?.url ||
							           video.snippet?.thumbnails?.high?.url ||
							           video.snippet?.thumbnails?.medium?.url ||
							           `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
							publishedAt: video.snippet?.publishedAt || new Date().toISOString()
						});
					}
				}
			} catch (err) {
				console.error(`Error fetching from channel ${channelId}:`, err);
			}
		}
		
		console.log(`Found ${allShorts.length} shorts from curated channels`);
	}

	// PRIORITY 2: If we don't have enough from curated channels, use search
	if (allShorts.length < 10) {
		const searchTermsToUse = pageToken 
			? [config.searchTerms[Math.floor(Math.random() * config.searchTerms.length)]]
			: config.searchTerms.slice(0, 3);

		for (const searchQuery of searchTermsToUse) {
			try {
				const searchParams = new URLSearchParams({
					part: 'snippet',
					q: searchQuery + ' #shorts',
					type: 'video',
					videoDuration: 'short',
					maxResults: '15',
					key: YOUTUBE_API_KEY,
					order: 'relevance',
					relevanceLanguage: 'ar',
					safeSearch: 'strict',
					videoCategoryId: '27' // Education category
				});

				if (pageToken) {
					searchParams.set('pageToken', pageToken);
				}

				const searchResponse = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`);

				if (!searchResponse.ok) {
					console.error(`YouTube Search API error for query "${searchQuery}"`);
					continue;
				}

				const searchData = await searchResponse.json();
				lastPageToken = searchData.nextPageToken || null;
				
				if (!searchData.items || searchData.items.length === 0) {
					continue;
				}

				const videoIds = searchData.items
					.map((item: any) => item.id?.videoId)
					.filter((id: string) => id && !seenIds.has(id))
					.join(',');

				if (!videoIds) continue;

				const detailsParams = new URLSearchParams({
					part: 'contentDetails,snippet',
					id: videoIds,
					key: YOUTUBE_API_KEY
				});

				const detailsResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${detailsParams}`);

				if (!detailsResponse.ok) continue;

				const detailsData = await detailsResponse.json();

				// Filter for actual Shorts (< 60 seconds) and quality content
				const shorts: YouTubeShort[] = detailsData.items
					.filter((video: any) => {
						const duration = parseDuration(video.contentDetails?.duration || '');
						const title = (video.snippet?.title || '').toLowerCase();
						
						// Filter out likely non-educational content
						const badKeywords = ['مقلب', 'prank', 'challenge', 'تحدي', 'reaction', 'ردة فعل'];
						const hasBadKeyword = badKeywords.some(kw => title.includes(kw));
						
						return duration > 0 && duration <= 60 && !hasBadKeyword;
					})
					.map((video: any) => ({
						id: video.id,
						title: video.snippet?.title || 'Untitled',
						channelTitle: video.snippet?.channelTitle || 'Unknown Channel',
						thumbnail: video.snippet?.thumbnails?.maxres?.url ||
						           video.snippet?.thumbnails?.high?.url ||
						           video.snippet?.thumbnails?.medium?.url ||
						           video.snippet?.thumbnails?.default?.url ||
						           `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
						publishedAt: video.snippet?.publishedAt || new Date().toISOString()
					}));

				for (const short of shorts) {
					if (!seenIds.has(short.id)) {
						seenIds.add(short.id);
						allShorts.push(short);
					}
				}
			} catch (err) {
				console.error(`Error fetching for query "${searchQuery}":`, err);
			}
		}
	}

	// If education category returned nothing, try without it
	if (allShorts.length === 0) {
		const fallbackQuery = config.searchTerms[0] + ' Arabic learn';
		const searchParams = new URLSearchParams({
			part: 'snippet',
			q: fallbackQuery + ' #shorts',
			type: 'video',
			videoDuration: 'short',
			maxResults: '20',
			key: YOUTUBE_API_KEY,
			order: 'relevance',
			relevanceLanguage: 'ar',
			safeSearch: 'strict'
		});

		const searchResponse = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`);
		
		if (searchResponse.ok) {
			const searchData = await searchResponse.json();
			lastPageToken = searchData.nextPageToken || null;
			
			if (searchData.items?.length > 0) {
				const videoIds = searchData.items
					.map((item: any) => item.id?.videoId)
					.filter(Boolean)
					.join(',');

				if (videoIds) {
					const detailsParams = new URLSearchParams({
						part: 'contentDetails,snippet',
						id: videoIds,
						key: YOUTUBE_API_KEY
					});

					const detailsResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${detailsParams}`);
					
					if (detailsResponse.ok) {
						const detailsData = await detailsResponse.json();
						
						for (const video of detailsData.items) {
							const duration = parseDuration(video.contentDetails?.duration || '');
							if (duration > 0 && duration <= 60) {
								allShorts.push({
									id: video.id,
									title: video.snippet?.title || 'Untitled',
									channelTitle: video.snippet?.channelTitle || 'Unknown Channel',
									thumbnail: video.snippet?.thumbnails?.maxres?.url ||
									           video.snippet?.thumbnails?.high?.url ||
									           `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
									publishedAt: video.snippet?.publishedAt || new Date().toISOString()
								});
							}
						}
					}
				}
			}
		}
	}

	// Shuffle results for variety
	const shuffled = allShorts.sort(() => Math.random() - 0.5);

	return {
		shorts: shuffled,
		nextPageToken: lastPageToken
	};
}

export const GET: RequestHandler = async ({ url }) => {
	const dialect = url.searchParams.get('dialect') || 'egyptian-arabic';
	const skipCache = url.searchParams.get('skipCache') === 'true';
	
	// Validate dialect
	if (!DIALECT_SEARCH_CONFIG[dialect]) {
		return json({ error: 'Invalid dialect' }, { status: 400 });
	}

	try {
		// Check cache first (unless skipCache is true)
		if (!skipCache) {
			const cached = await getCachedShorts(dialect);
			if (cached && cached.shorts.length > 0) {
				return json({
					shorts: cached.shorts,
					nextPageToken: cached.nextPageToken,
					dialect,
					cached: true
				});
			}
		}

		// Fetch from YouTube API
		const { shorts, nextPageToken } = await fetchFromYouTube(dialect);

		// Cache the results
		if (shorts.length > 0) {
			await cacheShorts(dialect, shorts, nextPageToken);
		}

		return json({
			shorts,
			nextPageToken,
			dialect,
			cached: false
		});

	} catch (error) {
		console.error('Error fetching YouTube shorts:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		);
	}
};

