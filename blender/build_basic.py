"""PULSE-16 BASIC v2 — layout A "workbench rows": controls ordered by how often you touch them
(sound settings at the back, track pads directly above the steps, PLAY + keys under your hands)."""
import json
import os
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as c  # noqa: E402
import screens  # noqa: E402
from build_rhythm import STEP_COLORS, TOP, knob  # noqa: E402

OUT = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].endswith('.py') else '.'
SELECTED_STEPS = {0, 4, 8, 12}  # KICK track selected in the render
PLAYHEAD = 6
WELL = 0.52  # keybed well surface height

# plates: name -> (x0, x1, y0, y1); every control must sit inside one (checked below)
PLATES = {'upper': (-3.25, 3.25, 0.3, 2.4), 'strip': (-3.25, 3.25, -1.45, 0.25), 'well': (-3.25, 3.25, -2.4, -1.5)}
FOOTPRINTS = []
CALLOUTS = []


def place(name, plate, x, y, w, d):
    FOOTPRINTS.append((name, plate, x - w / 2, x + w / 2, y - d / 2, y + d / 2))


def callout(title, job, pos):
    CALLOUTS.append((len(CALLOUTS) + 1, title, job, pos))


def check_bounds():
    bad = []
    for name, plate, x0, x1, y0, y1 in FOOTPRINTS:
        px0, px1, py0, py1 = PLATES[plate]
        if x0 < px0 or x1 > px1 or y0 < py0 or y1 > py1:
            bad.append(f'{name} ({x0:.2f}..{x1:.2f}, {y0:.2f}..{y1:.2f}) outside {plate}')
    for i, a in enumerate(FOOTPRINTS):
        for b in FOOTPRINTS[i + 1:]:
            if a[1] == b[1] and a[2] < b[3] and b[2] < a[3] and a[4] < b[5] and b[4] < a[5]:
                bad.append(f'{a[0]} overlaps {b[0]}')
    assert not bad, 'layout problems:\n' + '\n'.join(bad)
    print(f'bounds ok: {len(FOOTPRINTS)} controls inside their plates', flush=True)


