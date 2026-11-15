// Ear-training exercises. Sounds here never light up the keyboard, so it can't give the answer away.

import {
  KEYS, INTERVALS, chordMidis, defaultNote, keyName, noteName, relationsOf, shared, wheelDistance,
} from './theory.js';
import { playChord, playNote, stopAll } from './audio.js';
import { playBlend } from './demos.js';

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const QUIET = { show: false };

function scoreboard(id) {
  const storeKey = `djk-score-${id}`;
  let s = { right: 0, total: 0, streak: 0 };
  try { s = JSON.parse(localStorage.getItem(storeKey)) || s; } catch { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(storeKey, JSON.stringify(s)); } catch { /* ignore */ } };
  return {
    get: () => s,
    add(ok) { s.total++; if (ok) { s.right++; s.streak++; } else s.streak = 0; save(); },
    reset() { s = { right: 0, total: 0, streak: 0 }; save(); },
  };
}

function exercise(root, cfg) {
  const box = document.createElement('section');
  box.className = 'card exercise';
  box.innerHTML = `
    <header><h3>${cfg.title}</h3><button class="score" type="button" title="Reset score"></button></header>
    <p class="muted">${cfg.intro}</p>
    <div class="row">
      <button class="btn primary" data-act="new" type="button">▶ New round</button>
      <button class="btn" data-act="repeat" type="button" disabled>↻ Repeat</button>
    </div>
    <div class="answers"></div>
    <div class="feedback" aria-live="polite"></div>`;
  root.append(box);

  const $ = s => box.querySelector(s);
  const score = scoreboard(cfg.id);
  const answersEl = $('.answers');
  const feedback = $('.feedback');
  let round = null;
  let answered = false;

  function renderScore() {
    const s = score.get();
    $('.score').textContent = `${s.right} / ${s.total}${s.streak > 1 ? ` · ${s.streak} in a row` : ''}`;
  }

  function renderAnswers() {
    answersEl.innerHTML = '';
    for (const a of cfg.answers()) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn answer';
      b.textContent = a.label;
      b.dataset.value = a.value;
      b.disabled = !round || answered;
      if (answered && String(a.value) === String(round.correct)) b.classList.add('right');
      b.addEventListener('click', () => answer(a.value, b));
      answersEl.append(b);
    }
  }

  function answer(value, btn) {
    if (!round || answered) return;
    answered = true;
    const ok = String(value) === String(round.correct);
    score.add(ok);
    renderAnswers();
    if (!ok) answersEl.querySelector(`[data-value="${CSS.escape(String(value))}"]`)?.classList.add('wrong');
    feedback.className = `feedback ${ok ? 'good' : 'bad'}`;
    feedback.innerHTML = `<strong>${ok ? 'Right.' : 'Not quite.'}</strong> ${round.explain()}`;
    renderScore();
  }

  $('[data-act=new]').addEventListener('click', () => {
    round = cfg.newRound();
    answered = false;
    $('[data-act=repeat]').disabled = false;
    feedback.className = 'feedback';
    feedback.textContent = '';
    renderAnswers();
    round.play();
  });
  $('[data-act=repeat]').addEventListener('click', () => round?.play());
  $('.score').addEventListener('click', () => { score.reset(); renderScore(); });

  renderScore();
  renderAnswers();
  return { refresh: renderAnswers };
}

export function createTrainer(root, { getLang, onShow }) {
  const exercises = [];

  exercises.push(exercise(root, {
    id: 'mode',
    title: '1 · Major or minor?',
    intro: 'A chord is played note by note, then all together. Major sounds bright and stable, minor darker. This is the A/B letter on the wheel.',
    answers: () => [{ value: 'major', label: 'Major (B)' }, { value: 'minor', label: 'Minor (A)' }],
    newRound() {
      const pc = Math.floor(Math.random() * 12);
      const quality = rand(['major', 'minor']);
      const midis = chordMidis(pc, quality);
      return {
        correct: quality,
        play() {
          stopAll();
          midis.slice(1).forEach((m, i) => playNote(m, { at: i * 0.4, dur: 0.5, ...QUIET }));
          playChord(midis, { at: 1.3, dur: 1.6, ...QUIET });
        },
        explain: () => `It was ${noteName(defaultNote(pc, getLang()), getLang())} ${quality}. Only the middle note differs: it sits ${quality === 'major' ? 4 : 3} semitones above the root.`,
      };
    },
  }));

  exercises.push(exercise(root, {
    id: 'blend',
    title: '2 · Does it mix?',
    intro: 'Track 1 plays alone, then track 2 joins like in a blend. Does it sound good together, or does it clash?',
    answers: () => [{ value: 'mix', label: 'Mixes well' }, { value: 'clash', label: 'Clashes' }],
    newRound() {
      const a = rand(KEYS);
      const fits = Math.random() < 0.5;
      const b = rand(KEYS.filter(k => k !== a && (fits ? shared(a, k) >= 6 : shared(a, k) <= 4)));
      const move = relationsOf(a).find(r => r.key === b);
      return {
        correct: fits ? 'mix' : 'clash',
        play: () => playBlend(a, b, QUIET),
        explain() {
          const lang = getLang();
          const how = move ? `${move.label} (${move.short})` : `${wheelDistance(a, b)} steps apart on the wheel`;
          return `Track 1 was <b>${a.id}</b> (${keyName(a, lang)}), track 2 <b>${b.id}</b> (${keyName(b, lang)}): ${how}, sharing ${shared(a, b)} of 7 notes.
            <button class="link" type="button" data-show="${a.id}|${b.id}">Show on the wheel</button>`;
        },
      };
    },
  }));

  exercises.push(exercise(root, {
    id: 'note',
    title: '3 · Name the note',
    intro: 'First you hear C as a reference, then a mystery note within the next octave. Which note is it? Tip: sing up from C.',
    answers: () => Array.from({ length: 12 }, (_, pc) => ({ value: pc, label: noteName(defaultNote(pc, getLang()), getLang()) })),
    newRound() {
      const pc = Math.floor(Math.random() * 12);
      return {
        correct: pc,
        play() {
          stopAll();
          playNote(60, { dur: 0.8, ...QUIET });
          playNote(60 + pc, { at: 1.1, dur: 1.2, ...QUIET });
        },
        explain: () => `It was ${noteName(defaultNote(pc, getLang()), getLang())}, ${pc} semitones above C (${INTERVALS[pc]}).`,
      };
    },
  }));

  root.addEventListener('click', e => {
    const btn = e.target.closest('[data-show]');
    if (btn) onShow(...btn.dataset.show.split('|'));
  });

  return { refresh: () => exercises.forEach(x => x.refresh()) };
}
