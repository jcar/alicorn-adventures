import Phaser from 'phaser';
import { FAVORS, type FavorDef, type FavorStep } from '../content';
import { GROUND_Y } from '../content';
import { GameState } from '../systems/GameState';
import { titleStyle } from '../ui/style';
import { sfx } from '../audio/sfx';
import type { Friend } from '../objects/Friend';
import type { World } from './types';

/** The favor step a friend is waiting to talk about, if any. */
export function activeFavorFor(npc: string): { favor: FavorDef; step: FavorStep } | undefined {
  for (const favor of FAVORS) {
    if (!favor.needs.every((f) => GameState.hasHelped(f))) continue;
    const i = GameState.favorStep(favor.id);
    const step = favor.steps[i];
    if (step?.npc === npc) return { favor, step };
  }
  return undefined;
}

/** Errands between the friends who live in the Home Glade. */
export class Favors {
  private markers = new Map<string, Phaser.GameObjects.Text>();

  constructor(private w: World, private friends: Friend[]) {}

  build() {
    const s = this.w.view;
    for (const f of this.friends) {
      const mark = s.add.text(f.x, f.y - f.displayHeight - 30, '!', titleStyle(44, { stroke: '#ff7eb9' })).setOrigin(0.5).setDepth(12);
      s.tweens.add({ targets: mark, y: mark.y - 12, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.markers.set(f.def.id, mark);
      this.w.addSpot({
        x: f.x, y: GROUND_Y, verb: `to talk to ${f.def.name}`, promptY: f.y - f.displayHeight - 80, reachX: 90,
        enabled: () => !!activeFavorFor(f.def.id),
        use: () => this.talk(f),
      });
    }
    this.refresh();
    if (this.friends.some((f) => activeFavorFor(f.def.id)))
      s.time.delayedCall(2500, () => {
        // Don't talk over something more important that was just said.
        const last = s.registry.get('hint') as { at: number } | undefined;
        if (!last || s.time.now - last.at > 4000) this.w.hintOnce('favor', 'friend-has-favor');
      });
  }

  /** Friends with something to say wear a bouncing "!". */
  hasFavor(id: string) { return !!activeFavorFor(id); }

  private refresh() {
    for (const [id, mark] of this.markers) mark.setVisible(!!activeFavorFor(id));
  }

  private say(f: Friend, line: string) {
    this.w.say(line, f.x, f.y - f.displayHeight - 12, 6000);
  }

  private talk(f: Friend) {
    const a = activeFavorFor(f.def.id);
    if (!a) return;
    const { favor, step } = a;
    const s = this.w.view;
    switch (step.kind) {
      case 'talk':
        this.say(f, step.line);
        this.advance(favor, f);
        break;
      case 'puzzle':
        this.say(f, step.line);
        s.time.delayedCall(2600, () =>
          this.w.openPuzzle(step, () => {
            if (step.gives) GameState.setFlag(`has:${step.gives}`);
            s.time.delayedCall(300, () => this.say(f, step.done));
            this.advance(favor, f);
          }),
        );
        break;
      case 'bring':
        if (GameState.hasFlag(`has:${step.item}`)) {
          GameState.clearFlag(`has:${step.item}`);
          GameState.setFlag(`gave:${step.item}`);
          this.say(f, step.done);
          this.advance(favor, f);
        } else {
          this.say(f, step.wait);
        }
        break;
    }
  }

  private advance(favor: FavorDef, f: Friend) {
    GameState.advanceFavor(favor.id);
    if (GameState.favorStep(favor.id) >= favor.steps.length) {
      sfx.yay();
      f.celebrate();
      this.w.confetti(f.x, f.y - 100, 60);
      this.w.giveStardust(favor.stardust, f.x, f.y - 160);
      GameState.setFlag(`favor:${favor.id}`);
    }
    this.refresh();
  }
}
