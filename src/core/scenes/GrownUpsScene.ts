import Phaser from 'phaser';
import { Controls } from '../systems/Controls';
import { GameState } from '../systems/GameState';
import { downloadBackup, pickBackupFile } from '../systems/Backup';
import { toggleSound, toggleVoice } from '../systems/Settings';
import { isMuted } from '../audio/sfx';
import { isVoiceOn } from '../audio/voice';
import { COLORS, textStyle, titleStyle } from '../ui/style';
import { sfx } from '../audio/sfx';

interface Row {
  label: () => string;
  /** Hold-to-confirm actions can't be done by an accidental tap. */
  hold?: boolean;
  run: () => void;
  box?: Phaser.GameObjects.Rectangle;
  text?: Phaser.GameObjects.Text;
  fill?: Phaser.GameObjects.Rectangle;
}

const HOLD_MS = 2000;

/**
 * The Grown-up Corner: players, backups, sound and voice. Works with the
 * keyboard (↑↓ choose, ← → change player, SPACE press) or by tapping.
 * Anything that removes progress must be held for 2 seconds.
 */
export class GrownUpsScene extends Phaser.Scene {
  private controls!: Controls;
  private rows: Row[] = [];
  private sel = 0;
  private player = 0;
  private holdMs = 0;
  private pointerHold?: Row;
  private note!: Phaser.GameObjects.Text;

  constructor() { super('GrownUps'); }

  create() {
    const { width, height } = this.scale;
    this.controls = new Controls(this);
    this.rows = [];
    this.sel = 0;
    const active = GameState.activeProfile();
    this.player = Math.max(0, GameState.profiles().findIndex((p) => p.id === active?.id));

    this.add.rectangle(0, 0, width, height, 0x2b1f4a, 0.85).setOrigin(0);
    const g = this.add.graphics();
    g.fillStyle(COLORS.paper).lineStyle(8, 0x8f86a8).fillRoundedRect(140, 30, width - 280, height - 60, 36).strokeRoundedRect(140, 30, width - 280, height - 60, 36);
    this.add.text(width / 2, 80, 'Grown-up Corner', titleStyle(44)).setOrigin(0.5);

    const name = () => this.profile()?.save.name || 'this player';
    const rows: Row[] = [
      { label: () => (this.profile() ? `◀  Player: ${name()}  ▶` : 'No players yet'), run: () => this.changePlayer(1) },
      { label: () => `Save a backup of ${name()}`, run: () => this.backup() },
      { label: () => `Load a backup into ${this.profile() ? name() : 'a new player'}`, run: () => this.restore() },
      { label: () => `Start ${name()} over  (hold)`, hold: true, run: () => this.startOver() },
      { label: () => `Remove ${name()}  (hold)`, hold: true, run: () => this.remove() },
      { label: () => `Sound: ${isMuted() ? 'Off' : 'On'}`, run: () => { toggleSound(); sfx.select(); } },
      { label: () => `Read-aloud voice: ${isVoiceOn() ? 'On' : 'Off'}`, run: () => toggleVoice() },
      { label: () => 'Done', run: () => this.close() },
    ];
    rows.forEach((r, i) => {
      const y = 150 + i * 62;
      r.box = this.add.rectangle(width / 2, y, 760, 52, 0xffffff).setStrokeStyle(4, COLORS.paperEdge);
      r.fill = this.add.rectangle(width / 2 - 380, y, 0, 52, 0xffb3b3, 0.7).setOrigin(0, 0.5);
      r.text = this.add.text(width / 2, y, '', textStyle(26)).setOrigin(0.5);
      r.box.setInteractive({ useHandCursor: true })
        .on('pointerdown', (p: Phaser.Input.Pointer) => {
          this.sel = i;
          if (i === 0 && this.profile()) {
            // Tap the left or right end of the player row to switch players.
            this.changePlayer(p.x < width / 2 ? -1 : 1);
          } else if (r.hold) {
            this.pointerHold = r;
            this.holdMs = 0;
          } else r.run();
          this.refresh();
        })
        .on('pointerup', () => this.cancelHold())
        .on('pointerout', () => this.cancelHold());
      this.rows.push(r);
    });
    this.note = this.add.text(width / 2, height - 70, 'Saves stay in this browser on this device. A backup file keeps a copy, or moves a player to another device.',
      textStyle(18, { color: '#8f86a8', align: 'center', wordWrap: { width: 880 } })).setOrigin(0.5);
    this.refresh();
  }

