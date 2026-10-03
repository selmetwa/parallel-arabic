# Room Hunt: a 3D "find the object" game

## Context
The current games (word scramble, odd one out, and so on) are all flat card or tile UIs. This adds a game where the player stands inside a 3D room (kitchen, bathroom or restaurant), hears or reads an Arabic word, and taps the matching object. It ties vocabulary to a place and a picture rather than to an English gloss. It covers the 4 game dialects (`GAME_DIALECTS`: Egyptian, Levantine, Darija, Fusha) and uses Kenney's CC0 low-poly model kits.

Step 0 of implementation: copy this plan to `docs/room-hunt-plan.md`, following the repo's convention.

## UX (chosen)
- **Camera:** first-person, fixed in the middle of the room. The player drags (mouse or touch) to look around 360°. There's no walking, so it's easy on mobile and nobody gets lost. Arrow keys also rotate the view, for keyboard play.
- **Room picker:** a GameShell `Picker` with three levels, ordered from easier to harder:
  1. Kitchen: about 14 objects.
  2. Bathroom: about 12.
  3. Restaurant: about 16, including some food items.
  All three are open. A ✓ badge on a room comes from a localStorage best score, so nothing is locked.
- **Explore phase (before the round, optional):** tapping any object pops up a label with the Arabic, transliteration and audio. A "Start round" button starts the round. This is where the learning happens; nothing here is scored.
- **Round:** 10 prompts drawn from the room's objects. A prompt card at the bottom shows the Arabic word with an audio button and, optionally, the transliteration.
  - Tap the right object: it briefly glows green, its Arabic label floats above it, and you get +1 XP.
  - Tap the wrong object: it shakes red and shows its own name, which teaches the word, and the prompt stays.
  - After 2 misses on a prompt, a "hint" pulses the correct object's outline. A hinted answer earns no XP.
- **Toggles:**
  - "Listen only" hides the Arabic text so the prompt is audio only. It's available to everyone when the object has a recording; otherwise it needs a subscription, because of the TTS limit.
  - "Show transliteration".
- **Results:** `GameResults` showing correct on first try, hints used, time and XP. It also has a word list of the room's vocabulary (reuse `GameWordList`) and "Play again" / "Next room" buttons.
- **Fullscreen:** call `onStart()` on the first tap of a round, exactly as the other games do. The canvas resizes to the overlay.
- **Hover:** desktop shows only a pointer cursor and a subtle outline. It never shows names during a round, because that would give the answer away.
- **Reduced motion:** with `prefers-reduced-motion`, there's no camera easing or object shake; the feedback is colour only.

## Tech
- **3D engine:** add `three` (plus `@types/three`) and use it directly. I'm not using Threlte, because one imperative scene class is simpler and keeps Svelte reactivity away from the render loop.
  - It's imported with `await import('three')` inside `onMount`, so the main bundle and SSR are untouched.
  - Use `GLTFLoader`. `OutlinePass` costs too much on mobile, so the outline/glow is done with emissive tinting instead.
- **Assets:** Kenney Furniture Kit and Food Kit (CC0) go in `static/games/room-hunt/models/*.glb`.
  - Only the models actually used get copied.
  - A layout is described in data (model file, position, rotation, scale, word id), so a room is a TS config and not a Blender scene.
  - Walls and floor are simple planes with flat colours per room. Use hemisphere plus directional light, with no shadows on mobile.
  - Add `static/games/room-hunt/LICENSE.txt` with Kenney's CC0 notice.
  - At implementation time, check which objects the kits really contain and drop or substitute any word without a matching model.
- **Vocabulary: generated with Gemini once, at build time, and committed.** The objects are fixed by the 3D models, so only their translations are needed. Generating them at runtime would add latency and cost and could give different words each round. The DB also has no kitchen, bathroom or restaurant categories.
  - **Room layouts:** `src/lib/games/room-hunt/rooms.ts` is written by hand. Each object is `{ id, english, model, transform }`, so this file holds the models, positions, and the English name.
  - **Generation script:** `scripts/generate-room-hunt-vocab.ts`. It follows the pattern in `scripts/build-vocab-topics.ts`: `@google/genai`, `gemini-2.5-flash`, a zod schema passed through `zodToJsonSchema`, dotenv from `.env.local`, and a cache file so re-runs are free (`--regenerate` busts it).
    - It makes one call per room per dialect, sending the room's English object list.
    - It asks for the everyday spoken word in that dialect (not MSA unless the dialect is fusha), in Arabic script with tashkeel, plus the transliteration.
    - The schema stays flat to avoid the "too many states" 400: an array of `{ id, arabic, transliteration }` with no min/max bounds.
    - Structured output goes under `config`, not `generationConfig` (the known bug).
    - It checks that every requested id comes back exactly once. If not, it fails loudly.
    - Add an `npm run generate:room-hunt` script to package.json.
  - **Output:** `src/lib/games/room-hunt/vocab.json`, shaped as `{ [objectId]: { [dialect]: { arabic, transliteration } } }`. It's committed, imported statically, and safe to edit by hand.
  - I'll spot-check the output and flag doubtful Darija and Levantine entries for native review. For example, fridge should come out as تلاجة in Egyptian, براد in Levantine, فريجيدير/تلاجة in Darija, and ثلاجة in Fusha.
  - The content is ours, so unlike the licensed `word` table it doesn't need the noindex fetch.
