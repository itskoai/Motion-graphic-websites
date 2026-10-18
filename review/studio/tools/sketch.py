# Storyboard pencil sketch derived from a real frame (pure image processing, no generation).
import numpy as np
from PIL import Image, ImageFilter

def _conv(a, k):
    from numpy.lib.stride_tricks import sliding_window_view
    p = np.pad(a, 1, mode='edge')
    return (sliding_window_view(p, (3, 3)) * k).sum(axis=(-1, -2))

def _edges(gimg, sigma):
    g = np.asarray(gimg.filter(ImageFilter.GaussianBlur(sigma))).astype(np.float32) / 255.0
    kx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], np.float32)
    gx, gy = _conv(g, kx), _conv(g, kx.T)
    m = np.sqrt(gx * gx + gy * gy)
    return m / (np.percentile(m, 99.4) + 1e-6), g

def sketch(im, seed=7):
    im = im.convert('RGB')
    W, H = im.size
    L = im.convert('L')
    fine, g = _edges(L, 1.3)
    coarse, _ = _edges(L, 4.0)
    line = np.clip((fine - 0.22) * 1.6, 0, 1) * 0.75 + np.clip((coarse - 0.32) * 1.3, 0, 1) * 0.34
    line = np.clip(line, 0, 1)
    lo, hi = np.percentile(g, 4), np.percentile(g, 97)
    dark = 1.0 - np.clip((g - lo) / (hi - lo + 1e-6), 0, 1)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rng = np.random.default_rng(seed)
    def noise(cell):
        n = rng.random((H // cell + 2, W // cell + 2)).astype(np.float32)
        return np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32) / 255.0
    s = W / 1440.0
    j = noise(24) * 0.35
    h1 = (np.sin((xx * 0.92 + yy) / (3.1 * s) + j) > 0.86).astype(np.float32)
    h2 = (np.sin((xx - yy * 0.95) / (3.6 * s) + j) > 0.9).astype(np.float32)
    broken = (noise(10) > 0.38).astype(np.float32)          # strokes lift off the paper now and then
    t1 = np.clip((dark - 0.62) * 3.2, 0, 1)
    t2 = np.clip((dark - 0.84) * 4.0, 0, 1)
    hatch = np.clip(h1 * t1 * 0.42 + h2 * t2 * 0.38, 0, 1) * broken
    graphite = np.clip(line + hatch * (1 - line), 0, 1)
    graphite = np.asarray(Image.fromarray((graphite * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32) / 255.0
    grain = rng.normal(0, 0.03, (H, W)).astype(np.float32)
    paper = np.array([0.955, 0.94, 0.905], np.float32) * 255
    lead = np.array([46, 48, 55], np.float32)
    a = np.clip(graphite * (0.92 + grain), 0, 1)[..., None]
    out = paper * (1 - a) + lead * a
    out = out * (1 + grain[..., None] * 0.22)
    r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    out *= (1 - 0.10 * np.clip(r - 0.5, 0, 1))[..., None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

if __name__ == '__main__':
    import sys
    sketch(Image.open(sys.argv[1])).save(sys.argv[2], quality=88)
