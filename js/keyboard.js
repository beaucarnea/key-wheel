// Clickable piano keyboard that lights up whenever a note sounds.

import { events } from './audio.js';
import { defaultNote, noteName } from './theory.js';

const BLACK = new Set([1, 3, 6, 8, 10]);

export function createKeyboard(el, { from = 48, to = 83, onPress }) {
  el.innerHTML = '';
  const keys = new Map();
  let whiteCount = 0;
  for (let m = from; m <= to; m++) if (!BLACK.has(m % 12)) whiteCount++;
  const w = 100 / whiteCount;

  let wi = 0;
  for (let m = from; m <= to; m++) {
    const black = BLACK.has(m % 12);
    const k = document.createElement('button');
    k.className = `key ${black ? 'black' : 'white'}`;
    k.type = 'button';
    k.style.left = `${black ? wi * w - w * 0.3 : wi * w}%`;
    k.style.width = `${black ? w * 0.6 : w}%`;
    if (!black) wi++;
    k.innerHTML = '<span class="name"></span><span class="oct"></span>';
    if (m % 12 === 0) k.querySelector('.oct').textContent = `C${m / 12 - 1}`;
    k.addEventListener('pointerdown', e => { e.preventDefault(); onPress(m); });
    el.append(k);
    keys.set(m, k);
  }

  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  };
  events.addEventListener('note', e => {
    const { midi, at, dur } = e.detail;
    const k = keys.get(midi);
    if (!k) return;
    later(() => {
      k.classList.add('on');
      later(() => k.classList.remove('on'), dur * 1000);
    }, at * 1000);
  });
  events.addEventListener('stop', () => {
    timers.forEach(clearTimeout);
    timers.clear();
    keys.forEach(k => k.classList.remove('on'));
  });

  return {
    // Marks the notes of `key`; notes only in `compare` are shown as "foreign".
    setScale(key, lang, compare = null) {
      keys.forEach((k, m) => {
        const pc = m % 12;
        const own = key?.scale.find(n => n.pc === pc);
        const other = !own && compare?.scale.find(n => n.pc === pc);
        k.classList.toggle('in', !!own);
        k.classList.toggle('root', !!own && pc === key.rootPc);
        k.classList.toggle('foreign', !!other);
        const note = own || other;
        k.querySelector('.name').textContent = note ? noteName(note, lang) : pc === 0 ? noteName(defaultNote(0), lang) : '';
      });
    },
    flash(midi) {
      const k = keys.get(midi);
      if (k) { k.classList.add('on'); setTimeout(() => k.classList.remove('on'), 250); }
    },
  };
}
