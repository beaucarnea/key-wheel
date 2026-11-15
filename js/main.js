// Wires the wheel, key details, keyboard, lessons and trainer together.

import {
  getKey, keyAt, keyName, noteName, openKey, relationsOf, scaleMidis, shared, softwareName,
} from './theory.js';
import { playNote, stopAll } from './audio.js';
import { playBlend, playCadence, playKeyChord, playScale } from './demos.js';
import { createWheel, keyColor } from './wheel.js';
import { createKeyboard } from './keyboard.js';
import { createTrainer } from './trainer.js';

const load = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

const state = {
  selected: getKey(load('djk-key', '8A')) || getKey('8A'),
  hover: null,
  lang: load('djk-lang', 'en'),
};
const otherLang = () => (state.lang === 'en' ? 'de' : 'en');
const badge = key => `<span class="badge" style="background:${keyColor(key)}" data-letter="${key.letter}">${key.id}</span>`;

const wheel = createWheel(document.getElementById('wheel-svg'), {
  onSelect: key => select(key),
  onHover: key => { state.hover = key; renderHover(); },
  onCenter: () => playKeyChord(state.selected),
});
const keyboard = createKeyboard(document.getElementById('keyboard'), {
  from: 48, to: 83, onPress: m => playNote(m),
});
const trainer = createTrainer(document.getElementById('trainer'), {
  getLang: () => state.lang,
  onShow: (a, b) => { showTab('wheel'); select(getKey(a), { sound: false }); state.hover = getKey(b); renderHover(); },
});

function select(key, { sound = true } = {}) {
  state.selected = key;
  save('djk-key', key.id);
  render();
  if (sound) playKeyChord(key);
}

function render() {
  const key = state.selected;
  const marks = new Map(relationsOf(key).map(r => [r.key.id, r.type]));
  wheel.setNames(state.lang);
  wheel.setState(key, marks);
  renderDetails();
  renderHover();
  renderNotationTable();
  document.getElementById('lang').textContent = state.lang === 'en' ? 'Note names: EN' : 'Notennamen: DE';
}

function renderHover() {
  const key = state.selected;
  const h = state.hover;
  if (h && h !== key) {
    wheel.setCenter([h.id, keyName(h, state.lang), `${shared(key, h)}/7 notes shared`]);
    keyboard.setScale(key, state.lang, h);
  } else {
    wheel.setCenter([key.id, keyName(key, state.lang), 'click to play']);
    keyboard.setScale(key, state.lang);
  }
}

function renderDetails() {
  const key = state.selected;
  const alt = key.alt ? ` · also ${keyName(key, state.lang, true)}` : '';
  const moves = relationsOf(key).filter(r => r.type !== 'same');
  document.getElementById('details').innerHTML = `
    <div class="key-head">
      ${badge(key)}
      <div>
        <h2>${keyName(key, state.lang)}</h2>
        <p class="muted">${keyName(key, otherLang())}${alt}</p>
      </div>
    </div>
    <dl class="facts">
      <div><dt>Camelot</dt><dd>${key.id}</dd></div>
      <div><dt>Open Key</dt><dd>${openKey(key)}</dd></div>
      <div><dt>Software</dt><dd>${softwareName(key)}${key.alt ? ` / ${softwareName(key, true)}` : ''}</dd></div>
      <div><dt>Mode</dt><dd>${key.mode === 'major' ? 'Major · Dur' : 'Minor · Moll'}</dd></div>
    </dl>
    <h3>Notes of the scale</h3>
    <div class="chips">
      ${key.scale.map((n, i) => `<button type="button" class="chip${i === 0 ? ' root' : ''}" data-note="${i}">${noteName(n, state.lang)}</button>`).join('')}
    </div>
    <div class="row">
      <button type="button" class="btn primary" data-play="chord">▶ Chord</button>
      <button type="button" class="btn" data-play="scale">▶ Scale</button>
      <button type="button" class="btn" data-play="cadence">▶ Cadence</button>
    </div>
    <h3>Mixes with</h3>
    <ul class="moves">
      ${moves.map(r => `
        <li data-id="${r.key.id}" data-type="${r.type}">
          <button type="button" class="move-key" data-select="${r.key.id}">${badge(r.key)}</button>
          <div class="move-text">
            <strong>${keyName(r.key, state.lang)} <span class="tag">${r.short}</span></strong>
            <span>${r.label} · ${shared(key, r.key)}/7 notes shared</span>
            <small class="muted">${r.desc}</small>
          </div>
          <button type="button" class="btn small" data-blend="${r.key.id}" title="Hear both keys blended">▶ Blend</button>
        </li>`).join('')}
    </ul>`;
}

