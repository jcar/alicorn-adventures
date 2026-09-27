import type { Unlock } from '../data/unlocks';
import { findFriend } from '../data/friends';

/** "Collect 75 stardust" / "Help Bunny" in words a young reader can manage. */
export function requirementText(u: Unlock | undefined): string {
  if (!u) return '';
  const parts: string[] = [];
  if (u.stardust) parts.push(`Collect ${u.stardust} stardust`);
  if (u.gold) parts.push(`Find ${u.gold} golden stars`);
  if (u.flags?.length) parts.push(u.hint ?? 'Keep exploring');
  if (u.friends?.length) {
    const names = u.friends.map((f) => findFriend(f)?.name ?? f);
    parts.push(u.friends.length > 2 ? 'Help all your friends' : `Help ${names.join(' and ')}`);
  }
  return parts.join(' and ');
}
