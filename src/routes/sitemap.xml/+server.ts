import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { blogPosts } from '$lib/constants/blog-posts';
import verbIndex from '$lib/data/verb-conjugations/egyptian-arabic/index.json';
import { stories as staticStories } from '$lib/constants/stories/index';
import { BLOCKED_STORY_IDS } from '$lib/constants/stories/blocked';
import { PHRASE_SEEDS, PHRASE_DIALECTS } from '$lib/constants/phrase-seeds';
import { COMPARISON_SLUGS } from '$lib/constants/dialect-comparisons';
import { WORD_DIALECTS, wordSlugsFor } from '$lib/data/words/manifest';
import { VOCAB_DIALECTS, topicSlugsFor } from '$lib/data/vocab/manifest';
import { existsPhrase } from '$lib/data/phrases/manifest';
import { GAMES } from '$lib/constants/games';
const BASE_URL = 'https://www.parallel-arabic.com';

// Supabase caps a select at 1000 rows. There are more stories than that, so
// every table read here has to page through.
const PAGE_SIZE = 1000;

async function selectAll<T>(table: string, columns: string): Promise<T[]> {
	const rows: T[] = [];
	for (let from = 0; ; from += PAGE_SIZE) {
		const { data, error } = await supabase
			.from(table)
			.select(columns)
			.order('created_at', { ascending: false })
			.range(from, from + PAGE_SIZE - 1);

		// One table failing should not cost us the rest of the sitemap.
		if (error) {
			console.error(`Sitemap: failed to read ${table}:`, error.message);
			return rows;
		}
		if (!data?.length) break;
		rows.push(...(data as T[]));
		if (data.length < PAGE_SIZE) break;
	}
	return rows;
}

// Static pages with their priorities and change frequencies
const staticPages = [
	// Core pages
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/learn', priority: '0.9', changefreq: 'weekly' },
	{ path: '/practice', priority: '0.9', changefreq: 'weekly' },
	{ path: '/explore', priority: '0.9', changefreq: 'weekly' },

	// Learn section
	{ path: '/alphabet', priority: '0.8', changefreq: 'monthly' },
	{ path: '/alphabet/learn', priority: '0.8', changefreq: 'monthly' },
	{ path: '/alphabet/practice', priority: '0.8', changefreq: 'monthly' },
	{ path: '/alphabet/practice/handwriting', priority: '0.7', changefreq: 'monthly' },
	{ path: '/alphabet/practice/keyboard', priority: '0.7', changefreq: 'monthly' },
	{ path: '/lessons', priority: '0.8', changefreq: 'weekly' },
	{ path: '/lessons/structured', priority: '0.8', changefreq: 'weekly' },
	{ path: '/vocabulary', priority: '0.8', changefreq: 'weekly' },

	// Games
	{ path: '/learn/game', priority: '0.8', changefreq: 'weekly' },
	{ path: '/learn/game/quiz', priority: '0.6', changefreq: 'monthly' },
	...GAMES.map((g) => ({ path: `/learn/game/${g.slug}`, priority: '0.7', changefreq: 'monthly' })),

	// Practice section
	{ path: '/stories', priority: '0.8', changefreq: 'weekly' },
	{ path: '/sentences', priority: '0.8', changefreq: 'weekly' },
	{ path: '/speak', priority: '0.8', changefreq: 'weekly' },

	// Explore section
	{ path: '/videos', priority: '0.8', changefreq: 'weekly' },
	{ path: '/tutor', priority: '0.9', changefreq: 'weekly' },
	{ path: '/conjugations', priority: '0.7', changefreq: 'monthly' },

	// Dialect landing pages
	{ path: '/egyptian-arabic', priority: '0.9', changefreq: 'weekly' },
	{ path: '/egyptian-arabic/conjugations', priority: '0.8', changefreq: 'monthly' },
	{ path: '/fusha', priority: '0.9', changefreq: 'weekly' },
	{ path: '/levantine', priority: '0.9', changefreq: 'weekly' },
	{ path: '/darija', priority: '0.9', changefreq: 'weekly' },

	// Structured lessons by dialect
	{ path: '/lessons/structured/egyptian-arabic', priority: '0.8', changefreq: 'weekly' },
	{ path: '/lessons/structured/fusha', priority: '0.8', changefreq: 'weekly' },
	{ path: '/lessons/structured/levantine', priority: '0.8', changefreq: 'weekly' },
	{ path: '/lessons/structured/darija', priority: '0.8', changefreq: 'weekly' },

	// Resources
	{ path: '/anki-decks', priority: '0.7', changefreq: 'monthly' },
	{ path: '/keyboard', priority: '0.8', changefreq: 'monthly' },
	{ path: '/mobile-app', priority: '0.7', changefreq: 'monthly' },

	// Info pages
	{ path: '/about', priority: '0.5', changefreq: 'monthly' },
	{ path: '/faq', priority: '0.5', changefreq: 'monthly' },
	{ path: '/support', priority: '0.5', changefreq: 'monthly' },

	// Blog
	{ path: '/blog', priority: '0.6', changefreq: 'weekly' },

	// Legal
	{ path: '/privacy', priority: '0.3', changefreq: 'yearly' }
];

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function formatDate(date: string | Date): string {
	const d = new Date(date);
	return d.toISOString().split('T')[0];
}

