// Measurements of the painting, taken on its 2000x563 copy. Heights are in texture
// space: 0 at the bottom edge, 1 at the top.
export const PAINTING_PIXELS = { width: 2000, height: 563 }
export const PAINTING_ASPECT = PAINTING_PIXELS.width / PAINTING_PIXELS.height

// Where the sea meets the sky. Far clouds are reflected about this line.
export const HORIZON = 1 - 330 / 563

// Lines the trees and the girl stand on; their reflections mirror about these.
// Keep in step with TREE_BASE and GIRL_BASE in scripts/make_painting_layers.py.
export const TREE_BASE = 1 - 441 / 563
export const GIRL_BASE = 1 - 490 / 563

// Rectangles covered by the extra layers, as [left, bottom, right, top]. Keep in step with
// REGION and SKY_PATCH in scripts/make_painting_layers.py.
export const REGION = [440 / 2000, 1 - 563 / 563, 760 / 2000, 1 - 130 / 563] as const
export const SKY_PATCH = [110 / 2000, 1 - 275 / 563, 175 / 2000, 1 - 230 / 563] as const
