// The Camelot wheel as SVG: outer ring = major (B), inner ring = minor (A).

import { KEYS, shortName } from './theory.js';

const NS = 'http://www.w3.org/2000/svg';
const R = { center: 72, inner: 150, outer: 238 };

export const keyHue = key => ((key.num - 1) * 30 + 150) % 360;
export const keyColor = key => key.letter === 'B'
  ? `hsl(${keyHue(key)} 62% 60%)`
  : `hsl(${keyHue(key)} 52% 42%)`;

function el(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function polar(r, deg) {
  const a = (deg - 90) * Math.PI / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
}

function segmentPath(r1, r2, a1, a2) {
  const [x1, y1] = polar(r2, a1);
  const [x2, y2] = polar(r2, a2);
  const [x3, y3] = polar(r1, a2);
  const [x4, y4] = polar(r1, a1);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
}

export function createWheel(svg, { onSelect, onHover, onCenter }) {
  svg.setAttribute('viewBox', '-245 -245 490 490');
  const segs = new Map();

  for (const key of KEYS) {
    const angle = (key.num % 12) * 30; // 12 at the top, like a clock
    const [r1, r2] = key.letter === 'A' ? [R.center, R.inner] : [R.inner, R.outer];
    const g = el('g', { class: `seg seg-${key.letter}`, tabindex: 0, role: 'button', 'aria-label': key.id });
    const path = el('path', { d: segmentPath(r1, r2, angle - 15, angle + 15), fill: keyColor(key) });
    const [x, y] = polar((r1 + r2) / 2, angle);
    const id = el('text', { x, y: y - 7, class: 'seg-id' });
    id.textContent = key.id;
    const name = el('text', { x, y: y + 11, class: 'seg-name' });
    g.append(path, id, name);

    g.addEventListener('click', () => onSelect(key));
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(key); }
    });
    g.addEventListener('mouseenter', () => onHover(key));
    g.addEventListener('mouseleave', () => onHover(null));
    svg.append(g);
    segs.set(key.id, { g, name, key });
  }

  const center = el('g', { class: 'wheel-center', role: 'button', tabindex: 0 });
  center.append(el('circle', { r: R.center - 3 }));
  const lines = [el('text', { y: -16, class: 'c1' }), el('text', { y: 8, class: 'c2' }), el('text', { y: 28, class: 'c3' })];
  center.append(...lines);
  center.addEventListener('click', () => onCenter());
  svg.append(center);

  return {
    setNames(lang) {
      segs.forEach(s => { s.name.textContent = shortName(s.key, lang); });
    },
    // marks: Map of key id → move type ("same", "up", …)
    setState(selected, marks) {
      segs.forEach((s, id) => {
        s.g.classList.toggle('selected', selected?.id === id);
        s.g.classList.toggle('dim', !!selected && !marks.has(id));
        s.g.dataset.rel = marks.get(id) || '';
      });
      // Draw highlighted segments last so their outlines are not covered.
      for (const id of marks.keys()) svg.insertBefore(segs.get(id).g, center);
      if (selected) svg.insertBefore(segs.get(selected.id).g, center);
    },
    setCenter(texts) {
      lines.forEach((t, i) => { t.textContent = texts[i] || ''; });
    },
  };
}
