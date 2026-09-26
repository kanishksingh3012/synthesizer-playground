"""Concept 3 — Semi-Modular ("LATTICE"): patch bay with draped cables."""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as c  # noqa: E402
import screens  # noqa: E402

OUT = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].endswith('.py') else '.'
KNOBS = [('cutoff', 'CUTOFF', 0.48), ('resonance', 'RES', 0.59), ('attack', 'ATTACK', 0.14), ('decay', 'DECAY', 0.55),
         ('sustain', 'SUSTAIN', 0.2), ('release', 'RELEASE', 0.42), ('delay', 'DELAY', 0.15), ('reverb', 'REVERB', 0.11)]
JACKS = [['VCO 1', 'VCO 2', 'NOISE', 'MIX IN', 'VCF IN', 'VCF OUT'],
         ['LFO', 'ENV', 'VCA CV', 'CUTOFF', 'GATE', 'CLOCK'],
         ['DLY IN', 'DLY OUT', 'REV IN', 'REV OUT', 'MIX', 'OUT']]
OUTPUTS = {'VCO 1', 'VCO 2', 'NOISE', 'VCF OUT', 'LFO', 'ENV', 'CLOCK', 'DLY OUT', 'REV OUT', 'OUT'}
CABLES = [((0, 0), (0, 4), (0.85, 0.12, 0.08), 0.35), ((0, 5), (2, 0), (0.95, 0.72, 0.1), -0.3),
          ((1, 1), (1, 3), (0.1, 0.35, 0.85), 0.28), ((2, 1), (2, 2), (0.92, 0.9, 0.86), 0.2), ((1, 0), (0, 3), (0.95, 0.4, 0.05), -0.25)]
TOP = 0.62


def jack_xy(r, col):
    return 0.95 + col * 0.58, 2.28 - r * 0.62


def knob(param, x, y, r, n, m):
    k = c.empty(f'knob_{param}', (x, y, TOP), (0, 0, (0.75 - n * 1.5) * math.pi))
    c.adopt(k,
            c.cylinder(f'{param}_base', r * 1.12, 0.06, (0, 0, 0), m['knob_dark'], seg=64, bev=0.01),
            c.cylinder(f'{param}_body', r, 0.3, (0, 0, 0.06), m['cream'], knurl=14, knurl_depth=0.08, bev=0.02),
            c.cylinder(f'{param}_top', r * 0.8, 0.02, (0, 0, 0.36), m['cream'], seg=64, bev=0.008),
            c.box(f'{param}_line', (0.028, r * 0.75, 0.004), (0, r * 0.45, 0.382), m['ink_k'], bev=0))
    for t in range(11):
        a = math.radians(225 - t * 27)
        c.box(f'{param}_tick{t}', (0.012, 0.045, 0.002), (x + math.cos(a) * r * 1.42, y + math.sin(a) * r * 1.42, TOP + 0.001), m['ink'], bev=0, rot=(0, 0, a - math.pi / 2))
    return k


