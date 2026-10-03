"""Draws the portfolio's pixel art: 88x31 buttons, the walk's thumbnail, a star tile for the
background and the link preview.

Usage: python scripts/make_pixel_assets.py   (needs Pillow and NumPy)

Text in the buttons uses Silkscreen, a pixel font made for 8px, so every letter lands on
whole pixels. The preview uses Pixelify Sans, which has the Turkish letters in my name. Both
fonts are in scripts/fonts under the SIL Open Font License.
"""

import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "scripts" / "fonts"
BUTTONS = ROOT / "public" / "buttons"
PAINTING = ROOT / "src" / "horizon" / "assets" / "painting.jpg"

SILKSCREEN = ImageFont.truetype(str(FONTS / "Silkscreen-Regular.ttf"), 8)
SILKSCREEN_BIG = ImageFont.truetype(str(FONTS / "Silkscreen-Regular.ttf"), 16)

# The site's palette (see src/home/home.css).
NIGHT = "#100f2b"
SKY = ["#07061a", "#0b0a24", "#100e2f", "#16133b", "#1d1948", "#252056", "#2e2765"]
PANEL = "#1b1942"
LINE = "#5b55c7"
TEXT = "#edecff"
MUTED = "#aaa6dc"
GOLD = "#ffe7a3"
BLUE = "#4aa8ff"
ORANGE = "#ff944d"
INK = "#05040f"

BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 + 1 / 32


def rgb(color):
    color = color.lstrip("#")
    return tuple(int(color[i : i + 2], 16) for i in (0, 2, 4))


def dithered_gradient(width, height, colors, power=1.0):
    """A top-to-bottom gradient through `colors`, ordered-dithered between neighbours."""
    image = Image.new("RGB", (width, height))
    pixels = image.load()
    for y in range(height):
        t = (y / max(1, height - 1)) ** power * (len(colors) - 1)
        band = int(t)
        for x in range(width):
            pick = band + 1 if t - band > BAYER[y % 4, x % 4] else band
            pixels[x, y] = rgb(colors[min(pick, len(colors) - 1)])
    return image


# Silkscreen's capitals sit 4px below the point they are drawn from, and are 5px tall. These
# rows put two or three lines in the middle of a 31px button, 3px apart.
TWO_LINES = (5, 13)
THREE_LINES = (1, 9, 17)


def text(draw, xy, words, color, font=SILKSCREEN):
    draw.text(xy, words, fill=rgb(color), font=font)


def text_width(words, font=SILKSCREEN):
    left, _, right, _ = font.getbbox(words)
    return right - left


def frame(image, outer=INK, light="#ffffff", dark="#000000", strength=0.22):
    """The classic button edge: a dark outline and a bevel, lit from the top left."""
    draw = ImageDraw.Draw(image)
    w, h = image.size
    pixels = image.load()

    def shade(x, y, color, amount):
        r, g, b = pixels[x, y]
        tr, tg, tb = rgb(color)
        pixels[x, y] = (
            round(r + (tr - r) * amount),
            round(g + (tg - g) * amount),
            round(b + (tb - b) * amount),
        )

    for x in range(1, w - 1):
        shade(x, 1, light, strength)
        shade(x, h - 2, dark, strength * 1.6)
    for y in range(2, h - 2):
        shade(1, y, light, strength)
        shade(w - 2, y, dark, strength * 1.6)
    draw.rectangle([0, 0, w - 1, h - 1], outline=rgb(outer))
    return image


def new_button(background):
    image = Image.new("RGB", (88, 31), rgb(background))
    draw = ImageDraw.Draw(image)
    draw.fontmode = "1"
    return image, draw


def sprinkle_stars(image, count, seed, keep_out=(), colors=("#3a3680", "#6a65b6", "#b2aeee")):
    """Scatters faint stars, leaving the boxes in `keep_out` clear so letters stay clean."""
    rng = random.Random(seed)
    pixels = image.load()
    placed = 0
    # A fixed number of tries, so a button with little free room cannot loop forever.
    for _ in range(count * 200):
        if placed == count:
            break
        x = rng.randrange(2, 86)
        y = rng.randrange(2, 29)
        if any(left <= x <= right and top <= y <= bottom for left, top, right, bottom in keep_out):
            continue
        pixels[x, y] = rgb(rng.choice(colors))
        placed += 1


