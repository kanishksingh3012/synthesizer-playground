"""Concept 1 — Analog Flagship ("MONARCH")."""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as c  # noqa: E402
import screens  # noqa: E402

OUT = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].endswith('.py') else '.'

# demo patch values normalised 0..1 (same curves as src/state/controls.ts)
KNOBS = [('cutoff', 'CUTOFF', 0.48), ('resonance', 'RESONANCE', 0.59), ('attack', 'ATTACK', 0.14), ('decay', 'DECAY', 0.55),
         ('sustain', 'SUSTAIN', 0.2), ('release', 'RELEASE', 0.42), ('delay', 'DELAY', 0.15), ('reverb', 'REVERB', 0.11)]
USED = screens.STEPS_USED
CURRENT = screens.CURRENT


empty, adopt = c.empty, c.adopt


def knob(panel, param, x, y, r, n, m):
    k = empty(f'knob_{param}', (x, y, 0), (0, 0, (0.75 - n * 1.5) * math.pi), panel)
    skirt = c.cylinder(f'{param}_skirt', r * 1.22, 0.07, (0, 0, 0), m['knob'], seg=64, bev=0.01)
    mark = c.box(f'{param}_skirt_mark', (0.022, r * 0.2, 0.004), (0, r * 1.1, 0.07), m['ink'], bev=0)
    body = c.cylinder(f'{param}_body', r, 0.34, (0, 0, 0.07), m['knob'], knurl=36, bev=0.012)
    cap = c.cylinder(f'{param}_cap', r * 0.8, 0.025, (0, 0, 0.41), m['cap'], seg=64, bev=0.006)
    line = c.box(f'{param}_line', (0.02, r * 0.55, 0.004), (0, r * 0.42, 0.435), m['knob'], bev=0)
    adopt(k, skirt, mark, body, cap, line)
    # printed scale ticks (static, on the panel)
    for t in range(11):
        a = math.radians(225 - t * 27)
        tx, ty = x + math.cos(a) * r * 1.45, y + math.sin(a) * r * 1.45
        tick = c.box(f'{param}_tick{t}', (0.012, 0.05, 0.002), (tx, ty, 0.001), m['ink'], bev=0, rot=(0, 0, a - math.pi / 2))
        tick.parent = panel
    return k


