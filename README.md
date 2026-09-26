# Synthesizer Playground

Browser synth playground: play a 3D synth (PULSE-16 BASIC), sequence a beat + melody, export audio.

## Status
- `src/` — Vite + React + TS app: Tone.js audio engine (`src/audio`), zustand store, 3D scene. The 3D model in `src/scene` is a **placeholder**; the approved design is being ported from Blender.
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
