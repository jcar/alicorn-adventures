import Phaser from 'phaser';
import { DIALOGUE } from '../content';
import { isMuted } from './sfx';

export const LINES = DIALOGUE;

/** Pitch for the browser's built-in voice, used when no generated voice file exists. */
const PITCH: Record<string, number> = { narrator: 1.15, bunny: 1.7, fox: 1.3, owl: 0.8, dragon: 1.5, pip: 1.9 };

let current: Phaser.Sound.BaseSound | undefined;
let voiceOn = true;

export const setVoiceOn = (on: boolean) => { voiceOn = on; if (!on) stopVoice(); };
export const isVoiceOn = () => voiceOn;

export function lineText(id: string, name = ''): string {
  return (LINES[id]?.text ?? id).replaceAll('{name}', name);
}

export function stopVoice() {
  current?.stop();
  current = undefined;
  try { speechSynthesis.cancel(); } catch { /* not supported */ }
}

/** Read a line out loud, so kids who are still learning to read can follow along. */
export function speak(scene: Phaser.Scene, id: string, name = '') {
  if (!voiceOn || isMuted()) return;
  stopVoice();
  const key = `vo-${id}`;
  if (scene.cache.audio.exists(key)) {
    current = scene.sound.add(key, { volume: 0.9 });
    current.play();
    return;
  }
  try {
    const u = new SpeechSynthesisUtterance(lineText(id, name));
    u.pitch = PITCH[LINES[id]?.speaker ?? 'narrator'] ?? 1.1;
    u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch {
    /* no speech support: the text bubble is still shown */
  }
}
