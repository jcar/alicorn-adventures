import Phaser from 'phaser';
import { GameState } from '../systems/GameState';
import { goldCount, nextStardustGoal } from '../systems/UnlockManager';
import { POWERS } from '../content';
import { UNLOCKS, type Unlock } from '../content';
import { iconFor } from '../ui/icons';
import { COLORS, textStyle, titleStyle } from '../ui/style';
import { isMuted, setMuted, sfx } from '../audio/sfx';
import { isVoiceOn, setVoiceOn, speak } from '../audio/voice';
import type { Quest } from './WorldScene';

/** The heads-up display over the world: stardust jar, quest, hints and celebrations. */
export class UIScene extends Phaser.Scene {
  private countText!: Phaser.GameObjects.Text;
  private bar!: Phaser.GameObjects.Rectangle;
  private goalIcon!: Phaser.GameObjects.Image;
  private questBox!: Phaser.GameObjects.Container;
  private banner!: Phaser.GameObjects.Text;
  private hintBox!: Phaser.GameObjects.Container;
  private hintText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private powerIcons: Phaser.GameObjects.Image[] = [];
  private toastQueue: Unlock[] = [];
  private toasting = false;

  constructor() { super('UI'); }

  create() {
    const { width, height } = this.scale;

    // Stardust jar
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.paper, 0.92).lineStyle(4, COLORS.paperEdge).fillRoundedRect(16, 16, 330, 84, 24).strokeRoundedRect(16, 16, 330, 84, 24);
    const star = this.add.image(58, 58, 'stardust').setScale(1.2);
    this.tweens.add({ targets: star, angle: 15, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.countText = this.add.text(92, 30, '0', textStyle(34));
    this.add.rectangle(92, 82, 190, 14, 0xe9e0f7).setOrigin(0, 0.5);
    this.bar = this.add.rectangle(92, 82, 0, 14, 0xffc93c).setOrigin(0, 0.5);
    this.goalIcon = this.add.image(310, 58, 'fx-dot');

    // Golden stars and powers, under the jar.
    const row = this.add.graphics();
    row.fillStyle(COLORS.paper, 0.92).lineStyle(4, COLORS.paperEdge).fillRoundedRect(16, 108, 330, 58, 20).strokeRoundedRect(16, 108, 330, 58, 20);
    this.add.image(46, 137, 'gold-star').setScale(0.7);
    this.goldText = this.add.text(70, 118, '0', textStyle(28));
    this.powerIcons = POWERS.map((pw, i) => this.add.image(160 + i * 50, 137, pw.icon).setDisplaySize(40, 40));

    this.questBox = this.add.container(width - 16, 16);
    this.banner = this.add.text(width / 2, 140, '', titleStyle(64)).setOrigin(0.5).setAlpha(0);

    this.hintText = this.add.text(0, 0, '', textStyle(30, { align: 'center', wordWrap: { width: 900 } })).setOrigin(0.5);
    const hintBg = this.add.graphics();
    this.hintBox = this.add.container(width / 2, height - 70, [hintBg, this.hintText]).setAlpha(0);
    this.hintBox.setData('bg', hintBg);

    this.refreshStardust();
    this.refreshFinds();
    this.showQuest(this.registry.get('quest'));
    const lvl = this.registry.get('levelName');
    if (lvl) this.showBanner(lvl.name);

    GameState.events.on('stardust', this.refreshStardust, this);
    GameState.events.on('unlock', this.queueToast, this);
    GameState.events.on('flag', this.refreshFinds, this);
    GameState.events.on('unlock', this.refreshFinds, this);
    this.registry.events.on('changedata-quest', this.onQuest, this);
    this.registry.events.on('changedata-levelName', this.onLevel, this);
    this.registry.events.on('changedata-hint', this.onHint, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameState.events.off('stardust', this.refreshStardust, this);
      GameState.events.off('unlock', this.queueToast, this);
      GameState.events.off('flag', this.refreshFinds, this);
      GameState.events.off('unlock', this.refreshFinds, this);
      this.registry.events.off('changedata-quest', this.onQuest, this);
      this.registry.events.off('changedata-levelName', this.onLevel, this);
      this.registry.events.off('changedata-hint', this.onHint, this);
    });

    const kb = this.input.keyboard!;
    kb.on('keydown-M', () => { setMuted(!isMuted()); this.showHint(isMuted() ? 'Sound off' : 'Sound on'); });
    kb.on('keydown-V', () => { setVoiceOn(!isVoiceOn()); this.showHint(isVoiceOn() ? 'Voice on' : 'Voice off'); });
  }

  private onQuest(_p: unknown, q: Quest | null) { this.showQuest(q); }
  private onLevel(_p: unknown, v: { name: string }) { this.showBanner(v.name); }
  private onHint(_p: unknown, v: { text: string }) { this.showHint(v.text); }

