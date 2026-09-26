import Phaser from 'phaser';

/**
 * Sky plus two parallax layers. Copies of each layer alternate flipX,
 * so even a non-tiling generated painting joins up without a seam.
 */
export function addBackdrop(scene: Phaser.Scene, levelId: string, levelWidth: number) {
  const { width: vw, height: vh } = scene.scale;
  scene.add.image(0, 0, `bg-${levelId}-sky`).setOrigin(0).setDisplaySize(vw, vh).setScrollFactor(0).setDepth(-30);
  addLayer(scene, `bg-${levelId}-far`, 0.25, levelWidth, -20);
  // A drawn-in-code near layer would clash on top of a generated painting, so it only
  // joins in when both layers are the same kind.
  if (isPlaceholder(scene, `bg-${levelId}-far`) === isPlaceholder(scene, `bg-${levelId}-near`))
    addLayer(scene, `bg-${levelId}-near`, 0.55, levelWidth, -10);
}

function isPlaceholder(scene: Phaser.Scene, key: string) {
  return scene.textures.get(key).source[0]?.isCanvas ?? true;
}

function addLayer(scene: Phaser.Scene, key: string, factor: number, levelWidth: number, depth: number) {
  const { width: vw, height: vh } = scene.scale;
  const src = scene.textures.get(key).getSourceImage();
  const scale = vh / src.height;
  const w = src.width * scale;
  const needed = vw + Math.max(0, levelWidth - vw) * factor + 2;
  for (let i = 0, x = 0; x < needed; i++, x += w) {
    scene.add.image(x, vh, key).setOrigin(0, 1).setScale(scale).setScrollFactor(factor, 1).setFlipX(i % 2 === 1).setDepth(depth);
  }
}