# Orion, my favorite constellation, drawn as a neural network the same way the site's header
# draws it (src/home/nightSky.ts): head, shoulders, belt and feet as four layers. Right ascension
# and declination in degrees; size 2 marks Rigel and Betelgeuse, 0 the faint head.
ORION = [
    [(83.78, 9.93, 0, "blue")],
    [(88.79, 7.41, 2, "red"), (81.28, 6.35, 1, "blue")],
    [(85.19, -1.94, 1, "blue"), (84.05, -1.2, 1, "blue"), (83.0, -0.3, 1, "blue")],
    [(86.94, -9.67, 1, "blue"), (78.63, -8.2, 2, "blue")],
]
ORION_SWORD = [(83.85, -4.84), (83.86, -5.91)]
ORION_NEBULA = (83.82, -5.39)
ORION_MIDDLE = (83.7, 0.13)
STAR_LOOKS = {"red": ("#ffe2c4", "#ff9a5c"), "blue": ("#f4f2ff", "#b9c9ff")}
GLYPHS = {
    "O": ["###", "#.#", "#.#", "#.#", "###"],
    "R": ["##.", "#.#", "##.", "#.#", "#.#"],
    "I": ["###", ".#.", ".#.", ".#.", "###"],
    "N": ["#..#", "##.#", "#.##", "#..#", "#..#"],
}


def blend(pixels, x, y, color, alpha=1.0):
    r, g, b = pixels[x, y][:3]
    tr, tg, tb = rgb(color)
    pixels[x, y] = (round(r + (tr - r) * alpha), round(g + (tg - g) * alpha), round(b + (tb - b) * alpha))


def line_points(start, end):
    """The pixels of a straight line, ends included (Bresenham)."""
    (x, y), (x1, y1) = start, end
    dx, dy = abs(x1 - x), -abs(y1 - y)
    sx, sy = (1 if x < x1 else -1), (1 if y < y1 else -1)
    error = dx + dy
    points = [(x, y)]
    # A line never has more pixels than its longer side, so the loop is bounded.
    for _ in range(max(dx, -dy)):
        twice = 2 * error
        if twice >= dy:
            error += dy
            x += sx
        if twice <= dx:
            error += dx
            y += sy
        points.append((x, y))
    return points


def draw_orion(image, center, degree, tiny=False, label=True):
    """Orion as a network at `center`, `degree` pixels per degree of sky."""
    pixels = image.load()
    cx, cy = center

    def place(ra, dec):
        return (round(cx + (ORION_MIDDLE[0] - ra) * degree), round(cy - (dec - ORION_MIDDLE[1]) * degree))

    layers = [[(place(ra, dec), size, look) for ra, dec, size, look in layer] for layer in ORION]
    for upper, lower in zip(layers, layers[1:]):
        for start, _, _ in upper:
            for end, _, _ in lower:
                points = line_points(start, end)[1:-1] if tiny else line_points(start, end)[2:-2]
                for i, (x, y) in enumerate(points):
                    if tiny or i % 2 == 0:
                        blend(pixels, x, y, "#3a358f", 0.8 if tiny else 1)
    if not tiny:
        nx, ny = place(*ORION_NEBULA)
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                strength = 1 - math.hypot(dx * 0.9, dy) / 2.6
                if strength > BAYER[(ny + dy) % 4, (nx + dx) % 4] * 0.9:
                    blend(pixels, nx + dx, ny + dy, "#b77fc4", 0.25 + 0.45 * strength)
        blend(pixels, nx, ny, "#b2aeee")
        for ra, dec in ORION_SWORD:
            blend(pixels, *place(ra, dec), "#6a65b6")
    for layer in layers:
        for (x, y), size, look in layer:
            core, arm = STAR_LOOKS[look]
            blend(pixels, x, y, core)
            if tiny and size < 2:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                blend(pixels, x + dx, y + dy, arm, 0.55 if size == 0 else 1)
            if size >= 2 and not tiny:
                for dx, dy in ((2, 0), (-2, 0), (0, 2), (0, -2)):
                    blend(pixels, x + dx, y + dy, arm, 0.5)
                for dx, dy in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
                    blend(pixels, x + dx, y + dy, arm, 0.3)
    if label and not tiny:
        right = max(point[0] for layer in layers for point, _, _ in layer)
        left = right + 4
        top = layers[2][1][0][1] - 2
        for letter in "ORION":
            glyph = GLYPHS[letter]
            for dy, row in enumerate(glyph):
                for dx, cell in enumerate(row):
                    if cell == "#":
                        blend(pixels, left + dx, top + dy, "#5f5aae")
            left += len(glyph[0]) + 1
    return place, layers


