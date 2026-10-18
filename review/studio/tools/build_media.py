# Builds every processed media file for studio-site/ from the assembled frame folders.
# Run: python3 -I review/studio/tools/build_media.py   (from the repo root)
import json, os, shutil, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageEnhance

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
FR = os.path.join(ROOT, 'review/studio/frames')
ENC = os.path.join(ROOT, 'review/studio/enc')          # test-only copies (VP9 for headless Chromium)
OUT = os.path.join(ROOT, 'studio-site/assets/media')
MERCH = os.path.join(ROOT, 'yuval-itay-set/assets')
os.makedirs(OUT, exist_ok=True); os.makedirs(ENC, exist_ok=True)


def ff(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def webp(im, path, q, w=None, h=None):
    if w and h:
        im = im.resize((w, h), Image.LANCZOS)
    im.save(path, 'WEBP', quality=q, method=6)


def frames(job):
    d = os.path.join(FR, job)
    return [os.path.join(d, f) for f in sorted(os.listdir(d)) if f.endswith('.png')]


# ---------- hero (desktop scrub video + stills) ----------
hero = frames('hero')
ff('-framerate', '24', '-i', os.path.join(FR, 'hero/%04d.png'), '-c:v', 'libx264', '-crf', '20', '-preset', 'slow',
   '-g', '8', '-keyint_min', '8', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', os.path.join(OUT, 'hero-scrub.mp4'))
ff('-framerate', '24', '-i', os.path.join(FR, 'hero/%04d.png'), '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-g', '8',
   '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', '-an', os.path.join(ENC, 'hero-scrub.webm'))
Image.open(hero[0]).convert('RGB').save(os.path.join(OUT, 'hero-poster.jpg'), quality=84, optimize=True, progressive=True)
Image.open(hero[-1]).convert('RGB').save(os.path.join(OUT, 'hero-end.jpg'), quality=84, optimize=True, progressive=True)

# ---------- hero (portrait frame sequence for phones) ----------
hm = frames('herom')
os.makedirs(os.path.join(OUT, 'herom'), exist_ok=True)
for i, p in enumerate(hm):
    webp(Image.open(p).convert('RGB'), os.path.join(OUT, f'herom/{i:02d}.webp'), 66)
Image.open(hm[-1]).convert('RGB').save(os.path.join(OUT, 'hero-end-m.jpg'), quality=82, optimize=True, progressive=True)
Image.open(hm[0]).convert('RGB').save(os.path.join(OUT, 'hero-poster-m.jpg'), quality=82, optimize=True, progressive=True)

# where each portrait frame sits on the desktop frame timeline (both come from the same two source shots)
A_D = [0, 4, 8] + list(range(10, 80, 2)) + [80, 86, 92, 98]
B_D = list(range(0, 40, 2)) + list(range(40, 96)) + list(range(96, 127, 2))
A_M = [0, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 92]
B_M = list(range(0, 41, 4)) + list(range(42, 97, 2)) + list(range(100, 125, 4)) + [126]
desk = [('a', f) for f in A_D] + [('b', f) for f in B_D]
mob = [('a', f) for f in A_M] + [('b', f) for f in B_M]
assert len(desk) == len(hero), (len(desk), len(hero))
assert len(mob) == len(hm), (len(mob), len(hm))
seqpos = [desk.index(x) for x in mob]

# ---------- idea / transformation sequence ----------
idea = frames('idea')
os.makedirs(os.path.join(OUT, 'idea'), exist_ok=True)
CX = 0.60   # the walker sits right of center; portrait crops keep them in frame
for i, p in enumerate(idea):
    im = Image.open(p).convert('RGB')
    webp(im, os.path.join(OUT, f'idea/d{i:02d}.webp'), 72, 1280, 720)
    W, H = im.size; cw = int(H * 4 / 5)
    x0 = max(0, min(W - cw, int(W * CX - cw / 2)))
    webp(im.crop((x0, 0, x0 + cw, H)), os.path.join(OUT, f'idea/m{i:02d}.webp'), 70)


sys.path.insert(0, os.path.dirname(__file__))
from sketch import sketch  # noqa: E402


first = Image.open(idea[0]).convert('RGB')
sk = sketch(first)
webp(sk, os.path.join(OUT, 'idea/sketch-d.webp'), 76, 1280, 720)
W, H = sk.size; cw = int(H * 4 / 5); x0 = max(0, min(W - cw, int(W * CX - cw / 2)))
webp(sk.crop((x0, 0, x0 + cw, H)), os.path.join(OUT, 'idea/sketch-m.webp'), 74)

# ---------- door loop (a light slit on a wall; the minds and mystery sections) ----------
tmp = os.path.join(ENC, 'door24.mp4')
ff('-framerate', '8', '-i', os.path.join(FR, 'door/%04d.png'), '-vf', "minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:vsbmc=1",
   '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p', tmp)
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', tmp],
                           capture_output=True, text=True).stdout.strip())
