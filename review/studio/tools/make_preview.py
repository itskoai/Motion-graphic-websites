# Builds the claude.ai preview page from studio-site/index.html (page content only, no doctype/head wrapper)
# and prints the files map for the Artifact publish. python3 -I review/studio/tools/make_preview.py
import json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SITE = os.path.join(ROOT, 'studio-site')
OUT = os.path.join(ROOT, 'review/studio/preview')
os.makedirs(OUT, exist_ok=True)
html = open(os.path.join(SITE, 'index.html'), encoding='utf-8').read()
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
script = re.search(r'<script>\n/\* Decide the hero mode.*?</script>', head, re.S).group(0)
page = '\n'.join([
    '<title>OUTFRAME Studio Site</title>',
    '<meta name="claude:viewport-fit-sides" content="cover">',
    '<meta name="description" content="Preview of the OUTFRAME studio website: a cinematic, scroll-driven Hebrew site.">',
    '<link rel="preload" href="assets/fonts/karantina-700-hebrew.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="stylesheet" href="assets/site.css">',
    script,
    body.strip(),
])
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(page + '\n')
files = {}
for d, _, fs in os.walk(os.path.join(SITE, 'assets')):
    for f in fs:
        full = os.path.join(d, f)
        files[os.path.relpath(full, SITE)] = os.path.relpath(full, ROOT)
files['privacy.html'] = 'studio-site/privacy.html'
json.dump(files, open(os.path.join(OUT, 'files.json'), 'w'), indent=0)
print(len(files), 'files', round(sum(os.path.getsize(os.path.join(ROOT, v)) for v in files.values()) / 1e6, 2), 'MB')
