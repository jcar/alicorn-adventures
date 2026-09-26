# Alicorn Adventures

A gentle side-scrolling game for 5–6 year olds. You play a little alicorn exploring an enchanted forest, helping forest friends and collecting stardust. Nobody wins or loses, nothing hurts you, and nothing is timed.

## Play

```bash
npm install
npm run dev        # open http://localhost:5173
```

| Key | What it does |
| --- | --- |
| ← → | Walk (hold to trot faster) |
| Space or ↑ | Flap wings. Tap again and again to fly as high as you like |
| ↓ | Horn magic: makes flowers bloom and wakes sleepy friends. At a door, mirror or tree it goes in |
| Esc | Sticker Book |

Grown-up keys on the title screen: **M** turns sound on/off, **V** turns voice on/off, and holding **R** for 3 seconds starts a fresh game.

## How it plays

- **Home Glade** is the hub. It has doors to each area, the Magic Mirror (dress up) and the Sticker Tree.
- Each area has a friend who needs help:

  | Area | Friend | What they need |
  | --- | --- | --- |
  | Whispering Woods | Bunny | 3 carrots |
  | Mushroom Meadow | Fox | 4 berries |
  | Crystal Waterfall | Owl | Wake them with horn magic |
  | Rainbow Cloud Kingdom | Baby Dragon | Bloom every flower to make a rainbow |

- Helping a friend opens the next area, and that friend moves into your Glade.
- **Stardust is never spent.** It fills a jar, and new manes, trails and hats pop out at goals. Nothing a child earns can be lost.
- Falling off a ledge? A smiling cloud floats you back.
- Progress saves automatically in the browser (localStorage).

## Art, voice and music (Gemini)

Everything is drawn in code first, so the game always works. Generated assets replace the placeholders one at a time as they're made.

```bash
cp .env.example .env             # put your GEMINI_API_KEY in .env (it's git-ignored)
npm run assets -- --dry-run      # see what would be generated
npm run assets                   # generate everything that's missing
npm run assets -- --only friend-fox --force   # redo one thing
npm run assets -- --only alicorn-*            # prefix match
npm run assets -- --kind voice   # images | voice | music
npm run assets -- --rekey        # redo the cut-out from saved originals (no API calls)
npm run assets -- --list-models  # which models your key can use
```

- Prompts live in `tools/assets/manifest.json`. They share one style block so the art looks consistent.
- Only `alicorn-pink` is generated. The other manes (`"kind": "recolor"`) are made from it by changing the color of just the mane and tail, so it's always the same pony. To try a new shade, edit its `hue`/`sat`/`val` and run `npm run assets -- --rekey --only alicorn-*`. That's free and instant. If you ever regenerate `alicorn-pink`, run that same command afterwards.
- Sprites are generated on magenta, which is then cut out. The untouched originals are kept in `tools/assets/raw/`.
- Voice lines come from `src/data/dialogue.json`. If a voice file is missing, the browser's built-in speech reads the line instead.
- Only the prompts and dialogue text are sent to Google. Your child's chosen name is never sent.
- **Your own art works too.** Drop a PNG named after a texture key (e.g. `friend-bunny.png`) into `public/assets/images/`, then run `npm run assets -- --index`. Kids' drawings make great friends.

## Code map

```
src/data/        levels, friends, unlocks, cosmetics, dialogue  ← most changes happen here
src/scenes/      Title, NamePicker, World (every level), UI (HUD), Wardrobe, StickerBook
src/objects/     Alicorn (movement/flight/magic), Friend
src/systems/     Controls, SaveManager, UnlockManager, GameState
src/art/         placeholder art drawn in code
src/audio/       synthesized sound effects, generated music box, voice playback
tools/           Gemini asset pipeline
```

To add a new area, add a level in `src/data/levels.ts`, a friend in `friends.ts`, an `area-…` unlock in `unlocks.ts`, and a door in the Glade's `portals`.

```bash
npm test           # save/unlock logic plus data sanity checks (no dead ends)
npm run build      # type-check and production build into dist/
```
