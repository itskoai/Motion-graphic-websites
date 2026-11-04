# Hero v2: full-screen scroll walkthrough (entrance + waiter)

The owner's two approved videos joined into one continuous walk (11.5 s, 172 frames at 15 fps):
1. Frames 1–50 (0–29% of the scroll): the red YOKO ONO front, upscaled to 4K with Topaz, pushing through the glass door into the main hall.
2. A 0.6 s dissolve (about frames 50–60): the camera arrives in the second dining room (the mural wall, bamboo ceiling and blue curtains).
3. Frames 60–172 (35–100%): the waiter walks in and serves sushi to a smiling guest. The walk ends on the serving moment.

Two frame sets. **Both are FULL SCREEN (object-fit cover). No column, no blurred side panels.**
- `frames-mobile/f_001…f_172.webp`: 720×1280 (9:16), cropped from the sources. Use when the viewport is portrait (width/height < 1).
- `frames-desktop/f_001…f_172.webp`: 1280×720 (16:9). Use when the viewport is landscape.
- `poster-mobile.webp` / `poster-desktop.webp`: frame 1 of each set. Show the matching one before the frames load and as the reduced-motion fallback.
- `demo.html`: tested reference. It picks the set by aspect ratio and switches on resize/rotate. Tested at iPhone 13 and 1440×900.

Only load the set for the current orientation. Preload frames 1–30 first, then the rest.
