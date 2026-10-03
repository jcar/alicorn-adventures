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

**Tablets:** touch buttons appear as soon as someone touches the screen. ◀ ▶ walk, ★ flies (and means OK in menus), ⬇ does things, ▲ moves up in menus, and ✕ opens the book or goes back. Every screen works with them.

**Grown-up Corner:** on the title screen, hold the ⚙ button (or the **G** key) for 2 seconds. It has:
- Choose a player
- Save or load a backup file
- Start a player over, or remove a player (both must be held, so a tap can't do it)
- Sound and read-aloud voice on/off (remembered on this device)

Keyboard shortcuts on the title screen: **M** sound, **V** voice, **B** backup, **L** load, hold **R** to start over.

Up to 4 players can each have their own alicorn and save. Pick one on the title screen with ← →. The B, L and R keys act on the selected player. Saves live only in this browser on this device. A backup file is how you keep a copy or move a player to another device.

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
npm run assets -- --convert      # one-time: turn old PNG/WAV files into WebP/MP3
npm run assets -- --list-models  # which models your key can use
```

- Prompts live in `tools/assets/manifest.json`. They share one style block so the art looks consistent.
- Only `alicorn-pink` is generated. The other manes (`"kind": "recolor"`) are made from it by changing the color of just the mane and tail, so it's always the same pony. To try a new shade, edit its `hue`/`sat`/`val` and run `npm run assets -- --rekey --only alicorn-*`. That's free and instant. If you ever regenerate `alicorn-pink`, run that same command afterwards.
- Sprites are generated on magenta, which is then cut out. The untouched originals are kept in `tools/assets/raw/`.
- **Small and lazy.** Pictures ship as WebP and sound as MP3 (a bundled ffmpeg does the encoding). Only "core" pictures load at start-up, about 0.7 MB. A kingdom's own pictures (`"bundle": "forest"` in the manifest) load when she flies there. Voices and music load the first time they play, and the music box covers the moment while a track loads.
- Voice lines come from `src/data/dialogue.json`. Only the line itself is sent to the voice model, because it reads any instructions aloud; each character's personality comes from its voice in the manifest. Gemini then transcribes every new clip and checks it against the script, retrying up to 3 times. `npm run assets -- --verify` re-checks all clips without generating anything. If a voice file is missing, the browser's built-in speech reads the line instead.
- Only the prompts and dialogue text are sent to Google. Your child's chosen name is never sent.
- **Your own art works too.** Drop a PNG or WebP named after a texture key (e.g. `friend-bunny.png`) into `public/assets/images/`, then run `npm run assets -- --index`. Kids' drawings make great friends.

## Code map

```
src/core/             the engine: scenes, world mechanics, objects, systems, UI, audio, placeholder art, debug kit
src/core/content/     shared content types (types.ts), the kingdom registry, cosmetics, rules (logic.ts), core lines
src/home/             Home (the Glade): its level, lines, and the Heart Crystal's sparks
src/kingdoms/forest/  The Enchanted Forest pack: areas, friends, powers, puzzles, favors, unlocks, dialogue
tools/                Gemini asset pipeline, headless playtests
```

**Adding a kingdom:** make `src/kingdoms/<id>/index.ts` default-export a `KingdomDef` (see `src/core/content/types.ts` and the forest pack). The registry finds it automatically. IDs (areas, friends, lines, puzzles, unlocks) must be unique across the whole game, and `tests/registry.test.ts` checks that. Levels can hold `winds`, `ice`, `darks`, `gates`, `patterns`, `chests`, `notes`, `golds`, `bumpers`, a `spark` and `storyItems`. The tests in `tests/world.test.ts` check that every area can be finished with the powers she has on arrival, and that every puzzle, favor and clue fits together.

```bash
npm test           # save/unlock logic plus data sanity checks (no dead ends)
npm run playtest   # headless-browser playtests against the dev server (start it with npm run dev)
npm run bot        # the playthrough bot: a new player finishes the whole Enchanted Forest (~10 min)
npm run build      # type-check and production build into dist/
```
