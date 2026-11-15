# Key Wheel

A small website for learning the **Camelot wheel** and training your ears for harmonic mixing.

- **Wheel**: all 24 keys. Click one to hear it and see which keys it mixes with (−1, +1, A↔B, +2, +7), how many notes they share, and the key in every notation (Camelot, Open Key, software, German).
- **Learn**: the theory step by step, with sound examples for each idea.
- **Train**: three ear-training exercises (major or minor, does it mix, name the note). Scores are stored in your browser.
- **Keyboard**: three octaves, playable with the mouse or the computer keyboard (`A W S E D F T G Y/Z H U J K` = C4–C5).

All sounds are generated live with the Web Audio API. There are no samples, dependencies or build step.

## Run it

The page uses ES modules, so it has to be served over HTTP (opening `index.html` directly will not work). From the project folder, run:

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Structure

```
index.html        Page layout and lesson texts
css/style.css     Styles (light and dark mode)
js/theory.js      Keys, scales, note spelling, Camelot/Open Key, mixing moves
js/audio.js       Web Audio synth (notes, chords, sequences, stop)
js/demos.js       Sound examples: chord, scale, cadence, blend
js/wheel.js       SVG Camelot wheel
js/keyboard.js    Piano keyboard that lights up with every note
js/trainer.js     Ear-training exercises
js/main.js        Wires everything together
```
