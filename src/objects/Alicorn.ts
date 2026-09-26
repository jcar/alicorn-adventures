import Phaser from 'phaser';
import { findAccessory, findTrail } from '../data/cosmetics';
import { GameState } from '../systems/GameState';
import type { Controls } from '../systems/Controls';
import { sfx } from '../audio/sfx';

const WALK = 230;
const TROT = 360;
const TROT_AFTER_MS = 700;
const FLAP_VELOCITY = -430;
const MAX_FALL = 280; // wings make every fall a gentle float
const MAGIC_COOLDOWN = 450;

/**
 * The hero. One sprite carries the physics body. The accessory, trail and
 * magic effects follow it. Motion comes from tweens (squash, tilt, bob) so a
 * single generated pose still looks lively.
 */
export class Alicorn extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  facing: 1 | -1 = 1;
  private holdMs = 0;
  private lastMagic = 0;
  private accessory?: Phaser.GameObjects.Image;
  private trail?: Phaser.GameObjects.Particles.ParticleEmitter;
  private feathers: Phaser.GameObjects.Particles.ParticleEmitter;
  private magicFx: Phaser.GameObjects.Particles.ParticleEmitter;
  /** Last place we stood on solid ground, for the cloud to bring us back to. */
  safeSpot = new Phaser.Math.Vector2();
  frozen = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, `alicorn-${GameState.data.equipped.mane}`);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(10);
    this.body.setSize(90, 90).setOffset(35, 36);
    this.body.setMaxVelocityY(MAX_FALL * 3);
    this.body.setCollideWorldBounds(true);
    this.body.onWorldBounds = true;
    this.safeSpot.set(x, y);

    this.feathers = scene.add.particles(0, 0, 'fx-feather', {
      speed: { min: 40, max: 120 }, angle: { min: 60, max: 120 }, lifespan: 700,
      alpha: { start: 1, end: 0 }, rotate: { min: 0, max: 360 }, gravityY: 60, emitting: false,
    }).setDepth(9);
    this.magicFx = scene.add.particles(0, 0, 'fx-star', {
      speed: { min: 120, max: 320 }, lifespan: 700, scale: { start: 1, end: 0 },
      tint: [0xfff6a0, 0xff7eb9, 0x7ed6ff, 0xffffff], emitting: false,
    }).setDepth(11);

    this.applyLook();
    GameState.events.on('equip', this.applyLook, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      GameState.events.off('equip', this.applyLook, this);
      this.trail?.destroy();
      this.accessory?.destroy();
    });
  }

  applyLook() {
    const eq = GameState.data.equipped;
    this.setTexture(`alicorn-${eq.mane}`);

    this.accessory?.destroy();
    this.accessory = undefined;
    const acc = findAccessory(eq.accessory);
    if (acc.texture) this.accessory = this.scene.add.image(this.x, this.y, acc.texture).setDepth(11);

    this.trail?.destroy();
    this.trail = undefined;
    const tr = findTrail(eq.trail);
    if (tr.id !== 'none') {
      this.trail = this.scene.add.particles(0, 0, tr.texture, {
        follow: this, followOffset: { x: 0, y: 10 }, frequency: 60, lifespan: 900,
        speed: { min: 5, max: 30 }, scale: { start: 0.9, end: 0.1 }, alpha: { start: 0.9, end: 0 },
        tint: tr.tints, gravityY: -20, emitting: false,
      }).setDepth(9);
    }
  }

  /** Returns true on the frame horn magic is cast. */
  control(c: Controls, dt: number, magicPressed: boolean): boolean {
    if (this.frozen) {
      c.flap(); // swallow presses
      this.syncAttachments();
      return false;
    }
    const b = this.body;
    const onGround = b.blocked.down || b.touching.down;
    if (onGround) this.safeSpot.set(this.x, this.y - 10);

    const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (dir !== 0) {
      this.holdMs += dt;
      this.facing = dir as 1 | -1;
      const speed = this.holdMs > TROT_AFTER_MS ? TROT : WALK;
      b.setVelocityX(Phaser.Math.Linear(b.velocity.x, dir * speed, 0.2));
    } else {
      this.holdMs = 0;
      b.setVelocityX(b.velocity.x * 0.8);
    }
    this.setFlipX(this.facing < 0);

    if (c.flap()) this.flap();

    // Floaty fall. Holding flap floats down even slower.
    const maxFall = c.flapHeld ? MAX_FALL * 0.5 : MAX_FALL;
    if (b.velocity.y > maxFall) b.setVelocityY(maxFall);

    // Tilt into flight and trot bob, for life without extra frames.
    const targetAngle = onGround ? 0 : Phaser.Math.Clamp(b.velocity.y / 30, -10, 10) * this.facing;
    this.angle = Phaser.Math.Linear(this.angle, targetAngle, 0.15);

    this.trail && (this.trail.emitting = Math.abs(b.velocity.x) > 40 || !onGround);

    let cast = false;
    if (magicPressed && this.scene.time.now - this.lastMagic > MAGIC_COOLDOWN) {
      this.lastMagic = this.scene.time.now;
      this.castMagic();
      cast = true;
    }
    this.syncAttachments();
    return cast;
  }

  flap() {
    this.body.setVelocityY(FLAP_VELOCITY);
    sfx.flap();
    this.feathers.explode(3, this.x - 10 * this.facing, this.y - 10);
    this.scene.tweens.add({ targets: this, scaleY: 0.85, scaleX: 1.1, duration: 90, yoyo: true, ease: 'Sine.out' });
  }

  bounce(power = -820) {
    this.body.setVelocityY(power);
    sfx.bounce();
    this.scene.tweens.add({ targets: this, scaleY: 1.2, scaleX: 0.85, duration: 140, yoyo: true });
  }

  hornTip() {
    return new Phaser.Math.Vector2(this.x + 52 * this.facing, this.y - 60);
  }

  castMagic() {
    const tip = this.hornTip();
    sfx.magic();
    this.magicFx.explode(24, tip.x, tip.y);
    const ring = this.scene.add.circle(tip.x, tip.y, 20, 0xfff6a0, 0.35).setDepth(11);
    this.scene.tweens.add({ targets: ring, radius: 170, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
  }

  syncAttachments() {
    if (!this.accessory) return;
    const acc = findAccessory(GameState.data.equipped.accessory);
    const rot = Phaser.Math.DegToRad(this.angle);
    const ox = acc.offsetX * this.facing;
    const oy = acc.offsetY;
    this.accessory.setPosition(
      this.x + ox * Math.cos(rot) - oy * Math.sin(rot),
      this.y + ox * Math.sin(rot) + oy * Math.cos(rot),
    );
    this.accessory.setAngle(this.angle).setFlipX(this.facing < 0).setScale(this.scaleX, this.scaleY);
    this.accessory.setVisible(this.visible);
  }
}
