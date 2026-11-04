# Hero: scroll walkthrough (owner's approved Seedance video)

- `frames/f_001.webp … f_181.webp`: 181 frames, 720×1280 (9:16), taken from the owner's 12-second Seedance walkthrough at 15 fps.
  The walk goes from the red YOKO ONO front, through the glass door, into the umbrella-ceiling dining hall.
- `poster.webp`: frame 1. Shown before the frames load and as the reduced-motion and no-JS fallback.
- `demo.html`: minimal working reference (sticky canvas inside a 500vh section). Frame = scroll progress × 180.

This is the approved hero. Do not replace it with CSS animation, another video, or new AI generation.

Implementation:
- Preload frames 1–30 right away and lazy-load the rest. Show the poster until frame 1 is drawn.
- Draw with object-fit "cover" math. On wide desktop screens, show the vertical walk in a centered column with a soft blurred background, so it isn't cropped hard.
- prefers-reduced-motion: poster only, no tall scroll section.
- The primary CTA "הזמינו שולחן" (Ontopo link in ../BUSINESS-INFO.md) stays visible over the hero at all times.
- At the end of the walk, transition smoothly into the first content section.
