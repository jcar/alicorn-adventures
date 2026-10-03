import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { NamePickerScene } from './scenes/NamePickerScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';
import { WardrobeScene } from './scenes/WardrobeScene';
import { StickerBookScene } from './scenes/StickerBookScene';
import { PuzzleScene } from './scenes/PuzzleScene';
import { installDebug } from './debug/debug';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#2b1f4a',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 900 }, debug: false } },
  scene: [BootScene, PreloadScene, TitleScene, NamePickerScene, WorldScene, UIScene, WardrobeScene, StickerBookScene, PuzzleScene],
});

installDebug(game);
