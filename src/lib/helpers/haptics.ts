/**
 * Haptic feedback in the iOS app (Micro Interactions). No-ops on the web.
 *
 * The app loads the live site, so this also runs in binaries built before the
 * haptics plugin was added: there the plugin call rejects, and we ignore it.
 * Used sparingly: a light tap on a right answer, a success buzz at the end of
 * a round or lesson.
 */
import { isNativeApp } from '$lib/helpers/is-native-app';

function withHaptics(run: (h: typeof import('@capacitor/haptics')) => Promise<void>): void {
	if (!isNativeApp()) return;
	import('@capacitor/haptics').then(run).catch(() => {});
}

/** A right answer. */
export function hapticTap(): void {
	withHaptics(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }));
}

/** A round, lesson or conversation finished. */
export function hapticSuccess(): void {
	withHaptics(({ Haptics, NotificationType }) =>
		Haptics.notification({ type: NotificationType.Success })
	);
}
