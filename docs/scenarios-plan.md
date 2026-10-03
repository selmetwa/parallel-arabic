# Scenarios: spoken conversations in 3D

## What
`/learn/game/scenarios`: short conversations in a 3D place, in all four game dialects.

| Scene | Other person | Teaches |
| --- | --- | --- |
| Order a meal (restaurant) | Waiter | Ordering, dessert, the bill |
| Take a taxi | Driver | Destination, haggling the fare, directions, paying |
| Shop at the market | Seller | Asking for produce, kilos, haggling |
| At the pharmacy | Pharmacist | Symptoms, "since when", dosage |
| Check in at a hotel | Receptionist | Reservation, name, nights, passport, breakfast, wifi |

The restaurant scene is also reachable from Room Hunt's restaurant room.

## How it's built
- **Data, not code.** Each scene is `src/lib/games/room-hunt/scenarios/<id>.ts`, which holds:
  - the English source lines, each marked as said by the other person (`npc`), by the player (`you`), or as the name of a handed-over item (`item`)
  - the turns, where each choice is right or wrong for the moment and can also:
    - `give` something
    - get a `reply`
    - `fetch` (hand things over), or `drive` (ride a route)
  - its `Stage`: the setting room, the player's pose, where the other person stands and fetches from, where handed-over props appear, extras, and vehicle routes
- **The engine.** `scenario.ts` is pure logic (shared with tests). `ScenarioPlayer.svelte` turns a turn's outcome into motion: a walk, a pick-up, props popping in, or the camera following the taxi.
- **Arabic.** `<id>.json` holds `{ line: { dialect: { arabic, transliteration } } }`.
  - The four new scenes were written by hand, in the same shape and with the same rules as the Gemini script: full tashkeel, the 3/7/2 transliteration style, and everyday dialect.
  - `npm run generate:room-hunt-scenario -- --scenario=<id>` can still draft missing lines for a new scene.
- **Voices.** `npm run generate:room-hunt-audio` records every line. The other person uses a second voice of the gender in `npcGender`:
  - Egyptian: Haytham (m), Hoda (f)
  - Levantine: Sara (f)
  - Darija: Jawad (m)
  - Fusha: Adam (m)
  - Levantine has no male voice, so every Levantine scene has a woman as the other person.
- **Models.** Kenney CC0 kits: furniture, food, mini characters, car, city roads, city commercial. Licences are in `static/games/room-hunt/LICENSE.txt`.
- **Free rounds.** Scenes share one gate, `scenarios`: two free conversations, like other games.

## Needs review
- A native-speaker pass over `scenarios/*.json`, especially Darija (vowel-less transliterations, word choice such as لْيْمُون for oranges and الفانيد for pills).
- In Egyptian and Levantine, the wrong-answer lines shared between scenes address the other person as male or female inconsistently. They're wrong answers anyway, but worth tidying.

## Adding a scene
1. Write `<id>.ts` (lines, turns, stage) and `<id>.json` (all four dialects), and add it to `scenarios/index.ts`.
2. Run `npm run generate:room-hunt-audio`.
3. Run `npx vitest run src/lib/games/room-hunt`. The tests check that every line has text and a recording in each dialect, that speakers are right, that everything asked for has a prop and gets handed over, and that drives exist.
