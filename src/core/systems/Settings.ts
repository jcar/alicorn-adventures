import { isMuted, setMuted } from '../audio/sfx';
import { isVoiceOn, setVoiceOn } from '../audio/voice';

/** Grown-up settings for this device (sound, voice). Not part of any player's save. */
const KEY = 'alicorn-adventures-settings';

export function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { muted?: boolean; voice?: boolean };
    if (typeof s.muted === 'boolean') setMuted(s.muted);
    if (typeof s.voice === 'boolean') setVoiceOn(s.voice);
  } catch { /* defaults */ }
}

function store() {
  try { localStorage.setItem(KEY, JSON.stringify({ muted: isMuted(), voice: isVoiceOn() })); } catch { /* ignore */ }
}

export function toggleSound() { setMuted(!isMuted()); store(); return !isMuted(); }
export function toggleVoice() { setVoiceOn(!isVoiceOn()); store(); return isVoiceOn(); }