def build():
    c.reset()
    c.world('studio.exr', 0.55, (0.42, 0.4, 0.37))
    c.studio()
    m = {
        'floor': c.paint('floor', (0.42, 0.4, 0.37), 0.9, 0.02),
        'wood': c.wood('walnut'),
        'case': c.paint('case', (0.018, 0.018, 0.02), 0.5),
        'panel': c.brushed_metal('panel', (0.035, 0.035, 0.038), 0.32, 0.6),
        'ink': c.ink('ink', (0.86, 0.85, 0.8), 0.45),
        'amber': c.ink('amber_ink', (0.95, 0.55, 0.15), 0.45),
        'knob': c.plastic('knob', (0.012, 0.012, 0.013), 0.42, 0.05),
        'cap': c.brushed_metal('cap', (0.82, 0.82, 0.83), 0.2, 0.8, radial=True),
        'white': c.plastic('ivory', (0.83, 0.8, 0.72), 0.22, 0.25, sss=0.06),
        'black': c.plastic('ebony', (0.008, 0.008, 0.009), 0.2, 0.35),
        'rubber': c.rubber('rubber', (0.06, 0.06, 0.065)),
        'glass': c.glass('glass', (0.9, 0.85, 0.8)),
        'bezel': c.paint('bezel', (0.01, 0.01, 0.01), 0.3),
        'led_off': c.led_lens('led_off', (0.35, 0.16, 0.04), 0.0),
        'led_used': c.led_lens('led_used', (1.0, 0.55, 0.12), 2.5),
        'led_on': c.led_lens('led_on', (1.0, 0.62, 0.2), 14.0),
        'step': c.plastic('step', (0.07, 0.07, 0.075), 0.35, 0.1),
    }
    c.floor(m['floor'])

    # --- case, cheeks, keybed ---------------------------------------------------------
    for sx in (-1, 1):
        c.box(f'cheek_{sx}', (0.36, 5.7, 1.05), (sx * 4.26, 0.25, 0), m['wood'], bev=0.05)
    c.box('keybed', (8.16, 2.7, 0.36), (0, -1.25, 0), m['case'], bev=0.03)
    c.box('case_back', (8.16, 3.05, 0.5), (0, 1.55, 0), m['case'], bev=0.03)
    c.box('key_slip', (8.16, 0.12, 0.5), (0, -0.2, 0), m['case'], bev=0.02)

    white_w = 0.455
    x0 = 4.03 - 15 * white_w
    c.keybed('key', x0, -2.45, white_w, 2.1, 1.3, 0.36, m, pressed=(0, 4, 7))

    # pitch / mod wheels in a slot left of the keys
    c.box('wheel_well', (1.0, 1.5, 0.02), (-3.52, -1.3, 0.36), m['bezel'], bev=0.01)
    for i, wx in enumerate((-3.72, -3.3)):
        wheel = c.cylinder(f'wheel_{i}', 0.5, 0.2, (wx - 0.1, -1.3, 0.1), m['rubber'], knurl=40, knurl_depth=0.02, bev=0.01)
        wheel.rotation_euler = (0, math.pi / 2, 0)
        wheel.location = (wx - 0.1, -1.3, 0.36 - 0.18)
    c.text('PITCH', (-3.72, -2.2, 0.365), 0.075, m['ink'])
    c.text('MOD', (-3.3, -2.2, 0.365), 0.075, m['ink'])

    # --- tilted control panel ---------------------------------------------------------
    tilt = math.radians(6)
    c.box('panel_plate', (8.16, 3.0, 0.1), (0, 1.55, 0.72), m['panel'], bev=0.02, rot=(tilt, 0, 0))
    panel = empty('panel', (0, 1.55, 0.82), (tilt, 0, 0))

    def on(o):
        o.parent = panel
        return o

    # sections
    sections = [('OSCILLATOR', -3.95, -1.85), ('FILTER', -1.75, -0.15), ('ENVELOPE', -0.05, 2.55), ('EFFECTS', 2.65, 3.95)]
    for title, sx0, sx1 in sections:
        for p in c.outline(f'sec_{title}', sx0, -0.4, sx1, 1.05, 0.0005, 0.014, m['ink']):
            on(p)
        on(c.box(f'sec_{title}_mask', (len(title) * 0.085 + 0.12, 0.05, 0.001), (sx0 + 0.1 + (len(title) * 0.085 + 0.12) / 2, 1.05, 0.0004), m['panel'], bev=0))
        on(c.text(title, (sx0 + 0.16, 1.05, 0.0012), 0.085, m['ink'], align='LEFT'))

    # VFD screen behind glass
    screens.vfd(os.path.join(OUT, 'analog_vfd.png'))
    on(c.box('screen_bezel', (1.9, 1.05, 0.03), (-2.9, 0.4, 0), m['bezel'], bev=0.02))
    on(c.plane('screen', 1.72, 0.86, (-2.9, 0.4, 0.033), c.screen_mat('vfd', os.path.join(OUT, 'analog_vfd.png'), 3.0)))
    on(c.box('screen_glass', (1.8, 0.94, 0.012), (-2.9, 0.4, 0.036), m['glass'], bev=0.004))

    positions = [(-1.35, 0.3), (-0.55, 0.3), (0.3, 0.3), (0.9, 0.3), (1.5, 0.3), (2.1, 0.3), (2.97, 0.3), (3.62, 0.3)]
    for (param, label, n), (x, y) in zip(KNOBS, positions):
        r = 0.3 if param in ('cutoff', 'resonance') else 0.22
        knob(panel, param, x, y, r, n, m)
        on(c.text(label, (x, y - r * 1.45 - 0.12, 0.0012), 0.06, m['ink']))

    # step sequencer row + LEDs
    for i in range(16):
        sx = -3.78 + i * 0.37
        on(c.box(f'step_{i}', (0.28, 0.28, 0.07), (sx, -1.1, 0), m['step'], bev=0.02))
        lm = m['led_on'] if i == CURRENT else m['led_used'] if i in USED else m['led_off']
        led = c.dome(f'led_{i}', 0.045, 0.03, (sx, -0.78, 0), lm)
        on(led)
        on(c.text(str(i + 1), (sx, -1.34, 0.0012), 0.055, m['ink']))
    for g in range(1, 4):
        on(c.box(f'step_sep{g}', (0.012, 0.55, 0.002), (-3.78 + g * 4 * 0.37 - 0.185, -1.0, 0.0005), m['amber'], bev=0))

    # drum pads 3x2
    for i, name in enumerate(['KICK', 'SNARE', 'HAT', 'CLAP', 'TOM', 'PERC']):
        px = 2.35 + (i % 3) * 0.62
        py = -0.72 if i < 3 else -1.28
        on(c.box(f'pad_{name.lower()}', (0.5, 0.42, 0.08), (px, py, 0), m['rubber'], bev=0.05, seg=4))
        on(c.text(name, (px, py + 0.28, 0.0012), 0.05, m['ink']))

    # wordmark strip
    on(c.text('MONARCH', (-3.95, 1.3, 0.0012), 0.22, m['ink'], align='LEFT', font=c.FONT_BOLD, spacing=1.3))
    on(c.text('PLAYGROUND ELECTRONICS', (-2.0, 1.28, 0.0012), 0.07, m['amber'], align='LEFT', spacing=1.4))
    on(c.text('ANALOG SYNTHESIZER  ·  MODEL 8', (3.95, 1.28, 0.0012), 0.07, m['ink'], align='RIGHT', spacing=1.3))

    return c.top_camera(9.4, 12, (0, 0.2, 0.6)), c.hero_camera()


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    top, hero = build()
    views = os.environ.get('VIEWS', 'top,hero').split(',')
    if 'top' in views:
        c.render(top, os.path.join(OUT, 'analog_top.png'))
    if 'hero' in views:
        c.render(hero, os.path.join(OUT, 'analog_hero.png'))
