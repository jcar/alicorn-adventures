import Phaser from 'phaser';
import { MANES } from '../data/cosmetics';
import { LEVELS, type Theme } from '../data/levels';

/**
 * Cute art drawn in code. Each texture is only drawn when no generated
 * image with the same key has loaded, so Gemini art replaces these one at
 * a time as it's generated.
 */
type Ctx = CanvasRenderingContext2D;

const hex = (n: number, a = 1) =>
  `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;

const RAINBOW = [0xff5e5e, 0xffa24c, 0xffe14c, 0x6fe36f, 0x5ec8ff, 0xa77bff];

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const c = tex.getContext();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  draw(c);
  tex.refresh();
}

function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, lw = 3, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}
const circle = (c: Ctx, x: number, y: number, r: number, fill: string, stroke?: string, lw = 3) =>
  ellipse(c, x, y, r, r, fill, stroke, lw);

function poly(c: Ctx, pts: number[], fill: string, stroke?: string, lw = 3) {
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}

function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, lw = 3) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}

function star(c: Ctx, x: number, y: number, outer: number, inner: number, fill: string, stroke?: string, lw = 3) {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  poly(c, pts, fill, stroke, lw);
}

function heart(c: Ctx, x: number, y: number, s: number, fill: string) {
  c.beginPath();
  c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.4, y - s, x, y - s * 0.35);
  c.bezierCurveTo(x + s * 0.4, y - s, x + s, y - s * 0.4, x, y + s * 0.35);
  c.fillStyle = fill;
  c.fill();
}

function eye(c: Ctx, x: number, y: number, s = 1) {
  ellipse(c, x, y, 6 * s, 8 * s, '#2b1f4a');
  circle(c, x + 2 * s, y - 3 * s, 2.4 * s, '#ffffff');
  circle(c, x - 2 * s, y + 3 * s, 1.2 * s, '#ffffff');
}

// ---------------------------------------------------------------- alicorn

function drawAlicorn(c: Ctx, maneColors: string[]) {
  const line = '#b69ad6';
  const coat = '#fdf8ff';
  const mane = (i: number) => maneColors[i % maneColors.length];

  // Tail
  for (let i = 0; i < 4; i++) ellipse(c, 34 - i * 6, 80 + i * 9, 16, 9, mane(i), undefined, 0, -0.9 + i * 0.25);
  // Back wing
  poly(c, [70, 70, 40, 22, 60, 30, 72, 18, 84, 30, 92, 66], '#e7dcff', line);
  // Legs
  for (const x of [52, 64, 92, 104]) {
    roundRect(c, x - 6, 88, 13, 34, 6, x === 64 || x === 104 ? '#efe7fb' : coat, line);
    roundRect(c, x - 7, 114, 15, 10, 4, '#ffd46b', '#e0a93a');
  }
  // Body
  ellipse(c, 78, 82, 44, 26, coat, line);
  // Neck
  poly(c, [98, 74, 108, 38, 128, 42, 120, 84], coat);
  // Head
  ellipse(c, 124, 44, 22, 19, coat, line);
  ellipse(c, 141, 54, 13, 10, coat, line);
  circle(c, 146, 52, 1.8, '#b69ad6');
  // Ear
  poly(c, [112, 30, 114, 12, 124, 26], coat, line);
  // Horn
  poly(c, [118, 26, 134, 0, 128, 28], '#ffd46b', '#e0a93a', 2);
  c.strokeStyle = '#fff3c4'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(122, 20); c.lineTo(128, 18); c.moveTo(125, 12); c.lineTo(130, 10); c.stroke();
  // Mane down the neck
  const bumps: [number, number, number][] = [[112, 24, 11], [104, 34, 12], [100, 48, 12], [98, 62, 11], [96, 74, 9]];
  bumps.forEach(([x, y, r], i) => circle(c, x, y, r, mane(i)));
  circle(c, 118, 26, 8, mane(5)); // forelock
  // Face
  eye(c, 128, 42, 1.1);
  c.strokeStyle = '#2b1f4a'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(131, 33); c.lineTo(135, 30); c.stroke();
  circle(c, 136, 56, 5, 'rgba(255,140,180,0.45)');
  c.beginPath(); c.arc(144, 60, 4, 0.2, Math.PI - 0.6); c.stroke();
  // Front wing
  poly(c, [62, 72, 34, 40, 50, 44, 50, 30, 66, 40, 70, 24, 84, 42, 88, 74], '#f3ecff', line);
  c.strokeStyle = '#d6c6f2'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(56, 64); c.lineTo(48, 48); c.moveTo(68, 64); c.lineTo(64, 42); c.moveTo(80, 66); c.lineTo(78, 46); c.stroke();
  // Cutie mark
  star(c, 66, 88, 7, 3, '#ffd46b');
}

// ---------------------------------------------------------------- friends

function drawBunny(c: Ctx) {
  const line = '#9a8fa8';
  ellipse(c, 38, 30, 9, 26, '#f6f2fa', line, 3, -0.2);
  ellipse(c, 38, 30, 4, 18, '#ffc2de', undefined, 0, -0.2);
  ellipse(c, 60, 28, 9, 26, '#f6f2fa', line, 3, 0.2);
  ellipse(c, 60, 28, 4, 18, '#ffc2de', undefined, 0, 0.2);
  ellipse(c, 50, 84, 30, 26, '#f6f2fa', line);
  circle(c, 22, 92, 10, '#ffffff', line);
  ellipse(c, 50, 58, 24, 21, '#f6f2fa', line);
  eye(c, 42, 56); eye(c, 58, 56);
  ellipse(c, 50, 66, 4, 3, '#ff8fb8');
  circle(c, 34, 66, 4, 'rgba(255,140,180,0.45)'); circle(c, 66, 66, 4, 'rgba(255,140,180,0.45)');
}

function drawFox(c: Ctx) {
  const line = '#b0602a';
  ellipse(c, 84, 78, 20, 12, '#ff9a4c', line, 3, -0.8);
  circle(c, 96, 64, 8, '#ffffff');
  ellipse(c, 50, 82, 26, 22, '#ff9a4c', line);
  ellipse(c, 50, 88, 14, 14, '#fff3e6');
  poly(c, [28, 44, 30, 14, 46, 36], '#ff9a4c', line);
  poly(c, [72, 44, 70, 14, 54, 36], '#ff9a4c', line);
  ellipse(c, 50, 52, 26, 20, '#ff9a4c', line);
  poly(c, [30, 56, 50, 72, 70, 56, 50, 62], '#fff3e6');
  eye(c, 40, 50); eye(c, 60, 50);
  circle(c, 50, 64, 4, '#2b1f4a');
}

function drawOwl(c: Ctx) {
  const line = '#7a5236';
  ellipse(c, 50, 62, 32, 36, '#b58660', line);
  ellipse(c, 50, 72, 20, 24, '#ecd3b3');
  poly(c, [22, 34, 26, 16, 38, 30], '#b58660', line);
  poly(c, [78, 34, 74, 16, 62, 30], '#b58660', line);
  circle(c, 38, 46, 13, '#fff7e8', line, 2);
  circle(c, 62, 46, 13, '#fff7e8', line, 2);
  eye(c, 38, 46, 1.2); eye(c, 62, 46, 1.2);
  poly(c, [45, 56, 55, 56, 50, 66], '#ffc93c', '#d99a1a', 2);
  ellipse(c, 20, 66, 8, 20, '#9c7050', line, 3, 0.2);
  ellipse(c, 80, 66, 8, 20, '#9c7050', line, 3, -0.2);
  for (const x of [40, 60]) poly(c, [x - 6, 96, x, 90, x + 6, 96], '#ffc93c');
}

function drawDragon(c: Ctx) {
  const line = '#3a9b74';
  ellipse(c, 16, 84, 18, 8, '#7fe0b4', line, 3, 0.5);
  poly(c, [30, 60, 8, 34, 20, 36, 22, 24, 40, 50], '#c4f7df', line);
  ellipse(c, 50, 80, 26, 24, '#7fe0b4', line);
  ellipse(c, 52, 86, 14, 16, '#fff0b3');
  poly(c, [44, 34, 46, 14, 54, 30], '#fff0b3', '#d9b24a', 2);
  poly(c, [62, 32, 70, 14, 70, 34], '#fff0b3', '#d9b24a', 2);
  ellipse(c, 58, 48, 26, 21, '#7fe0b4', line);
  ellipse(c, 78, 56, 12, 9, '#7fe0b4', line);
  eye(c, 52, 46); eye(c, 68, 44);
  circle(c, 84, 54, 1.8, line);
  circle(c, 44, 58, 4, 'rgba(255,140,180,0.45)');
  for (let i = 0; i < 3; i++) poly(c, [30 + i * 10, 58 - i * 2, 34 + i * 10, 50 - i * 2, 38 + i * 10, 58 - i * 2], '#ffb3d1');
}

// ---------------------------------------------------------------- scenery

function drawBackground(c: Ctx, t: Theme, layer: 'far' | 'near', w: number, h: number) {
  const rnd = new Phaser.Math.RandomDataGenerator([t.deco + layer]);
  const col = layer === 'far' ? t.far : t.near;
  const base = h - 100;
  if (layer === 'far') {
    // Rolling hills along the bottom.
    c.fillStyle = hex(col, 0.9);
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) c.lineTo(x, base - 120 - Math.sin(x / 210) * 50 - Math.sin(x / 90) * 18);
    c.lineTo(w, h);
    c.fill();
  }
  switch (t.deco) {
    case 'glade':
    case 'trees': {
      const n = layer === 'far' ? 9 : 6;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * (w / n) + rnd.between(-40, 40);
        const th = layer === 'far' ? rnd.between(220, 330) : rnd.between(300, 430);
        const tw = layer === 'far' ? 22 : 34;
        roundRect(c, x - tw / 2, base - th, tw, th + 40, 8, hex(t.deco === 'glade' ? 0x8a5a3c : 0x3b2a3f, layer === 'far' ? 0.6 : 1));
        const r = layer === 'far' ? 70 : 95;
        [[0, -th], [-r * 0.6, -th + 30], [r * 0.6, -th + 30], [0, -th - r * 0.5]].forEach(([dx, dy]) =>
          circle(c, x + dx, base + dy, r * 0.75, hex(col, layer === 'far' ? 0.8 : 1)));
        if (t.deco === 'glade' && layer === 'near')
          for (let k = 0; k < 4; k++) circle(c, x + rnd.between(-60, 60), base - th + rnd.between(-60, 30), 8, hex([0xff7eb9, 0xffe14c, 0xffffff][k % 3]));
      }
      if (t.deco === 'trees' && layer === 'near')
        for (let i = 0; i < 40; i++) circle(c, rnd.between(0, w), rnd.between(80, base), rnd.between(2, 4), hex(0xfff6a0, 0.9));
      break;
    }
    case 'mushrooms': {
      const n = layer === 'far' ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * (w / n) + rnd.between(-40, 40);
        const sh = layer === 'far' ? rnd.between(140, 220) : rnd.between(200, 320);
        const cap = layer === 'far' ? 80 : 120;
        const a = layer === 'far' ? 0.7 : 1;
        roundRect(c, x - 20, base - sh, 40, sh + 40, 16, hex(0xfff3e0, a));
        c.fillStyle = hex([0xff6f91, 0xffa24c, 0xa77bff][i % 3], a);
        c.beginPath(); c.ellipse(x, base - sh, cap, cap * 0.6, 0, Math.PI, 0); c.fill();
        for (let k = 0; k < 4; k++) circle(c, x + rnd.between(-cap * 0.6, cap * 0.6), base - sh - rnd.between(10, cap * 0.45), rnd.between(8, 14), hex(0xffffff, a));
      }
      break;
    }
    case 'crystals': {
      if (layer === 'far') {
        for (let i = 0; i < 3; i++) {
          const x = 200 + i * 420;
          roundRect(c, x, 60, 110, base, 30, hex(0xeafcff, 0.55));
          for (let k = 0; k < 6; k++) roundRect(c, x + 12 + k * 16, 60, 6, base, 3, hex(0xffffff, 0.5));
        }
      } else {
        for (let i = 0; i < 7; i++) {
          const x = (i + 0.5) * (w / 7) + rnd.between(-40, 40);
          for (let k = -1; k <= 1; k++) {
            const hgt = rnd.between(80, 190) * (k === 0 ? 1.3 : 1);
            poly(c, [x + k * 34 - 18, base + 40, x + k * 34 - 18, base - hgt + 30, x + k * 34, base - hgt, x + k * 34 + 18, base - hgt + 30, x + k * 34 + 18, base + 40],
              hex([0x9be7ff, 0xc9a7ff, 0x8ff0d8][(i + k + 3) % 3], 0.9), hex(0xffffff, 0.8), 3);
          }
        }
      }
      break;
    }
    case 'clouds': {
      const n = layer === 'far' ? 6 : 9;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * (w / n) + rnd.between(-50, 50);
        const y = layer === 'far' ? rnd.between(base - 200, base - 60) : rnd.between(100, base - 200);
        const s = layer === 'far' ? 1.6 : 0.8;
        [[0, 0, 60], [-55, 15, 42], [55, 15, 45], [-25, -20, 40], [25, -25, 44]].forEach(([dx, dy, r]) =>
          circle(c, x + dx * s, y + dy * s, r * s, hex(col, layer === 'far' ? 0.85 : 0.95)));
      }
      if (layer === 'near') for (let i = 0; i < 30; i++) star(c, rnd.between(0, w), rnd.between(40, base - 150), 6, 2.5, hex(0xfff6a0, 0.9));
      break;
    }
  }
}

function drawGround(c: Ctx, t: Theme, w: number, h: number) {
  c.fillStyle = hex(t.ground);
  c.fillRect(0, 14, w, h);
  // Pebbles / speckles
  for (let i = 0; i < 6; i++) circle(c, 12 + i * 21, 40 + ((i * 37) % 50), 4, hex(0x000000, 0.08));
  // Scalloped top edge that tiles seamlessly (w is a multiple of the scallop size).
  c.fillStyle = hex(t.groundTop);
  c.fillRect(0, 0, w, 20);
  for (let x = 0; x <= w; x += 32) circle(c, x + 16, 20, 16, hex(t.groundTop));
}

// ---------------------------------------------------------------- entry point

export function makePlaceholders(scene: Phaser.Scene) {
  for (const m of MANES) {
    const colors = m.id === 'rainbow' ? RAINBOW.map((n) => hex(n)) : [hex(m.color), hex(m.accent)];
    make(scene, `alicorn-${m.id}`, 160, 128, (c) => drawAlicorn(c, colors));
  }

  make(scene, 'friend-bunny', 100, 110, drawBunny);
  make(scene, 'friend-fox', 110, 110, drawFox);
  make(scene, 'friend-owl', 100, 104, drawOwl);
  make(scene, 'friend-dragon', 100, 110, drawDragon);

  // Accessories
  make(scene, 'acc-bow', 48, 32, (c) => {
    poly(c, [24, 16, 4, 4, 4, 28], '#ff5e9a', '#c93a73', 2);
    poly(c, [24, 16, 44, 4, 44, 28], '#ff5e9a', '#c93a73', 2);
    circle(c, 24, 16, 6, '#ff8fb8', '#c93a73', 2);
  });
  make(scene, 'acc-crown', 60, 30, (c) => {
    ['#ff7eb9', '#ffe14c', '#a77bff', '#5ec8ff', '#ff7eb9'].forEach((f, i) => {
      const x = 8 + i * 11;
      const y = 16 + Math.abs(2 - i) * 2;
      for (let k = 0; k < 5; k++) circle(c, x + Math.cos((k * Math.PI * 2) / 5) * 4, y + Math.sin((k * Math.PI * 2) / 5) * 4, 3.5, f);
      circle(c, x, y, 2.5, '#fff3c4');
    });
  });
  make(scene, 'acc-saddle', 64, 30, (c) => {
    roundRect(c, 4, 4, 56, 20, 10, '#a77bff', '#6d4fc2', 2);
    for (let i = 0; i < 5; i++) star(c, 12 + i * 10, 14, 4, 1.8, '#fff6a0');
  });

  // Effects
  make(scene, 'fx-dot', 16, 16, (c) => circle(c, 8, 8, 7, '#ffffff'));
  make(scene, 'fx-star', 24, 24, (c) => star(c, 12, 12, 11, 4.5, '#ffffff'));
  make(scene, 'fx-heart', 24, 24, (c) => heart(c, 12, 14, 10, '#ffffff'));
  make(scene, 'fx-bubble', 24, 24, (c) => {
    circle(c, 12, 12, 10, 'rgba(255,255,255,0.25)', '#ffffff', 2);
    circle(c, 8, 8, 2.5, '#ffffff');
  });
  make(scene, 'fx-feather', 20, 12, (c) => ellipse(c, 10, 6, 9, 4, '#ffffff'));

  // Pickups
  make(scene, 'stardust', 44, 44, (c) => {
    circle(c, 22, 22, 20, 'rgba(255,246,160,0.35)');
    star(c, 22, 23, 17, 8, '#ffe14c', '#ffb31a', 2.5);
    circle(c, 17, 18, 3, '#ffffff');
  });
  make(scene, 'item-carrot', 44, 60, (c) => {
    poly(c, [22, 58, 10, 16, 34, 16], '#ff8a3c', '#d9601a');
    c.strokeStyle = '#d9601a'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(15, 28); c.lineTo(22, 26); c.moveTo(18, 40); c.lineTo(25, 38); c.stroke();
    for (const r of [-0.5, 0, 0.5]) ellipse(c, 22 + r * 14, 9, 5, 10, '#5fcf6a', '#3a9b44', 2, r);
  });
  make(scene, 'item-berry', 48, 48, (c) => {
    [[16, 28], [32, 28], [24, 16]].forEach(([x, y]) => {
      circle(c, x, y, 10, '#7a5cff', '#4f38c2', 2);
      circle(c, x - 3, y - 3, 2.5, '#ffffff');
    });
    ellipse(c, 24, 6, 8, 4, '#5fcf6a');
  });

  // Blooms
  make(scene, 'bloom-bud', 50, 50, (c) => {
    roundRect(c, 22, 20, 6, 30, 3, '#4fae6d');
    ellipse(c, 25, 18, 9, 12, '#9bd46b', '#4fae6d', 2);
    ellipse(c, 14, 36, 8, 4, '#6fd08c', undefined, 0, -0.5);
  });
  make(scene, 'bloom-flower', 80, 90, (c) => {
    roundRect(c, 37, 40, 6, 50, 3, '#4fae6d');
    ellipse(c, 24, 66, 12, 5, '#6fd08c', undefined, 0, -0.5);
    ellipse(c, 56, 60, 12, 5, '#6fd08c', undefined, 0, 0.5);
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI * 2) / 6;
      circle(c, 40 + Math.cos(a) * 17, 30 + Math.sin(a) * 17, 13, '#ffffff', '#e0d0f0', 2);
    }
    circle(c, 40, 30, 11, '#ffe14c', '#ffb31a', 2);
  });

  // Level pieces
  make(scene, 'bouncer', 140, 110, (c) => {
    roundRect(c, 52, 50, 36, 60, 14, '#fff3e0', '#d9c2a3');
    c.beginPath(); c.ellipse(70, 56, 66, 44, 0, Math.PI, 0); c.closePath();
    c.fillStyle = '#ff6f91'; c.fill(); c.strokeStyle = '#d94f73'; c.lineWidth = 3; c.stroke();
    [[44, 36, 10], [80, 26, 12], [104, 44, 8], [64, 46, 7]].forEach(([x, y, r]) => circle(c, x, y, r, '#ffffff'));
  });
  make(scene, 'portal', 150, 210, (c) => {
    const g = c.createLinearGradient(0, 30, 0, 210);
    g.addColorStop(0, '#fff6ff');
    g.addColorStop(1, '#c9a7ff');
    c.beginPath(); c.moveTo(22, 210); c.lineTo(22, 80); c.arc(75, 80, 53, Math.PI, 0); c.lineTo(128, 210); c.closePath();
    c.fillStyle = g; c.fill();
    c.lineWidth = 14; c.strokeStyle = '#b69ad6'; c.stroke();
    c.lineWidth = 4; c.strokeStyle = '#ffffff'; c.stroke();
    for (let i = 0; i < 7; i++) star(c, 40 + ((i * 29) % 70), 70 + ((i * 47) % 120), 6, 2.5, 'rgba(255,255,255,0.9)');
  });
  make(scene, 'icon-lock', 56, 64, (c) => {
    c.lineWidth = 7; c.strokeStyle = '#8f86a8';
    c.beginPath(); c.arc(28, 26, 14, Math.PI, 0); c.stroke();
    roundRect(c, 6, 26, 44, 34, 8, '#b4acc9', '#8f86a8');
    circle(c, 28, 40, 5, '#6d6485');
  });
  make(scene, 'station-mirror', 130, 220, (c) => {
    roundRect(c, 58, 150, 14, 70, 5, '#d9a441');
    ellipse(c, 65, 90, 52, 72, '#ffd46b', '#d9a441', 4);
    ellipse(c, 65, 90, 40, 60, '#cdefff');
    ellipse(c, 50, 70, 10, 22, 'rgba(255,255,255,0.7)', undefined, 0, 0.4);
    roundRect(c, 30, 208, 70, 12, 6, '#d9a441');
  });
  make(scene, 'station-tree', 240, 300, (c) => {
    roundRect(c, 102, 150, 36, 150, 10, '#8a5a3c', '#6b4229');
    [[120, 110, 80], [60, 140, 55], [180, 140, 55], [120, 60, 60]].forEach(([x, y, r]) => circle(c, x, y, r, '#6fd08c', '#4fae6d'));
    ['#ff7eb9', '#ffe14c', '#5ec8ff', '#a77bff', '#ff9a4c', '#ffffff'].forEach((f, i) =>
      roundRect(c, 50 + ((i * 53) % 140), 70 + ((i * 41) % 90), 26, 26, 6, f, '#ffffff', 3));
  });
  make(scene, 'cloud', 200, 100, (c) => {
    [[100, 60, 40], [60, 66, 30], [140, 66, 32], [80, 44, 30], [122, 42, 32]].forEach(([x, y, r]) => circle(c, x, y, r, '#ffffff'));
    eye(c, 88, 60, 0.8); eye(c, 112, 60, 0.8);
    c.strokeStyle = '#b69ad6'; c.lineWidth = 2;
    c.beginPath(); c.arc(100, 68, 6, 0.2, Math.PI - 0.2); c.stroke();
  });
  make(scene, 'rainbow', 900, 460, (c) => {
    RAINBOW.forEach((col, i) => {
      c.beginPath(); c.arc(450, 460, 440 - i * 26, Math.PI, 0);
      c.lineWidth = 26; c.strokeStyle = hex(col, 0.85); c.stroke();
    });
  });
  make(scene, 'deco-lanterns', 120, 140, (c) => {
    c.strokeStyle = '#8a5a3c'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, 10); c.quadraticCurveTo(60, 40, 120, 10); c.stroke();
    [[25, 24, '#ffb3d1'], [60, 30, '#fff0b3'], [95, 24, '#c4f7df']].forEach(([x, y, f]) => {
      c.beginPath(); c.moveTo(x as number, y as number); c.lineTo(x as number, (y as number) + 20); c.stroke();
      circle(c, x as number, (y as number) + 40, 26, 'rgba(255,246,160,0.3)');
      ellipse(c, x as number, (y as number) + 40, 14, 18, f as string, '#ffffff', 2);
    });
  });
  make(scene, 'deco-flowers', 200, 70, (c) => {
    for (let i = 0; i < 8; i++) {
      const x = 14 + i * 24;
      const y = 30 + (i % 2) * 14;
      roundRect(c, x - 2, y, 4, 70 - y, 2, '#4fae6d');
      for (let k = 0; k < 5; k++) circle(c, x + Math.cos((k * Math.PI * 2) / 5) * 7, y + Math.sin((k * Math.PI * 2) / 5) * 7, 6, hex(RAINBOW[i % 6]));
      circle(c, x, y, 4, '#fff3c4');
    }
  });

  // Per-level scenery
  for (const lvl of Object.values(LEVELS)) {
    const t = lvl.theme;
    make(scene, `bg-${lvl.id}-sky`, 16, 720, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 720);
      g.addColorStop(0, hex(t.skyTop));
      g.addColorStop(1, hex(t.skyBottom));
      c.fillStyle = g;
      c.fillRect(0, 0, 16, 720);
    });
    make(scene, `bg-${lvl.id}-far`, 1280, 720, (c) => drawBackground(c, t, 'far', 1280, 720));
    make(scene, `bg-${lvl.id}-near`, 1280, 720, (c) => drawBackground(c, t, 'near', 1280, 720));
    make(scene, `ground-${lvl.id}`, 128, 128, (c) => drawGround(c, t, 128, 128));
  }
}
