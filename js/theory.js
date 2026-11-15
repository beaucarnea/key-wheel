// Music theory for the Camelot wheel: keys, scales, note spelling and mixing moves.

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Conventional root spelling for each Camelot number (index 1–12).
const MAJOR_ROOTS = [null, 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E'];
const MINOR_ROOTS = [null, 'G#', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
// Enharmonic names DJ software also shows for the same key.
const ALT_ROOTS = { '1A': 'Ab', '2A': 'D#', '2B': 'Gb', '3B': 'C#' };

export const STEPS = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const TRIAD = { major: [0, 4, 7], minor: [0, 3, 7] };

export const INTERVALS = [
  'unison', 'minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th',
  'tritone', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th', 'major 7th',
];

export const mod12 = n => ((n % 12) + 12) % 12;
const wrap12 = n => mod12(n - 1) + 1;

export function parseNote(str) {
  const letter = str[0];
  let acc = 0;
  for (const ch of str.slice(1)) acc += ch === '#' ? 1 : ch === 'b' ? -1 : 0;
  return { letter, acc, pc: mod12(LETTER_PC[letter] + acc) };
}

// English: C♯, B♭ – German: Cis, B, H, Es, As.
export function noteName(note, lang = 'en') {
  const { letter, acc } = note;
  if (lang !== 'de') return letter + (acc > 0 ? '♯'.repeat(acc) : '♭'.repeat(-acc));
  if (letter === 'B') {
    if (acc === 0) return 'H';
    if (acc === -1) return 'B';
    return acc > 0 ? 'H' + 'is'.repeat(acc) : 'Heses';
  }
  if (acc === 0) return letter;
  if (acc > 0) return letter + 'is'.repeat(acc);
  if (letter === 'E' || letter === 'A') return letter + 's' + 'es'.repeat(-acc - 1);
  return letter + 'es'.repeat(-acc);
}

// Spelling for notes outside any key context (keyboard, ear trainer).
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(parseNote);
export function defaultNote(pc, lang = 'en') {
  return lang === 'de' && pc === 10 ? parseNote('Bb') : SHARPS[mod12(pc)];
}

function spellScale(root, mode) {
  const li = LETTERS.indexOf(root.letter);
  return STEPS[mode].map((step, i) => {
    const letter = LETTERS[(li + i) % 7];
    const pc = mod12(root.pc + step);
    let acc = mod12(pc - LETTER_PC[letter]);
    if (acc > 6) acc -= 12;
    return { letter, acc, pc };
  });
}

function makeKey(num, letter) {
  const mode = letter === 'B' ? 'major' : 'minor';
  const id = `${num}${letter}`;
  const root = parseNote((mode === 'major' ? MAJOR_ROOTS : MINOR_ROOTS)[num]);
  const scale = spellScale(root, mode);
  return {
    id, num, letter, mode, root,
    alt: ALT_ROOTS[id] ? parseNote(ALT_ROOTS[id]) : null,
    rootPc: root.pc,
    scale,
    pcs: new Set(scale.map(n => n.pc)),
  };
}

export const KEYS = [];
for (let n = 1; n <= 12; n++) for (const l of ['A', 'B']) KEYS.push(makeKey(n, l));

export const getKey = id => KEYS.find(k => k.id === id);
export const keyAt = (num, letter) => getKey(`${wrap12(num)}${letter}`);

export function keyName(key, lang = 'en', useAlt = false) {
  const n = noteName(useAlt && key.alt ? key.alt : key.root, lang);
  if (lang === 'de') return key.mode === 'major' ? `${n}-Dur` : `${n.toLowerCase()}-Moll`;
  return `${n} ${key.mode}`;
}

export function shortName(key, lang = 'en') {
  const n = noteName(key.root, lang);
  if (lang === 'de') return key.mode === 'major' ? n : n.toLowerCase();
  return key.mode === 'major' ? n : n + 'm';
}

// How Rekordbox, Serato & co. write it, e.g. "C#m", "Abm", "F#".
export function softwareName(key, useAlt = false) {
  const { letter, acc } = useAlt && key.alt ? key.alt : key.root;
  return letter + (acc > 0 ? '#' : acc < 0 ? 'b' : '') + (key.mode === 'minor' ? 'm' : '');
}

// Traktor's Open Key: 1d = C major, 1m = A minor.
export const openKey = key => `${wrap12(key.num - 7)}${key.mode === 'major' ? 'd' : 'm'}`;

export const MOVES = [
  { type: 'same', short: '=', label: 'Same key', get: k => k,
    desc: 'Identical notes. The safest mix.' },
  { type: 'down', short: '−1', label: 'One step down', get: k => keyAt(k.num - 1, k.letter),
    desc: 'Neighbour on the wheel, a fifth lower. Smooth, slightly calmer.' },
  { type: 'up', short: '+1', label: 'One step up', get: k => keyAt(k.num + 1, k.letter),
    desc: 'Neighbour on the wheel, a fifth higher. Smooth, slight lift in energy.' },
  { type: 'relative', short: 'A↔B', label: 'Relative major/minor', get: k => keyAt(k.num, k.letter === 'A' ? 'B' : 'A'),
    desc: 'Same notes, different home tone. Switches the mood between darker (A) and brighter (B).' },
  { type: 'boost', short: '+2', label: 'Energy boost', get: k => keyAt(k.num + 2, k.letter),
    desc: 'Two steps up. Noticeable – keep the blend short.' },
  { type: 'semitone', short: '+7', label: 'Semitone up', get: k => keyAt(k.num + 7, k.letter),
    desc: 'Everything jumps up a half step. Works as a hard switch, not as a long blend.' },
];

export const relationsOf = key => MOVES.map(m => ({ ...m, key: m.get(key) }));
export const shared = (a, b) => [...a.pcs].filter(pc => b.pcs.has(pc)).length;

// Steps between two keys on the wheel, ignoring A/B.
export function wheelDistance(a, b) {
  const d = mod12(b.num - a.num);
  return Math.min(d, 12 - d);
}

// A triad with its root near `center`, plus a bass note an octave below.
export function chordMidis(rootPc, quality, center = 60) {
  const root = center - 5 + mod12(rootPc - (center - 5));
  return [root - 12, ...TRIAD[quality].map(i => root + i)];
}

// I–IV–V–I (major) or i–iv–V–i (minor): makes the key's home tone obvious.
export function cadence(key, center = 60) {
  const degrees = key.mode === 'major'
    ? [[0, 'major'], [5, 'major'], [7, 'major'], [0, 'major']]
    : [[0, 'minor'], [5, 'minor'], [7, 'major'], [0, 'minor']];
  return degrees.map(([d, q]) => chordMidis(mod12(key.rootPc + d), q, center));
}

export function scaleMidis(key) {
  const start = 60 + key.rootPc - (key.rootPc > 6 ? 12 : 0);
  return [...STEPS[key.mode].map(s => start + s), start + 12];
}
