import Phaser from 'phaser';
import { Virtual, type VKey } from './VirtualInput';

/** Which on-screen button stands in for each key. */
const VIRTUAL: Record<string, VKey | undefined> = {
  left: 'left', a: 'left', right: 'right', d: 'right', up: 'up', w: 'up', down: 'down', s: 'down', space: 'space', esc: 'esc',
};

/**
 * Every input in the game goes through here: arrows, Space, Enter, Esc
 * (WASD too, for grown-ups who like them), plus the on-screen touch buttons.
 */
export class Controls {
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private seen = {} as Record<VKey, number>;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP, down: K.DOWN,
      a: K.A, d: K.D, w: K.W, s: K.S,
      space: K.SPACE, enter: K.ENTER, esc: K.ESC,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    this.reset();
  }

  /** Forget presses made while this screen wasn't listening (e.g. while paused). */
  reset() {
    for (const k of ['left', 'right', 'up', 'down', 'space', 'esc'] as VKey[]) this.seen[k] = Virtual.count(k);
  }

  private just(...names: string[]) {
    // Check every key so each one's "just pressed" flag gets cleared this frame.
    const real = names.map((n) => Phaser.Input.Keyboard.JustDown(this.keys[n]));
    const virtual = [...new Set(names.map((n) => VIRTUAL[n]).filter((v): v is VKey => !!v))].map((v) => {
      const fresh = Virtual.count(v) > this.seen[v];
      this.seen[v] = Virtual.count(v);
      return fresh;
    });
    return [...real, ...virtual].some(Boolean);
  }

  get left() { return this.keys.left.isDown || this.keys.a.isDown || Virtual.isDown('left'); }
  get right() { return this.keys.right.isDown || this.keys.d.isDown || Virtual.isDown('right'); }
  get flapHeld() { return this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown || Virtual.isDown('space') || Virtual.isDown('up'); }

  /** Call these once per frame each; they consume the press. */
  flap() { return this.just('space', 'up', 'w'); }
  /** ↓ (or Enter): horn magic, powers, and "go in / open / read / talk". */
  action() { return this.just('down', 's', 'enter'); }
  menuUp() { return this.just('up', 'w'); }
  menuDown() { return this.just('down', 's'); }
  menuLeft() { return this.just('left', 'a'); }
  menuRight() { return this.just('right', 'd'); }
  confirm() { return this.just('space', 'enter'); }
  back() { return this.just('esc'); }
}