- **Audio:** reuse `AudioButton` (`src/lib/components/AudioButton.svelte`), which falls back to TTS through `/api/text-to-speech`. Free users get the existing TTS allowance. There are no new recordings in v1.

## Files
New:
- `src/lib/games/room-hunt/rooms.ts`: room configs (object ids, English names, models, transforms).
- `scripts/generate-room-hunt-vocab.ts` and its output `src/lib/games/room-hunt/vocab.json`: the Gemini-generated words for each dialect.
- `src/lib/games/room-hunt/round.ts`: pure round logic (`createRound(room, dialect, n)`, `answer(state, objectId)` returning `correct|wrong|hint`, scoring).
- `src/lib/games/room-hunt/round.test.ts`: Vitest coverage of the round logic, plus a data test that every room has all 4 dialects filled and that ids are unique.
- `src/lib/games/room-hunt/scene.ts`: `RoomScene` class with `mount(canvas)`, `loadRoom(config)`, `onPick(cb)`, `flash(id, 'correct'|'wrong'|'hint')`, `showLabel(id, text)`, `resize()` and `dispose()`. It handles raycasting, drag-to-look, render-on-demand, and disposal of geometries and textures.
- `src/lib/components/games/RoomHunt.svelte`: the game UI (canvas, prompt card, explore/round/results states, loading progress bar while GLBs load).
- `src/routes/learn/game/room-hunt/+page.server.ts` and `+page.svelte`: follow the `word-scramble` route pattern. They use `GameShell` directly instead of `WordGamePage`, because the word pool is static. They wire up `initialDialect`, `createRoundGate('room-hunt', …)`, a room `Picker`, and `freeRoundsStatus`.
- `static/games/room-hunt/models/*.glb` and `LICENSE.txt`.

Modified:
- `src/lib/constants/games.ts`: add a `GAMES` entry (slug `room-hunt`, emoji 🏠, accent and deep colours, intro, howToPlay, faqs, seo). The shot can be added later with `scripts/capture-feature-screenshots.ts`.
- `src/lib/constants/games.test.ts`: only if it lists slugs explicitly.
- `package.json`: add `three` and `@types/three`, plus the `generate:room-hunt` script.

Reused unchanged:
- `GameShell`, `GameResults`, `GameWordList`, `PressButton`
- `createRoundGate` and `freeRoundsStatus` (`src/lib/games/free-rounds.svelte.ts`)
- `awardGameXp` (`src/lib/games/game-xp.ts`), with the existing `game_correct` event, so the XP API doesn't change
- `DIALECT_OPTIONS` and `initialDialect` (`src/lib/games/themes.ts`)

## Build order
1. Write `rooms.ts` with the object lists, then the Gemini script, then run `npm run generate:room-hunt` to produce `vocab.json`. Spot-check the output.
1b. Write `round.ts` and the tests; the data test now checks `vocab.json` against `rooms.ts`. Verify: `npx vitest run src/lib/games/room-hunt` passes.
2. Download the Kenney kits, pick the models, and write the transforms for the kitchen. Get `scene.ts` rendering the kitchen with drag and pick. Verify: `npm run dev`, then the user checks visually.
3. Build `RoomHunt.svelte` with all its states, then the route and the games.ts entry. Run svelte-autofixer on every .svelte file. Verify: `npm run check` adds no new errors.
4. Lay out the bathroom and restaurant.
5. Run `npm run build` and confirm that `three` lands in a lazy chunk only.

## Verification
- `npx vitest run` passes, including the new round and data tests.
- `npm run check` shows no new type errors. Pass `className=""` wherever SaveButton or similar components are used.
- The user checks manually in `npm run dev` at `/learn/game/room-hunt`:
  - drag on desktop and touch on a phone-width viewport
  - fullscreen enters on the first tap and exits with Escape
  - switching dialect changes the prompts
  - after 2 free rounds, signed-out users get the auth modal and signed-in users get the paywall modal
  - XP goes up after correct answers
  - there's no console WebGL error when switching rooms, which means disposal works
