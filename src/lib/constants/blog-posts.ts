// Blog post metadata. The index page and sitemap both read from here so they stay in
// sync. The article body itself lives in each post's `+page.svelte`.

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date
  readingTime: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'egyptian-arabic-alphabet',
    title: 'The Arabic alphabet, the Egyptian way',
    description:
      'The 28 letters, but with the sounds you will actually hear on the street in Cairo, where ج is a hard G, ق quietly disappears, and ث is almost never a "th".',
    date: '2026-06-17',
    readingTime: '8 min read'
  }
];
