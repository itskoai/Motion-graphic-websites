# Worst-pixel contrast under each hero text box (glyphs hidden, every scrim layer composited by the browser).
# python3 -I audit.py <report.json>
import json, sys
from PIL import Image
import numpy as np

def lum(rgb):
    c = rgb / 255.0
    c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]

TEXT = np.array([236, 230, 218], np.float32)
lt = float(lum(TEXT[None, None, :])[0, 0])
rep = json.load(open(sys.argv[1]))
worst = {}
for a in rep['audit']:
    im = np.asarray(Image.open(a['file']).convert('RGB')).astype(np.float32)
    d = a['dpr']
    for b in a['boxes']:
        if b['w'] < 2 or b['h'] < 2:
            continue
        x0, y0 = max(0, int(b['x'] * d)), max(0, int(b['y'] * d))
        x1, y1 = min(im.shape[1], int((b['x'] + b['w']) * d)), min(im.shape[0], int((b['y'] + b['h']) * d))
        if x1 <= x0 or y1 <= y0:
            continue
        L = lum(im[y0:y1, x0:x1])
        # the 99.8th percentile instead of the single max, so one stray sparkle pixel does not decide
        hi = float(np.percentile(L, 99.8))
        ratio = (max(lt, hi) + 0.05) / (min(lt, hi) + 0.05)
        key = (a['band'], b['cls'])
        if key not in worst or ratio < worst[key][0]:
            worst[key] = (ratio, a['q'], a['file'])
print(rep['kind'], rep.get('mode'))
fail = 0
for (band, cls), (r, q, f) in sorted(worst.items()):
    need = 3.5 if cls in ('hl',) else 4.5
    ok = r >= need
    fail += (not ok)
    print(f'  band {band} {cls:7s} worst {r:5.2f}:1 at q={q}  need {need}  {"OK" if ok else "FAIL"}')
print('fails', fail)
