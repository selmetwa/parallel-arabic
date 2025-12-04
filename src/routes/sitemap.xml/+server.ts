import type { RequestHandler } from './$types';

const baseUrl = 'https://www.parallel-arabic.com';

// Static pages that should always be in sitemap
const staticPages = [
  { url: '', priority: 1.0, changefreq: 'weekly' },
  { url: '/about', priority: 0.8, changefreq: 'monthly' },
  { url: '/faq', priority: 0.8, changefreq: 'monthly' },
  { url: '/lessons', priority: 0.9, changefreq: 'weekly' },
  { url: '/stories', priority: 0.9, changefreq: 'weekly' },
  { url: '/tutor', priority: 0.8, changefreq: 'monthly' },
  { url: '/alphabet/learn', priority: 0.7, changefreq: 'monthly' },
  { url: '/videos', priority: 0.8, changefreq: 'weekly' },
  { url: '/vocabulary', priority: 0.9, changefreq: 'weekly' },
  { url: '/review/import', priority: 0.6, changefreq: 'monthly' },
];

// Dialect-specific pages
const dialectPages = [
  { dialect: 'egyptian-arabic', priority: 0.9 },
  { dialect: 'levantine', priority: 0.9 },
  { dialect: 'darija', priority: 0.9 },
  { dialect: 'fusha', priority: 0.9 },
];

export const GET: RequestHandler = async () => {
  const pages = [...staticPages];

  // Add dialect-specific lesson and story pages
  for (const { dialect, priority } of dialectPages) {
    pages.push({
      url: `/lessons/${dialect}`,
      priority,
      changefreq: 'weekly'
    });
    pages.push({
      url: `/stories/${dialect}`,
      priority,
      changefreq: 'weekly'
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
};

