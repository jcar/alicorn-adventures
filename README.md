# Alicorn Adventures

A gentle side-scrolling game for 5–6 year olds. You play a little alicorn exploring an enchanted forest, helping forest friends and collecting stardust. Nobody wins or loses, nothing hurts you, and nothing is timed.

## Play

**Play online:** https://jcar.github.io/alicorn-adventures/ (it redeploys automatically on every push to `main`)

Or run it locally:

```bash
npm install
npm run dev        # open http://localhost:5173
```

| Key | What it does |
| --- | --- |
| ← → | Walk (hold to trot faster) |
| Space or ↑ | Flap wings. Tap again and again to fly as high as you like |
| ↓ or Enter | Do things: go through doors, read notes, open chests, talk, play crystals. Anywhere else it's horn magic, which uses her powers |
| Esc | Adventure Book (stickers, map, clues) |

An on-screen "Press ⬇ to …" prompt appears whenever there's something to do.

Grown-up keys on the title screen: **M** turns sound on/off, **V** turns voice on/off, and holding **R** for 3 seconds starts a fresh game.

## How it plays

Nothing hurts and nothing is timed. If she falls, a smiling cloud floats her back. The challenge comes from exploring and thinking.

**Friends and powers.** Each area has a friend to help. Helping them opens the next area, and the friend moves into the Home Glade and teaches a power:

| Area | Friend | Their request | Power they teach |
| --- | --- | --- | --- |
| Whispering Woods | Bunny | Find 3 carrots | **Sniff**: reveals hidden things (look for twinkles) |
| Mushroom Meadow | Fox | Find 4 berries (one is hidden!) | **Dash**: zoom through strong wind |
| Crystal Waterfall | Owl | Wake them with horn magic | **Glow**: see inside dark caves |
| Rainbow Cloud Kingdom | Baby Dragon | Bloom every flower | **Warm Breath**: melt ice walls |
| Frosty Peaks | ??? | Follow the clues | — |

Each area's main path only needs powers she already has. Every area also hides secrets behind **later** powers, so going back to old places pays off.

**Secrets.** Each door shows `✨ secrets found  ⭐ golden stars found`, plus 💎 once that area's color spark is found. Hidden things include:
- Treasure chests
- Clue notes signed "P"
- Golden stars at the end of bouncy-cloud tunnels
- A color spark in every area

**Puzzles.** These get harder area by area:
- **Number-lock gates:** addition, then "how many more", multiplication, subtraction, and finally counting the snowmen in Frosty Peaks.
- **Pattern crystals:** they chime a tune and she repeats it. The tunes grow from 3 notes to 6.
- **Riddles and favors:** friends in the Glade ask for help. Fox has a berry sum. Fox also wants Owl's lantern, but Owl has a riddle first. Dragon wants a Moon Shell, and Bunny knows where it is if she solves a riddle.

**The mystery.** The Heart Crystal in the Glade has lost its colors. The eight clue notes tell the story of Pip, a tiny star who fell from the sky and is hiding in Frosty Peaks. She solves the mystery by bringing home all five color sparks and finding Pip.

**Unlocks.** Stardust is never spent. It fills a jar, and new manes, trails and hats pop out at goals. Golden stars unlock special trails and the Starlight mane, and solving the mystery unlocks the Star Tiara. Nothing she earns can be lost. Progress saves automatically in the browser (localStorage).

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
npm run assets -- --verify       # listen to every voice clip and flag any that go off-script
npm run assets -- --list-models  # which models your key can use
```

- Prompts live in `tools/assets/manifest.json`. They share one style block so the art looks consistent.
- Only `alicorn-pink` is generated. The other manes (`"kind": "recolor"`) are made from it by changing the color of just the mane and tail, so it's always the same pony. To try a new shade, edit its `hue`/`sat`/`val` and run `npm run assets -- --rekey --only alicorn-*`. That's free and instant. If you ever regenerate `alicorn-pink`, run that same command afterwards.
- Sprites are generated on magenta, which is then cut out. The untouched originals are kept in `tools/assets/raw/`.
- Voice lines come from `src/data/dialogue.json`. Only the line itself is sent to the voice model, because it reads any instructions aloud; each character's personality comes from its voice in the manifest. Gemini then transcribes every new clip and checks it against the script, retrying up to 3 times. `npm run assets -- --verify` re-checks all clips without generating anything. If a voice file is missing, the browser's built-in speech reads the line instead.
- Only the prompts and dialogue text are sent to Google. Your child's chosen name is never sent.
- **Your own art works too.** Drop a PNG named after a texture key (e.g. `friend-bunny.png`) into `public/assets/images/`, then run `npm run assets -- --index`. Kids' drawings make great friends.

## Code map

```
src/data/        levels, friends, powers, puzzles, favors, unlocks, cosmetics, dialogue  ← most changes happen here
src/scenes/      Title, NamePicker, World (every level), UI (HUD), Wardrobe, StickerBook (Adventure Book), Puzzle
src/world/       barriers (wind, ice, gates, bumpers), darkness, secrets, pattern crystals, favors, Heart Crystal
src/objects/     Alicorn (movement/flight/magic), Friend
src/systems/     Controls, SaveManager, UnlockManager, GameState
src/art/         placeholder art drawn in code
src/audio/       synthesized sound effects, generated music box, voice playback
tools/           Gemini asset pipeline
```

To add a new area, add a level in `src/data/levels.ts`, a friend in `friends.ts`, an `area-…` unlock in `unlocks.ts`, and a door in the Glade's `portals`. Levels can also hold `winds`, `ice`, `darks`, `gates`, `patterns`, `chests`, `notes`, `golds`, `bumpers`, a `spark` and `storyItems`. Puzzles live in `puzzles.ts`, favors in `favors.ts`, and powers in `powers.ts`. The tests in `tests/world.test.ts` check that every area can be finished with the powers she has on arrival, and that every puzzle, favor and clue fits together.

```bash
npm test           # save/unlock logic plus data sanity checks (no dead ends)
npm run build      # type-check and production build into dist/
```
