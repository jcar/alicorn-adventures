import Phaser from 'phaser';
import { makePlaceholders } from '../art/placeholders';
import { GameState } from '../systems/GameState';
import { loadSettings } from '../systems/Settings';
import { titleStyle } from '../ui/style';
import { lateImageKeys, queueBundle, setAssetIndex, type AssetIndex } from '../assets';

/**
 * Loads the asset index and the core pictures (listed in public/assets/assets.json
 * by the Gemini pipeline), then fills every gap with placeholder art. Kingdom
 * pictures, voices and music load later, when they're needed.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2 - 60, 'Loading magic...', titleStyle(48)).setOrigin(0.5);
    const bar = this.add.rectangle(width / 2 - 300, height / 2 + 20, 0, 26, 0xffc93c).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2 + 20, 604, 32).setStrokeStyle(4, 0xffffff);
    this.load.on('progress', (p: number) => (bar.width = 600 * p));

    this.load.json('assetList', 'assets/assets.json');
    this.load.once('filecomplete-json-assetList', () => {
      setAssetIndex(this.cache.json.get('assetList') as AssetIndex | undefined);
      queueBundle(this, 'core');
    });
    // A missing or broken file just means that thing uses placeholder art.
    this.load.on('loaderror', (f: Phaser.Loader.File) => console.warn('Asset not loaded, using placeholder:', f.key));
  }

  create() {
    makePlaceholders(this, lateImageKeys());
    loadSettings();
    GameState.init();
    this.scene.start('Title');
  }
}
