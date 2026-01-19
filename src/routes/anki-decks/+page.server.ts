import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';
import { sections } from '$lib/constants/sections';
import { darijaSections } from '$lib/constants/darija-sections';
import { levantineSections } from '$lib/constants/levantine-sections';
import { fushaSections } from '$lib/constants/fusha-sections';

interface CategoryWithCount {
  name: string;
  path: string;
  count: number;
  isPaywalled: boolean;
}

interface DialectData {
  name: string;
  slug: string;
  emoji: string;
  categories: CategoryWithCount[];
  totalWords: number;
}

export const load: PageServerLoad = async ({ parent }) => {
  const { isSubscribed } = await parent();

  // Define dialect configurations
  const dialects = [
    { name: 'Egyptian Arabic', slug: 'egyptian-arabic', emoji: '🇪🇬', sections: sections },
    { name: 'Levantine Arabic', slug: 'levantine', emoji: '🇱🇧', sections: levantineSections },
    { name: 'Moroccan Darija', slug: 'darija', emoji: '🇲🇦', sections: darijaSections },
    { name: 'Modern Standard Arabic', slug: 'fusha', emoji: '📚', sections: fushaSections },
  ];

  // Fetch word counts per dialect and category from the database
  const dialectData: DialectData[] = [];

  for (const dialect of dialects) {
    // Get total count for this dialect
    const { count: totalCount } = await supabase
      .from('word')
      .select('*', { count: 'exact', head: true })
      .eq('dialect', dialect.slug);

    // Get counts per category
    const categoriesWithCounts: CategoryWithCount[] = [];

    for (const section of dialect.sections) {
      const { count } = await supabase
        .from('word')
        .select('*', { count: 'exact', head: true })
        .eq('dialect', dialect.slug)
        .eq('category', section.path);

      categoriesWithCounts.push({
        name: section.name,
        path: section.path,
        count: count || 0,
        isPaywalled: section.isPaywalled ?? true
      });
    }

    // Filter out categories with 0 words and sort by count descending
    const filteredCategories = categoriesWithCounts
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);

    dialectData.push({
      name: dialect.name,
      slug: dialect.slug,
      emoji: dialect.emoji,
      categories: filteredCategories,
      totalWords: totalCount || 0
    });
  }

  return {
    dialects: dialectData,
    isSubscribed
  };
};