def draw_astronomer(image, foot_x, foot_y, target):
    """The little astronomer in a scarf at a telescope, as in the site's header."""
    pixels = image.load()
    shape, scarf = set(), set()
    for y in range(foot_y - 3, foot_y):
        shape.update({(foot_x - 1, y), (foot_x + 1, y)})
    for row in range(6):
        half = 2 if row < 2 else 1
        shape.update((x, foot_y - 4 - row) for x in range(foot_x - half, foot_x + half + 1))
    for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, -1), (1, -1), (-1, -1), (0, 1), (1, 1), (-1, 1), (0, -2), (2, -1), (2, 0)):
        shape.add((foot_x + dx, foot_y - 12 + dy))
    for dx, dy in ((-1, -10), (0, -10), (1, -10), (-2, -10), (-3, -11), (-4, -11), (-5, -12)):
        scarf.add((foot_x + dx, foot_y + dy))
    eye_x, eye_y = foot_x + 3, foot_y - 12
    angle = min(max(math.atan2(eye_y - target[1], target[0] - eye_x), 0.2), 1.05)
    ux, uy = math.cos(angle), -math.sin(angle)
    for step in range(12):
        x, y = eye_x + ux * step, eye_y + uy * step
        shape.update({(round(x), round(y)), (round(x + 1), round(y))})
        if step > 7:
            shape.add((round(x), round(y - 1)))
    shape.update(line_points((foot_x + 1, foot_y - 8), (eye_x, eye_y + 1)))
    mount = (round(eye_x + ux * 5), round(eye_y + uy * 5) + 1)
    for leg_x in (mount[0] - 3, mount[0] + 1, mount[0] + 4):
        shape.update(line_points(mount, (leg_x, foot_y)))
    for x, y in shape:
        pixels[x, y] = rgb("#06051a") if (x, y - 1) in shape else rgb("#2b2662")
    for x, y in scarf:
        pixels[x, y] = rgb("#d9b25c")
    pixels[round(eye_x + ux * 11 + 1), round(eye_y + uy * 11 - 1)] = rgb(GOLD)


def button_littlestronomer():
    image = dithered_gradient(88, 31, SKY[:6], power=1.1)
    sprinkle_stars(image, 22, 3, keep_out=[(2, 2, 25, 28), (27, 7, 85, 23)])
    draw = ImageDraw.Draw(image)
    draw.fontmode = "1"
    draw_orion(image, (14, 15), 1.15, tiny=True)
    text(draw, (29, TWO_LINES[0]), "LITTLE", GOLD)
    text(draw, (29, TWO_LINES[1]), "STRONOMER", TEXT)
    return frame(image, outer=LINE)


