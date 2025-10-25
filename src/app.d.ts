// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

declare global {
	namespace App {
        interface Locals {
			// Keep existing auth interface for compatibility
			auth: {
				validate(): Promise<{ sessionId: string; user: { id: string; email?: string; supabase_auth_id?: string } } | null>;
				setSession(session: any): void;
				invalidateSession(sessionId: string): Promise<void>;
			};
			// Official Supabase SSR integration
			supabase: SupabaseClient
			safeGetSession(): Promise<{ session: Session | null; user: User | null }>
			session: Session | null
			user: User | null
		}
		// interface Error {}
		interface PageData {
			// Session and supabase client available on all pages
			session: Session | null
			supabase: SupabaseClient
			user: User | null
		}
		// interface PageState {}
		// interface Platform {}
	}
}

/// <reference types="lucia" />
declare global {
	namespace Lucia {
		type Auth = import("$lib/server/lucia").Auth;
		type DatabaseUserAttributes = Record<string, never>;
		type DatabaseSessionAttributes = Record<string, never>;
	}
}

export {};
