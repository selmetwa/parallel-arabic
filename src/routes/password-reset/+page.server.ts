// routes/password-reset/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import { isValidEmail, sendPasswordResetLink } from "$lib/server/email";
import { supabase } from "$lib/supabaseClient";
import { ADMIN_ID } from '$env/static/private';
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// Require admin authentication
		// @ts-expect-error - auth property exists on locals at runtime
		const session = await locals.auth.validate();
		
		if (!session?.sessionId) {
			throw redirect(302, '/login');
		}

		const userId = session && session.user?.id || null;
		
		if (ADMIN_ID !== userId) {
			throw redirect(302, '/');
		}

		const formData = await request.formData();
		const email = formData.get("email");
		// basic check
		if (!isValidEmail(email)) {
			return fail(400, {
				message: "Invalid email"
			});
		}
		try {
			const { data: storedUser, error } = await supabase
				.from("user")
				.select("*")
				.eq("email", email.toLowerCase())
				.single();

			if (error && error.code !== 'PGRST116') {
				console.error('Error fetching user for password reset:', error);
				return fail(500, {
					message: "An unknown error occurred"
				});
			}

			if (!storedUser) {
				return fail(400, {
					message: "User does not exist"
				});
			}

			// const user = auth.transformDatabaseUser(storedUser);
			const token = '123456';
			await sendPasswordResetLink(token, email, userId);
			return {
				success: true
			};
		} catch (e) {
			return fail(500, {
				message: "An unknown error occurred"
			});
		}
	}
};