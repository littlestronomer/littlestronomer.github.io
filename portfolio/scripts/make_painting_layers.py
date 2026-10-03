"""Split the horizon page's painting into layers the shader can move separately.

Only the rectangle around the trees and the girl (REGION) needs extra layers; the rest of
the painting is used as it is. Every output is cropped to REGION:

scene-background.png  the sky and water with the trees, the girl and their reflections
                      painted out, so clouds can drift behind them
scene-under.png       the girl with her dress and hair painted out, so they can move
                      without dragging her legs and arms along
scene-matte.png       red = trees and their reflections, green = the girl and her
                      reflection (how opaque each pixel is), blue = how far leaves sway
scene-cloth.png       red = her dress, green = her hair (how opaque), blue = how far they move

One more small crop, SKY_PATCH, takes the little painted paper plane out of the clouds so a
separate plane can fly on its own:

scene-sky-patch.png   the sky around the painted paper plane, with the plane painted out

Usage (needs Pillow and NumPy):
  python scripts/make_painting_layers.py [painting.jpg] [output folder]

Shapes were measured on the 2000x563 copy of the painting and are stored in its pixels,
scaled to the actual size, so a larger copy of the same painting works without edits.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path(__file__).resolve().parent.parent / "src" / "horizon" / "assets"
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ASSETS / "painting.jpg"
OUTPUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ASSETS

REF_W, REF_H = 2000, 563

# The rectangle the layers cover (left, top, right, bottom). Keep in step with REGION in
# src/horizon/painting.ts.
REGION = (440, 130, 760, 563)

# Lines the trees and the girl stand on; their reflections mirror about these.
TREE_BASE = 441
GIRL_BASE = 490
# Below this line green pixels are reflections of leaves rather than leaves.
GROUND = 452

# Where leaves can be (left, top, right, bottom); stray green specks elsewhere are ignored.
TREE_AREA = (455, 140, 725, 563)
# The trunks and branches stand inside this box. Below LEAF_FLOOR it holds only bark,
# even where the dark teal bark passes the leaf colour test.
TRUNK_BOX = (500, 280, 662, GROUND)
LEAF_FLOOR = 383
# The trunks' reflections lie inside this box.
TRUNK_REFLECTION_BOX = (500, GROUND, 668, 563)

# The small tree's canopy; every other leaf belongs to the big tree. Treetops sway more
# than the lower branches, measured from each canopy's bottom up to its top.
SMALL_CANOPY = (465, 312, 590, 392)
SMALL_CANOPY_SPAN = (392, 312)
BIG_CANOPY_SPAN = (335, 160)

# Outline of the girl, from her raised hand round to her feet.
GIRL = [
    (655, 368), (662, 366), (668, 372), (680, 376), (686, 372), (681, 358),
    (690, 352), (700, 350), (710, 355), (719, 365), (724, 375), (730, 388),
    (724, 394), (716, 399), (712, 404), (717, 416), (724, 427), (716, 441),
    (706, 446), (709, 462), (711, 477), (709, 484), (701, 491), (688, 491),
    (689, 476), (690, 458), (686, 446), (682, 432), (683, 414), (688, 398),
    (686, 392), (670, 388), (660, 382), (653, 376),
]
# Her dress, from the shoulder strap round the blown-out hem, and her hair streaming right.
DRESS = [
    (690, 389), (699, 388), (705, 391), (709, 398), (714, 408), (719, 416),
    (725, 423), (727, 428), (722, 433), (716, 440), (708, 445), (697, 447),
    (686, 446), (683, 438), (682, 428), (684, 416), (687, 404), (688, 395),
]
HAIR = [
    (703, 366), (712, 366), (720, 371), (727, 379), (733, 388), (731, 395),
    (723, 398), (715, 400), (709, 396), (705, 387), (702, 377),
]

# The painted paper plane, and the crop around it (left, top, right, bottom). Keep
# SKY_PATCH in step with SKY_PATCH in src/horizon/painting.ts.
PAPER_PLANE = (126, 244, 155, 261)
SKY_PATCH = (110, 230, 175, 275)

# Hidden parts of the sky and water are filled with a copy of the same rows from elsewhere
# in the painting, at least MIN_CLONE_SHIFT away so no cloud visibly repeats next to itself.
# The paper plane is small, so a nearby stretch of the same cloud fills it best.
MIN_CLONE_SHIFT = 300
PLANE_CLONE_SHIFTS = (24, 160)
HORIZON = 330


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def to_image(values):
    return Image.fromarray((np.clip(values, 0.0, 1.0) * 255).round().astype(np.uint8))


def grow(mask, px):
    size = 2 * max(1, round(px)) + 1
    return np.asarray(to_image(mask).filter(ImageFilter.MaxFilter(size))) / 255.0


def shrink(mask, px):
    size = 2 * max(1, round(px)) + 1
    return np.asarray(to_image(mask).filter(ImageFilter.MinFilter(size))) / 255.0


def soften(mask, px):
    return np.asarray(to_image(mask).filter(ImageFilter.GaussianBlur(px))) / 255.0


def mirror(mask, line):
    """Flip rows about a horizontal line, given in pixels from the top."""
    h = mask.shape[0]
    rows = np.round(2 * line - np.arange(h) - 1).astype(int)
    flipped = np.zeros_like(mask)
    inside = (rows >= 0) & (rows < h)
    flipped[inside] = mask[rows[inside]]
    return flipped


def smooth3(values):
    """A light [1 2 1] blur in both directions, for arrays of any range."""
    padded = np.pad(values, ((1, 1), (1, 1), (0, 0)), mode="edge")
    rows = (padded[:-2] + 2 * padded[1:-1] + padded[2:]) / 4
    return (rows[:, :-2] + 2 * rows[:, 1:-1] + rows[:, 2:]) / 4


def fill_enclosed(solid):
    """Add every gap that solid pixels surround completely, like a paint-bucket fill from outside."""
    outside = np.zeros_like(solid)
    outside[[0, -1], :] = True
    outside[:, [0, -1]] = True
    outside &= ~solid
    while True:
        spread = (grow(outside.astype(float), 1) > 0.5) & ~solid
        if (spread == outside).all():
            return solid | ~outside
        outside = spread


def best_clone_shift(rgb, ring, hole_columns, nearest=MIN_CLONE_SHIFT, farthest=None):
    """Find the sideways shift whose copy of the painting best matches the colours around a hole."""
    w = rgb.shape[1]
    first, last = hole_columns.min(), hole_columns.max()
    best_shift, best_error = None, np.inf
    for shift in range(-first, w - last, 4):
        if abs(shift) < nearest or (farthest and abs(shift) > farthest):
            continue
        if first + shift <= last and last + shift >= first:
            continue
        error = np.mean((rgb[ring] - np.roll(rgb, -shift, axis=1)[ring]) ** 2)
        if error < best_error:
            best_shift, best_error = shift, error
    return best_shift


def pull_push(values, known):
    """Fill the pixels where known is 0 with a smooth blend of the known ones around them."""
    h, w = known.shape
    if h <= 1 or w <= 1:
        mean = (values * known[..., None]).sum((0, 1)) / max(known.sum(), 1e-6)
        return known[..., None] * values + (1 - known[..., None]) * mean
    ph, pw = h + h % 2, w + w % 2
    weighted = np.pad(values * known[..., None], ((0, ph - h), (0, pw - w), (0, 0)), mode="edge")
    weights = np.pad(known, ((0, ph - h), (0, pw - w)), mode="edge")
    coarse_weighted = weighted.reshape(ph // 2, 2, pw // 2, 2, -1).sum(axis=(1, 3))
    coarse_weights = weights.reshape(ph // 2, 2, pw // 2, 2).sum(axis=(1, 3))
    coarse_values = coarse_weighted / np.maximum(coarse_weights, 1e-6)[..., None]
    coarse = pull_push(coarse_values, np.minimum(coarse_weights, 1.0))
    upsampled = smooth3(coarse.repeat(2, axis=0).repeat(2, axis=1)[:h, :w])
    return known[..., None] * values + (1 - known[..., None]) * upsampled


def main():
    painting = Image.open(SOURCE).convert("RGB")
    w, h = painting.size
    sx, sy = w / REF_W, h / REF_H
    scale = sy
    rgb = np.asarray(painting).astype(np.float64)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    ys = (np.arange(h)[:, None] + 0.5) / sy
    xs = (np.arange(w)[None, :] + 0.5) / sx

    def box(left, top, right, bottom):
        return (xs >= left) & (xs <= right) & (ys >= top) & (ys <= bottom)

    def shape(points):
        image = Image.new("L", (w, h), 0)
        ImageDraw.Draw(image).polygon([(x * sx, y * sy) for x, y in points], fill=255)
        return np.asarray(image) / 255.0

    # Trees. Leaves are the only clearly green pixels (teal leaves still have green >= blue);
    # bark and branches are dark and not strongly blue.
    bark_only = box(*TRUNK_BOX) & (ys >= LEAF_FLOOR)
    greenness = np.minimum(g - r - 30, g - b + 5)
    leaf = smoothstep(-6, 10, greenness) * box(*TREE_AREA) * ~bark_only
    leaf *= grow(shrink((leaf > 0.5).astype(float), 1), 2)
    dark = smoothstep(135, 105, luma) * (b - r < 65)
    above_ground = ys < GROUND
    trunks = dark * box(*TRUNK_BOX)
    # Lower down, the trunks' reflections turn navy against deep blue water and no longer
    # stand out by colour, so the trunks' mirror image covers them as well.
    mirrored_trunks = grow(mirror(trunks, TREE_BASE * sy) * ~above_ground, 3 * scale)
    trees = np.maximum.reduce([
        leaf,
        trunks,
        np.maximum(dark, mirrored_trunks) * box(*TRUNK_REFLECTION_BOX),
    ])
    # Close gaps between leaves and branches, so the drifting sky never shows through.
    trees = np.maximum(trees, shrink(grow((trees > 0.5).astype(float), 3 * scale), 3 * scale))
    trees = np.maximum(trees, fill_enclosed(trees > 0.5))
    # Reflections sit on moving water, so give them softer edges than the trees themselves.
    trees = np.where(above_ground, trees, soften(trees * ~above_ground, 2.5 * scale))

    in_small_canopy = soften(box(*SMALL_CANOPY).astype(float), 10 * scale)
    small_height = smoothstep(SMALL_CANOPY_SPAN[0], SMALL_CANOPY_SPAN[1], ys)
    big_height = smoothstep(BIG_CANOPY_SPAN[0], BIG_CANOPY_SPAN[1], ys)
    height_in_canopy = big_height + (small_height - big_height) * in_small_canopy
    canopy = leaf * above_ground
    sway = np.maximum(
        soften(grow(canopy, 3 * scale), 2 * scale) * (0.45 + 0.55 * height_in_canopy),
        0.6 * soften(grow(leaf * ~above_ground, 2 * scale), 2 * scale),
    )

    # The girl and her reflection under her feet.
    girl_shape = shape(GIRL)
    below_feet = ys > GIRL_BASE
    girl = np.maximum(
        soften(grow(girl_shape, 1 * scale), 0.8 * scale),
        soften(grow(mirror(girl_shape, GIRL_BASE * sy) * below_feet, 2 * scale), 2.5 * scale),
    )

    # Her dress (legs and arms are warmer than the white cloth, so they stay out of it)
    # and her hair (dark strands against the light sky).
    skin = smoothstep(4, 14, r - b)
    dress = soften(grow(shape(DRESS), 1 * scale), 0.7 * scale) * (1 - skin)
    dress = np.maximum(dress, mirror(dress, GIRL_BASE * sy) * below_feet)
    hair = grow(shape(HAIR), 2 * scale) * smoothstep(170, 110, luma)

    # How far each part of the cloth moves: the hem and the downwind edge of the dress
    # more than the shoulders, the tips of the hair more than the roots.
    dress_reach = np.clip(
        smoothstep(398, 446, ys) + 0.6 * smoothstep(700, 726, xs) * smoothstep(400, 432, ys), 0, 1
    )
    dress_reach = np.maximum(dress_reach, mirror(dress_reach, GIRL_BASE * sy) * below_feet)
    hair_reach = smoothstep(703, 731, xs)
    cloth_reach = np.maximum(
        soften(grow((dress > 0.05).astype(float), 4 * scale), 2 * scale) * dress_reach,
        soften(grow((hair > 0.05).astype(float), 3 * scale), 2 * scale) * hair_reach,
    )

    # Under the dress and hair: the rest of the girl, with the cloth painted out by
    # blending in what surrounds it (her legs below the hem, the sky beside her hair).
    under_hole = grow((np.maximum(dress, hair) > 0.05).astype(float), 2 * scale)
    under = pull_push(rgb, 1 - under_hole)

    # Behind everything: the sky and water, with the trees, the girl and their reflections
    # replaced by the same rows copied from elsewhere: the sky from the best-matching stretch
    # of sky, the water from the best-matching stretch of water. The copy is then nudged so
    # its colours meet the surrounding painting without a seam.
    hole = grow((np.maximum(trees, girl) > 0.03).astype(float), 6 * scale)
    ring = grow(hole, 4 * scale) * (1 - hole)
    hole_columns = np.nonzero(hole.any(axis=0))[0]
    in_sky = np.broadcast_to(ys < HORIZON, hole.shape)
    sky_shift = best_clone_shift(rgb, (ring > 0) & in_sky, hole_columns)
    water_shift = best_clone_shift(rgb, (ring > 0) & ~in_sky, hole_columns)
    print(f"filling hidden sky from {sky_shift:+d}px and hidden water from {water_shift:+d}px")
    clone = np.where(in_sky[..., None], np.roll(rgb, -sky_shift, axis=1), np.roll(rgb, -water_shift, axis=1))
    correction = pull_push(rgb - clone, ring)
    feather = soften(hole, 1.5 * scale)[..., None]
    background = rgb * (1 - feather) + (clone + correction) * feather

    # The painted paper plane: replace it with a nearby stretch of the same cloud, so the
    # clouds can drift on without it.
    plane_hole = grow(box(*PAPER_PLANE).astype(float), 1 * scale)
    plane_ring = grow(plane_hole, 3 * scale) * (1 - plane_hole)
    plane_columns = np.nonzero(plane_hole.any(axis=0))[0]
    plane_shift = best_clone_shift(rgb, plane_ring > 0, plane_columns, *PLANE_CLONE_SHIFTS)
    print(f"filling the painted paper plane from {plane_shift:+d}px")
    plane_clone = np.roll(rgb, -plane_shift, axis=1)
    plane_fill = plane_clone + pull_push(rgb - plane_clone, plane_ring)
    plane_feather = soften(plane_hole, 1 * scale)[..., None]
    sky = rgb * (1 - plane_feather) + plane_fill * plane_feather

    def save(channels, name, region=REGION):
        left, top, right, bottom = (round(region[0] * sx), round(region[1] * sy), round(region[2] * sx), round(region[3] * sy))
        image = np.stack(channels, axis=-1) if isinstance(channels, list) else channels
        crop = image[top:bottom, left:right]
        path = OUTPUT / name
        Image.fromarray(np.clip(crop, 0, 255).round().astype(np.uint8), "RGB").save(path, optimize=True)
        print(f"wrote {path} ({crop.shape[1]}x{crop.shape[0]})")

    save(background, "scene-background.png")
    save(under, "scene-under.png")
    save([trees * 255, girl * 255, sway * 255], "scene-matte.png")
    save([dress * 255, hair * 255, cloth_reach * 255], "scene-cloth.png")
    save(sky, "scene-sky-patch.png", SKY_PATCH)


if __name__ == "__main__":
    main()
