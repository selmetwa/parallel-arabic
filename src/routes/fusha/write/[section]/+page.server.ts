import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
  throw redirect(301, `/vocabulary?dialect=fusha&category=${params.section}`);
};
