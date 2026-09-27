export const load = async ({ parent }) => {
	// Get session and subscription status from layout
	const { session, isSubscribed, user } = await parent();

	return {
		session,
		isSubscribed,
		hasActiveSubscription: isSubscribed, // Keep for backward compatibility
		user
	};
};
