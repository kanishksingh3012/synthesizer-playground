# Synthesizer Playground

Browser synth playground: play a 3D synth (PULSE-16 BASIC), sequence a beat + melody, export audio.

## Status
- `src/` — Vite + React + TS app: Tone.js engine (`src/audio`), zustand store, `controller.ts` (every control action), `input/keyboard.ts`, and `scene/Pulse16.tsx`, which loads `public/models/pulse16-basic.glb` and wires each named part (keys, steps, pads, buttons, knobs, LEDs, screen).
- Re-export the model (Cycles bakes lighting + materials into one texture, ~15 min on 4 CPUs): `SYNTH_ASSETS=blender/assets BAKE=raw.glb .venv/bin/python blender/bake_basic.py /tmp && npx @gltf-transform/cli meshopt raw.glb public/models/pulse16-basic.glb`. The app shows that texture unlit, so the browser matches the renders; screen, LEDs and pad rims stay live.
- `blender/` — procedural Blender (bpy 5.0) models + Cycles renders. `build_basic.py` = approved PULSE-16 BASIC design. HDRIs in `blender/assets` are CC0 (via `@pmndrs/assets`).
- `docs/design/` — current design renders.

## Run
```
npm install && npm run dev
```

## Render the design
```
python -m venv .venv && .venv/bin/pip install bpy==5.0.1 numpy pillow
SYNTH_ASSETS=blender/assets .venv/bin/python blender/build_basic.py renders   # SPP=16 RES_PCT=40 for a quick test
```