  private profile() { return GameState.profiles()[this.player]; }

  private changePlayer(d: number) {
    const n = GameState.profiles().length;
    if (!n) return;
    this.player = Phaser.Math.Wrap(this.player + d, 0, n);
    sfx.select();
  }

  private say(msg: string) {
    this.note.setText(msg).setColor('#2f9b5a');
  }

  private backup() {
    const p = this.profile();
    if (!p) return this.say('There are no players to back up yet.');
    downloadBackup(p.save);
    this.say(`Backup of ${p.save.name || 'this player'} saved to your downloads.`);
  }

  private restore() {
    const p = this.profile();
    if (p) GameState.selectProfile(p.id);
    pickBackupFile()
      .then((save) => {
        if (!save) return;
        GameState.restore(save);
        this.player = Math.max(0, GameState.profiles().findIndex((x) => x.id === GameState.activeProfile()?.id));
        this.say(`Loaded the backup of ${save.name || 'that player'}.`);
        this.refresh();
      })
      .catch(() => this.say("That file isn't an Alicorn Adventures backup."));
  }

  private startOver() {
    const p = this.profile();
    if (!p) return;
    GameState.selectProfile(p.id);
    GameState.resetAll();
    this.say('All fresh! They will pick a name next time they play.');
  }

  private remove() {
    const p = this.profile();
    if (!p) return;
    GameState.deleteProfile(p.id);
    this.player = 0;
    this.say(`${p.save.name || 'That player'} was removed.`);
  }

  private close() {
    sfx.whoosh();
    this.scene.stop();
    this.scene.stop('Title');
    this.scene.start('Title');
  }

  private cancelHold() {
    this.pointerHold = undefined;
    this.holdMs = 0;
    this.refresh();
  }

  private refresh() {
    this.rows.forEach((r, i) => {
      const on = i === this.sel;
      r.text!.setText(r.label());
      r.box!.setStrokeStyle(on ? 8 : 4, on ? 0xff7eb9 : COLORS.paperEdge);
      if (!this.holdMs || !on) r.fill!.width = 0;
    });
  }

  update(_t: number, dt: number) {
    const c = this.controls;
    if (c.menuUp()) { this.sel = Phaser.Math.Wrap(this.sel - 1, 0, this.rows.length); sfx.select(); this.cancelHold(); }
    if (c.menuDown()) { this.sel = Phaser.Math.Wrap(this.sel + 1, 0, this.rows.length); sfx.select(); this.cancelHold(); }
    if (this.sel === 0) {
      if (c.menuLeft()) { this.changePlayer(-1); this.refresh(); }
      if (c.menuRight()) { this.changePlayer(1); this.refresh(); }
    }
    if (c.back()) return this.close();

    const row = this.rows[this.sel];
    const keyHeld = c.flapHeld && row.hold;
    if (row.hold && (keyHeld || this.pointerHold === row)) {
      this.holdMs += dt;
      row.fill!.width = 760 * Math.min(1, this.holdMs / HOLD_MS);
      if (this.holdMs >= HOLD_MS) {
        sfx.soft();
        row.run();
        this.cancelHold();
      }
      return;
    }
    if (this.holdMs && !this.pointerHold) this.cancelHold();
    if (c.confirm() && !row.hold) {
      row.run();
      this.refresh();
    }
  }
}