fade = 1.2
loopf = "[0:v]split[a][b];[a]trim=start={f},setpts=PTS-STARTPTS[main];[b]trim=0:{f},setpts=PTS-STARTPTS[head];" \
        "[main][head]xfade=transition=fade:duration={f}:offset={o}[v]".format(f=fade, o=dur - 2 * fade)
ff('-i', tmp, '-filter_complex', loopf, '-map', '[v]', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p',
   '-movflags', '+faststart', '-an', os.path.join(OUT, 'door-loop.mp4'))
ff('-i', os.path.join(OUT, 'door-loop.mp4'), '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1', '-an', os.path.join(ENC, 'door-loop.webm'))
Image.open(frames('door')[0]).convert('RGB').save(os.path.join(OUT, 'door-poster.jpg'), quality=82, optimize=True, progressive=True)

# ---------- series reel (vertical, own comedy series) ----------
ff('-framerate', '24', '-i', os.path.join(FR, 'reel/%04d.png'), '-c:v', 'libx264', '-crf', '21', '-preset', 'slow', '-pix_fmt', 'yuv420p',
   '-movflags', '+faststart', '-an', os.path.join(OUT, 'reel.mp4'))
ff('-framerate', '24', '-i', os.path.join(FR, 'reel/%04d.png'), '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-row-mt', '1', '-an',
   os.path.join(ENC, 'reel.webm'))
reel = frames('reel')
Image.open(reel[150]).convert('RGB').save(os.path.join(OUT, 'reel-poster.jpg'), quality=84, optimize=True, progressive=True)

# ---------- campaign and character stills from the merch project (own work) ----------
os.makedirs(os.path.join(OUT, 'merch'), exist_ok=True)
picks = {
    'look-night': ('look-02.jpg', 900), 'look-falls': ('look-04.jpg', 900), 'look-car': ('look-06.jpg', 900),
    'look-gate': ('look-08.jpg', 900), 'flat-navy': ('color-navy.jpg', 900), 'flat-sky': ('color-sky.jpg', 900),
    'macro': ('macro.jpg', 1400), 'faces-itay': ('face-itay.jpg', 1400), 'turn-itay': ('turn-itay.jpg', 1600),
    'hoods': ('step-02.jpg', 1200),
}
for name, (src, w) in picks.items():
    im = Image.open(os.path.join(MERCH, src)).convert('RGB')
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    webp(im, os.path.join(OUT, f'merch/{name}.webp'), 78)

# ---------- social preview (no text baked in) ----------
end = Image.open(hero[-1]).convert('RGB')
W, H = end.size; th = int(W * 630 / 1200)
end.crop((0, (H - th) // 2, W, (H - th) // 2 + th)).resize((1200, 630), Image.LANCZOS).save(
    os.path.join(OUT, 'og.jpg'), quality=86, optimize=True, progressive=True)

json.dump({'heroFrames': len(hero), 'heromSeqpos': seqpos, 'ideaFrames': len(idea), 'reelFrames': len(reel)},
          open(os.path.join(ENC, 'media.json'), 'w'))
print('ok', len(hero), len(hm), len(idea), 'seqpos', seqpos)
