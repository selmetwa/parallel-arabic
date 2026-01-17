import { json } from '@sveltejs/kit';
import { loadLesson } from '$lib/helpers/lesson-file-helper';

export const GET = async ({ params, url, setHeaders }) => {
    const { id } = params;
    let dialect = url.searchParams.get('dialect') || undefined;
    
    if (!id) {
        return json({ error: 'Lesson ID required' }, { status: 400 });
    }

    try {
        // For alphabet and grammar lessons, try loading from 'fusha' first
        // since they're typically stored there (not dialect-specific)
        let lesson = null;
        if (dialect === 'alphabet' || dialect === 'grammar') {
            // Try fusha first (alphabet/grammar lessons are usually in MSA/Fusha)
            lesson = await loadLesson(id, 'fusha');
            // If not found in fusha, try without dialect (searches all)
            if (!lesson) {
                lesson = await loadLesson(id, undefined);
            }
        } else {
            lesson = await loadLesson(id, dialect);
        }
        
        if (!lesson) {
            return json({ error: 'Lesson not found' }, { status: 404 });
        }

        // Override dialect in response to match what was requested (for tracking)
        if (dialect === 'alphabet' || dialect === 'grammar') {
            lesson = { ...lesson, dialect: dialect };
        }

        // Set cache headers - lessons rarely change
        // Cache for 1 hour in browser, 24 hours on CDN, stale-while-revalidate for 1 day
        setHeaders({
            'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400'
        });

        return json(lesson);
    } catch (error) {
        console.error('Error loading lesson:', error);
        return json({ error: 'Failed to load lesson' }, { status: 500 });
    }
};

