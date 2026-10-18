# assemble.py <manifest.json> <outdir>: find this job's tiles among the images the sandbox returned
# (saved by the tool in this session's tool-results folder), match them by md5, split tiles into frames.
import sys, os, glob, json, hashlib
from PIL import Image
TR = '/root/.claude/projects/-home-user-Motion-graphic-websites/bf0460d8-ceb8-5a25-a236-87a3f3b2b9a2/tool-results'
man = json.load(open(sys.argv[1])); out = sys.argv[2]
os.makedirs(out, exist_ok=True)
by_md5 = {}
for p in glob.glob(os.path.join(TR, 'mcp-Higgsfield-blob-*.jpg')):
    by_md5[hashlib.md5(open(p, 'rb').read()).hexdigest()] = p
cols, rows = man['grid']; w, h = man['w'], man['h']
fi = 0; missing = []
for t in man['tiles']:
    p = by_md5.get(t["md5"]) or next((v for k, v in by_md5.items() if k.startswith(t["md5"])), None)
    if not p:
        missing.append(t['name']); fi += t['n']; continue
    T = Image.open(p)
    for k in range(t['n']):
        x, y = (k % cols) * w, (k // cols) * h
        T.crop((x, y, x + w, y + h)).save(os.path.join(out, f'{fi:04d}.png'))
        fi += 1
print(man['job'], 'frames', fi, 'missing tiles', len(missing), missing[:12])
