#!/usr/bin/env python3
"""Web-size photo sets from the stripped sources in review/yoko-ono/photos-raw (never committed).
Each photo becomes p-<name>-640/1000/1600.jpg (page sizes) and p-<name>-full.jpg (the lightbox, long edge 2000).
Two sources are Instagram collage exports with a band above a white separator line: that band is cropped off."""
import glob, os, sys
from PIL import Image, ImageOps
SRC = '/home/user/Motion-graphic-websites/review/yoko-ono/photos-raw'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/home/user/Motion-graphic-websites/yoko-ono-site/assets/media'
CROP_TOP = {'salmon-bowl', 'salmon-roll'}
def separator_row(im):
    g = im.convert('L'); w, h = g.size; px = g.load()
    best = None
    for y in range(0, int(h * 0.15)):
        m = sum(px[x, y] for x in range(0, w, 8)) / len(range(0, w, 8))
        if m > 225: best = y
    return best
for f in sorted(glob.glob(SRC + '/*')):
    name = os.path.splitext(os.path.basename(f))[0]
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    w, h = im.size; note = ''
    if name in CROP_TOP:
        y = separator_row(im)
        if y is not None:
            im = im.crop((0, y + 4, w, h)); note = f' cropped top {y + 4}px'
    for label, edge in (('640', 640), ('1000', 1000), ('1600', 1600), ('full', 2000)):
        r = im.copy(); r.thumbnail((edge, edge), Image.LANCZOS)
        q = 84 if label == 'full' else 82
        r.save(f'{OUT}/p-{name}-{label}.jpg', 'JPEG', quality=q, optimize=True, progressive=True)
    print(name, im.size, note)
