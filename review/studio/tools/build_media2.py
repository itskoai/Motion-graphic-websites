# Second media pass (review round 1). Run after build_media.py.
# python3 -I review/studio/tools/build_media2.py   (from the repo root)
#  - series reel from the clips' native 480x854 frames, without the backpack and sneaker shots (brand marks)
#  - SC02 full-bleed world frames at 1920x1080 / 864x1080
#  - SC03 world still, small/medium variants of the merch stills, a phone-sized door loop
#  - home-screen icon
import os, subprocess
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
FR = os.path.join(ROOT, 'review/studio/frames')
ENC = os.path.join(ROOT, 'review/studio/enc')
OUT = os.path.join(ROOT, 'studio-site/assets/media')
TMP = os.path.join(ENC, 'tmp-reel')
os.makedirs(TMP, exist_ok=True)


def ff(*a):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)


def webp(im, path, q, size=None):
    if size:
        im = im.resize(size, Image.LANCZOS)
    im.save(path, 'WEBP', quality=q, method=6)


# ---------- series reel: 6c50241e guard, 5500a4a7 cars, b3e0d600 flying car, bc7bf470 plane (sneaker shot 34-62 dropped)
src = sorted(os.listdir(os.path.join(FR, 'reel2')))
keep = list(range(0, 34)) + list(range(63, 192))
for f in os.listdir(TMP):
    os.remove(os.path.join(TMP, f))
for n, i in enumerate(keep):
    os.symlink(os.path.join(FR, 'reel2', src[i]), os.path.join(TMP, f'{n:04d}.png'))
ff('-framerate', '24', '-i', os.path.join(TMP, '%04d.png'), '-c:v', 'libx264', '-profile:v', 'high', '-crf', '22', '-preset', 'slow',
   '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', os.path.join(OUT, 'reel.mp4'))
ff('-framerate', '24', '-i', os.path.join(TMP, '%04d.png'), '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-row-mt', '1', '-an',
   os.path.join(ENC, 'reel.webm'))
# poster: the plane scene (the series' kid in the cloud hoodie), not the cars
Image.open(os.path.join(TMP, f'{140:04d}.png')).convert('RGB').save(os.path.join(OUT, 'reel-poster.jpg'), quality=84, optimize=True, progressive=True)

# ---------- SC02 world frames (idea frames 23..31 = source frames 115..155)
world = sorted(os.listdir(os.path.join(FR, 'world')))
CX = 0.60
for k, f in enumerate(world):
    im = Image.open(os.path.join(FR, 'world', f)).convert('RGB')
    i = 23 + k
    webp(im, os.path.join(OUT, f'idea/d{i:02d}.webp'), 70)
    W, H = im.size
    cw = int(H * 4 / 5)
    x0 = max(0, min(W - cw, int(W * CX - cw / 2)))
    webp(im.crop((x0, 0, x0 + cw, H)), os.path.join(OUT, f'idea/m{i:02d}.webp'), 68)

# SC03 item 0 (films): the finished world, 16:9
last = Image.open(os.path.join(FR, 'world', world[-1])).convert('RGB')
webp(last, os.path.join(OUT, 'world-film-1600.webp'), 74, (1600, 900))
webp(last, os.path.join(OUT, 'world-film-800.webp'), 74, (800, 450))

# ---------- merch stills: small and medium variants
for name in ['look-night', 'look-falls', 'look-car', 'faces-itay', 'turn-itay']:
    im = Image.open(os.path.join(OUT, f'merch/{name}.webp')).convert('RGB')
    for w in (360, 720):
        if im.width > w:
            webp(im, os.path.join(OUT, f'merch/{name}-{w}.webp'), 76, (w, round(im.height * w / im.width)))

# ---------- door loop for phones: the slit side only
ff('-i', os.path.join(OUT, 'door-loop.mp4'), '-vf', 'crop=360:648:0:0,scale=320:576:flags=lanczos', '-c:v', 'libx264', '-crf', '26',
   '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', os.path.join(OUT, 'door-loop-m.mp4'))
ff('-i', os.path.join(OUT, 'door-loop-m.mp4'), '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-an', os.path.join(ENC, 'door-loop-m.webm'))

# ---------- home-screen icon: the mark (frame + beam) on the canvas colour
S = 720
ic = Image.new('RGB', (S, S), (11, 13, 17))
glow = Image.new('L', (S, S), 0)
gd = ImageDraw.Draw(glow)
gd.rectangle((S * .5 - 10, S * .14, S * .5 + 10, S * .86), fill=150)
glow = glow.filter(ImageFilter.GaussianBlur(26))
ic.paste(Image.new('RGB', (S, S), (255, 244, 226)), (0, 0), glow)
d = ImageDraw.Draw(ic)
d.rectangle((S * .29, S * .22, S * .71, S * .78), outline=(120, 118, 112), width=12)
d.rounded_rectangle((S * .5 - 13, S * .12, S * .5 + 13, S * .88), radius=12, fill=(255, 244, 226))
ic.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, 'touch-icon-180.png'), optimize=True)
ic.resize((32, 32), Image.LANCZOS).save(os.path.join(OUT, 'favicon-32.png'), optimize=True)

# ---------- remove media the site no longer uses
for f in ['still-flycar.webp', 'still-plane.webp', 'merch/look-gate.webp', 'idea/sketch-d.webp', 'idea/sketch-m.webp']:
    p = os.path.join(OUT, f)
    if os.path.exists(p):
        os.remove(p)
print('ok', len(keep), 'reel frames')
