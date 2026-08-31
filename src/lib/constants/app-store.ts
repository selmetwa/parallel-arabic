/**
 * The iOS app listing. Single source of truth — referenced from /mobile-app,
 * /about and the mobile download banner.
 *
 * There is no Android app: no Play Store listing exists, and the `cap:android`
 * scripts and @capacitor/android dependency are scaffolding that was never
 * used. Copy that mentions app availability should say iPhone and iPad only.
 */
export const APP_STORE_ID = '6761313327';

export const APP_STORE_URL = `https://apps.apple.com/us/app/parallel-arabic/id${APP_STORE_ID}`;