const details = document.getElementById('details');
details.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  const key = state.selected;
  if (t.dataset.play === 'chord') playKeyChord(key);
  if (t.dataset.play === 'scale') playScale(key);
  if (t.dataset.play === 'cadence') playCadence(key);
  if (t.dataset.note) playNote(scaleMidis(key)[t.dataset.note]);
  if (t.dataset.blend) playBlend(key, getKey(t.dataset.blend));
  if (t.dataset.select) select(getKey(t.dataset.select));
});
details.addEventListener('mouseover', e => {
  const li = e.target.closest('li[data-id]');
  const key = li ? getKey(li.dataset.id) : null;
  if (key !== state.hover) { state.hover = key; renderHover(); }
});
details.addEventListener('mouseleave', () => { state.hover = null; renderHover(); });

// Conversion table in the Learn tab.
function renderNotationTable() {
  const rows = [];
  for (let n = 1; n <= 12; n++) {
    const cells = ['A', 'B'].map(l => {
      const k = keyAt(n, l);
      return `<td>${badge(k)}</td><td>${keyName(k, 'en')}</td><td>${keyName(k, 'de')}</td><td><code>${softwareName(k)}</code></td><td><code>${openKey(k)}</code></td>`;
    });
    rows.push(`<tr>${cells.join('')}</tr>`);
  }
  document.getElementById('notation-table').innerHTML = `
    <thead><tr>
      <th>Camelot</th><th>Minor</th><th>German</th><th>Software</th><th>Open Key</th>
      <th>Camelot</th><th>Major</th><th>German</th><th>Software</th><th>Open Key</th>
    </tr></thead><tbody>${rows.join('')}</tbody>`;
}

// Sound buttons inside the lessons: data-demo="chord:8B", "scale:8A", "cadence:8B", "blend:8A:9A".
document.getElementById('learn').addEventListener('click', e => {
  const t = e.target.closest('[data-demo]');
  if (!t) return;
  const [kind, a, b] = t.dataset.demo.split(':');
  if (kind === 'chord') playKeyChord(getKey(a));
  if (kind === 'scale') playScale(getKey(a));
  if (kind === 'cadence') playCadence(getKey(a));
  if (kind === 'blend') playBlend(getKey(a), getKey(b));
  if (kind === 'octave') { stopAll(); [48, 60, 72].forEach((m, i) => playNote(m, { at: i * 0.6 })); }
  if (kind === 'chromatic') { stopAll(); for (let i = 0; i <= 12; i++) playNote(60 + i, { at: i * 0.22, dur: 0.3 }); }
  if (kind === 'wheel') { showTab('wheel'); select(getKey(a)); }
});

// Tabs
function showTab(name) {
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  document.querySelectorAll('.view').forEach(v => { v.hidden = v.id !== name; });
  save('djk-tab', name);
}
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

document.getElementById('lang').addEventListener('click', () => {
  state.lang = otherLang();
  save('djk-lang', state.lang);
  render();
  trainer.refresh();
});
document.getElementById('stop').addEventListener('click', stopAll);

// Computer keyboard plays the piano: A W S E D F T G Y/Z H U J K = C4 … C5.
const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, z: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15 };
window.addEventListener('keydown', e => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea')) return;
  const off = KEYMAP[e.key.toLowerCase()];
  if (off !== undefined) playNote(60 + off);
  if (e.key === 'Escape') stopAll();
});

showTab(load('djk-tab', 'wheel'));
render();