def button_agi():
    image, draw = new_button("#0d0c26")
    sprinkle_stars(image, 8, 5, keep_out=[(3, 2, 38, 25), (41, 3, 85, 27)])
    text(draw, (5, -3), "AGI", GOLD, SILKSCREEN_BIG)
    text(draw, (6, 14), "SOON?", MUTED)
    text(draw, (44, 1), "LOADING", MUTED)
    # A progress bar, stuck a little under halfway.
    draw.rectangle([43, 12, 83, 19], outline=rgb(LINE), fill=rgb("#141236"))
    filled = 43 + round(40 * 0.42)
    for x in range(45, filled):
        color = BLUE if (x // 2) % 2 == 0 else "#7cc2ff"
        draw.line([(x, 14), (x, 17)], fill=rgb(color))
    text(draw, (44, 17), "42%", TEXT)
    return frame(image, outer=LINE)


def button_loss():
    image, draw = new_button(PANEL)
    # Axes, and a loss curve falling fast and then settling.
    draw.line([(5, 4), (5, 25)], fill=rgb(MUTED))
    draw.line([(5, 25), (36, 25)], fill=rgb(MUTED))
    points = []
    for x in range(7, 36):
        t = (x - 7) / 28
        y = 6 + 17 * (1 - math.exp(-4.2 * t)) + (1 if x % 5 == 0 and t < 0.5 else 0)
        points.append((x, round(y)))
    draw.line(points, fill=rgb(ORANGE))
    draw.point([points[-1]], fill=rgb(GOLD))
    text(draw, (42, THREE_LINES[0]), "LOSS", GOLD)
    text(draw, (42, THREE_LINES[1]), "GOING", TEXT)
    text(draw, (42, THREE_LINES[2]), "DOWN", TEXT)
    return frame(image)


def button_attention():
    image, draw = new_button("#151238")
    # An attention map: each query row looks hardest at a few keys.
    rng = random.Random(11)
    size = 5
    for row in range(size):
        for column in range(size):
            if column > row:
                weight = 0.05
            else:
                weight = 0.25 + 0.75 * rng.random() if column in (row, 0) else 0.15 + 0.3 * rng.random()
            r, g, b = rgb(BLUE)
            base = rgb("#141236")
            color = tuple(round(base[i] + ((r, g, b)[i] - base[i]) * weight) for i in range(3))
            draw.rectangle([4 + column * 4, 4 + row * 4, 6 + column * 4, 6 + row * 4], fill=color)
    text(draw, (29, THREE_LINES[0]), "ATTENTION", GOLD)
    text(draw, (29, THREE_LINES[1]), "IS ALL YOU", TEXT)
    text(draw, (29, THREE_LINES[2]), "NEED", TEXT)
    return frame(image)


def button_kernels():
    image, draw = new_button("#0a0920")
    # A lightning bolt.
    bolt = [(12, 3), (6, 15), (11, 15), (8, 27), (18, 12), (13, 12), (16, 3)]
    draw.polygon(bolt, fill=rgb(GOLD), outline=rgb("#c99a3c"))
    text(draw, (25, THREE_LINES[0]), "FAST", GOLD)
    text(draw, (25, THREE_LINES[1]), "KERNELS", TEXT)
    text(draw, (25, THREE_LINES[2]), "INSIDE", MUTED)
    return frame(image, outer=LINE)


def button_night():
    image = dithered_gradient(88, 31, ["#06051a", "#0d0b28", "#17133d"])
    sprinkle_stars(image, 16, 21, keep_out=[(2, 5, 22, 25), (22, 7, 85, 23)])
    draw = ImageDraw.Draw(image)
    draw.fontmode = "1"
    # A crescent moon: a disc with a darker disc taken out of it.
    for y in range(31):
        for x in range(88):
            inside = (x - 12) ** 2 + (y - 15) ** 2 <= 8**2
            bite = (x - 16) ** 2 + (y - 12) ** 2 <= 7**2
            if inside and not bite:
                draw.point([(x, y)], fill=rgb(GOLD))
    text(draw, (24, TWO_LINES[0]), "BEST VIEWED", TEXT)
    text(draw, (24, TWO_LINES[1]), "AT NIGHT", GOLD)
    return frame(image, outer=LINE)


def button_trabzon():
    image = dithered_gradient(88, 31, ["#0f2c3d", "#17454e", "#22605a", "#3a8468"])
    pixels = image.load()
    draw = ImageDraw.Draw(image)
    draw.fontmode = "1"
    # Green mountains coming down to the Black Sea, ridge behind ridge.
    ridges = [
        ("#24634e", lambda x: 12 - 5 * math.sin(x * 0.16 + 0.5) - 2.5 * math.sin(x * 0.37)),
        ("#174a39", lambda x: 18 - 4 * math.sin(x * 0.11 + 2) - 2 * math.sin(x * 0.29 + 1)),
        ("#0e3328", lambda x: 23 - 2.5 * math.sin(x * 0.09 + 4)),
    ]
    for color, ridge in ridges:
        for x in range(1, 87):
            for y in range(max(2, round(ridge(x))), 26):
                pixels[x, y] = rgb(color)
    for y in range(26, 30):
        for x in range(1, 87):
            pixels[x, y] = rgb("#2b7ea6") if (x + y * 2) % 5 == 0 else rgb("#0d3f5c")
    # An anchovy jumping out of the sea: the Black Sea's favorite fish.
    fish = ["#..###..", ".######.", "#..###.."]
    for dy, row in enumerate(fish):
        for dx, cell in enumerate(row):
            if cell == "#":
                pixels[7 + dx, 19 + dy] = rgb("#dfe9ee")
    pixels[13, 20] = rgb("#0f2c3d")
    for x, y in [(8, 24), (11, 25), (13, 24)]:
        pixels[x, y] = rgb("#bfe6ff")
    text(draw, (40, TWO_LINES[0]), "MADE IN", "#f4fff8")
    text(draw, (40, TWO_LINES[1]), "TRABZON", "#fff3d6")
    return frame(image)


def button_cookies():
    image, draw = new_button("#141236")
    # A cookie with a bite out of it, crossed out.
    for y in range(31):
        for x in range(30):
            if (x - 14) ** 2 + (y - 15) ** 2 <= 10**2 and (x - 22) ** 2 + (y - 7) ** 2 > 4**2:
                draw.point([(x, y)], fill=rgb("#c98a4b"))
    draw.point([(10, 12), (11, 12), (16, 18), (17, 18), (12, 20), (18, 11), (9, 17)], fill=rgb("#5a3418"))
    draw.line([(4, 26), (25, 5)], fill=rgb("#ff5a5a"), width=2)
    text(draw, (33, THREE_LINES[0]), "NO", GOLD)
    text(draw, (33, THREE_LINES[1]), "COOKIES", TEXT)
    text(draw, (33, THREE_LINES[2]), "HERE", TEXT)
    return frame(image)


def walk_thumbnail():
    """The painting as pixel art: cropped, shrunk and reduced to a few colors."""
    painting = Image.open(PAINTING).convert("RGB")
    w, h = painting.size
    crop_w = h * 3
    left = round(min(max(0, w * 0.33 - crop_w / 2), w - crop_w))
    small = painting.crop((left, 0, left + crop_w, h)).resize((144, 48), Image.Resampling.LANCZOS)
    small = small.quantize(colors=28, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = ROOT / "public" / "images" / "walk.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    small.save(out, optimize=True)
    return out


def star_tile():
    """A tile of faint stars for the page background, repeated and scaled up by CSS."""
    rng = random.Random(42)
    tile = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    pixels = tile.load()
    for _ in range(9):
        x, y = rng.randrange(64), rng.randrange(64)
        pixels[x, y] = rgb(rng.choice(["#2a2766", "#2a2766", "#37338a", "#4c47a6"])) + (255,)
    out = ROOT / "src" / "home" / "assets" / "stars-tile.png"
    tile.save(out, optimize=True)
    return out


def preview_image():
    """The 1200x630 picture shown when the portfolio's link is shared."""
    scale = 5
    width, height = 240, 126
    art = dithered_gradient(width, height, SKY, power=1.25)
    pixels = art.load()
    rng = random.Random(7)
    hill = [round(height * 0.86 + 1.5 * math.sin(x * 0.04) + math.sin(x * 0.13)) for x in range(width)]
    for _ in range(width * height // 40):
        x = rng.randrange(width)
        y = rng.randrange(max(1, hill[x] - 4))
        roll = rng.random()
        level = 0 if roll < 0.56 else 1 if roll < 0.84 else 2 if roll < 0.96 else 3
        if (x < 150 and 18 < y < 92) or (168 < x < 214 and 8 < y < 100):
            level = 0
        pixels[x, y] = rgb(["#3a3680", "#6a65b6", "#b2aeee", "#f4f2ff"][level])

    _, layers = draw_orion(art, (190, 54), 4.3)
    for x in range(width):
        for y in range(hill[x], height):
            pixels[x, y] = rgb("#2b2662") if y == hill[x] else rgb("#06051a")
    belt = layers[2][1][0]
    draw_astronomer(art, 150, hill[150], belt)

    image = art.resize((width * scale, height * scale), Image.Resampling.NEAREST).crop((0, 0, 1200, 630))
    draw = ImageDraw.Draw(image)
    pixelify = ImageFont.truetype(str(FONTS / "PixelifySans.ttf"), 64)
    pixelify.set_variation_by_axes([600])
    small = ImageFont.truetype(str(FONTS / "PixelifySans.ttf"), 34)
    tiny = ImageFont.truetype(str(FONTS / "Silkscreen-Regular.ttf"), 24)
    draw.text((64, 120), "littlestronomer", fill=rgb(GOLD), font=tiny)
    draw.text((64, 160), "Göktürk Batın", fill=rgb(TEXT), font=pixelify)
    draw.text((64, 232), "Dervişoğlu", fill=rgb(TEXT), font=pixelify)
    draw.text((64, 330), "AI engineering student, working on", fill=rgb(MUTED), font=small)
    draw.text((64, 372), "ML systems, speech AI and fast inference", fill=rgb(MUTED), font=small)
    out = ROOT / "public" / "og-portfolio.png"
    image.save(out, optimize=True)
    return out


def main():
    BUTTONS.mkdir(parents=True, exist_ok=True)
    buttons = {
        "littlestronomer": button_littlestronomer,
        "agi-loading": button_agi,
        "loss-going-down": button_loss,
        "attention": button_attention,
        "fast-kernels": button_kernels,
        "night-owl": button_night,
        "trabzon": button_trabzon,
        "no-cookies": button_cookies,
    }
    for name, make in buttons.items():
        make().save(BUTTONS / f"{name}.png", optimize=True)
    print("buttons:", ", ".join(buttons))
    print(walk_thumbnail())
    print(star_tile())
    print(preview_image())


if __name__ == "__main__":
    main()