def build():
    c.reset()
    c.world('studio.exr', 0.5, (0.13, 0.13, 0.14))
    c.studio(key=4200, fill=800, rim=2600, exposure=-0.55)
    m = {
        'floor': c.paint('floor', (0.1, 0.1, 0.11), 0.85, 0.02),
        'case': c.paint('case', (0.03, 0.03, 0.032), 0.45, 0.05),
        'upper': c.paint('upper', (0.46, 0.43, 0.37), 0.5, 0.05),
        'strip': c.paint('strip', (0.028, 0.028, 0.03), 0.55, 0.05),
        'ink': c.ink('ink', (0.04, 0.04, 0.04), 0.5),
        'ink_w': c.ink('ink_w', (0.88, 0.87, 0.83), 0.45),
        'ink_r': c.ink('ink_r', (0.75, 0.12, 0.05), 0.45),
        'knob': c.plastic('knob', (0.015, 0.015, 0.016), 0.4, 0.05),
        'knob_top': c.plastic('knob_top', (0.2, 0.2, 0.21), 0.55, 0.0),
        'white': c.plastic('keyw', (0.78, 0.77, 0.74), 0.3, 0.15),
        'black': c.plastic('keyb', (0.02, 0.02, 0.022), 0.3, 0.2),
        'acrylic': c.glass('smoked', (0.25, 0.08, 0.08), 0.05),
        'bezel': c.paint('bezel', (0.01, 0.01, 0.01), 0.3),
        'led_off': c.led_lens('led_off', (0.3, 0.03, 0.02), 0.0),
        'led_used': c.led_lens('led_used', (1, 0.08, 0.04), 3.0),
        'led_on': c.led_lens('led_on', (1, 0.15, 0.08), 16.0),
        'btn': c.rubber('btn', (0.12, 0.12, 0.125)),
        'play': c.plastic('play', (0.85, 0.3, 0.04), 0.3, 0.2),
    }
    steps = [c.plastic(f'step{g}', col, 0.22, 0.3) for g, col in enumerate(STEP_COLORS)]
    c.floor(m['floor'])
    z = TOP + 0.001

    # --- case and plates (6.8 x 5.0) ---------------------------------------------------
    c.box('case', (6.8, 5.0, 0.5), (0, 0, 0), m['case'], bev=0.1, seg=5)
    for key, mat, h in (('upper', m['upper'], 0.06), ('strip', m['strip'], 0.06), ('well', m['strip'], 0.02)):
        x0, x1, y0, y1 = PLATES[key]
        c.box(f'plate_{key}', (x1 - x0, y1 - y0, h), ((x0 + x1) / 2, (y0 + y1) / 2, 0.5), mat, bev=0.015 if h > 0.03 else 0.01)

    c.text('PULSE-16', (-3.05, 2.2, z), 0.22, m['ink'], align='LEFT', spacing=1.2)
    c.text('BASIC', (-1.55, 2.2, z), 0.22, m['ink_r'], align='LEFT', spacing=1.2)
    c.text('PLAYGROUND ELECTRONICS', (3.05, 2.19, z), 0.09, m['ink'], align='RIGHT', spacing=1.5)
    c.box('rule', (6.1, 0.012, 0.002), (0, 2.03, TOP), m['ink'], bev=0)

    # --- back row 1: screen | SPEED, VOLUME ------------------------------------------
    disp = os.path.join(OUT, 'basic_matrix.png')
    screens.matrix(disp, 'KICK', 'BASS', 112, 4, 'C4', SELECTED_STEPS, PLAYHEAD)
    sx, sy = -1.35, 1.55
    c.box('screen_bezel', (3.62, 0.92, 0.03), (sx, sy, TOP), m['bezel'], bev=0.02)
    c.plane('screen', 3.5, 0.8, (sx, sy, TOP + 0.033), c.screen_mat('matrix', disp, 3.0))
    c.box('screen_acrylic', (3.56, 0.86, 0.012), (sx, sy, TOP + 0.036), m['acrylic'], bev=0.004)
    place('screen', 'upper', sx, sy, 3.62, 0.92)
    callout('SCREEN', 'track · sound · speed · octave · note · pattern', (sx, sy, TOP))

    for x, name, n, job in [(1.3, 'SPEED', 0.4, 'how fast the loop plays'), (2.55, 'VOLUME', 0.7, 'overall loudness')]:
        knob(name.lower(), x, 1.62, 0.24, n, m)
        c.text(name, (x, 1.13, z), 0.1, m['ink'])
        place(name, 'upper', x, 1.45, 0.8, 0.8)
        callout(name, job, (x, 1.62, TOP + 0.3))

    # --- back row 2: TONE LENGTH ECHO SPACE | SOUND, CLEAR ---------------------------
    for i, (name, n, job) in enumerate([('TONE', 0.45, 'dark to bright'), ('LENGTH', 0.35, 'short to long notes'),
                                        ('ECHO', 0.2, 'repeats of each note'), ('SPACE', 0.25, 'small room to big hall')]):
        kx = -2.6 + i * 0.95
        knob(name.lower(), kx, 0.8, 0.2, n, m)
        c.text(name, (kx, 0.4, z), 0.1, m['ink'])
        place(name, 'upper', kx, 0.62, 0.7, 0.62)
        callout(name, job, (kx, 0.8, TOP + 0.28))
    for x, name, job in [(1.3, 'SOUND', 'pick Bass, Keys, Lead or Pad'), (2.55, 'CLEAR', 'wipe the selected track')]:
        c.box(f'btn_{name.lower()}', (0.86, 0.46, 0.1), (x, 0.7, TOP), m['btn'], bev=0.05, seg=4)
        c.text(name, (x, 0.7, TOP + 0.101), 0.12, m['ink_w'])
        place(name, 'upper', x, 0.7, 0.86, 0.46)
        callout(name, job, (x, 0.7, TOP + 0.1))

    # --- middle: 5 track pads above the 16 steps -------------------------------------
    tracks = [('KICK', (0.55, 0.12, 0.05), (1, 0.3, 0.1), 'ink_w'), ('SNARE', (0.62, 0.44, 0.07), (1, 0.75, 0.2), 'ink'),
              ('HAT', (0.1, 0.38, 0.33), (0.3, 1, 0.8), 'ink_w'), ('CLAP', (0.14, 0.24, 0.55), (0.35, 0.6, 1), 'ink_w'),
              ('NOTES', (0.7, 0.68, 0.6), (1, 0.95, 0.85), 'ink')]
    pitch = 6.2 / len(tracks)
    for i, (name, col, glow, ink) in enumerate(tracks):
        px = -3.1 + pitch / 2 + i * pitch
        sel = name == 'KICK'
        c.box(f'track_{name.lower()}_rim', (pitch - 0.06, 0.44, 0.03), (px, 0.0, TOP), c.emissive(f'rim{i}', glow, 10.0 if sel else 0.15), bev=0.04, seg=4)
        c.box(f'track_{name.lower()}', (pitch - 0.14, 0.36, 0.1), (px, 0.0, TOP), c.rubber(f'pad{i}', col, 0.7, glow if sel else None, 0.25 if sel else 0), bev=0.06, seg=4)
        c.text(name, (px, 0.0, TOP + 0.101), 0.11, m[ink])
        place(f'track_{name}', 'strip', px, 0.0, pitch - 0.06, 0.44)
    callout('TRACK PADS', 'tap to hear a drum + choose what the steps edit', (-0.62, 0.0, TOP + 0.1))
    callout('NOTES', 'edit the melody instead of a drum', (-3.1 + pitch * 4.5, 0.0, TOP + 0.1))

    for i in range(16):
        sx_ = -2.925 + i * 0.39
        c.box(f'step_{i}', (0.33, 0.46, 0.1), (sx_, -0.8, TOP), steps[i // 4], bev=0.03, seg=4)
        lm = m['led_on'] if i == PLAYHEAD else m['led_used'] if i in SELECTED_STEPS else m['led_off']
        c.dome(f'led_{i}', 0.042, 0.028, (sx_, -0.36, TOP), lm)
        c.text(str(i + 1), (sx_, -1.22, z), 0.085, m['ink_w'])
        place(f'step_{i}', 'strip', sx_, -0.8, 0.33, 0.46)
    callout('STEP LIGHTS', 'which beats are on + where the loop is', (0.2, -0.36, TOP))
    callout('STEP KEYS', 'turn each of the 16 beats on or off', (-1.365, -0.8, TOP + 0.1))

    # --- front: PLAY, OCT, keys ----------------------------------------------------------
    c.box('btn_play', (0.8, 0.62, 0.12), (-2.72, -1.95, WELL), m['play'], bev=0.06, seg=4)
    c.text('▶ ■', (-2.72, -1.95, WELL + 0.121), 0.2, m['ink'], font=c.FONT_REG)
    place('PLAY', 'well', -2.72, -1.95, 0.8, 0.62)
    callout('PLAY / STOP', 'start or stop the loop', (-2.72, -1.95, WELL + 0.12))
    for i, label in enumerate(['OCT −', 'OCT +']):
        bx = -1.78 + i * 0.54
        c.box(f'btn_oct{i}', (0.46, 0.4, 0.09), (bx, -1.95, WELL), m['btn'], bev=0.045, seg=4)
        c.text(label, (bx, -1.95, WELL + 0.091), 0.085, m['ink_w'], font=c.FONT_BOLD)
        place(label, 'well', bx, -1.95, 0.46, 0.4)
    callout('OCT − / +', 'move the keys lower or higher', (-1.51, -1.95, WELL + 0.09))

    zone0, zone1 = -0.9, 3.2  # between OCT+ and the plate edge; keys centred in it
    white_w = 0.48
    x0 = (zone0 + zone1) / 2 - 4 * white_w
    c.keybed('key', x0, -2.36, white_w, 0.82, 0.5, WELL, m, gap=0.022, white_h=0.14, black_h=0.09, count=13, pressed=(0,))
    place('keys', 'well', (zone0 + zone1) / 2, -1.95, 8 * white_w, 0.82)
    callout('KEYS', 'play notes; on NOTES, write them into steps', ((zone0 + zone1) / 2, -2.1, WELL + 0.15))

    check_bounds()
    return c.top_camera(8.3, 12, (0, 0.0, 0.5)), c.hero_camera()


def save_callouts(cam, path):
    s = bpy.context.scene
    bpy.context.view_layer.update()  # camera matrix_world is stale until the depsgraph updates
    out = []
    for n, title, job, pos in CALLOUTS:
        v = world_to_camera_view(s, cam, c.Vector(pos))
        out.append({'n': n, 'title': title, 'job': job, 'x': v.x, 'y': 1 - v.y})
    with open(path, 'w') as f:
        json.dump(out, f, indent=1)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    top, hero = build()
    views = os.environ.get('VIEWS', 'top,hero').split(',')
    save_callouts(top, os.path.join(OUT, 'basic_callouts.json'))
    if 'top' in views:
        c.render(top, os.path.join(OUT, 'basic_top.png'))
    if 'hero' in views:
        c.render(hero, os.path.join(OUT, 'basic_hero.png'))
