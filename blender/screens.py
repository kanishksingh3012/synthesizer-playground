"""Pillow artwork for the three screen styles (emission textures)."""
import math

from PIL import Image, ImageDraw, ImageFilter, ImageFont

MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
STEPS_USED = {0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13, 14, 15}
CURRENT = 4


def _wave(d, x0, y0, w, h, color, width=3, cycles=2.0, kind='saw'):
    pts = []
    for i in range(200):
        t = i / 199
        ph = (t * cycles) % 1
        v = (2 * ph - 1) if kind == 'saw' else math.sin(t * cycles * 2 * math.pi)
        pts.append((x0 + t * w, y0 + h / 2 - v * h * 0.42))
    d.line(pts, fill=color, width=width, joint='curve')


def vfd(path, w=1024, h=480):
    """Amber vacuum-fluorescent display with ghosted segments and a soft phosphor glow."""
    img = Image.new('RGB', (w, h), (6, 4, 2))
    d = ImageDraw.Draw(img)
    amber, ghost = (255, 176, 70), (38, 26, 12)
    big = ImageFont.truetype(MONO, 64)
    small = ImageFont.truetype(MONO, 30)
    d.text((40, 30), '888 8888888888', font=big, fill=ghost)
    d.text((40, 30), '07  ACID BASS', font=big, fill=amber)
    d.text((40, 120), 'SAW  CUT 900  RES 9.0', font=small, fill=amber)
    _wave(d, 40, 180, w - 80, 170, amber, 5, 3, 'saw')
    for i in range(16):
        x = 40 + i * (w - 80) / 16
        col = amber if i in STEPS_USED else ghost
        d.rectangle([x + 4, h - 70, x + (w - 80) / 16 - 6, h - 40], fill=(255, 235, 200) if i == CURRENT else col)
    glow = img.filter(ImageFilter.GaussianBlur(6))
    img = Image.blend(img, glow, 0.35)
    img.save(path)


def _seg_digit(d, x, y, s, digit, on, off):
    segs = {'a': (0, 0, 1, 0), 'b': (1, 0, 1, 1), 'c': (1, 1, 1, 2), 'd': (0, 2, 1, 2), 'e': (0, 1, 0, 2), 'f': (0, 0, 0, 1), 'g': (0, 1, 1, 1)}
    lit = {'0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcfgd'}[digit]
    for k, (x0, y0, x1, y1) in segs.items():
        d.line([(x + x0 * s, y + y0 * s), (x + x1 * s, y + y1 * s)], fill=on if k in lit else off, width=int(s * 0.18))


def led7(path, w=768, h=320, value='112'):
    """Red seven-segment tempo display behind smoked acrylic."""
    img = Image.new('RGB', (w, h), (10, 2, 2))
    d = ImageDraw.Draw(img)
    on, off = (255, 40, 30), (40, 6, 6)
    for i, ch in enumerate(value):
        _seg_digit(d, 90 + i * 200, 45, 110, ch, on, off)
    d.ellipse([w - 60, h - 70, w - 36, h - 46], fill=on)
    glow = img.filter(ImageFilter.GaussianBlur(8))
    Image.blend(img, glow, 0.4).save(path)


def oled(path, w=768, h=384):
    """Small white OLED: patch name, envelope curve, step strip."""
    img = Image.new('RGB', (w, h), (0, 0, 0))
    d = ImageDraw.Draw(img)
    f1 = ImageFont.truetype(SANS, 44)
    f2 = ImageFont.truetype(SANS, 26)
    white, dim = (235, 240, 255), (70, 74, 84)
    d.text((28, 20), 'LATTICE', font=f1, fill=white)
    d.text((w - 190, 30), '112 BPM', font=f2, fill=white)
    d.text((28, 80), 'VCO1 SAW  >  VCF', font=f2, fill=dim)
    env = [(28, 300), (110, 140), (220, 200), (520, 200), (w - 30, 300)]
    d.line(env, fill=white, width=4)
    for i in range(16):
        x = 28 + i * (w - 56) / 16
        d.rectangle([x + 3, h - 40, x + (w - 56) / 16 - 5, h - 22], fill=(255, 106, 43) if i == CURRENT else white if i in STEPS_USED else dim)
    img.save(path)


