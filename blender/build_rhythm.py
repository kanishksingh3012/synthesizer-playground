"""Concept 2 — Rhythm Composer (the concept that became HEX-16): beat-first drum-machine layout."""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as c  # noqa: E402
import screens  # noqa: E402

OUT = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].endswith('.py') else '.'
KNOBS = [('cutoff', 'CUTOFF', 0.48), ('resonance', 'RESO', 0.59), ('attack', 'ATTACK', 0.14), ('decay', 'DECAY', 0.55),
         ('sustain', 'SUSTAIN', 0.2), ('release', 'RELEASE', 0.42), ('delay', 'DELAY', 0.15), ('reverb', 'REVERB', 0.11)]
DRUMS = ['KICK', 'SNARE', 'HI-HAT', 'CLAP', 'TOM', 'PERC']
DRUM_GLOW = [(1, 0.25, 0.08), (1, 0.6, 0.1), (1, 0.9, 0.3), (0.3, 0.9, 0.6), (0.3, 0.6, 1), (0.8, 0.4, 1)]
STEP_COLORS = [(0.5, 0.02, 0.01), (0.75, 0.16, 0.01), (0.8, 0.5, 0.02), (0.72, 0.69, 0.6)]
TOP = 0.56


def knob(param, x, y, r, n, m):
    k = c.empty(f'knob_{param}', (x, y, TOP), (0, 0, (0.75 - n * 1.5) * math.pi))
    c.adopt(k,
            c.cylinder(f'{param}_skirt', r * 1.35, 0.05, (0, 0, 0), m['knob'], seg=64, bev=0.01),
            c.box(f'{param}_skirt_line', (0.025, r * 0.3, 0.004), (0, r * 1.18, 0.05), m['ink_w'], bev=0),
            c.cylinder(f'{param}_body', r, 0.26, (0, 0, 0.05), m['knob'], knurl=24, knurl_depth=0.05, bev=0.01),
            c.cylinder(f'{param}_top', r * 0.86, 0.015, (0, 0, 0.31), m['knob_top'], seg=64, bev=0.005),
            c.box(f'{param}_line', (0.025, r * 0.7, 0.004), (0, r * 0.45, 0.325), m['ink_w'], bev=0))
    for t in range(11):
        a = math.radians(225 - t * 27)
        c.box(f'{param}_tick{t}', (0.014, 0.06 if t % 5 == 0 else 0.04, 0.002), (x + math.cos(a) * r * 1.62, y + math.sin(a) * r * 1.62, TOP + 0.001), m['ink'], bev=0, rot=(0, 0, a - math.pi / 2))
    return k


