import type Phaser from 'phaser';

export const FONT = '"Baloo 2", "Trebuchet MS", "Comic Sans MS", sans-serif';

export const COLORS = {
  ink: '#2b1f4a',
  paper: 0xfffaff,
  paperEdge: 0xc9a7ff,
  gold: '#ffc93c',
};

export function textStyle(size: number, extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: FONT, fontSize: `${size}px`, color: COLORS.ink, fontStyle: '800', ...extra };
}

/** Big white letters with a purple outline, readable over any background. */
export function titleStyle(size: number, extra: Phaser.Types.GameObjects.Text.TextStyle = {}) {
  return textStyle(size, { color: '#ffffff', stroke: '#7a4fd6', strokeThickness: Math.max(4, size / 7), ...extra });
}
