#!/usr/bin/env python3
"""Removes all hidden metadata (GPS location, camera serial, date) from photos before they go online.
Usage: python3 -I security/strip_photo_location.py photo1.jpg photo2.png ...   (needs Pillow: pip install pillow)
The visible image is unchanged; the file is rewritten in place."""
import sys
from PIL import Image
for path in sys.argv[1:]:
    with Image.open(path) as im:
        clean = Image.new(im.mode, im.size); clean.putdata(list(im.getdata()))
        if 'icc_profile' in im.info: clean.info['icc_profile'] = im.info['icc_profile']
        fmt = im.format
    clean.save(path, format=fmt, **({'quality': 92} if fmt == 'JPEG' else {}))
    print('cleaned', path)
