import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';

const sections = [
  {
    name: 'Animals',
    path: 'animals'
  },
  {
    name: 'Vocabulary from around the house',
    path: 'vocabulary_from_around_the_house'
  },
  {
    name: 'City and transportation',
    path: 'city_and_transportation'
  },
  {
    name: 'Clothing',
    path: 'clothing'
  },
  {
    name: 'Colors',
    path: 'colors'
  },
  {
    name: 'Education',
    path: 'education'
  },
  {
    name: 'Emotions and personality traits',
    path: 'emotions__and__personality_traits'
  },
  {
    name: 'Food',
    path: 'food'
  },
  {
    name: 'Geography',
    path: 'geography'
  },
  {
    name: 'Human body',
    path: 'human_body'
  },
  {
    name: 'Mankind and kinship',
    path: 'mankind_and_kinship'
  },
  {
    name: 'Media and the arts',
    path: 'media_and_the_arts'
  },
  {
    name: 'Medicine',
    path: 'medicine'
  },
  {
    name: 'Nature and weather',
    path: 'nature__and__weather'
  },
  {
    name: 'Religion',
    path: 'religion'
  },
  {
    name: 'Sports and hobbies',
    path: 'sports__and__hobbies'
  },
  {
    name: 'Technology',
    path: 'technology'
  },
  {
    name: 'Time',
    path: 'time'
  },
  {
    name: 'Work and money',
    path: 'work_and_money'
  },
  {
    name: 'Media',
    path: 'media'
  },
  {
    name: 'Media 2',
    path: 'media_2'
  },
  {
    name: 'Media 3',
    path: 'media_3'
  },
  {
    name: 'Crime and punishment',
    path: 'crime_and_punishment'
  },
  {
    name: 'Government and politics',
    path: 'government_and_politics'
  },
  {
    name: 'War',
    path: 'war'
  }
 ] 

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/login');

  const updatedSections = await Promise.all(
    sections.map(async (section) => {
      try {
        const response = await fetch(`${API_URL}/vocab/${section.path}`);
        const data = await response.json();
        return { ...section, count: data.length };
      } catch (error) {
        console.error(`Error fetching data for ${section.name}:`, error);
        return section;
      }
    })
  );

  return {
    data: updatedSections
  }
};