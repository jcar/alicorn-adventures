/**
 * On-screen buttons act like a little keyboard. Controls reads these exactly
 * like real keys, so every screen works by touch without its own touch code.
 */
export type VKey = 'left' | 'right' | 'up' | 'down' | 'space' | 'esc';

const held: Record<VKey, boolean> = { left: false, right: false, up: false, down: false, space: false, esc: false };
const presses: Record<VKey, number> = { left: 0, right: 0, up: 0, down: 0, space: 0, esc: 0 };

export const Virtual = {
  press(k: VKey) {
    if (!held[k]) presses[k]++;
    held[k] = true;
  },
  release(k: VKey) {
    held[k] = false;
  },
  releaseAll() {
    for (const k of Object.keys(held) as VKey[]) held[k] = false;
  },
  isDown: (k: VKey) => held[k],
  /** How many times it's been pressed, ever. Each Controls remembers how many it has seen. */
  count: (k: VKey) => presses[k],
};
