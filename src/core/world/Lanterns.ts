import Phaser from 'phaser';
import { GROUND_Y, WORLD_HEIGHT, type LanternColor } from '../content';
import { GameState } from '../systems/GameState';
import { sfx } from '../audio/sfx';
import type { World } from './types';

const COLOR: Record<LanternColor, number> = { red: 0xff6b6b, yellow: 0xffd23c, green: 0x6fe36f, blue: 0x5ec8ff, purple: 0xb88bff };

/**
 * Lantern doors: a clue says which lanterns to light ("the red one and the one
 * next to it, but not the blue one"). ↓ at a lantern lights it or puts it out;
 * the door opens when exactly the right ones are lit. Reading plus logic, and
 * nothing is ever wrong for long: change a lantern and try again.
 */
export class Lanterns {
  constructor(private w: World) {}

  build() {
    for (const def of this.w.level.lanternDoors ?? []) this.buildOne(def);
  }

  private buildOne(def: NonNullable<World['level']['lanternDoors']>[number]) {
    const s = this.w.view;
    const L = this.w.level;
    let open = GameState.hasFlag(`opened:${def.id}`);
    const lit = new Set<number>(open ? def.answer : []);

    let art: Phaser.GameObjects.Image | undefined;
    let zone: Phaser.GameObjects.Zone | undefined;
    if (!open) {
      const tex = L.art?.lanternDoor && s.textures.exists(L.art.lanternDoor) ? L.art.lanternDoor : 'gate';
      art = s.add.image(def.x + 36, WORLD_HEIGHT, tex).setOrigin(0.5, 1).setDepth(6);
      art.setDisplaySize(art.width * (WORLD_HEIGHT / art.height), WORLD_HEIGHT);
      if (tex === 'gate') art.setTint(0xc9b8ff);
      zone = s.add.zone(def.x, 0, 72, WORLD_HEIGHT).setOrigin(0);
      s.physics.add.existing(zone, true);
      this.w.solids.add(zone);
    }

    const lanternTex = L.art?.lantern && s.textures.exists(L.art.lantern) ? L.art.lantern : 'item-lantern';
    const imgs = def.lanterns.map((l, i) => {
      const img = s.add.image(l.x, l.y, lanternTex).setDepth(6).setScale(1.3);
      const light = s.add.image(l.x, l.y, 'fx-light').setScale(1.1).setBlendMode(Phaser.BlendModes.ADD).setDepth(5).setTint(COLOR[l.color]);
      // Unlit lanterns keep their color (dimmer), so "the red one" is always easy to find.
      const show = () => {
        const on = lit.has(i);
        img.setTint(COLOR[l.color]).setAlpha(on ? 1 : 0.6);
        light.setAlpha(on ? 0.75 : 0);
      };
      show();
      return { img, show };
    });

    const check = () => {
      if (open) return;
      const right = lit.size === def.answer.length && def.answer.every((i) => lit.has(i));
      if (right) return openDoor();
      if (lit.size >= def.answer.length) this.w.hintOnce(`lantern-${def.id}`, 'lantern-not-yet', 8000);
    };

    const openDoor = () => {
      if (open) return;
      open = true;
      GameState.setFlag(`opened:${def.id}`);
      if (zone) (zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      s.time.delayedCall(300, () => {
        sfx.yay();
        this.w.hint('lantern-right');
        this.w.confetti(def.x, GROUND_Y - 250, 60);
        if (art) s.tweens.add({ targets: art, y: art.y - WORLD_HEIGHT, duration: 1600, ease: 'Sine.in', onComplete: () => art!.destroy() });
      });
    };

    this.w.registerSolver?.(def.x, () => {
      lit.clear();
      def.answer.forEach((i) => lit.add(i));
      imgs.forEach((l) => l.show());
      openDoor();
    }, () => ({ id: def.id, lit: [...lit], answer: def.answer, open }));

    // The clue, at a little sign by the door (and once on the way past).
    const signX = def.x - 90;
    s.add.image(signX, GROUND_Y + 4, s.textures.exists('clue-sign') ? 'clue-sign' : 'note').setOrigin(0.5, 1).setDepth(5);
    this.w.addSpot({
      x: signX, y: GROUND_Y, verb: 'to hear the clue', promptY: GROUND_Y - 170,
      enabled: () => !open,
      use: () => this.w.hint(def.clue),
    });

    def.lanterns.forEach((l, i) =>
      this.w.addSpot({
        x: l.x, y: l.y, promptY: l.y - 70, reachX: 50, reachY: 170,
        get verb() { return lit.has(i) ? 'to blow it out' : 'to light it'; },
        enabled: () => !open,
        use: () => {
          if (lit.has(i)) lit.delete(i);
          else lit.add(i);
          sfx.chime();
          imgs[i].show();
          s.tweens.add({ targets: imgs[i].img, scale: 1.5, duration: 120, yoyo: true });
          check();
        },
      }),
    );

    // Say the clue the first time she comes near.
    this.nearChecks.push(() => {
      const x = this.w.player.x;
      if (!open && x > def.lanterns[0].x - 200 && x < def.x) this.w.hintOnce(`clue-${def.id}`, def.clue);
    });
  }

  private nearChecks: (() => void)[] = [];

  update() {
    for (const c of this.nearChecks) c();
  }
}
