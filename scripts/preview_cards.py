"""Link-preview cards A (split) / B (centred, live) / C (sequencer): 1200x630, white, Inter.
Sources: docs/brand/card_{hero,top}.png (blender/render_card.py). Output: public/previews/hex16-{a,b,c}.jpg
  python scripts/preview_cards.py   (needs Pillow; run npm install first for the Inter font)"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = os.path.join(ROOT, 'docs/brand')
OUT = os.path.join(ROOT, 'public/previews')
F = os.path.join(ROOT, 'node_modules/@fontsource/inter/files/inter-latin-{}-normal.woff')
font = lambda w, s: ImageFont.truetype(F.format(w), s)
W, H = 1200, 630
WHITE, INK, MUTED, ORANGE, LINE = (255, 255, 255), (17, 20, 24), (110, 115, 124), (255, 106, 43), (228, 229, 232)
STEPS = [(226, 72, 47)] * 4 + [(240, 149, 90)] * 4 + [(232, 204, 134)] * 4 + [(236, 234, 229)] * 4

def cut(path):
    im = Image.open(path).convert('RGBA')
    # the shadow catcher also records a faint ambient shadow over the whole floor, which ends in a hard edge
    # at the frame; drop the faint part and keep the contact shadow under the device
    im.putalpha(im.getchannel('A').point(lambda a: 0 if a < 40 else min(255, (a - 40) * 255 // 150)))
    return im.crop(im.getchannel('A').getbbox())

def fit(im, w=None, h=None):
    r = min(w / im.width if w else 9, h / im.height if h else 9)
    return im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)

def wordmark(d, x, y, size, weight='800', track=-0.02):
    f = font(weight, size)
    for part, col in (('HEX', INK), ('-16', ORANGE)):
        for ch in part:
            d.text((x, y), ch, font=f, fill=col)
            x += d.textlength(ch, font=f) + size * track
    return x

def steps(d, x, y, cell, gap, lit=None, radius=None):
    for i, col in enumerate(STEPS):
        cx = x + i * (cell + gap) + (i // 4) * gap
        box = (cx, y, cx + cell, y + cell)
        if lit is None:
            d.rounded_rectangle(box, radius or cell // 5, fill=col, outline=LINE if i >= 12 else None)
        else:
            d.ellipse(box, fill=ORANGE if i in lit else LINE)
    return x + 16 * (cell + gap) + 3 * gap

hero, top = cut(D + '/card_hero.png'), cut(D + '/card_top.png')

# A — split: name + tagline + 16-step strip on the left, angled device bleeding off the right edge
c = Image.new('RGB', (W, H), WHITE); d = ImageDraw.Draw(c)
h = fit(hero, w=860); c.paste(h, (W - h.width + 150, (H - h.height) // 2 + 20), h)
wordmark(d, 64, 150, 104)
d.text((68, 292), 'Make beats on a 3D synth,', font=font('500', 32), fill=MUTED)
d.text((68, 334), 'right in your browser.', font=font('500', 32), fill=MUTED)
steps(d, 70, 440, 18, 6)
c.save(OUT + '/hex16-a.jpg', quality=88, optimize=True, progressive=True)

# B — centred: small name + one line on top, the angled device centred below
c = Image.new('RGB', (W, H), WHITE); d = ImageDraw.Draw(c)
f = font('800', 64); tw = sum(d.textlength(ch, font=f) + 64 * -0.02 for ch in 'HEX-16')
wordmark(d, (W - tw) / 2, 52, 64)
t = 'Make beats on a 3D synth, right in your browser.'
d.text(((W - d.textlength(t, font=font('500', 26))) / 2, 140), t, font=font('500', 26), fill=MUTED)
h = fit(hero, w=760, h=420); c.paste(h, ((W - h.width) // 2, H - h.height - 24), h)
c.save(OUT + '/hex16-b.jpg', quality=88, optimize=True, progressive=True)

# C — sequencer motif: big name, a 16-dot beat (kick on 1·5·9·13) as the graphic, top view on the right
c = Image.new('RGB', (W, H), WHITE); d = ImageDraw.Draw(c)
t2 = fit(top, w=560, h=500); c.paste(t2, (W - t2.width - 56, (H - t2.height) // 2), t2)
wordmark(d, 64, 140, 116)
steps(d, 70, 300, 14, 9, lit={0, 4, 8, 12})
d.text((68, 350), '16 steps. 13 keys. One loop.', font=font('600', 30), fill=INK)
d.text((68, 396), 'Play it in your browser — free.', font=font('500', 26), fill=MUTED)
c.save(OUT + '/hex16-c.jpg', quality=88, optimize=True, progressive=True)
print('ok')
