import { StripeService } from "$lib/services/stripe.service";
import { redirect, fail } from "@sveltejs/kit";
import { auth } from '$lib/server/lucia';
import { getUserHasActiveSubscription } from "$lib/helpers/get-user-has-active-subscription";
import type { Actions } from "./$types";

import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";

/**
 * Home page load
 *
 * Check the current status of the subscription and return to the page so adjust
 * the options as necessary.
 *
 */
export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  const userId = session && session.user.userId || null;

  const user = await db.selectFrom('user').selectAll().where('id', '=', userId).executeTakeFirst();

  const isSubscribed = await getUserHasActiveSubscription(userId ?? "");
  console.log({ user });

  return {
    session,
    isSubscribed: isSubscribed,
    subscriptionId: user?.subscriber_id,
    subscriptionEndDate: user?.subscription_end_date,
  };
};

/**
 * Form actions
 *
 * There are only subscribe and cancel, which are accessible based on the result
 * of the above load statement and what it returns to the page.
 *
 */
export const actions = {
  logout: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.auth.setSession(null); // remove cookie
		throw redirect(302, '/login'); // redirect to login page
	},
  /**
   * Subscribe
   *
   * Retrieve the price id from the form data. This should have been created in
   * the Stripe developer's console, then create a subscription. If the sessins
   * was successful a client secret is returned and that is passed back to the
   * user via cookies in hooks.server.ts.
   */
  subscribe: async ({ request, cookies, locals }) => {
    const authSession = await locals.auth.validate();

    if (!authSession) {
      throw redirect(302, '/login');
    }
  
    const form = await request.formData();
    const priceId = form.get("price_id") as string;
    const session = await StripeService.subscribe(priceId);
    console.log({ session });
    if (session?.client_secret) {
      cookies.set("client-secret", session.client_secret, {
        path: "/",
        httpOnly: true,
        secure: true,
      });
      redirect(302, "/pricing/checkout");
    }

    redirect(302, "/pricing/error");
  },

  /**
   * Cancel
   *
   * Retrieve the email from the form data, then attempt to cancel the
   * subscription. Redirect according to success of error.
   */
  cancel: async ({ request, locals }) => {
    const form = await request.formData();
    const subscriptionId = form.get("subscription_id") as string;
    const subscription = await StripeService.cancel(subscriptionId);

    if (subscription) {
      const authSession = await locals.auth.validate();
      const userId = authSession && authSession.user.userId;
      const user = await db.selectFrom('user').selectAll().where('id', '=', userId).executeTakeFirst();

      if (user) {
        const result = await db
          .updateTable('user')
          .set({
            is_subscriber: 0 as unknown as boolean,
            subscriber_id: '',
          })
          .where('id', '=', userId)
          .executeTakeFirst();
  
      console.log(result.numUpdatedRows);
        redirect(302, "/pricing/canceled");
      }
    }
    redirect(302, "/pricing/error");
  },
} satisfies Actions;