# 5x7 dot-matrix glyphs (rows top->bottom, '#' = lit) for the characters the display uses.
GLYPHS = {
    'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    'M': ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    'S': ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
    'C': ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    'G': ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
    'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'I': ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    'N': ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    ' ': ['.....'] * 7,
}


def alnum(path, line1='BASS', line2='112 BPM', cols=8, w=1024, h=420):
    """Red 2-line dot-matrix LED display (5x7 glyphs), unlit dots faintly visible like real LED matrices."""
    grid_w, grid_h = cols * 6 - 1, 7 * 2 + 2
    lit = set()
    for row, line in enumerate((line1.ljust(cols)[:cols], line2.ljust(cols)[:cols])):
        for ci, ch in enumerate(line):
            for gy, bits in enumerate(GLYPHS.get(ch, GLYPHS[' '])):
                for gx, b in enumerate(bits):
                    if b == '#':
                        lit.add((ci * 6 + gx, row * 9 + gy))
    img = Image.new('RGB', (w, h), (12, 2, 2))
    d = ImageDraw.Draw(img)
    pad = 34
    p = min((w - 2 * pad) / grid_w, (h - 2 * pad) / grid_h)
    ox, oy = (w - p * grid_w) / 2, (h - p * grid_h) / 2
    r = p * 0.4
    for y in range(grid_h):
        for x in range(grid_w):
            if (x % 6 == 5) or y in (7, 8):
                continue  # gaps between character cells / lines
            cx, cy = ox + (x + 0.5) * p, oy + (y + 0.5) * p
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 50, 32) if (x, y) in lit else (46, 8, 6))
    glow = img.filter(ImageFilter.GaussianBlur(9))
    Image.blend(img, glow, 0.35).save(path)


def matrix(path, track='KICK', sound='BASS', bpm=112, octave=4, note='C4', steps=(), playhead=-1, W=140, H=32, px=10):
    """Red graphic dot-matrix screen (W x H dots): track (marker bar), sound, BPM / octave, last note /
    16-cell step map of the selected track with the playhead. Volume is deliberately not shown."""
    lit = set()

    def text(s, x, y, invert=False):
        glyph = set()
        for ci, ch in enumerate(s):
            for gy, bits in enumerate(GLYPHS.get(ch, GLYPHS[' '])):
                for gx, b in enumerate(bits):
                    if b == '#':
                        glyph.add((x + ci * 6 + gx, y + gy))
        if invert:  # solid box with the letters cut out
            box = {(xx, yy) for xx in range(x - 2, x + len(s) * 6 + 1) for yy in range(y - 2, y + 9)}
            lit.update(box - glyph)
        else:
            lit.update(glyph)
        return x + len(s) * 6

    lit.update({(x, y) for x in (1, 2) for y in range(2, 9)})  # marker bar = selected track
    text(track, 5, 2)
    text(sound, 48, 2)
    right = f'{bpm} BPM'
    text(right, W - len(right) * 6 - 1, 2)
    text(f'OCT {octave}', 2, 12)
    text(f'NOTE {note}', 48, 12)
    # step map: 16 cells of 7x8, 1-dot gaps, extra gap every 4 steps
    x = 2
    for i in range(16):
        on = i in steps
        for cx in range(7):
            for cy in range(7):
                edge = cx in (0, 6) or cy in (0, 6)
                if on or edge:
                    lit.add((x + cx, 22 + cy))
        if i == playhead:
            for cx in range(7):
                lit.add((x + cx, 30))
            if not on:
                lit.update({(x + 3, 25), (x + 3, 26), (x + 2, 25), (x + 4, 25)})
        x += 8 + (3 if i % 4 == 3 else 0)

    img = Image.new('RGB', (W * px, H * px), (12, 2, 2))
    d = ImageDraw.Draw(img)
    r = px * 0.4
    for y in range(H):
        for x in range(W):
            cx, cy = (x + 0.5) * px, (y + 0.5) * px
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 50, 32) if (x, y) in lit else (44, 8, 6))
    glow = img.filter(ImageFilter.GaussianBlur(px * 0.9))
    Image.blend(img, glow, 0.35).save(path)
