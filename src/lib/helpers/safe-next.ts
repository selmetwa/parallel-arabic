/**
 * Where to send someone after they log in or sign up. Only same-site paths are
 * allowed, so a crafted `?next=` can't bounce people to another site.
 */
export function safeNext(value: string | null | undefined, fallback = '/'): string {
	if (!value || !value.startsWith('/')) return fallback;
	if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
	return value;
}

/** Add the flag that opens onboarding for a brand-new account. */
export function withNewSignup(path: string): string {
	return `${path}${path.includes('?') ? '&' : '?'}newSignup=true`;
}

/**
 * Google and Apple sign-in come back through /auth/callback, whose URL must
 * match Supabase's allow list, so `next` travels in a short-lived cookie.
 */
export const NEXT_COOKIE = 'pa_next';

export function rememberNext(next: string): void {
	if (typeof document === 'undefined' || next === '/') return;
	document.cookie = `${NEXT_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=600; samesite=lax`;
}
