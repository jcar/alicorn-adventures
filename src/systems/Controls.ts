import Phaser from 'phaser';

/**
 * Every input in the game goes through here: arrows, Space, Enter, Esc.
 * WASD work too, for grown-ups who like them.
 */
export class Controls {
  private keys: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP, down: K.DOWN,
      a: K.A, d: K.D, w: K.W, s: K.S,
      space: K.SPACE, enter: K.ENTER, esc: K.ESC,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  private just(...names: string[]) {
    // Check every key so each one's "just pressed" flag gets cleared this frame.
    return names.map((n) => Phaser.Input.Keyboard.JustDown(this.keys[n])).some(Boolean);
  }

  get left() { return this.keys.left.isDown || this.keys.a.isDown; }
  get right() { return this.keys.right.isDown || this.keys.d.isDown; }
  get flapHeld() { return this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown; }

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
