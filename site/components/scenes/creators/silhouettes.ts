/*
 * Two pencil head-and-shoulders studies, drawn as open SVG strokes in a 300×400 (3:4) sheet.
 * Nobody in particular: no features, no likeness. A face line, a hair line, a neck, shoulders that run off
 * the sheet, a few hatching strokes on the shadow side and the two faint construction lines of a sketch.
 * Each stroke carries its slot in the 1.1s draw: [start, end] as fractions of the whole.
 *   ink   = the contour, 1px ink
 *   soft  = hatching and collar, graphite
 *   faint = construction lines, graphite at half strength
 */
export type Stroke = { d: string; k: 'ink' | 'soft' | 'faint'; t: [number, number] };

/* Study A: fuller hair, light from the start side; the shadow sits on the far cheek. */
const A: Stroke[] = [
  // face: temple, cheek, jaw, chin, jaw, cheek, temple (one breath, the pencil never lifts)
  { d: 'M 110 126 C 100 160, 103 198, 121 222 C 137 243, 171 243, 186 221 C 202 198, 207 162, 200 128', k: 'ink', t: [0.08, 0.46] },
  // hair line: a loose dome a touch wider than the skull, overshooting the temples
  { d: 'M 103 138 C 96 100, 118 74, 155 74 C 194 74, 215 100, 208 140', k: 'ink', t: [0.3, 0.56] },
  // the hairline across the forehead, and two strokes falling from the parting to the temples
  { d: 'M 114 128 C 132 114, 166 112, 194 126', k: 'soft', t: [0.5, 0.62] },
  { d: 'M 148 80 C 132 90, 118 104, 110 122', k: 'soft', t: [0.54, 0.64] },
  { d: 'M 160 80 C 178 88, 194 102, 202 122', k: 'soft', t: [0.56, 0.66] },
  // neck
  { d: 'M 136 238 C 138 252, 136 264, 129 276', k: 'ink', t: [0.48, 0.6] },
  { d: 'M 172 237 C 172 252, 176 264, 185 276', k: 'ink', t: [0.5, 0.62] },
  // shoulders, out of the sheet on both sides
  { d: 'M -8 348 C 38 320, 86 300, 131 280', k: 'ink', t: [0.58, 0.84] },
  { d: 'M 184 280 C 228 298, 270 324, 310 354', k: 'ink', t: [0.6, 0.86] },
  // collar: a shallow crew neck, not quite closed
  { d: 'M 127 286 C 142 302, 168 304, 188 288', k: 'soft', t: [0.76, 0.9] },
  // hatching on the shadow cheek (end side of the face)
  { d: 'M 174 152 l 11 15', k: 'soft', t: [0.8, 0.88] },
  { d: 'M 176 166 l 13 18', k: 'soft', t: [0.83, 0.91] },
  { d: 'M 176 181 l 14 19', k: 'soft', t: [0.86, 0.94] },
  { d: 'M 173 196 l 13 16', k: 'soft', t: [0.89, 0.97] },
  { d: 'M 167 210 l 10 11', k: 'soft', t: [0.92, 1] },
  // the chin's shadow on the neck
  { d: 'M 142 250 l 7 11', k: 'soft', t: [0.9, 0.96] },
  { d: 'M 152 252 l 7 11', k: 'soft', t: [0.92, 0.98] },
  { d: 'M 162 252 l 6 10', k: 'soft', t: [0.94, 1] },
  // construction: the eye line and the centre line of the head
  { d: 'M 96 162 C 132 157, 178 157, 216 163', k: 'faint', t: [0.88, 1] },
  { d: 'M 155 116 C 157 150, 156 196, 153 236', k: 'faint', t: [0.9, 1] },
];

/* Study B: short hair, a squarer jaw, broader shoulders, the head turned a degree the other way. */
const B: Stroke[] = [
  { d: 'M 106 124 C 98 160, 101 200, 117 224 C 128 240, 148 246, 162 244 C 178 242, 192 230, 198 208 C 206 184, 208 154, 202 122', k: 'ink', t: [0.08, 0.46] },
  // close-cropped hair, hugging the skull
  { d: 'M 101 132 C 97 92, 124 70, 156 70 C 190 70, 212 92, 206 130', k: 'ink', t: [0.3, 0.56] },
  // a squarer hairline, and pencil shading across the crown: short hair, darker than the paper
  { d: 'M 112 120 C 130 110, 172 108, 196 118', k: 'soft', t: [0.5, 0.62] },
  { d: 'M 118 108 l 9 -12', k: 'soft', t: [0.54, 0.6] },
  { d: 'M 132 96 l 9 -12', k: 'soft', t: [0.56, 0.62] },
  { d: 'M 148 88 l 8 -12', k: 'soft', t: [0.58, 0.64] },
  { d: 'M 164 86 l 7 -12', k: 'soft', t: [0.6, 0.66] },
  { d: 'M 180 90 l 5 -12', k: 'soft', t: [0.62, 0.68] },
  // a thicker neck
  { d: 'M 128 242 C 131 256, 129 268, 120 280', k: 'ink', t: [0.48, 0.6] },
  { d: 'M 184 238 C 184 254, 188 268, 198 280', k: 'ink', t: [0.5, 0.62] },
  // flatter, wider shoulders
  { d: 'M -8 330 C 36 308, 84 292, 122 282', k: 'ink', t: [0.58, 0.84] },
  { d: 'M 196 282 C 238 294, 278 312, 310 336', k: 'ink', t: [0.6, 0.86] },
  // an open V collar, the two strokes never meeting
  { d: 'M 121 288 L 150 326', k: 'soft', t: [0.76, 0.88] },
  { d: 'M 193 288 L 162 324', k: 'soft', t: [0.78, 0.9] },
  // hatching on the start-side cheek
  { d: 'M 128 150 l -11 15', k: 'soft', t: [0.8, 0.88] },
  { d: 'M 128 164 l -13 18', k: 'soft', t: [0.83, 0.91] },
  { d: 'M 129 179 l -14 19', k: 'soft', t: [0.86, 0.94] },
  { d: 'M 132 194 l -13 16', k: 'soft', t: [0.89, 0.97] },
  { d: 'M 138 208 l -10 11', k: 'soft', t: [0.92, 1] },
  { d: 'M 162 254 l -7 11', k: 'soft', t: [0.9, 0.96] },
  { d: 'M 152 256 l -7 11', k: 'soft', t: [0.92, 0.98] },
  { d: 'M 142 256 l -6 10', k: 'soft', t: [0.94, 1] },
  { d: 'M 92 160 C 130 154, 178 154, 214 158', k: 'faint', t: [0.88, 1] },
  { d: 'M 153 112 C 153 150, 155 196, 157 240', k: 'faint', t: [0.9, 1] },
];

export const SILHOUETTES: readonly Stroke[][] = [A, B];
/** The whole study draws in this many seconds. */
export const DRAW_SECONDS = 1.1;
