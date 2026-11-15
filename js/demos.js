// Ready-made sound examples built from theory + audio, shared by all views.

import { cadence, chordMidis, scaleMidis } from './theory.js';
import { playChord, playNote, playSequence, stopAll } from './audio.js';

export function playKeyChord(key, opts = {}) {
  stopAll();
  playChord(chordMidis(key.rootPc, key.mode), { dur: 1.4, ...opts });
}

export function playScale(key, opts = {}) {
  stopAll();
  scaleMidis(key).forEach((m, i) => playNote(m, { at: i * 0.3, dur: 0.45, ...opts }));
}

export function playCadence(key, opts = {}) {
  stopAll();
  return playSequence(cadence(key), { step: 0.75, ...opts });
}

// Simulates a DJ blend: track A alone, then A and B playing at the same time.
export function playBlend(a, b, opts = {}) {
  stopAll();
  const step = 0.7;
  const t = playSequence(cadence(a, 55), { step, vel: 0.55, ...opts });
  playSequence(cadence(a, 55), { start: t, step, vel: 0.5, ...opts });
  playSequence(cadence(b, 67).map(c => c.slice(1)), { start: t, step, vel: 0.5, ...opts });
  return t * 2;
}
