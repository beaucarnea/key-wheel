// Small Web Audio synth: piano-like tones, chords and timed sequences.
// Every note fires a "note" event so the keyboard can light up.

let ctx = null;
let out = null;
const voices = new Set();
export const events = new EventTarget();

function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    out = ctx.createGain();
    out.gain.value = 0.8;
    out.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export const midiToFreq = m => 440 * 2 ** ((m - 69) / 12);

export function playNote(midi, { at = 0, dur = 0.9, vel = 0.5, show = true } = {}) {
  const c = audio();
  const t = c.currentTime + 0.03 + at;
  const len = Math.max(dur, 0.4);
  const f = midiToFreq(midi);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(f * 8, 9000), t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(f * 2, 500), t + len);

  const o1 = c.createOscillator();
  o1.type = 'triangle';
  o1.frequency.value = f;
  const o2 = c.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = f * 2;
  const g2 = c.createGain();
  g2.gain.value = 0.25;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vel, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.35);
  gain.gain.setTargetAtTime(0.0001, t + len, 0.12);

  o1.connect(filter);
  o2.connect(g2).connect(filter);
  filter.connect(gain).connect(out);

  const end = t + len + 0.8;
  o1.start(t); o2.start(t);
  o1.stop(end); o2.stop(end);

  const voice = { gain, oscs: [o1, o2] };
  voices.add(voice);
  o1.onended = () => voices.delete(voice);

  if (show) events.dispatchEvent(new CustomEvent('note', { detail: { midi, at, dur: len } }));
}

export function playChord(midis, opts = {}) {
  const vel = (opts.vel ?? 0.6) / Math.sqrt(midis.length);
  midis.forEach(m => playNote(m, { ...opts, vel }));
}

// Plays a list of chords one after another; returns the total length in seconds.
export function playSequence(chords, { start = 0, step = 0.7, ...opts } = {}) {
  chords.forEach((m, i) => playChord(m, { ...opts, at: start + i * step, dur: step * 0.95 }));
  return start + chords.length * step;
}

export function stopAll() {
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const v of voices) {
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setTargetAtTime(0.0001, now, 0.03);
    v.oscs.forEach(o => { try { o.stop(now + 0.2); } catch { /* already stopped */ } });
  }
  voices.clear();
  events.dispatchEvent(new Event('stop'));
}
