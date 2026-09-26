import type { Unlock } from '../data/unlocks';
import { findTrail } from '../data/cosmetics';

/** Which picture represents an unlock in toasts and the sticker book. */
export function iconFor(u: Unlock): { texture: string; tint?: number; scale: number } {
  switch (u.kind) {
    case 'mane': return { texture: `alicorn-${u.target}`, scale: 0.7 };
    case 'trail': {
      const t = findTrail(u.target);
      return { texture: t.texture, tint: t.tints[0], scale: 2.6 };
    }
    case 'accessory': return { texture: `acc-${u.target}`, scale: 1.6 };
    case 'area': return { texture: 'portal', scale: 0.45 };
    case 'decoration': return { texture: `deco-${u.target}`, scale: 0.55 };
  }
}
