import { redirect } from '@sveltejs/kit';

export function load() {
	redirect(301, '/egyptian-arabic/stories');
}
