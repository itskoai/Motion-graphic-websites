# Rebuilds studio-site/assets/fonts: one woff2 per face holding exactly the characters the site uses
# (Hebrew + ASCII + a few marks), fetched with the Google Fonts "text=" subsetter. Rerun after copy changes.
# python3 -I review/studio/tools/fonts.py   (from the repo root; needs network access to fonts.googleapis.com)
import os, re, subprocess, urllib.parse
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SITE = os.path.join(ROOT, 'studio-site')
chars = set()
for f in ['index.html', 'privacy.html', 'accessibility.html', 'assets/site.js', 'assets/config.js']:
    chars |= set(open(os.path.join(SITE, f), encoding='utf-8').read())
base = set(chr(c) for c in range(0x20, 0x7F)) | set(chr(c) for c in range(0x05D0, 0x05EB)) | set(' ־׳״·°©↑…‘’“”₪  ×')
txt = ''.join(sorted(c for c in (chars | base) if 0x20 <= ord(c) < 0x7f or 0x0590 <= ord(c) <= 0x05ff or c in base))
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
FACES = [('Karantina', 700, 'karantina-700'), ('Karantina', 400, 'karantina-400'), ('IBM Plex Sans Hebrew', 300, 'plex-hebrew-300'),
         ('IBM Plex Sans Hebrew', 400, 'plex-hebrew-400'), ('IBM Plex Sans Hebrew', 500, 'plex-hebrew-500'),
         ('Frank Ruhl Libre', 300, 'frank-ruhl-300'), ('IBM Plex Mono', 400, 'plex-mono-400')]
dst = os.path.join(SITE, 'assets/fonts')
for f in os.listdir(dst):
    os.remove(os.path.join(dst, f))
rules = []
for fam, w, name in FACES:
    t = txt if 'Mono' not in fam else ''.join(c for c in txt if ord(c) < 0x7f or c in '·°↑×© ')
    url = 'https://fonts.googleapis.com/css2?family=' + urllib.parse.quote(fam) + f':wght@{w}&text=' + urllib.parse.quote(t) + '&display=swap'
    css = subprocess.run(['curl', '-sS', '-A', UA, url], capture_output=True, text=True, check=True).stdout
    src = re.search(r"url\((https://[^)]+)\)\s*format\('woff2'\)", css).group(1)
    subprocess.run(['curl', '-sS', '-o', os.path.join(dst, name + '.woff2'), src], check=True)
    rules.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{w};font-display:swap;src:url(fonts/{name}.woff2) format('woff2')}}")
css_path = os.path.join(SITE, 'assets/site.css')
css = open(css_path, encoding='utf-8').read()
start = css.index('/* Self-hosted fonts')
end = css.index('\n\n', start)
block = '/* Self-hosted fonts (SIL OFL): one file per face with exactly the characters the site uses. Rebuild: review/studio/tools/fonts.py */\n' + '\n'.join(rules)
open(css_path, 'w', encoding='utf-8').write(css[:start] + block + css[end:])
print('fonts', len(rules))