def build():
    c.reset()
    c.world('lobby.exr', 0.45, (0.3, 0.31, 0.33))
    c.studio(key=4800, fill=900, rim=2400, exposure=-0.3)
    m = {
        'floor': c.paint('floor', (0.3, 0.31, 0.33), 0.85, 0.02),
        'cheek': c.brushed_metal('cheek', (0.72, 0.72, 0.74), 0.3, 0.6, direction='Y'),
        'case': c.paint('case', (0.02, 0.02, 0.022), 0.5),
        'panel': c.paint('panel', (0.035, 0.036, 0.04), 0.62, 0.08),
        'ink': c.ink('ink', (0.84, 0.83, 0.79), 0.45),
        'ink_k': c.ink('ink_k', (0.02, 0.02, 0.02), 0.45),
        'cream': c.plastic('cream', (0.78, 0.72, 0.58), 0.3, 0.2, sss=0.03),
        'knob_dark': c.plastic('knob_dark', (0.02, 0.02, 0.02), 0.4),
        'nut': c.brushed_metal('nut', (0.78, 0.78, 0.8), 0.18, 0.5, radial=True),
        'hole': c.ink('hole', (0.005, 0.005, 0.005), 0.8),
        'white': c.plastic('keyw', (0.86, 0.85, 0.82), 0.18, 0.35),
        'black': c.plastic('keyb', (0.01, 0.01, 0.011), 0.18, 0.4),
        'bezel': c.paint('bezel', (0.008, 0.008, 0.008), 0.3),
        'glass': c.glass('glass'),
        'led_off': c.led_lens('led_off', (0.3, 0.03, 0.02), 0.0),
        'led_used': c.led_lens('led_used', (1, 0.1, 0.05), 3.0),
        'led_on': c.led_lens('led_on', (1, 0.18, 0.1), 16.0),
        'btn': c.rubber('btn', (0.08, 0.08, 0.085)),
        'plug_metal': c.brushed_metal('plug_metal', (0.8, 0.8, 0.82), 0.2, 0.3, radial=True),
    }
    c.floor(m['floor'])

    # --- case ---------------------------------------------------------------------
    for sx in (-1, 1):
        c.box(f'cheek_{sx}', (0.32, 5.5, 0.92), (sx * 4.2, 0.05, 0), m['cheek'], bev=0.09, seg=5)
    c.box('case', (8.08, 5.4, 0.55), (0, 0.05, 0), m['case'], bev=0.03)
    c.box('panel', (8.08, 2.75, 0.07), (0, 1.35, 0.55), m['panel'], bev=0.012)

    c.text('LATTICE', (-4.0, 2.55, TOP + 0.001), 0.2, m['ink'], align='LEFT', spacing=1.35)
    c.text('SEMI-MODULAR SYNTHESIZER', (-2.55, 2.54, TOP + 0.001), 0.075, m['ink'], align='LEFT', spacing=1.4)

    # OLED
    screens.oled(os.path.join(OUT, 'modular_oled.png'))
    c.box('oled_bezel', (1.25, 0.66, 0.03), (-3.35, 1.72, TOP), m['bezel'], bev=0.02)
    c.plane('screen', 1.1, 0.55, (-3.35, 1.72, TOP + 0.033), c.screen_mat('oled', os.path.join(OUT, 'modular_oled.png'), 2.2))
    c.box('oled_glass', (1.16, 0.6, 0.01), (-3.35, 1.72, TOP + 0.036), m['glass'], bev=0.003)

    for i, (param, label, n) in enumerate(KNOBS):
        kx, ky = -2.3 + (i % 4) * 0.68, 1.95 if i < 4 else 1.1
        knob(param, kx, ky, 0.2, n, m)
        c.text(label, (kx, ky - 0.4, TOP + 0.001), 0.058, m['ink'])
    c.box('div', (0.012, 2.1, 0.002), (0.5, 1.45, TOP), m['ink'], bev=0)

    # patch bay
    jack_top = {}
    for r, row in enumerate(JACKS):
        for col, name in enumerate(row):
            jx, jy = jack_xy(r, col)
            if name in OUTPUTS:
                c.box(f'jack_out_{r}{col}', (0.36, 0.44, 0.002), (jx, jy - 0.07, TOP), m['ink'], bev=0)
            c.cylinder(f'jack_nut_{r}{col}', 0.09, 0.035, (jx, jy, TOP), m['nut'], seg=6, bev=0.006)
            c.cylinder(f'jack_hole_{r}{col}', 0.045, 0.002, (jx, jy, TOP + 0.036), m['hole'], seg=24)
            c.text(name, (jx, jy - 0.22, TOP + 0.002), 0.052, m['ink_k'] if name in OUTPUTS else m['ink'])
            jack_top[(r, col)] = (jx, jy)
    for i, (a, b, col, bow) in enumerate(CABLES):
        boot = c.plastic(f'boot{i}', col, 0.35, 0.1)
        ends = []
        for j, key in enumerate((a, b)):
            jx, jy = jack_top[key]
            c.cylinder(f'plug{i}{j}_ring', 0.07, 0.07, (jx, jy, TOP + 0.035), m['plug_metal'], seg=32, bev=0.008)
            c.cylinder(f'plug{i}{j}_boot', 0.075, 0.24, (jx, jy, TOP + 0.1), boot, seg=32, r_top=0.05, bev=0.02)
            ends.append((jx, jy, TOP + 0.33))
        c.cable(f'cable{i}', ends[0], ends[1], TOP + 0.12, bow, boot, 0.034)

    # step row
    for i in range(16):
        sx = -3.72 + i * 0.496
        c.box(f'step_{i}', (0.34, 0.3, 0.08), (sx, 0.28, TOP), m['btn'], bev=0.03, seg=4)
        lm = m['led_on'] if i == screens.CURRENT else m['led_used'] if i in screens.STEPS_USED else m['led_off']
        c.dome(f'led_{i}', 0.04, 0.028, (sx, 0.58, TOP), lm)
    c.text('SEQUENCER', (-4.0, 0.76, TOP + 0.001), 0.06, m['ink'], align='LEFT', spacing=1.4)

    # keybed + pads
    c.keybed('key', -2.1, -2.55, 0.4, 2.2, 1.35, 0.55, m, gap=0.016, pressed=(0, 4, 7))
    glows = [(1, 0.25, 0.08), (1, 0.6, 0.1), (1, 0.9, 0.3), (0.3, 0.9, 0.6), (0.3, 0.6, 1), (0.8, 0.4, 1)]
    for i, name in enumerate(['KICK', 'SNARE', 'HAT', 'CLAP', 'TOM', 'PERC']):
        px, py = -3.7 + (i % 3) * 0.54, -0.75 if i < 3 else -1.4
        c.box(f'pad_{name.lower()}', (0.46, 0.46, 0.09), (px, py, 0.55), c.rubber(f'pad{i}', (0.09, 0.09, 0.095), 0.7, glows[i], 0.35), bev=0.06, seg=4)
        c.text(name, (px, py - 0.3, 0.551), 0.045, m['ink'])

    return c.top_camera(9.3, 12, (0, 0.05, 0.6)), c.hero_camera()


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    top, hero = build()
    views = os.environ.get('VIEWS', 'top,hero').split(',')
    if 'top' in views:
        c.render(top, os.path.join(OUT, 'modular_top.png'))
    if 'hero' in views:
        c.render(hero, os.path.join(OUT, 'modular_hero.png'))
