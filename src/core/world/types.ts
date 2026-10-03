import type Phaser from 'phaser';
import type { LevelDef, PuzzleSpec } from '../content';
import type { Alicorn } from '../objects/Alicorn';

/** Something you can walk up to and press ↓ (or Enter) at. */
export interface Spot {
  x: number;
  y: number;
  /** "Press ⬇ to ___" */
  verb: string;
  promptY: number;
  reachX?: number;
  reachY?: number;
  enabled?: () => boolean;
  use: () => void;
}

/** Something invisible until Sniff finds it. */
export interface HiddenThing {
  x: number;
  y: number;
  revealed: boolean;
  reveal: () => void;
}

/** What the world scene offers to its helper modules (barriers, secrets, puzzles...). */
export interface World {
  /** The Phaser scene, for adding pictures, tweens and timers. */
  view: Phaser.Scene;
  level: LevelDef;
  player: Alicorn;
  solids: Phaser.Physics.Arcade.StaticGroup;
  addSpot(spot: Spot): Spot;
  addHidden(thing: HiddenThing): void;
  /** In a dark place without Glow: can't see it, so can't use it. */
  isHiddenByDark(x: number, y: number): boolean;
  /** A narrator line at the bottom of the screen, read aloud. */
  hint(lineId: string): void;
  /** Once per visit to this area, or again after `repeatMs` if given. */
  hintOnce(key: string, lineId: string, repeatMs?: number): void;
  /** A speech bubble at a spot, read aloud. */
  say(lineId: string, x: number, y: number, ms?: number): void;
  giveStardust(n: number, x: number, y: number): void;
  confetti(x: number, y: number, count?: number): void;
  openPuzzle(spec: PuzzleSpec, onSolved: () => void): void;
  /** Debug kit: lets alicorn.solve() finish a puzzle at this x. */
  registerSolver?(x: number, solve: () => void, info?: () => Record<string, unknown>): void;
}