  private refreshStardust() {
    const d = GameState.data;
    this.countText.setText(String(d.stardust));
    const goal = nextStardustGoal(d);
    if (!goal) {
      this.bar.width = 190;
      this.goalIcon.setTexture('fx-star').setTint(0xffc93c).setScale(1.4);
      return;
    }
    const prev = Math.max(0, ...UNLOCKS.filter((u) => u.stardust !== undefined && u.stardust < goal.stardust!).map((u) => u.stardust!));
    const pct = Phaser.Math.Clamp((d.stardust - prev) / (goal.stardust! - prev), 0, 1);
    this.tweens.add({ targets: this.bar, width: 190 * pct, duration: 200 });
    const icon = iconFor(goal);
    this.goalIcon.setTexture(icon.texture).setTintFill(0x8f86a8).setAlpha(0.8); // a mystery silhouette
    const s = 52 / Math.max(this.goalIcon.frame.width, this.goalIcon.frame.height);
    this.goalIcon.setScale(s);
  }

  private refreshFinds() {
    this.goldText.setText(String(goldCount(GameState.data)));
    POWERS.forEach((pw, i) => {
      const icon = this.powerIcons[i];
      if (GameState.hasPower(pw.id)) icon.clearTint().setAlpha(1);
      else icon.setTintFill(0xd9d2e8).setAlpha(0.6);
    });
  }

  private showQuest(q: Quest | null | undefined) {
    this.questBox.removeAll(true);
    if (!q) return;
    const w = 90 + q.need * 50;
    const g = this.add.graphics();
    g.fillStyle(COLORS.paper, 0.92).lineStyle(4, COLORS.paperEdge).fillRoundedRect(-w, 0, w, 84, 24).strokeRoundedRect(-w, 0, w, 84, 24);
    const icon = this.add.image(-w + 44, 42, q.texture);
    icon.setScale(56 / Math.max(icon.width, icon.height));
    this.questBox.add([g, icon]);
    for (let i = 0; i < q.need; i++) {
      const on = i < q.have;
      this.questBox.add(this.add.circle(-w + 100 + i * 50, 42, 17, on ? 0xffc93c : 0xe9e0f7).setStrokeStyle(3, on ? 0xffb31a : COLORS.paperEdge));
    }
    if (q.have > 0) this.tweens.add({ targets: this.questBox, scale: 1.1, duration: 120, yoyo: true });
  }

  private showBanner(name: string) {
    this.banner.setText(name).setAlpha(0).setScale(0.6);
    this.tweens.killTweensOf(this.banner);
    this.tweens.chain({
      targets: this.banner,
      tweens: [
        { alpha: 1, scale: 1, duration: 450, ease: 'Back.out' },
        { alpha: 0, duration: 600, delay: 1800 },
      ],
    });
  }

  private showHint(text: string) {
    this.hintText.setText(text);
    const g = this.hintBox.getData('bg') as Phaser.GameObjects.Graphics;
    const w = this.hintText.width + 60;
    const h = this.hintText.height + 30;
    g.clear().fillStyle(COLORS.paper, 0.95).lineStyle(5, 0xff7eb9).fillRoundedRect(-w / 2, -h / 2, w, h, 26).strokeRoundedRect(-w / 2, -h / 2, w, h, 26);
    this.tweens.killTweensOf(this.hintBox);
    this.hintBox.setAlpha(0).setY(this.scale.height - 40);
    this.tweens.chain({
      targets: this.hintBox,
      tweens: [
        { alpha: 1, y: this.scale.height - 70, duration: 300, ease: 'Back.out' },
        { alpha: 0, duration: 400, delay: 4500 },
      ],
    });
  }

  private queueToast(u: Unlock) {
    this.toastQueue.push(u);
    if (!this.toasting) this.nextToast();
  }

  private nextToast() {
    const u = this.toastQueue.shift();
    if (!u) { this.toasting = false; return; }
    GameState.takeCelebration();
    this.toasting = true;
    const { width } = this.scale;
    sfx.yay();
    speak(this, 'new-unlock');

    const card = this.add.container(width / 2, 250).setScale(0);
    const g = this.add.graphics();
    g.fillStyle(0xfff6d6, 1).lineStyle(8, 0xffc93c).fillRoundedRect(-280, -130, 560, 260, 34).strokeRoundedRect(-280, -130, 560, 260, 34);
    const rays = this.add.image(0, -20, 'fx-star').setScale(9).setTint(0xffe89a).setAlpha(0.5);
    this.tweens.add({ targets: rays, angle: 360, duration: 6000, repeat: -1 });
    const ic = iconFor(u);
    const icon = this.add.image(0, -30, ic.texture);
    icon.setScale(Math.min(3, 130 / Math.max(icon.width, icon.height)));
    if (ic.tint !== undefined) icon.setTint(ic.tint);
    const t1 = this.add.text(0, 62, 'Yay! You got something new!', textStyle(28)).setOrigin(0.5);
    const t2 = this.add.text(0, 100, u.name, titleStyle(32)).setOrigin(0.5);
    card.add([g, rays, icon, t1, t2]);

    this.tweens.chain({
      targets: card,
      tweens: [
        { scale: 1, duration: 500, ease: 'Back.out' },
        { scale: 0, alpha: 0, duration: 350, delay: 2800, ease: 'Back.in' },
      ],
      onComplete: () => { card.destroy(); this.nextToast(); },
    });
  }
}
