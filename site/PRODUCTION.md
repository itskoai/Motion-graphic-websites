# PRODUCTION · Higgsfield shot list (nothing here has been generated; approve before any credits are spent)

Account state checked on 23 Oct 2026: Higgsfield MCP connected, plan **max**, balance **1,870.79 credits**. Costs below are live preflight quotes (`get_cost: true`, zero spend): Seedance 2.5, 8 s, 16:9 = **56 credits**; MiniMax H3, 6 s, 2K = **12 credits** (5 s = 10); Nano Banana Pro still = **2 credits**; GPT Image 2.5 still = **0.25 credits**.

The site ships complete today on the studio's own existing footage. Every item below is optional and ranked by impact. Each is written in the prompt structure the studio's skill uses (OUTPUT / SOURCE OF TRUTH / PRESERVE / PRIMARY CHANGE / CAMERA / LIGHTING / ACTION TIMELINE / FINAL STATE / SUCCESS TEST).

## Not a Higgsfield shot (real people, real work)
- **Founder portraits ×2** (Scene 5): photographed, not generated. 3:4, one light source from the start side, paper-coloured or very dark neutral background, eyes to camera, no props. Delivered ≥ 2000 px tall, JPG. The page never shows a generated face in these frames.
- **Studio name, contact details, social links, legal owner, accessibility contact**: `site.config.ts`.

## Rank 1 · Phone-native slit loop for the hero window (≈ 10 credits)
Today the phone hero reuses the 16:9 slit loop cropped inside the ם. A 9:16 take fills the letter better.
- Model: MiniMax H3, 5 s, 2K, 9:16, start_image = the existing slit still (`public/media/hero-poster.jpg` re-framed) · **10 credits**.
- OUTPUT: one 5 s seamless loop, 9:16. SOURCE OF TRUTH: the existing beam still. PRESERVE: dead-centre razor-thin vertical line of warm white light, charcoal haze, polished black floor reflection. PRIMARY CHANGE: the haze drifts; the line breathes ±5 % in brightness; first and last frames identical. CAMERA: locked. LIGHTING: the line only. ACTION TIMELINE: 0–5 s slow drift. FINAL STATE: identical to frame 1. SUCCESS TEST: loops without a visible cut; the line stays centred within 2 px; no text.
- Post: ffmpeg → `door-loop-9x16.webm|mp4`, then set it as the phone `media` in `components/scenes/Hero.tsx`.

## Rank 2 · Two more self-initiated pieces for the index (≈ 116 credits)
Rows 01–06 are real; row 07 is openly reserved for client work. Two more own pieces make the index feel like a body of work.
- **"מכתב" (a letter folds itself)**: Nano Banana Pro master still 16:9 (2) + Seedance 2.5 8 s (56). OUTPUT: 8 s, 16:9, photoreal paper. SOURCE: the still. PRESERVE: warm paper #F1EADC, single soft window light. PRIMARY CHANGE: a sheet lifts at one corner and folds twice into a small envelope shape. CAMERA: slow push-in 8 %. LIGHTING: one window, no fill. ACTION: 0–2 s still, 2–6 s folds, 6–8 s rests. SUCCESS: folds read as paper physics, no hands, no text. **58 credits**.
- **"קו חוף" (a coastline drawn by a tide)**: same recipe, 9:16 for the reel row. **58 credits**.

## Rank 3 · A dedicated studio showreel cut (0 credits)
Chain the existing opening film → series reel → drill clip into one 25 s file with ffmpeg (fades, 24 fps, 1080×1920 for the portrait viewer and 1920×1080 for desktop). No generation; one afternoon of editing.

## Rank 4 · Scene 7 teaser still (2 credits, optional)
Today the ח holds the existing slit still. A dedicated 9:16 still: "a closed doorway with light along its bottom edge, dark corridor, 9:16" via Nano Banana Pro with the slit still as reference. OUTPUT one still; PRESERVE the warm light colour; SUCCESS: the light reads as a line under a door, nothing else bright. **2 credits**.

## Rank 5 · Share image (0 credits)
`public/media/og.jpg` is the previous site's. Re-export the hero headline on paper with the ם window as a 1200×630 JPG from the lab route (Playwright screenshot), no generation.

**Suggested first batch if approved: Rank 1 + Rank 4 = 12 credits.** Full list ≈ 128 credits. Nothing runs until you say so.