def build():
    c.reset()
    c.world('studio.exr', 0.5, (0.13, 0.13, 0.14))
    c.studio(key=4200, fill=800, rim=2600, exposure=-0.55)
    m = {
        'floor': c.paint('floor', (0.1, 0.1, 0.11), 0.85, 0.02),
        'case': c.paint('case', (0.03, 0.03, 0.032), 0.45, 0.05),
        'upper': c.paint('upper', (0.46, 0.43, 0.37), 0.5, 0.05),
        'strip': c.paint('strip', (0.028, 0.028, 0.03), 0.55, 0.05),
        'ink': c.ink('ink', (0.05, 0.05, 0.05), 0.5),
        'ink_w': c.ink('ink_w', (0.85, 0.84, 0.8), 0.45),
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
        'start': c.plastic('start', (0.85, 0.3, 0.04), 0.3, 0.2),
    }
    steps = [c.plastic(f'step{g}', col, 0.22, 0.3) for g, col in enumerate(STEP_COLORS)]
    c.floor(m['floor'])

    # --- case and plates --------------------------------------------------------------
    c.box('case', (8.7, 5.3, 0.5), (0, 0, 0), m['case'], bev=0.1, seg=5)
    c.box('plate_upper', (8.4, 2.5, 0.06), (0, 1.33, 0.5), m['upper'], bev=0.015)
    c.box('plate_steps', (8.4, 1.32, 0.06), (0, -0.62, 0.5), m['strip'], bev=0.015)
    c.box('keybed_well', (8.4, 1.38, 0.02), (0, -1.98, 0.5), m['strip'], bev=0.01)

    # wordmark row
    c.text('HEX-16', (-4.0, 2.36, TOP + 0.001), 0.26, m['ink'], align='LEFT', spacing=1.2)
    c.text('RHYTHM COMPOSER', (-2.3, 2.34, TOP + 0.001), 0.1, m['ink_r'], align='LEFT', spacing=1.5)
    c.text('PLAYGROUND ELECTRONICS', (4.0, 2.34, TOP + 0.001), 0.09, m['ink'], align='RIGHT', spacing=1.5)
    c.box('rule', (8.0, 0.012, 0.002), (0, 2.14, TOP), m['ink'], bev=0)

    # tempo display + transport
    screens.led7(os.path.join(OUT, 'rhythm_led.png'))
    c.box('disp_bezel', (1.35, 0.6, 0.03), (-3.3, 1.55, TOP), m['bezel'], bev=0.02)
    c.plane('screen', 1.2, 0.5, (-3.3, 1.55, TOP + 0.033), c.screen_mat('led7', os.path.join(OUT, 'rhythm_led.png'), 3.5))
    c.box('disp_acrylic', (1.25, 0.54, 0.012), (-3.3, 1.55, TOP + 0.036), m['acrylic'], bev=0.004)
    c.text('TEMPO', (-3.3, 1.14, TOP + 0.001), 0.07, m['ink'])
    for i, (label, mat) in enumerate([('START', m['start']), ('STOP', m['btn'])]):
        bx = -3.62 + i * 0.66
        c.box(f'btn_{label.lower()}', (0.56, 0.36, 0.1), (bx, 0.62, TOP), mat, bev=0.05, seg=4)
        c.text(label, (bx, 0.36, TOP + 0.001), 0.065, m['ink'])

    # 8 knobs, 2 rows
    for i, (param, label, n) in enumerate(KNOBS):
        kx, ky = -1.95 + (i % 4) * 0.72, 1.62 if i < 4 else 0.7
        knob(param, kx, ky, 0.19, n, m)
        c.text(label, (kx, ky + 0.42, TOP + 0.001), 0.06, m['ink'])

    # 6 instrument pads
    for i, name in enumerate(DRUMS):
        px, py = 1.45 + (i % 3) * 0.92, 1.6 if i < 3 else 0.7
        c.box(f'pad_{name.lower().replace("-", "")}_rim', (0.82, 0.62, 0.02), (px, py, TOP), c.emissive(f'rim{i}', DRUM_GLOW[i], 1.2), bev=0.04, seg=4)
        c.box(f'pad_{name.lower().replace("-", "")}', (0.76, 0.56, 0.1), (px, py, TOP), c.rubber(f'padr{i}', (0.14, 0.14, 0.145)), bev=0.06, seg=4)
        c.text(name, (px, py - 0.4, TOP + 0.001), 0.06, m['ink'])

    # 16 colour-banded step keys + LEDs
    for i in range(16):
        sx = -3.68 + i * 0.49
        c.box(f'step_{i}', (0.42, 0.6, 0.1), (sx, -0.72, TOP), steps[i // 4], bev=0.035, seg=4)
        lm = m['led_on'] if i == screens.CURRENT else m['led_used'] if i in screens.STEPS_USED else m['led_off']
        c.dome(f'led_{i}', 0.045, 0.03, (sx, -0.2, TOP), lm)
        c.text(str(i + 1), (sx, -1.16, TOP + 0.001), 0.06, m['ink_w'])
    for g in range(4):
        gx = -3.68 + g * 4 * 0.49 + 1.5 * 0.49
        c.box(f'band_{g}', (1.9, 0.035, 0.002), (gx, 0.02, TOP), c.ink(f'band{g}', STEP_COLORS[g], 0.45), bev=0)

    # mini keybed + volume / octave
    c.keybed('key', -1.22, -2.6, 0.34, 1.2, 0.72, 0.52, m, gap=0.02, white_h=0.14, black_h=0.09, pressed=(0, 4, 7))
    knob('volume', -3.35, -1.95, 0.26, 0.7, m)
    c.text('VOLUME', (-3.35, -2.52, TOP + 0.001), 0.06, m['ink_w'])
    for i, label in enumerate(['OCT -', 'OCT +']):
        c.box(f'btn_oct{i}', (0.38, 0.26, 0.08), (-2.3 + i * 0.5, -1.95, 0.52), m['btn'], bev=0.04, seg=4)
        c.text(label, (-2.3 + i * 0.5, -2.2, 0.521), 0.05, m['ink_w'])

    return c.top_camera(9.5, 12, (0, 0, 0.5)), c.hero_camera()


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    top, hero = build()
    views = os.environ.get('VIEWS', 'top,hero').split(',')
    if 'top' in views:
        c.render(top, os.path.join(OUT, 'rhythm_top.png'))
    if 'hero' in views:
        c.render(hero, os.path.join(OUT, 'rhythm_hero.png'))
