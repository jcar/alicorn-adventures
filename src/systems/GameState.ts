import Phaser from 'phaser';
import { SaveManager } from './SaveManager';
import { grantUnlocks, isUnlocked } from './UnlockManager';
import type { Unlock, UnlockKind } from '../data/unlocks';

/**
 * One shared game state for every scene. Scenes listen to `events`:
 *   'stardust' (total), 'unlock' (Unlock), 'friend' (id), 'equip'
 */
class GameStateImpl {
  readonly store = new SaveManager();
  readonly events = new Phaser.Events.EventEmitter();

  get data() { return this.store.data; }

  init() {
    grantUnlocks(this.data); // starter kit, plus anything new added since the last save
    this.store.save();
  }

  setName(name: string) {
    this.data.name = name;
    this.store.save();
  }

  addStardust(n = 1) {
    this.data.stardust += n;
    this.events.emit('stardust', this.data.stardust);
    this.checkUnlocks();
  }

  helpFriend(id: string) {
    if (this.data.friendsHelped.includes(id)) return;
    this.data.friendsHelped.push(id);
    this.events.emit('friend', id);
    this.checkUnlocks();
  }

  hasHelped(id: string) { return this.data.friendsHelped.includes(id); }
  has(kind: UnlockKind, target: string) { return isUnlocked(this.data, kind, target); }

  equip(slot: 'mane' | 'trail' | 'accessory', id: string) {
    this.data.equipped[slot] = id;
    this.store.save();
    this.events.emit('equip');
  }

  /** Pops the next unlock waiting to be celebrated, if any. */
  takeCelebration(): string | undefined {
    const id = this.data.pendingCelebrations.shift();
    this.store.save();
    return id;
  }

  private checkUnlocks() {
    const fresh: Unlock[] = grantUnlocks(this.data);
    this.store.save();
    fresh.forEach((u) => this.events.emit('unlock', u));
  }

  resetAll() {
    this.store.reset();
    this.init();
  }
}

export const GameState = new GameStateImpl();
