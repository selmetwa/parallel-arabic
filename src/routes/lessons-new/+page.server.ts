import { curriculum } from '$lib/data/curriculum';
import { checkExistingLessons } from '$lib/helpers/lesson-file-helper';

export const load = async ({ parent }) => {
	const { session, isSubscribed, user } = await parent();

    // Flatten curriculum to get all topic IDs
    const allTopicIds = curriculum.flatMap(m => m.topics.map(t => t.id));
    
    // Check which lessons actually exist on disk
    const existingLessons = await checkExistingLessons(allTopicIds);
	
	return {
		session,
		isSubscribed,
		hasActiveSubscription: isSubscribed,
        user: user,
        curriculum,
        existingLessons // Map of topicId -> boolean
	};
};
