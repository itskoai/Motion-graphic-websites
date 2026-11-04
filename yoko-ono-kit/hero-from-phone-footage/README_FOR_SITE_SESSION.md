# Yoko Ono — scroll walkthrough hero (approved assets)

Paste this together with the folder into the session that builds the site.

## HARD RULE
The hero is built ONLY from the files in this folder. They are real footage of the restaurant.
Do not replace them with CSS/canvas animation, stock video or AI-generated video.
If something here does not work, stop and say so. Do not swap in a substitute.

## What's in the folder
| File | Use |
|---|---|
| `frames/f_001.webp … f_180.webp` | 180 frames, 720×1280 (9:16), ~7.4 MB in total. Drawn to a canvas and tied to scroll. **This is the hero.** |
| `poster.webp` | First frame. Shows before JS loads and is the reduced-motion fallback. |
| `hero-scrub-720.mp4` | The same walkthrough as a video with a keyframe every 5 frames. Backup option for scrubbing with `video.currentTime`. |
| `hero-master-1080x1920.mp4` | High-quality master for re-exporting. Do not ship it to the browser. |
| `demo.html` | Minimal working reference: a sticky canvas in a 500vh section. Tested on an iPhone 13 viewport. |
| `MASTER_BLUEPRINT_alexdukee_reconstructed.md` | Full build brief. Use it as the system for the rest of the site. |

## What the walkthrough shows (18 s of footage → 180 frames)
1. Frames 1–60: the plaza at night, string lights, turning toward the red YOKO ONO front (sped up 1.5×).
2. Dissolve into the walk-up: neon sign, lanterns, glass door.
3. Frames ~65–140: through the door into the hall, with the colorful umbrella ceiling and white tables.
4. Dissolve to the round booth with curtains and blossoms.
5. Dissolve to the carved wooden palm sign: "Restaurant · Full service / Street sushi · Self service". End of the hero.

Processing done: HDR (HLG) tone-mapped to SDR, joined, stabilized (vidstab), two motion-blurred whip pans cut out, light warm grade and vignette.

## Implementation requirements
- A sticky stage inside a section about 450–500vh tall. Frame index = scroll progress × 179.
- Preload the first ~30 frames right away and lazy-load the rest. Show `poster.webp` until frame 1 is drawn.
- Use object-fit "cover" math on the canvas so it fills both portrait and landscape.
- `prefers-reduced-motion`: show the poster only, with no 500vh section.
- The primary CTA ("הזמנת שולחן" / "תפריט" / WhatsApp, whichever the owner confirmed) stays visible over the hero at all times. Never hide it behind the animation.
- Hebrew, RTL.
- Verify: Playwright screenshots on an iPhone viewport at 0%, 35%, 60%, 85% and 100% scroll. Show them before you call it done.

## Known limits
- **Desktop:** the footage is vertical. On a wide screen, "cover" crops it hard. Options: (a) reshoot the same walk in landscape (best), (b) on desktop, frame the vertical hero in a centered phone-shaped column with blurred sides, (c) AI outpaint to 16:9 (costs credits, needs approval, may warp signs).
- A sports TV and a "פתוח" sign are visible in the hall (frames ~70–110). If you reshoot, turn off the TV and take down the sign.
- Footage was shot after closing, so the restaurant is empty. A reshoot during service would sell it better.
