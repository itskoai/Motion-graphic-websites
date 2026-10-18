# Asset manifest and provenance

Every visual on the site, where it came from, and how it was made. Nothing on the site is a stock image. Nothing shows a real person as a founder. All headlines are real HTML text; no image has text baked in (the one exception is the merch-site capture, which is a recording of our own website and shows that site's own Hebrew headline, inside a browser frame, labelled as our project).

Generation account: the owner's Higgsfield account. Credits are from the account ledger (`transactions`), not estimates.

## Credit ledger (this build)

| Time (UTC, 18 Oct 2026) | Model | What | Credits |
|---|---|---|---|
| 06:48:20 | GPT Image 2.5 (high, 2K) | KF-H1 the beam | 2.75 |
| 06:48:20 | GPT Image 2.5 (high, 2K) | KF-H2g cloud world (comparison, not used) | 2.75 |
| 06:48:20 | Nano Banana Pro (2K) | KF-H2n cloud world (used) | 2 |
| 06:48:20 | GPT Image 2.5 (high, 2K) | KF-S2 salt flat | 2.75 |
| 06:48:22 | GPT Image 2.5 (medium, 2K) | KF-DOOR light slit | 1 |
| 06:49:53 | Nano Banana Pro (2K, 2 refs) | KF-HM the open doorway (joins the two hero shots) | 2 |
| 06:52:55 | MiniMax H3 (2K, 5s) | V-DOOR loop | 10 |
| 06:53:09 | MiniMax H3 (2K, 5s) | V-HA hero shot A | 10 |
| 06:53:09 | MiniMax H3 (2K, 6s) | V-HB hero shot B | 12 |
| 06:53:09 | MiniMax H3 (2K, 6s) | V-S2 transformation | 12 |
| | | **Total** | **57.25 of the 100 cap** |

Cost checks (`get_cost: true`) spend nothing. Seedance 2.5 was priced (56 to 128 credits per 8s shot) and rejected for the cap; MiniMax H3 at 2K was chosen instead. The four Nano Banana Pro charges at 06:05 UTC in the ledger predate this session and are not part of this build.

## The prompt structure

Each generated asset is documented below in the brief's required structure. The "Sent" block is the exact prompt text submitted; the structured fields are the same intent broken out, so a re-roll can be written from them.

---

### KF-H1 · The beam (hero first frame)
- Job: `9179140e-3958-40e2-b054-e6cbaef6b2cf` · GPT Image 2.5 high · 16:9 2K · 2.75 credits
- Used as: start frame of V-HA; reference for KF-HM.
- **OUTPUT:** one 16:9 photoreal still, the opening frame of the film.
- **SOURCE OF TRUTH:** text only (first frame of the journey).
- **PRESERVE:** n/a (first frame).
- **PRIMARY CHANGE:** n/a.
- **CAMERA:** locked, eye level, anamorphic, centered.
- **LIGHTING:** a single razor-thin vertical line of warm white light, dead center; faint halo in the haze; deep charcoal elsewhere.
- **ACTION TIMELINE:** still.
- **FINAL STATE:** dark space, polished black floor, one line of light bisecting the frame with a reflection on the floor.
- **SUCCESS TEST:** the line is centered within a few pixels, nothing else bright in frame, no text. Passed.
- Sent: "16:9 cinematic still, the first frame of a film. A vast, dark, empty space that fills the frame edge to edge: deep charcoal with a faint cool slate-blue tint, a polished black floor receding into the distance with a soft sheen, fine atmospheric haze hanging in the air. Dead center, a single razor-thin vertical line of warm white light runs from the top edge of the frame straight down to the floor, bisecting the frame exactly, the same distance from the left edge as from the right. Where the line meets the floor it reflects as a thin soft streak. The haze right around the line glows faintly, a soft volumetric halo only a little wider than the line. Both halves of the frame are the same quiet charcoal space with gentle depth, no objects, no walls, no bright highlights on either side. Photoreal, shot on an ARRI Alexa with an anamorphic lens, subtle film grain, deep blacks that keep detail, restrained and elegant. No text, no logos, no lettering anywhere."

### KF-H2n · The world (hero final frame)
- Job: `740c4033-8599-4010-b65e-3c285d8339db` · Nano Banana Pro · 16:9 2K · 2 credits (GPT twin `41be53bf-…` 2.75 credits, same prompt, not used: its horizon glow was cooler and did not continue the doorway's warm light)
- Used as: end frame of V-HB; reference for KF-HM; still for the static hero, the film card and the share image (`hero-end.jpg`, `og.jpg`).
- **OUTPUT:** one 16:9 photoreal still, the resting frame.
- **SOURCE OF TRUTH:** text only.
- **PRESERVE:** n/a.
- **PRIMARY CHANGE:** n/a.
- **CAMERA:** high altitude, level, symmetrical.
- **LIGHTING:** first light before sunrise; a thin warm-white line along the whole horizon; slate-blue sky.
- **ACTION TIMELINE:** still.
- **FINAL STATE:** an endless sea of clouds, level horizon slightly below middle, quiet sky above (room for the settle headline).
- **SUCCESS TEST:** horizon level, upper half calm enough for text, no sun disc, no birds or aircraft, no text. Passed.
- Sent: "16:9 cinematic still, the final resting frame of a film. An endless sea of soft clouds seen from just above, stretching to a perfectly level horizon that sits slightly below the middle of the frame. First light before sunrise: a single thin luminous line of warm white light runs along the entire horizon, the sun not yet visible. The sky above is a calm, deep slate blue that softens into a pale warm haze just above the horizon. The cloud tops in the foreground are cool blue-grey with soft shadows, catching faint warm light toward the horizon. Thin wisps of mist drift between the cloud tops. Symmetrical, calm composition, one continuous world from edge to edge, with a wide quiet sky filling the upper half. Photoreal, shot on an ARRI Alexa from high altitude, anamorphic lens, subtle film grain, restrained grade, no lens flare. No text, no logos, no lettering, no birds, no aircraft anywhere."

### KF-H2g · The world, comparison render (not used)
- Job: `41be53bf-…` · GPT Image 2.5 high · 16:9 2K · 2.75 credits
- Used as: nothing. Rendered from the same prompt as KF-H2n to compare two models.
- **OUTPUT:** one 16:9 photoreal still, the resting frame.
- **SOURCE OF TRUTH:** text only (the KF-H2n prompt).
- **PRESERVE:** n/a.
- **PRIMARY CHANGE:** n/a.
- **CAMERA:** high altitude, level, symmetrical.
- **LIGHTING:** first light before sunrise, a thin warm line along the horizon.
- **ACTION TIMELINE:** still.
- **FINAL STATE:** a sea of clouds under a calm sky.
- **SUCCESS TEST:** the horizon light must continue the doorway's warm light. Failed: the glow came out cooler, so KF-H2n was used instead.
- Sent: the same text as KF-H2n.

### KF-HM · The open doorway (joins the two hero shots)
- Job: `19d54c74-34cc-4bb5-a3f0-1e81b14639d4` · Nano Banana Pro with 2 references (KF-H1, KF-H2n) · 16:9 2K · 2 credits
- Used as: end frame of V-HA and start frame of V-HB, so the two shots meet on the same image.
- **OUTPUT:** one 16:9 still.
- **SOURCE OF TRUTH:** reference 1 (KF-H1) for the space; reference 2 (KF-H2n) for the world seen through the door.
- **PRESERVE:** the dark space, floor line, haze, camera position, lens and grade of KF-H1.
- **PRIMARY CHANGE:** the line of light has opened into a tall narrow doorway of light, dead center, about one fifth of the width.
- **CAMERA:** identical to KF-H1.
- **LIGHTING:** the world's light spills out onto the floor as a soft trapezoid and glows at the doorway's edges.
- **ACTION TIMELINE:** still.
- **FINAL STATE:** a frameless doorway; through it the cloud sea and the warm horizon line, aligned with the floor line.
- **SUCCESS TEST:** horizon inside the door matches the floor line; doorway centered; no door leaf or frame material. Passed.
- Sent: "Combine the two reference images into one new frame. Keep the first reference exactly: the same dark charcoal space, the same polished black floor and where it meets the darkness, the same haze, the same camera position and lens, the same grade. Change one thing: the thin vertical line of light at the center has opened into a tall, narrow, perfectly upright rectangular doorway of light standing free on the floor, dead center, bisecting the frame, about one fifth of the frame width and about three quarters of the frame height. The doorway is an opening into another world: through it we see the sea of clouds and the thin warm-white luminous horizon line from the second reference, under its calm slate-blue sky, with the horizon seen through the doorway at the same height as the line where the black floor meets the darkness. Soft light from that world spills out of the doorway onto the black floor toward the camera as a long, soft trapezoid of light, and glows faintly in the haze around the doorway's edges. The doorway has no door and no frame material, only crisp straight edges where the dark space ends and the bright world begins. Photoreal, cinematic, anamorphic lens, subtle film grain, 16:9. No text, no logos, no lettering anywhere."

### V-HA · Hero shot A, the beam opens into a doorway
- Job: `7a4e4ec2-824f-4516-9036-262424a39c97` · MiniMax H3 · 2K 16:9 · 5s · 10 credits · start KF-H1, end KF-HM · preset "IN THE DARK" declined
- Used as: first 42 frames of `hero-scrub.mp4` and of the phone sequence `herom/`.
- **OUTPUT:** one continuous locked-off 5s shot.
- **SOURCE OF TRUTH:** start frame KF-H1, end frame KF-HM.
- **PRESERVE:** camera, space, grade.
- **PRIMARY CHANGE:** the line splits into the two edges of a doorway.
- **CAMERA:** locked off.
- **LIGHTING:** the world's light grows through the opening and pools on the floor.
- **ACTION TIMELINE:** 0s line; 1 to 4s the two halves glide apart, the light above the door dims; 5s at rest on the open door.
- **FINAL STATE:** KF-HM.
- **SUCCESS TEST:** no cut, no camera drift, ends on the end frame. Passed; the first and last half second held still and were thinned out in the frame selection.
- Sent: see `review/studio/ASSET-PROMPTS.txt` (V-HA).

### V-HB · Hero shot B, through the door into the world
- Job: `9105b3af-8de2-4756-b896-b781ad698b08` · MiniMax H3 · 2K 16:9 · 6s · 12 credits · start KF-HM, end KF-H2n · preset declined
- Used as: the last 92 frames of `hero-scrub.mp4` and of `herom/`.
- **OUTPUT:** one continuous 6s dolly shot.
- **SOURCE OF TRUTH:** start KF-HM, end KF-H2n.
- **PRESERVE:** the door's position and the horizon height.
- **PRIMARY CHANGE:** the camera passes through the door.
- **CAMERA:** steady dolly forward down the center, slowing to rest.
- **LIGHTING:** a soft bloom on the lens at the threshold, then first light over the clouds.
- **ACTION TIMELINE:** 0 to 3s approach, door edges slide past frame; 3 to 4s threshold bloom; 4 to 6s glide over the cloud sea and settle.
- **FINAL STATE:** KF-H2n.
- **SUCCESS TEST:** continuous with V-HA at the seam (same image), level horizon at rest. Passed; trimmed at about 5.3s where it came to rest.
- Sent: see `ASSET-PROMPTS.txt` (V-HB).

### KF-S2 · The salt flat, still (start frame of the transformation)
- Job: `39a54dc2-2424-4e85-9ada-2c43ce4cc25b` · GPT Image 2.5 high · 16:9 2K · 2.75 credits
- Used as: the start frame of V-S2.
- **OUTPUT:** one 16:9 photoreal still.
- **SOURCE OF TRUTH:** text only.
- **PRESERVE:** n/a (first frame).
- **PRIMARY CHANGE:** n/a.
- **CAMERA:** eye level, distant, horizon low (about one third up).
- **LIGHTING:** dusk under a heavy storm sky, a pale warm band on the horizon.
- **ACTION TIMELINE:** still.
- **FINAL STATE:** a mirror-water salt flat, one small figure from behind with an open red umbrella, slightly right of centre, reflected below.
- **SUCCESS TEST:** the umbrella is the only saturated colour, the figure is small and clearly reflected, no text. Passed.
- Sent: see `ASSET-PROMPTS.txt` (KF-S2).

### V-S2 · The salt flat becomes a world (transformation sequence)
- Job: `3b05ce04-4531-4338-a1a3-86b9094bbdb8` · MiniMax H3 · 2K · 6s · 12 credits · start KF-S2 · preset declined
- Used as: `idea/d00..d31.webp` (desktop) and `idea/m00..m31.webp` (4:5 phone crops centred on the figure), and the SC 03 film still. The pencil storyboard before it is drawn in code to match this shot's composition.
- **OUTPUT:** a 6s shot that starts on a still and becomes a world.
- **SOURCE OF TRUTH:** KF-S2.
- **PRESERVE:** the figure, the red umbrella, the mirror water, the storm sky.
- **PRIMARY CHANGE:** rain starts and the camera reveals the endless plain.
- **CAMERA:** slow crane up and pull back.
- **LIGHTING:** dusk storm light, warm band on the horizon.
- **ACTION TIMELINE:** 0 to 2s rain rings appear; 2 to 6s crane up and back.
- **FINAL STATE:** a wide calm aerial view, the figure a small red point.
- **SUCCESS TEST:** the figure stays recognisable and still; no cut. Partly passed: the camera move came out gentler than asked, so the page adds the "world" growth itself (the frame scales past the screen in code).
- Sent: see `ASSET-PROMPTS.txt` (V-S2).

### KF-DOOR · The light slit, still
- Job: `0becec53-b0c6-42b6-a6d9-ed6d5667829b` · GPT Image 2.5 medium · 16:9 2K · 1 credit
- Used as: first and last frame of V-DOOR, and `door-poster.jpg` (also the no-JS picture in "meet the minds").
- **OUTPUT:** one 16:9 photoreal still.
- **SOURCE OF TRUTH:** text only.
- **PRESERVE:** n/a.
- **PRIMARY CHANGE:** n/a.
- **CAMERA:** locked, wide, the door at the far left edge.
- **LIGHTING:** intense warm white through a narrow gap, a long wedge across the concrete floor, fine dust in the beam.
- **ACTION TIMELINE:** still.
- **FINAL STATE:** an almost black concrete room, a sliver of door ajar at the left, a calm dark area across the right two thirds.
- **SUCCESS TEST:** the gap sits at the frame edge so two mirrored copies meet as one beam; the right side stays empty; no text. Passed.
- Sent: see `ASSET-PROMPTS.txt` (KF-DOOR).

### V-DOOR · The light slit breathes (meet the minds)
- Job: `25aeaef8-b5b0-49cf-9b14-715561cc4836` · MiniMax H3 · 2K · 5s · 10 credits · start and end KF-DOOR
- Used as: `door-loop.mp4` (both panels of "meet the minds", one mirrored, so their two slits meet as one beam), `door-poster.jpg`.
- **OUTPUT:** a seamless ambient loop.
- **SOURCE OF TRUTH:** KF-DOOR for both first and last frame.
- **PRESERVE:** everything; the door does not move.
- **PRIMARY CHANGE:** the light breathes, dust drifts.
- **CAMERA:** locked off.
- **LIGHTING:** intense warm white through a narrow gap, a long wedge on the floor.
- **ACTION TIMELINE:** 0 to 5s slow brighten and soften; ends as it began.
- **FINAL STATE:** identical to the first frame.
- **SUCCESS TEST:** loops without a jump. Passed after processing: interpolated from 8 to 24 fps and the tail crossfaded into the head (1.2s).
- Sent: see `ASSET-PROMPTS.txt` (V-DOOR). The "next frame" door in SC 08 is drawn in CSS, not taken from this video.

## Derived assets (no generation)

Rebuild everything with `python3 -I review/studio/tools/build_media.py` and then `build_media2.py` (both read `review/studio/frames/`, which is not committed).

| File | Made from | How |
|---|---|---|
| `media/hero-scrub.mp4` | V-HA + V-HB | 134 selected frames, 1440x810, H.264 crf 20, keyframe every 8 frames, faststart, no audio |
| `media/herom/00..67.webp` | the same frames | centre crop to 720x1280, every second desktop frame plus the last (the phone scrub) |
| `media/hero-poster(-m).jpg`, `hero-end(-m).jpg` | first and last hero frames | stills for loading, static and fallback states; also the start and end images of the film card in "עבודות" |
| `media/idea/d00..d22.webp`, `m00..m22.webp` | V-S2 | 1280x720 desktop frames and 648x810 phone crops centred on the figure |
| `media/idea/d23..d31.webp`, `m23..m31.webp` | V-S2, last 41 source frames | the full-bleed end of the sequence at 1920x1080 and 864x1080 |
| the pencil storyboard in SC 02 | nothing (no file) | drawn live on a canvas by `site.js` from seeded strokes, so it can draw itself as you scroll |
| `media/world-film-800/1600.webp` | V-S2 last frame | the "סרטים וסיפורים" image in SC 03 |
| `media/og.jpg` | hero end frame | 1200x630 share image, no text |
| `media/favicon-32.png`, `touch-icon-180.png` | nothing (drawn) | the mark: a frame and a beam, drawn in `build_media2.py` |
| `media/site-capture.mp4`, `site-poster.jpg` | our merch website (`yuval-itay-set/`) | recorded in a headless browser while scrolling, 1120x700 |
| `media/reel.mp4`, `reel-poster.jpg` | 4 of the owner's existing "דור העתיד" clips | 163 frames at the clips' native 480x854, cut together (no new generation) |
| `media/merch/*.webp` (+ `-360`, `-720` sizes) | images from our merch website project | resized only; the full-size files are kept as the source for the smaller sizes |
| `media/door-loop.mp4`, `door-loop-m.mp4`, `door-poster.jpg` | V-DOOR | 1152x648 loop; the phone version is the slit side only, 320x576 |

Owner clips in the reel (from the account's history, made before this build): `6c50241e`, `5500a4a7`, `b3e0d600`, `bc7bf470`. They are drafts at 480p, which is why the series reel is shown at phone size. Two shots were cut on purpose: a masked-kids shot with a striped strap that looked like a designer pattern, and a sneaker close-up with a swoosh-like mark.

Fonts (self-hosted, SIL Open Font License): Karantina, IBM Plex Sans Hebrew, Frank Ruhl Libre, IBM Plex Mono. `review/studio/tools/fonts.py` downloads each face once, cut down to the letters the site uses (Hebrew plus Latin), and rewrites the `@font-face` block in `site.css`. Re-run it after changing the text.

## Content notes for the owner
- The car designs in the reel and in "דור העתיד" are AI-made and look like real production cars. Please check you are comfortable showing them.
- The merch images show a puff-print pattern on the sets. Please confirm the print is yours to use.
- No portrait on the site is presented as a founder. The founder panels show light, not faces, until real photos are added in `assets/config.js`.
