import type Phaser from 'phaser';

/**
 * The asset index (public/assets/assets.json, written by the Gemini pipeline).
 *   Images are grouped in bundles: "core" loads at start, a kingdom's bundle
 *   loads when you fly there.
 *   Voice and music load the first time they're needed, so start-up stays quick.
 */
export interface AssetIndex {
  images: { key: string; url: string; bundle?: string }[];
  audio: { key: string; url: string; kind?: string }[];
}

let index: AssetIndex = { images: [], audio: [] };
const audioUrls = new Map<string, string>();

export function setAssetIndex(i: AssetIndex | undefined) {
  index = { images: i?.images ?? [], audio: i?.audio ?? [] };
  audioUrls.clear();
  for (const a of index.audio) audioUrls.set(a.key, a.url);
}

export const imagesIn = (bundle: string) => index.images.filter((a) => (a.bundle ?? 'core') === bundle);
/** Image keys that exist as files but load later, so placeholders shouldn't take their place. */
export const lateImageKeys = () => new Set(index.images.filter((a) => (a.bundle ?? 'core') !== 'core').map((a) => a.key));
export const hasAudioFile = (key: string) => audioUrls.has(key);

/** Queue a bundle's images in a scene's preload(). */
export function queueBundle(scene: Phaser.Scene, bundle: string) {
  for (const a of imagesIn(bundle)) if (!scene.textures.exists(a.key)) scene.load.image(a.key, a.url);
}

const pending = new Map<string, Promise<boolean>>();

/** Load one sound now (if it isn't already). Resolves false if there's no such file or it fails. */
export function loadAudio(scene: Phaser.Scene, key: string): Promise<boolean> {
  if (scene.cache.audio.exists(key)) return Promise.resolve(true);
  const url = audioUrls.get(key);
  if (!url) return Promise.resolve(false);
  const already = pending.get(key);
  if (already) return already;
  const p = new Promise<boolean>((resolve) => {
    const done = (ok: boolean) => {
      scene.load.off(`filecomplete-audio-${key}`);
      pending.delete(key);
      resolve(ok);
    };
    scene.load.once(`filecomplete-audio-${key}`, () => done(true));
    scene.load.once('loaderror', (f: Phaser.Loader.File) => { if (f.key === key) done(false); });
    scene.load.once('complete', () => done(scene.cache.audio.exists(key)));
    scene.load.audio(key, url);
    if (!scene.load.isLoading()) scene.load.start();
  });
  pending.set(key, p);
  return p;
}
