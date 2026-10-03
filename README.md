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

It's a desktop game: play it on a computer with a keyboard.

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

**The Coral Kingdom** opens on the Sky Map once the forest mystery is solved. Pip explains that the Guardian Stars are Pip's family, and that big sister Luma fell into the sea and broke into four shards. Its hub is **Coral Cove**, a beach village with Luma's altar. The four areas are underwater, so she **swims**: Space swims up, she drifts down slowly, ← → glide, and ↓ still does things.

| Area | Friend | Their request | Power they teach |
| --- | --- | --- | --- |
| Sunny Shallows | Marina the sea pony | Find 4 pearls (one hidden) | **Bubble Jet**: zoom through strong water currents |
| Kelp Forest | Otto the otter | Make the sea anemones bloom (one in the dark) | — |
| Sunken Ship | Captain Crab | Find his key in the dark cabin, behind a lock | — |
| Moonlit Trench | Grandma Tide the whale | Wake her (currents on the way need Bubble Jet) | **Shell Song**: sings sea-glass walls open |

Sea-glass walls in every Coral area hide treasure, golden stars and Luma's shards, so Shell Song sends her back through the sea. Bring all four shards to the altar to restore Luma. That unlocks the Sea Shell Crown and the Ocean mane. Marina and Otto have favors at Home too.

Each area's main path only needs powers she already has. Every area also hides secrets behind **later** powers, so going back to old places pays off.

**Secrets.** Each door shows `✨ secrets found  ⭐ golden stars found`, plus 💎 once that area's color spark is found. Hidden things include:
- Treasure chests
- Clue notes signed "P"
- Golden stars at the end of bouncy-cloud tunnels
- A color spark in every area

**Puzzles that adapt to her.** Each player has a level in four skills:

| Skill | Levels | From → to |
| --- | --- | --- |
| Math | 1–8 | "2 + 1" → subtraction → "how many more?" → groups → two-step problems → halves and doubles |
| Reading | 1–6 | "which one is a color?" → rhymes → one-sentence details → inference → riddles → short stories |
| Logic | 1–6 | simple patterns → number sequences → odd-one-out → skip counting → if-then → who is tallest/shortest |
| Memory | 1–6 | crystal tunes from 3 notes up to 8 |

- Gates and favors ask questions from the banks at her level. A spot can be a little easier or harder (`offset`). Whispering Woods is math, Mushroom Meadow reading, Crystal Waterfall logic, and Rainbow Cloud Kingdom harder math. The crystals' tune length follows her memory level.
- **Adapting:** two first-try wins move a skill up a level, and a puzzle that took several tries moves it down. Wrong answers just say "try again", and after two misses on a sum, stars appear to count.
- **Grown-up dial:** Grown-up Corner → *Puzzle levels* shows and sets each skill's level per player. The game keeps adjusting from there.
- Story puzzles stay hand-written: Owl's and Bunny's riddles, and counting the snowmen in Frosty Peaks.
- **Favors:** friends in the Glade ask for help. Fox has a berry sum. Fox also wants Owl's lantern, but Owl has a riddle first. Dragon wants a Moon Shell, and Bunny knows where it is if she solves a riddle.
- The banks (200 questions, all voiced) are built by `node tools/make-puzzle-banks.mjs`. Edit that file to add questions, then run `npm run assets` to record them.

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

- Prompts live in `tools/assets/manifest.json`. They share one style block, **and every new picture should list `styleRefs`**: two or three existing pictures whose style the model must match (line weight, colors, watercolor shading) without copying their subjects. The style text alone isn't enough, and the model drifts without them. `ref` is different: it means "this is the same character", as with the alicorn manes.
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

**Adding a kingdom:** copy the shape of `src/kingdoms/coral/` (the best example). Make `src/kingdoms/<id>/index.ts` default-export a `KingdomDef` (see `src/core/content/types.ts` and the forest pack). The registry finds it automatically. IDs (areas, friends, lines, puzzles, unlocks) must be unique across the whole game, and `tests/registry.test.ts` checks that. Levels can hold `winds` (wind or water `current`, each needing a power), `ice`, `walls` (any power opens them, like sea-glass and Shell Song), `darks`, `gates`, `patterns`, `chests`, `notes`, `golds`, `bumpers`, a `spark` and `storyItems`. `mode: 'swim'` makes an area underwater, and `art` swaps the shared flower, crystal, bumper or catch-you-cloud pictures for the area's own. A kingdom's `saga` gives its hub a Guardian Star altar (one shard per area). The tests in `tests/world.test.ts` check that every area can be finished with the powers she has on arrival, and that every puzzle, favor and clue fits together.

```bash
npm test           # save/unlock logic plus data sanity checks (no dead ends)
npm run playtest   # headless-browser playtests against the dev server (start it with npm run dev)
npm run bot        # the playthrough bot: a new player finishes every kingdom (~15 min)
npm run build      # type-check and production build into dist/
```
