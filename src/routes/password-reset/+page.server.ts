// routes/password-reset/+page.server.ts
import { fail } from "@sveltejs/kit";
import { isValidEmail, sendPasswordResetLink } from "$lib/server/email";
import { supabase } from "$lib/supabaseClient";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request }) => {
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
			await sendPasswordResetLink(token, email);
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