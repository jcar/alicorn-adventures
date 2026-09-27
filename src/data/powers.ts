/** Every friend you help teaches a power. Each one opens up secrets everywhere. */
export interface PowerDef {
  id: 'sniff' | 'dash' | 'glow' | 'warmth';
  name: string;
  friend: string;
  icon: string;
  /** Narrator line that explains the power right after it's learned. */
  teach: string;
}

export const POWERS: PowerDef[] = [
  { id: 'sniff', name: 'Sniff', friend: 'bunny', icon: 'power-sniff', teach: 'power-sniff' },
  { id: 'dash', name: 'Dash', friend: 'fox', icon: 'power-dash', teach: 'power-dash' },
  { id: 'glow', name: 'Glow', friend: 'owl', icon: 'power-glow', teach: 'power-glow' },
  { id: 'warmth', name: 'Warm Breath', friend: 'dragon', icon: 'power-warmth', teach: 'power-warmth' },
];

export type PowerId = PowerDef['id'];
export const powerFromFriend = (friendId: string) => POWERS.find((p) => p.friend === friendId);
