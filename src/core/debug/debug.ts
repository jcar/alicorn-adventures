import Phaser from 'phaser';
import { AREA_ORDER, FAVORS, FRIENDS, LEVELS, SPARK_AREAS, goldIds, secretIds } from '../content';
import { activeFavorFor } from '../world/Favors';
import { GameState } from '../systems/GameState';
import { migrate } from '../systems/SaveManager';
import { stopVoice } from '../audio/voice';
import { PRESETS } from './presets';
import { markersFor } from './markers';
import type { WorldScene } from '../scenes/WorldScene';
import type { PuzzleScene } from '../scenes/PuzzleScene';

/**
 * window.alicorn: a toolbox for testing. On in dev builds, or on the live
 * site with ?debug in the URL. A child never sees any of it.
 *
 *   alicorn.preset('all-powers')         load a ready-made save
 *   alicorn.go('woods', 'woods-chest-cave')   jump to a level (and a named spot)
 *   alicorn.teleport(4100)               move the hero
 *   alicorn.solve()                      solve the open puzzle, or a nearby pattern
 *   alicorn.overlay()                    show barriers, zones and secret spots
 *   alicorn.state()  alicorn.markers()   look around
 */
export function debugEnabled() {
  try {
    return import.meta.env.DEV || new URLSearchParams(location.search).has('debug');
  } catch {
    return false;
  }
}

export function installDebug(game: Phaser.Game) {
  if (!debugEnabled()) return;
  const world = () => game.scene.getScene('World') as WorldScene;
  const running = (key: string) => game.scene.isActive(key) || game.scene.isPaused(key);

  const api = {
    game,
    presets: Object.keys(PRESETS),

    /** Load a preset save and go Home. */
    preset(name: keyof typeof PRESETS | string) {
      const make = PRESETS[name];
      if (!make) throw new Error(`Unknown preset. Try: ${Object.keys(PRESETS).join(', ')}`);
      GameState.restore(migrate(make()));
      api.go('glade');
      return api.state();
    },

    /** Jump to a level; optionally to a named marker or an x position. */
    go(levelId: string, where?: string | number) {
      if (!LEVELS[levelId]) throw new Error(`Unknown level. Try: ${Object.keys(LEVELS).join(', ')}`);
      for (const k of ['Title', 'NamePicker', 'Wardrobe', 'StickerBook', 'Puzzle']) if (running(k)) game.scene.stop(k);
      const w = world();
      w.events.once(Phaser.Scenes.Events.CREATE, () => {
        if (where !== undefined) setTimeout(() => api.teleport(where), 50);
      });
      if (running('World')) {
        game.scene.resume('World');
        w.scene.restart({ levelId });
      } else game.scene.start('World', { levelId });
      return `going to ${levelId}${where !== undefined ? ` @ ${where}` : ''}`;
    },

    /** Open the Sky Map. */
    sky(from = 'glade') {
      for (const k of ['Title', 'NamePicker', 'Wardrobe', 'StickerBook', 'Puzzle', 'World']) if (running(k)) game.scene.stop(k);
      game.scene.start('SkyMap', { from });
      return 'flying to the Sky Map';
    },

    /** Move the hero to an x (and y), or to a named marker in the current level. */
    teleport(where: string | number, y?: number) {
      const w = world();
      let pos: { x: number; y: number };
      if (typeof where === 'number') pos = { x: where, y: y ?? 540 };
      else {
        const m = markersFor(w.level)[where];
        if (!m) throw new Error(`No marker "${where}" here. Try: ${Object.keys(markersFor(w.level)).join(', ')}`);
        pos = m;
      }
      w.player.body.reset(pos.x, pos.y);
      return pos;
    },

    markers(levelId?: string) {
      return markersFor(LEVELS[levelId ?? world().level.id]);
    },

    /** Solve the open number lock or riddle, or the pattern crystals you're standing by. */
    solve() {
      if (game.scene.isActive('Puzzle')) return (game.scene.getScene('Puzzle') as PuzzleScene).debugSolve();
      return world().debugSolvePattern();
    },

    overlay(on?: boolean) {
      return world().debugOverlay(on);
    },

    skipTalk() {
      stopVoice();
      game.registry.set('hint', { text: '', at: 0 });
    },

    /** Help a friend (and learn their power) without playing their quest. */
    help(friendId: string) {
      GameState.helpFriend(friendId);
      return GameState.data.friendsHelped;
    },

    flag(...flags: string[]) {
      flags.forEach((f) => GameState.setFlag(f));
      return GameState.data.flags.length;
    },

    /** Every area, in story order. */
    areas() {
      return AREA_ORDER;
    },

    /** Friends at Home waiting to talk about a favor, and where they stand. */
    favorsTodo() {
      return FRIENDS.filter((f) => GameState.hasHelped(f.id) && activeFavorFor(f.id)).map((f) => ({ id: f.id, x: f.gladeX }));
    },

    /** How much of everything has been found. */
    progress() {
      const d = GameState.data;
      const count = (ids: string[], prefix: string) => `${ids.filter((id) => d.flags.includes(`${prefix}${id}`)).length}/${ids.length}`;
      const areas = AREA_ORDER.map((a) => LEVELS[a]);
      return {
        friends: `${d.friendsHelped.length}/${FRIENDS.length}`,
        secrets: count(areas.flatMap(secretIds), 'secret:'),
        golds: count(areas.flatMap(goldIds), 'gold:'),
        sparks: count(SPARK_AREAS, 'spark:'),
        favors: count(FAVORS.map((f) => f.id), 'favor:'),
        mystery: d.flags.includes('mystery:solved'),
      };
    },

    state() {
      const w = running('World') ? world() : undefined;
      const d = GameState.data;
      return {
        scenes: game.scene.getScenes(true).map((s) => s.scene.key),
        level: w?.level.id,
        hero: w?.player && { x: Math.round(w.player.x), y: Math.round(w.player.y) },
        name: d.name, stardust: d.stardust, friends: d.friendsHelped, flags: d.flags.length, favors: d.favors,
      };
    },
  };

  const win = window as unknown as Record<string, unknown>;
  win.game = game;
  win.alicorn = api;
  console.info('🦄 Debug kit ready: try alicorn.state(), alicorn.preset("all-powers"), alicorn.go("woods", "friend")');
}
