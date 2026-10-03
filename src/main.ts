import Phaser from 'phaser';
import { BootScene } from './core/scenes/BootScene';
import { PreloadScene } from './core/scenes/PreloadScene';
import { TitleScene } from './core/scenes/TitleScene';
import { NamePickerScene } from './core/scenes/NamePickerScene';
import { WorldScene } from './core/scenes/WorldScene';
import { UIScene } from './core/scenes/UIScene';
import { WardrobeScene } from './core/scenes/WardrobeScene';
import { StickerBookScene } from './core/scenes/StickerBookScene';
import { PuzzleScene } from './core/scenes/PuzzleScene';
import { installDebug } from './core/debug/debug';

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
