"""Compose an explainer image: render + numbered markers + legend (what every control does)."""
import json
import sys

from PIL import Image, ImageDraw, ImageFont

SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
ORANGE = (255, 106, 43)


def compose(render_path, callouts_path, out_path, legend_w=620):
    img = Image.open(render_path).convert('RGB')
    w, h = img.size
    items = json.load(open(callouts_path))
    canvas = Image.new('RGB', (w + legend_w, h), (24, 24, 27))
    canvas.paste(img, (0, 0))
    d = ImageDraw.Draw(canvas)
    num_f = ImageFont.truetype(BOLD, 22)
    title_f = ImageFont.truetype(BOLD, 24)
    job_f = ImageFont.truetype(SANS, 19)
    head_f = ImageFont.truetype(BOLD, 30)

    r = 17
    for it in items:
        x, y = it['x'] * w, it['y'] * h
        d.ellipse([x - r - 3, y - r - 3, x + r + 3, y + r + 3], fill=(255, 255, 255))
        d.ellipse([x - r, y - r, x + r, y + r], fill=ORANGE)
        d.text((x, y), str(it['n']), font=num_f, fill=(255, 255, 255), anchor='mm')

    lx = w + 40
    d.text((lx, 38), 'PULSE-16 BASIC — every control', font=head_f, fill=(240, 240, 240))
    row_h = (h - 110) / len(items)
    for i, it in enumerate(items):
        y = 100 + i * row_h
        d.ellipse([lx, y, lx + 34, y + 34], fill=ORANGE)
        d.text((lx + 17, y + 17), str(it['n']), font=num_f, fill=(255, 255, 255), anchor='mm')
        d.text((lx + 50, y - 2), it['title'], font=title_f, fill=(240, 240, 240))
        d.text((lx + 50, y + 26), it['job'], font=job_f, fill=(160, 163, 170))
    canvas.save(out_path)
    print('saved', out_path)


if __name__ == '__main__':
    compose(*sys.argv[1:4])
