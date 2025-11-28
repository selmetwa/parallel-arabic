import { json } from '@sveltejs/kit';
import { loadLesson } from '$lib/helpers/lesson-file-helper';

export const GET = async ({ params, url }) => {
    const { id } = params;
    const dialect = url.searchParams.get('dialect') || undefined;
    
    if (!id) {
        return json({ error: 'Lesson ID required' }, { status: 400 });
    }

    try {
        const lesson = await loadLesson(id, dialect);
        
        if (!lesson) {
            return json({ error: 'Lesson not found' }, { status: 404 });
        }

        return json(lesson);
    } catch (error) {
        console.error('Error loading lesson:', error);
        return json({ error: 'Failed to load lesson' }, { status: 500 });
    }
};

