# Fix stale user data on prerendered pages

## Context

About 25 routes set `export const prerender = true` (the SEO vocab, word, phrase and comparison pages, `/pricing`, the blog and more). On these routes the root `src/routes/+layout.server.ts` runs once at build time with no user. Its output ships as static HTML plus `__data.json`, and the browser uses that same frozen data on a direct load and on client-side navigation. So for a logged-in user:

- `isSubscribed` is always `false`, and subscribers hit `PaywallModal`. This is the reported `/alphabet` bug, and it also affects `VocabPractice` on `/[dialect]/phrases`, `/[dialect]/word/[word]`, `/egyptian-arabic/pronunciation`, `/egyptian-arabic/vocabulary/[topic]` and `/[comparison]`.
- `trialEligible` is always `false`, so the trial copy is hidden on `/pricing` and in `SubscribeButton` and `PaywallModal`.
- `userXp`, `userLevel` and `targetDialect` read as 0, 1 and null. `+layout.svelte:69-70` pushes these into the XP store, and `Navigation` loses the user's dialect.

`data.user` and `data.session` are fine, because `src/routes/+layout.ts` gets them again from Supabase in the browser.

As a stopgap, `src/routes/alphabet/+page.ts` was switched to `prerender = false` (uncommitted). This plan replaces that with one fix for every route and lets all of them stay prerendered.

## Approach

When the layout's universal load runs in the browser, it will notice a mismatch: Supabase has a logged-in user, but the server data says there is none (`data.user == null`). That can only happen on a prerendered page. When it does, the load fetches the real per-user fields from a new endpoint that is never prerendered and merges them over the frozen defaults.

The universal load finishes before the page hydrates, so the hydrated page already has the correct values. The only moment of anonymous state is the static HTML shown before hydration, when nothing can be clicked yet.

### 1. Extract the per-user fields into a shared helper
New file `src/lib/server/user-context.ts`:

```ts
export function getUserContext(user) {
  const isSubscribed = checkUserSubscription(user);   // $lib/helpers/subscription
  return {
    isSubscribed,
    trialEligible: !isSubscribed && !user.has_used_trial,
    targetDialect: user.target_dialect || null,
    proficiencyLevel: user.proficiency_level || null,
    goalLevel: user.goal_level || null,
    userXp: user.total_xp ?? 0,
    userLevel: user.current_level ?? 1
  };
}
```

`src/routes/+layout.server.ts` spreads `...getUserContext(user)` in place of the inline logic, so the logic lives in one place. `showOnboarding` stays where it is: it depends on the `?newSignup` query param and doesn't apply to prerendered pages.

### 2. New endpoint `src/routes/api/me/+server.ts`
- `GET` reads `locals.user`, which `hooks.server.ts:171` already sets on every request, including API routes.
- It returns `json(getUserContext(locals.user))`, or a 401 if there is no user.
- It sends `Cache-Control: private, no-store`.

### 3. Hydrate in `src/routes/+layout.ts`
After `supabase.auth.getUser()` in the main `try` branch:

```ts
let userContext = {};
if (browser && user && !data.user) {
  // Prerendered page: server data was built anonymously; fetch the real values.
  try {
    const res = await fetch('/api/me');
    if (res.ok) userContext = await res.json();
  } catch { /* keep defaults */ }
}
```

Then spread `...userContext` after the existing `data.*` fields in the return, so the fetched values win. It uses the `fetch` SvelteKit passes into `load`.

### 4. Revert the `/alphabet` stopgap
Restore `src/routes/alphabet/+page.ts` to `export const prerender = true;`, i.e. `git checkout` that file.

### 5. Save the plan in the repo
Copy this plan to `docs/` to follow the project convention.

## Notes and risks
- Every navigation to a prerendered page makes one small `/api/me` request, because the root layout's server load depends on `url` and so reruns on each navigation. That's acceptable; don't add caching unless it turns out to matter.
- Logged-out visitors never make the request, because `user` is null.
- If the endpoint fails, the page behaves as it does today: the visitor is treated as a free user.

## Verification
1. Run `npm run check` and confirm the change adds no new type errors.
2. Run `npm run build && npm run preview`, so prerendering actually happens (dev mode doesn't prerender).
3. Log in as a subscriber, then do each of the following both by loading the page directly and by clicking through to it:
   - `/alphabet`: go past letter 5 and switch lessons. No paywall should appear.
   - `/egyptian-arabic/vocabulary/<topic>` and `/egyptian-arabic/pronunciation`: the `VocabPractice` CTA should show the subscriber version.
   - The XP and level in the sidebar should stay correct on a blog or FAQ page.
4. Log in as a free account that is eligible for the trial and check that `/pricing` shows the trial copy.
5. Log out and confirm the paywall still appears on `/alphabet` after letter 5, and that the Network tab shows no `/api/me` request.

Per project memory, the user does the visual checks; don't drive the browser over MCP.
