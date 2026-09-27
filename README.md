# Synthesizer Playground

Browser synth playground: play a 3D synth (HEX-16), sequence a beat + melody, export audio.

## Status
- `src/` — Vite + React + TS app: Tone.js engine (`src/audio`), zustand store, `controller.ts` (every control action), `input/keyboard.ts`, and `scene/Hex16.tsx`, which loads `public/models/hex16.glb` and wires each named part (keys, steps, pads, buttons, knobs, LEDs, screen).
- Re-export the model (Cycles bakes lighting + materials into one texture, ~70 min on 4 CPUs): `SYNTH_ASSETS=blender/assets BAKE=raw.glb .venv/bin/python blender/bake_hex16.py /tmp && npx @gltf-transform/cli meshopt raw.glb public/models/hex16.glb`. The app shows that texture unlit, so the browser matches the renders; screen, LEDs and pad rims stay live.
- `blender/` — procedural Blender (bpy 5.0) models + Cycles renders. `build_hex16.py` = the HEX-16 design. HDRIs in `blender/assets` are CC0 (via `@pmndrs/assets`).
- `docs/design/` — current design renders.

## Run
```
npm install && npm run dev
```

## Render the design
```
python -m venv .venv && .venv/bin/pip install bpy==5.0.1 numpy pillow
SYNTH_ASSETS=blender/assets .venv/bin/python blender/build_hex16.py renders   # SPP=16 RES_PCT=40 for a quick test
```

## Link-preview cards
Three designs in `public/previews/`: **A** split (`hex16-a.jpg`), **B** centred (`hex16-b.jpg`, the live one), **C** sequencer (`hex16-c.jpg`).
To switch, change `og:image` / `twitter:image` in `index.html`. Regenerate: `python scripts/preview_cards.py` (Pillow + `npm install` for the Inter font);
the transparent source renders in `docs/brand/` come from `SPP=96 python blender/render_card.py docs/brand`.

## Checks (Playwright, Chromium)
- `node scripts/qa.cjs <out-dir> [url]` — production smoke test against `vite preview` (render, export, share links, phone gate).
- `node scripts/sound-probe.cjs` and `node scripts/click-levels.cjs` — audio levels against the dev server (`npx vite --port 5174`).
- `npx tsx --tsconfig tsconfig.app.json scripts/tutorial-preview.tsx tutorial-preview.html` — the tutorial as one review page.
