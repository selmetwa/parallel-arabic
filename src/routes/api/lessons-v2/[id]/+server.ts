import { json } from '@sveltejs/kit';
import { loadLessonV2 } from '$lib/helpers/lesson-file-helper';

export const GET = async ({ params, url, setHeaders }) => {
	const { id } = params;
	const dialect = url.searchParams.get('dialect') || 'egyptian-arabic';

	if (!id) {
		return json({ error: 'Lesson ID required' }, { status: 400 });
	}

	try {
		const lesson = await loadLessonV2(id, dialect);
		if (!lesson) {
			return json({ error: 'Lesson not found' }, { status: 404 });
		}

		setHeaders({
			'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400'
		});

		return json(lesson);
	} catch (error) {
		console.error('Error loading v2 lesson:', error);
		return json({ error: 'Failed to load lesson' }, { status: 500 });
	}
};