export const GET: RequestHandler = async () => {
	const urls: string[] = [];

	const today = formatDate(new Date());

	// Add static pages
	for (const page of staticPages) {
		urls.push(`
  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
	}

	// Word pages, one index per dialect plus a page per word that earned one
	for (const dialect of WORD_DIALECTS) {
		const slugs = wordSlugsFor(dialect);
		if (!slugs.length) continue;

		urls.push(`
  <url>
    <loc>${BASE_URL}/${dialect}/word</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);

		for (const slug of slugs) {
			urls.push(`
  <url>
    <loc>${BASE_URL}/${dialect}/word/${escapeXml(slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
		}
	}

	// Vocabulary hub, topic pages, and the two hand-written Egyptian guides
	for (const dialect of VOCAB_DIALECTS) {
		const topics = topicSlugsFor(dialect);
		if (!topics.length) continue;

		urls.push(`
  <url>
    <loc>${BASE_URL}/${dialect}/vocabulary</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

		for (const topic of topics) {
			urls.push(`
  <url>
    <loc>${BASE_URL}/${dialect}/vocabulary/${escapeXml(topic)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
		}
	}

	for (const path of ['/egyptian-arabic/pronunciation', '/egyptian-arabic/beginners']) {
		urls.push(`
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
	}

	// Dialect comparison pages
	for (const slug of COMPARISON_SLUGS) {
		urls.push(`
  <url>
    <loc>${BASE_URL}/${escapeXml(slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
	}

	// Phrasebook: one index per dialect plus a page per generated phrase
	for (const dialect of PHRASE_DIALECTS) {
		if (!PHRASE_SEEDS.some((seed) => existsPhrase(dialect, seed.slug))) continue;

		urls.push(`
  <url>
    <loc>${BASE_URL}/${dialect}/phrases</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);

		for (const seed of PHRASE_SEEDS) {
			if (!existsPhrase(dialect, seed.slug)) continue;
			urls.push(`
  <url>
    <loc>${BASE_URL}/${dialect}/phrases/${escapeXml(seed.slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
		}
	}

	// Hand-written stories served from $lib/constants/stories
	for (const slug of Object.keys(staticStories)) {
		urls.push(`
  <url>
    <loc>${BASE_URL}/stories/${escapeXml(slug)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
	}

	// Add blog posts
	for (const post of blogPosts) {
		urls.push(`
  <url>
    <loc>${BASE_URL}/blog/${escapeXml(post.slug)}</loc>
    <lastmod>${formatDate(post.date)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
	}

	// Add verb conjugation pages (static JSON, no DB needed)
	for (const verb of verbIndex.verbs) {
		urls.push(`
  <url>
    <loc>${BASE_URL}/egyptian-arabic/conjugations/${escapeXml(verb.slug)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
	}

	// Fetch dynamic content from database
	try {
		// Lessons
		const lessons = await selectAll<{ id: string; created_at: string; is_private: boolean | null }>(
			'generated_lesson',
			'id, created_at, is_private'
		);
		for (const lesson of lessons) {
			if (lesson.is_private) continue;
			urls.push(`
  <url>
    <loc>${BASE_URL}/lessons/${escapeXml(lesson.id)}</loc>
    <lastmod>${formatDate(lesson.created_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
		}

		// Videos
		const videos = await selectAll<{ id: string; created_at: string }>('video', 'id, created_at');
		for (const video of videos) {
			urls.push(`
  <url>
    <loc>${BASE_URL}/video/${escapeXml(video.id)}</loc>
    <lastmod>${formatDate(video.created_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
		}

		// Generated stories
		const stories = await selectAll<{ id: string; created_at: string; dialect: string }>(
			'generated_story',
			'id, created_at, dialect'
		);
		for (const story of stories) {
			// Blocked stories are already hidden from /stories; they should not be
			// submitted for indexing either.
			if (BLOCKED_STORY_IDS.includes(story.id)) continue;

			urls.push(`
  <url>
    <loc>${BASE_URL}/generated_story/${escapeXml(story.id)}</loc>
    <lastmod>${formatDate(story.created_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
		}
	} catch (error) {
		console.error('Error fetching dynamic content for sitemap:', error);
		// Continue with static pages only if DB fetch fails
	}

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
		}
	});
};
