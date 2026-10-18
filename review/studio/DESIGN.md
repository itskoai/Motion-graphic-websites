# Design package · OUTFRAME studio site

## 1. Premise
A film's opening titles, performed by the visitor's scroll. Darkness, one line of light, the line opens into a frame, the frame opens into a world. Two images carry the whole site: the **line of light** (the beam) and the **frame**. In the copy, מסגרת always means the two founders (two sides of one frame) and פריים always means the image.

## 2. Palette (sampled from the footage)
| Token | Value | Use | Contrast on canvas |
|---|---|---|---|
| `--canvas` | `#0b0d11` | the dark before the beam | |
| `--panel` | `#12151b` | quiet surfaces | |
| `--bone` | `#ece6da` | text, the warm white of the horizon line | 15.7:1 |
| `--mist` | `#a9b0bd` | secondary text, the cloud tops | 8.9:1 |
| `--slate` | `#7a8597` | labels, tertiary | 5.2:1 |
| `--beam` | `#fff4e2` | the light itself, primary buttons | 17.9:1 |
| `--signal` | `#e5412d` | the umbrella red: rec dot, focus ring, one emphasis | 4.8:1 |

Red is rare on purpose: the rec dot in the spine and in primary buttons, focus states, the dot beside "הפריים הבא" in the nav. The umbrella in the footage is the only other red.

## 3. Type
- **Karantina 700** (display): condensed Hebrew with a film-poster voice. Headlines only.
- **IBM Plex Sans Hebrew 300/400/500** (body): quiet and precise.
- **Frank Ruhl Libre 300** (the vision scene only): a classic Hebrew serif for the one slow, reflective moment.
- **IBM Plex Mono 400** (Latin labels): timecodes, aspect ratios, SHOT 01.

## 4. Signature
The **beam**. It opens the film, splits into the two sides of the door, becomes the seam where the two founder panels meet, draws the reveal edges in the transformation scene, runs as the fixed spine with a live timecode (scroll measured as film, 24 fps), crosses the vision scene as the horizon line that moves ("הקו זז"), joins the process steps, and is the closed door in the mystery scene that the visitor can hold open (and that never reveals what is behind it). Remove it and the site loses its story.

## 5. Band map (hero, desktop 640vh, scroll range 540vh; phones 600vh)
| Band | Progress | Plateau | Film | Entrance (echoes the footage) |
|---|---|---|---|---|
| b1 כל רעיון מתחיל ככה. | 0 to 0.17 | about 80vh | the beam holds | characters open out of a single vertical line |
| b2 שני צדדים של אותה מסגרת. | 0.21 to 0.42 | about 92vh | the line splits into a doorway | the two halves part from the centre |
| b3 ומעבר למסגרת, עולם. | 0.47 to 0.70 | about 86vh | the camera approaches the door | words approach from depth |
| (breath) | 0.70 to 0.76 | | passing through the door | no text |
| settle מה שנשאר אחרי שהמסך נכבה. | 0.76 to 1 | about 120vh | the world settles | words rise, then line, then buttons |

Progress to film frame is a piecewise map (0 to 0, 0.16 to 3, 0.42 to 40, 0.72 to 100, 1 to 133), so the beam is allowed to hold before the door opens.

Flick test (measured): every beat holds full opacity for 5 or more 120px flicks and none can be skipped at 360px. Worst-pixel contrast under every hero line, measured from the composited page with the glyphs hidden: all headline bands 4:1 or better, body lines 4.5:1 or better.

## 6. Scenes
1. Hero: scroll-scrubbed film (video on desktop, a 68-frame portrait sequence on phones, a composed still with reduced motion).
2. Transformation: pencil sketch, then a reveal from a centre line with beam edges, then motion, then the frame grows past the screen into a world. Four words as a stepper, one caption line at a time.
3. Four ways to tell a story: a list with a sticky media frame that opens from a centre slit for each item (phones: each item carries its own image). Mono labels are the medium's own vocabulary (2.39:1, 9:16, SCROLL, TURNAROUND).
4. Meet the minds: two panels of the same light slit, one mirrored, slide in from opposite sides until the two slits become one beam.
5. Vision: Frank Ruhl lines that light word by word while a horizon line moves up the screen.
6. Work: three own projects in three different frames: a phone (the series), a browser (the merch site), a 2.39:1 letterbox (this film).
7. How we think: three words on a beam rail that lights them in order.
8. The next frame: a closed door of light. Press and hold to peek: the slit widens and floods white, and the answer is "עוד לא." Then the list signup with explicit consent.
9. Your turn: two paths, inquiry and list. Footer with the wordmark beside its beam.

## 7. Engineering
Plain HTML, CSS and JS, no build. One scroll listener, one rAF loop that eases every scene (dt-normalised lerp) and rests when converged; scenes only run near the screen. Video fetched whole as a Blob with an honest progress ring and a 20s stall watchdog; seeks gated (one in flight, newest wins). Canvas sequences load coarse to fine and crossfade between neighbours. Every scroll-driven DOM write is delta-gated. Animations are transform and opacity only. The five hero gates are decided before first paint and re-checked live; reduced motion is honoured both ways mid-session. The page is complete if the video or the frames never arrive.
