import Phaser from 'phaser';
import { MAX_PROFILES, SaveManager, type Profile, type SaveData } from './SaveManager';
import { grantUnlocks, isUnlocked } from './UnlockManager';
import type { Unlock, UnlockKind } from '../content';
import type { PowerId } from '../content';
import { adapt, levelFor, maxLevel, pickQuestion, type SkillId } from '../puzzles/engine';

/**
 * One shared game state for every scene. Scenes listen to `events`:
 *   'stardust' (total), 'unlock' (Unlock), 'friend' (id), 'equip', 'flag' (flag)
 */
class GameStateImpl {
  readonly store = new SaveManager();
  readonly events = new Phaser.Events.EventEmitter();

  get data() { return this.store.data; }

  /** Debug kit only: powers to try out without earning them (never saved). */
  readonly debugPowers = new Set<PowerId>();

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
  hasPower(id: PowerId) { return this.debugPowers.has(id) || this.has('power', id); }

  hasFlag(flag: string) { return this.data.flags.includes(flag); }
  countFlags(prefix: string) { return this.data.flags.filter((f) => f.startsWith(prefix)).length; }

  /** Remember something found or solved. Returns false if it was already set. */
  setFlag(flag: string): boolean {
    if (this.hasFlag(flag)) return false;
    this.data.flags.push(flag);
    this.events.emit('flag', flag);
    this.checkUnlocks();
    return true;
  }

  clearFlag(flag: string) {
    this.data.flags = this.data.flags.filter((f) => f !== flag);
    this.store.save();
    this.events.emit('flag', flag);
  }

  favorStep(id: string) { return this.data.favors[id] ?? 0; }

  advanceFavor(id: string) {
    this.data.favors[id] = this.favorStep(id) + 1;
    this.store.save();
  }

  /** Remember she's seen something new, so it stops sparkling "NEW!". */
  markSeen(id: string) {
    if (this.data.seen.includes(id)) return;
    this.data.seen.push(id);
    this.store.save();
  }

  // ------------------------------------------------------------ puzzles

  skillLevel(skill: SkillId, offset = 0) { return levelFor(this.data.skills, skill, offset); }

  /** A question for this player, at their level (plus the spot's offset). */
  question(skill: Exclude<SkillId, 'memory'>, offset = 0) {
    const q = pickQuestion(skill, this.skillLevel(skill, offset), this.data.recentQuestions);
    this.data.recentQuestions = [...this.data.recentQuestions, q.id].slice(-20);
    this.store.save();
    return q;
  }

  /** After a puzzle: nudge that skill's level up or down. */
  recordPuzzle(skill: SkillId, result: { firstTry: boolean; misses: number }) {
    this.data.skills[skill] = adapt(this.data.skills[skill], result, maxLevel(skill));
    this.store.save();
  }

  /** Grown-up dial: set a skill's level directly. */
  setSkillLevel(skill: SkillId, level: number) {
    this.data.skills[skill] = { level: Math.max(1, Math.min(maxLevel(skill), level)), streak: 0 };
    this.store.save();
  }

  visit(areaId: string) {
    if (this.data.visited.includes(areaId)) return;
    this.data.visited.push(areaId);
    this.store.save();
  }
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

  /** Replace the active player's save with a restored backup (the old one is kept aside, just in case). */
  restore(save: SaveData) {
    const before = this.store.active();
    if (before) {
      try {
        localStorage.setItem(`alicorn-adventures-before-restore-${before.id}`, JSON.stringify(before.save));
      } catch { /* storage blocked */ }
    }
    this.store.replaceActive(save);
    this.init();
  }

  // ------------------------------------------------------------ profiles

  profiles(): Profile[] { return this.store.profiles(); }
  activeProfile() { return this.store.active(); }
  canAddProfile() { return this.store.profiles().length < MAX_PROFILES; }

  selectProfile(id: string) {
    this.store.select(id);
    this.init();
  }

  createProfile(name: string) {
    const p = this.store.create(name);
    if (p) this.init();
    return p;
  }

  deleteProfile(id: string) {
    this.store.remove(id);
    if (this.store.active()) this.init();
  }

  resetAll() {
    this.store.reset();
    this.init();
  }
}

export const GameState = new GameStateImpl();
