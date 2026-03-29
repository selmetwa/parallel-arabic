import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import verbIndex from '$lib/data/verb-conjugations/egyptian-arabic/index.json';
import { blogPosts } from '$lib/constants/blog/index';
import { sections } from '$lib/constants/sections';
import { fushaSections } from '$lib/constants/fusha-sections';
import { levantineSections } from '$lib/constants/levantine-sections';
import { darijaSections } from '$lib/constants/darija-sections';

const BASE_URL = 'https://www.parallel-arabic.com';

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

  // Practice section
  { path: '/stories', priority: '0.8', changefreq: 'weekly' },
  { path: '/sentences', priority: '0.8', changefreq: 'weekly' },
  { path: '/speak', priority: '0.8', changefreq: 'weekly' },

  // Explore section
  { path: '/videos', priority: '0.8', changefreq: 'weekly' },
  { path: '/videos-new', priority: '0.8', changefreq: 'daily' },
  { path: '/tutor', priority: '0.8', changefreq: 'weekly' },

  // Dialect landing pages
  { path: '/egyptian-arabic', priority: '0.9', changefreq: 'weekly' },
  { path: '/egyptian-arabic/conjugations', priority: '0.8', changefreq: 'monthly' },
  { path: '/fusha', priority: '0.9', changefreq: 'weekly' },
  { path: '/levantine', priority: '0.9', changefreq: 'weekly' },
  { path: '/darija', priority: '0.9', changefreq: 'weekly' },

  // Dialect-filtered stories
  { path: '/stories?dialect=egyptian-arabic', priority: '0.8', changefreq: 'weekly' },
  { path: '/stories?dialect=darija', priority: '0.8', changefreq: 'weekly' },
  { path: '/stories?dialect=levantine', priority: '0.8', changefreq: 'weekly' },
  { path: '/stories?dialect=fusha', priority: '0.8', changefreq: 'weekly' },

  // Dialect-filtered vocabulary
  { path: '/vocabulary?dialect=egyptian-arabic', priority: '0.8', changefreq: 'weekly' },
  { path: '/vocabulary?dialect=darija', priority: '0.8', changefreq: 'weekly' },
  { path: '/vocabulary?dialect=levantine', priority: '0.8', changefreq: 'weekly' },
  { path: '/vocabulary?dialect=fusha', priority: '0.8', changefreq: 'weekly' },

  // Structured lessons by dialect
  { path: '/lessons/structured/egyptian-arabic', priority: '0.8', changefreq: 'weekly' },
  { path: '/lessons/structured/fusha', priority: '0.8', changefreq: 'weekly' },
  { path: '/lessons/structured/levantine', priority: '0.8', changefreq: 'weekly' },
  { path: '/lessons/structured/darija', priority: '0.8', changefreq: 'weekly' },

  // Resources
  { path: '/anki-decks', priority: '0.7', changefreq: 'monthly' },
  { path: '/keyboard', priority: '0.6', changefreq: 'monthly' },
  { path: '/mobile-app', priority: '0.7', changefreq: 'monthly' },

  // Vocab list hub
  { path: '/vocab-list', priority: '0.9', changefreq: 'weekly' },

  // Info pages
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/faq', priority: '0.5', changefreq: 'monthly' },
  { path: '/support', priority: '0.5', changefreq: 'monthly' },

  // Blog
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
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

  // Add static pages
  for (const page of staticPages) {
    urls.push(`
  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // Add blog post pages (static TypeScript, no DB needed)
  for (const post of blogPosts) {
    urls.push(`
  <url>
    <loc>${BASE_URL}/blog/${escapeXml(post.slug)}</loc>
    <lastmod>${post.updatedAt ?? post.publishedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
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

  // Add vocab-list pages for all dialects
  const vocabDialects: { key: string; sections: { path: string }[] }[] = [
    { key: 'egyptian-arabic', sections },
    { key: 'fusha', sections: fushaSections },
    { key: 'levantine', sections: levantineSections },
    { key: 'darija', sections: darijaSections }
  ];

  for (const dialect of vocabDialects) {
    for (const section of dialect.sections) {
      if (section.path === 'all') continue;
      urls.push(`
  <url>
    <loc>${BASE_URL}/vocab-list/${escapeXml(dialect.key)}/${escapeXml(section.path)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  }

  // Fetch dynamic content from database
  try {
    // Fetch lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('generated_lesson')
      .select('id, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (!lessonsError && lessons) {
      for (const lesson of lessons) {
        const lastmod = lesson.updated_at || lesson.created_at;
        urls.push(`
  <url>
    <loc>${BASE_URL}/lessons/${escapeXml(lesson.id)}</loc>
    <lastmod>${formatDate(lastmod)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    }

    // Fetch videos
    const { data: videos, error: videosError } = await supabase
      .from('video')
      .select('id, created_at')
      .order('created_at', { ascending: false });

    if (!videosError && videos) {
      for (const video of videos) {
        urls.push(`
  <url>
    <loc>${BASE_URL}/video/${escapeXml(video.id)}</loc>
    <lastmod>${formatDate(video.created_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    }

    // Fetch stories (Egyptian Arabic stories have their own route)
    const { data: stories, error: storiesError } = await supabase
      .from('generated_story')
      .select('id, created_at, dialect')
      .order('created_at', { ascending: false });

    if (!storiesError && stories) {
      for (const story of stories) {
        urls.push(`
  <url>
    <loc>${BASE_URL}/generated_story/${escapeXml(story.id)}</loc>
    <lastmod>${formatDate(story.created_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
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
