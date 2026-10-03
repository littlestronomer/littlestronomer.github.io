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
PICTURES = ROOT / "public" / "images" / "turk"
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


def turkish_text(draw, xy, words, color, font=SILKSCREEN):
    """Like text(), for words with İ or Ğ. Silkscreen has neither, so each is drawn as I or G
    with its mark added by hand, on the row where the font puts the dots of Ö."""
    x, y = xy
    unit = font.size // 8
    for letter in words:
        plain = {"İ": "I", "Ğ": "G"}.get(letter, letter)
        draw.text((x, y), plain, fill=rgb(color), font=font)
        if letter == "İ":
            draw.rectangle([x + unit, y + 2 * unit, x + 2 * unit - 1, y + 3 * unit - 1], fill=rgb(color))
        if letter == "Ğ":
            draw.rectangle([x + 2 * unit, y + 2 * unit, x + 4 * unit - 1, y + 3 * unit - 1], fill=rgb(color))
            for column in (1, 4):
                draw.rectangle([x + column * unit, y + unit, x + (column + 1) * unit - 1, y + 2 * unit - 1], fill=rgb(color))
        x += font.getlength(plain)


def stamp(image, left, top, rows, colors):
    """Paints a small picture given as rows of letters. Each letter names a color; a dot leaves
    the pixel as it is."""
    pixels = image.load()
    for dy, row in enumerate(rows):
        for dx, cell in enumerate(row):
            if cell != ".":
                pixels[left + dx, top + dy] = rgb(colors[cell])


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


# The buttons for the Turkish theme: the same strip, about tea, cats and the evil eye instead.


def button_turkey_mentioned():
    image, draw = new_button("#e30a17")
    # The crescent is one disc with a smaller one, set toward the star, taken out of it.
    for y in range(31):
        for x in range(30):
            if (x - 14) ** 2 + (y - 15) ** 2 <= 9.3**2 and (x - 16.6) ** 2 + (y - 15) ** 2 > 7.4**2:
                draw.point([(x, y)], fill=rgb("#ffffff"))
    stamp(image, 21, 13, ["..#..", ".###.", "#####", ".###.", ".#.#."], {"#": "#ffffff"})
    text(draw, (33, TWO_LINES[0]), "TURKEY", "#ffffff")
    text(draw, (33, TWO_LINES[1]), "MENTIONED", "#ffe3e5")
    return frame(image)


def button_cay():
    image, draw = new_button("#6b0a10")
    # A tulip-shaped glass of tea on its saucer, steaming.
    glass = [
        "...s...s...",
        "....s...s..",
        "...s...s...",
        "...........",
        ".wwwwwwwww.",
        ".wTTTTTTTw.",
        ".wTTTTTTTw.",
        "..wtttttw..",
        "...wtttw...",
        "...wtttw...",
        "..wdddddw..",
        ".wdddddddw.",
        ".wdddddddw.",
        "..wdddddw..",
        "...wwwww...",
        "rwrwrwrwrwr",
        ".ppppppppp.",
    ]
    colors = {"w": "#ffffff", "T": "#f6a03a", "t": "#e0701c", "d": "#b0380e", "r": "#e30a17", "p": "#e6cfd1", "s": "#f3b9bd"}
    stamp(image, 7, 6, glass, colors)
    text(draw, (26, TWO_LINES[0]), "POWERED", "#ffffff")
    text(draw, (26, TWO_LINES[1]), "BY ÇAY", "#ffd98a")
    return frame(image)


def button_nazar():
    image, draw = new_button("#0c2466")
    # The blue glass bead that stares back at the evil eye: ring inside ring.
    rings = [(10.3, "#1746c9"), (7.4, "#ffffff"), (4.7, "#59c3f5"), (2.3, "#0a0a12")]
    for y in range(31):
        for x in range(30):
            for radius, color in rings:
                if (x - 15) ** 2 + (y - 15) ** 2 <= radius**2:
                    draw.point([(x, y)], fill=rgb(color))
    text(draw, (31, TWO_LINES[0]), "NAZAR", "#ffffff")
    turkish_text(draw, (31, TWO_LINES[1]), "DEĞMESİN", "#bfe6ff")
    return frame(image)


def button_cat():
    image, draw = new_button("#27323d")
    # A street cat's face: orange tabby, big dark eyes, pink ears, nose and cheeks.
    face = [
        "..o...........o..",
        "..oi.........io..",
        "..oio.......oio..",
        "..ooosoosoosooo..",
        "..ooooooooooooo..",
        "..ooKWoooooKWoo..",
        "..ooKKoooooKKoo..",
        "l.obooocpcooobo.l",
        ".loooocckccooool.",
        "l.oooockckcoooo.l",
        "...ooooooooooo...",
        "....ooooooooo....",
        "......ooooo......",
    ]
    colors = {**CAT_COLORS, "l": "#d7dde2"}
    stamp(image, 6, 9, face, colors)
    text(draw, (30, THREE_LINES[0]), "STREET", "#ffffff")
    text(draw, (30, THREE_LINES[1]), "CAT", "#ffcf8a")
    text(draw, (30, THREE_LINES[2]), "APPROVED", "#ffffff")
    return frame(image)


def button_kahve():
    image, draw = new_button("#2c190f")
    # A small cup of Turkish coffee on its saucer.
    cup = [
        "...s..s.......",
        "..s..s........",
        "...s..s.......",
        "..............",
        ".wwwwwwwww....",
        ".wcccccccw.ww.",
        ".wwwwwwwww...w",
        ".wrwrwrwrw...w",
        "..wwwwwww..ww.",
        "...wwwww......",
        "wwwwwwwwwww...",
        ".ppppppppp....",
    ]
    colors = {"w": "#ffffff", "c": "#3b2110", "r": "#e30a17", "p": "#cdb9a6", "s": "#a58a76"}
    stamp(image, 5, 9, cup, colors)
    text(draw, (25, THREE_LINES[0]), "1 KAHVE", "#ffe7c2")
    text(draw, (25, THREE_LINES[1]), "40 YIL", "#ffffff")
    text(draw, (25, THREE_LINES[2]), "HATIR", "#ffffff")
    return frame(image)


def button_simit():
    image, draw = new_button("#0f3b46")
    # A ring of bread, twisted and covered in sesame.
    pixels = image.load()
    seeds = random.Random(7)
    for y in range(31):
        for x in range(30):
            distance = math.hypot(x - 15, y - 15)
            if 4.3 <= distance <= 10.3:
                edge = distance > 9.3 or distance < 5.3
                twist = (math.atan2(y - 15, x - 15) * 3.5 + distance * 0.5) % 2 < 0.45
                pixels[x, y] = rgb("#8a4b14" if edge or twist else "#cf7f2c")
                if not edge and not twist and seeds.random() < 0.22:
                    pixels[x, y] = rgb("#f8e6b0")
    text(draw, (31, 1), "TAZE", "#ffe7a3")
    turkish_text(draw, (30, 7), "SİMİT", "#ffffff", SILKSCREEN_BIG)
    return frame(image)


def button_tavla():
    image, draw = new_button("#5e3718")
    # The points of the board along the top and bottom, and a six and a five on the dice.
    for start in range(28, 86, 8):
        for depth in range(5):
            shade = "#8a5a2b" if (start // 8) % 2 == 0 else "#3f230e"
            draw.line([(start + depth, 2 + depth), (start + 6 - depth, 2 + depth)], fill=rgb(shade))
            draw.line([(start + depth, 28 - depth), (start + 6 - depth, 28 - depth)], fill=rgb(shade))
    six = [
        ".wwwwwwwww.",
        "wwwwwwwwwww",
        "wwkwwwwwkww",
        "wwwwwwwwwww",
        "wwwwwwwwwww",
        "wwkwwwwwkww",
        "wwwwwwwwwww",
        "wwwwwwwwwww",
        "wwkwwwwwkww",
        "wwwwwwwwwww",
        ".wwwwwwwww.",
    ]
    five = [
        ".wwwwwwwww.",
        "wwwwwwwwwww",
        "wwkwwwwwkww",
        "wwwwwwwwwww",
        "wwwwwwwwwww",
        "wwwwwkwwwww",
        "wwwwwwwwwww",
        "wwwwwwwwwww",
        "wwkwwwwwkww",
        "wwwwwwwwwww",
        ".wwwwwwwww.",
    ]
    colors = {"w": "#fff8ea", "k": "#1b1208"}
    stamp(image, 3, 3, six, colors)
    stamp(image, 13, 16, five, colors)
    text(draw, (32, TWO_LINES[0]), "ŞEŞ BEŞ", "#ffe7a3")
    text(draw, (32, TWO_LINES[1]), "TAVLA?", "#ffffff")
    return frame(image)


# Small pictures for the Turkish theme's notes: food, tea and customs, 16 pixels square. Each is
# a grid of letters, one letter to a color, with dots left clear.

OUTLINE = "#2a0508"


def round_picture(size, rings, middle=None):
    """Rings inside rings, as rows of letters: each ring is (radius, letter), largest first."""
    middle = middle or ((size - 1) / 2, (size - 1) / 2)
    rows = []
    for y in range(size):
        row = ""
        for x in range(size):
            distance = math.hypot(x - middle[0], y - middle[1])
            letter = "."
            for radius, name in rings:
                if distance <= radius:
                    letter = name
            row += letter
        rows.append(row)
    return rows


def overlay(rows, left, top, patch):
    """Lays a smaller grid of letters over a larger one; dots in the patch leave it alone."""
    rows = [list(row) for row in rows]
    for dy, line in enumerate(patch):
        for dx, cell in enumerate(line):
            if cell != ".":
                rows[top + dy][left + dx] = cell
    return ["".join(row) for row in rows]


def picture_simit():
    rows = round_picture(16, [(7.4, "e"), (6.4, "b"), (3.6, "e"), (2.6, ".")])
    # A twist every few pixels around the ring, and sesame seeds between.
    seeds = random.Random(3)
    out = []
    for y, row in enumerate(rows):
        line = ""
        for x, cell in enumerate(row):
            if cell == "b":
                turn = math.atan2(y - 7.5, x - 7.5)
                cell = "e" if (turn * 2.9) % 2 < 0.33 else "s" if seeds.random() < 0.3 else "b"
            line += cell
        out.append(line)
    return out, {"e": "#8a4b14", "b": "#cf7f2c", "s": "#f8e6b0"}


def picture_nazar():
    rows = round_picture(16, [(6.6, "b"), (4.7, "w"), (2.9, "l"), (1.3, "k")], middle=(7.5, 8.5))
    rows = overlay(rows, 6, 0, ["yyyy", "y..y"])
    return rows, {"b": "#1746c9", "w": "#ffffff", "l": "#59c3f5", "k": "#0a0a12", "y": "#ffd98a"}


def picture_lahmacun():
    rows = round_picture(16, [(7.2, "c"), (6.1, "t")], middle=(7, 7.5))
    flecks = random.Random(5)
    out = []
    for row in rows:
        line = ""
        for cell in row:
            if cell == "t":
                roll = flecks.random()
                cell = "g" if roll < 0.14 else "d" if roll < 0.3 else "t"
            line += cell
        out.append(line)
    # A wedge of lemon at its side.
    out = overlay(out, 10, 11, ["..KKK.", ".KyyyK", "KyyyyK", ".KKKK."])
    return out, {"c": "#e9c98a", "t": "#b5482a", "g": "#6fbf4a", "d": "#7a2a14", "y": "#ffe14d", "K": OUTLINE}


def picture_tavla():
    die = ["KKKKKKKK", "KwwwwwwK", "KwwwwwwK", "KwwwwwwK", "KwwwwwwK", "KwwwwwwK", "KwwwwwwK", "KKKKKKKK"]
    # Six pips in two columns of three.
    six = overlay(die, 0, 0, ["........", "..k..k..", "........", "..k..k..", "........", "..k..k..", "........", "........"])
    five = overlay(die, 0, 0, ["........", "..k..k..", "........", "...kk...", "........", "..k..k..", "........", "........"])
    rows = overlay(["." * 16] * 16, 0, 1, six)
    rows = overlay(rows, 8, 7, five)
    return rows, {"K": OUTLINE, "w": "#fff8ea", "k": "#1b1208"}


def picture_baklava():
    """One diamond of baklava seen from above and a little to the front: a golden top with
    pistachio down the middle, and the layers showing along its two near edges."""
    rows = []
    for y in range(16):
        row = ""
        for x in range(16):
            across = abs(x - 7.5) / 7.5
            # The top is a diamond; its near edges run from the side corners down to the front.
            on_top = across + abs(y - 5.5) / 3.9 <= 1
            near_edge = 5.5 + 3.9 * (1 - across)
            if on_top:
                nuts = abs(x - 7.5) / 3.4 + abs(y - 5.5) / 1.5 <= 1
                lit = y < 5.5 and across + abs(y - 1 - 5.5) / 3.9 > 1
                row += ("G" if (x + y) % 3 == 0 else "g") if nuts else "h" if lit else "y"
            elif y > 5.5 and y - near_edge < 4:
                row += "d" if int(y - near_edge) % 2 == 0 else "l"
            else:
                row += "."
        rows.append(row)
    return rows, {"y": "#f2b84a", "h": "#ffe29a", "d": "#c98a2a", "l": "#8a5514", "g": "#9ad16a", "G": "#5fae4a"}


# The street cat: orange with darker stripes, cream at the muzzle and chest, pink in the ears,
# on the nose and on the cheeks, and big dark eyes with a glint.
CAT_COLORS = {
    "o": "#f29a3f",
    "s": "#c46c22",
    "c": "#fff1da",
    "i": "#f59aa5",
    "p": "#f27f8f",
    "b": "#ff9c8a",
    "K": "#2a1508",
    "k": "#2a1508",
    "W": "#ffffff",
}

SMALL_PICTURES = {
    "cat": (
        [
            "................",
            "..o..........o..",
            ".oio........oio.",
            ".oooosossosoooo.",
            ".oooooooooooooo.",
            ".ooKWooooooKWoo.",
            ".ooKKooooooKKoo.",
            ".obooocppcooobo.",
            ".oooooccccooooo.",
            "..oooooccooooo..",
            "...oooooooooo...",
            "...ooccccccoo.s.",
            "...ooccccccoo.o.",
            "...oooccccooooo.",
            "...ooooooooooo..",
            "....cc....cc....",
        ],
        CAT_COLORS,
    ),
    "kahve": (
        [
            "................",
            "....s...s.......",
            "...s...s........",
            "....s...s.......",
            "................",
            "..wwwwwwwwww....",
            "..wccccccccw.ww.",
            "..wwwwwwwwww...w",
            "..wrwrwrwrww...w",
            "..wwwwwwwwww..w.",
            "...wwwwwwww.ww..",
            "....wwwwww......",
            ".wwwwwwwwwwww...",
            "..pppppppppp....",
            "................",
            "................",
        ],
        {"w": "#ffffff", "c": "#3b2110", "r": "#e30a17", "p": "#e6cfd1", "s": "#f3b9bd"},
    ),
    "kolonya": (
        [
            "................",
            "......CCCC......",
            "......cccc......",
            "......cccc......",
            ".....gggggg.....",
            "....gllllllg....",
            "...gllllllllg...",
            "...glWWWWWWlg...",
            "...glWyyWWWlg...",
            "...glWyyyWWlg...",
            "...glWWynWWlg...",
            "...glWWWWWWlg...",
            "...gllllllllg...",
            "...gLLLLLLLLg...",
            "...gggggggggg...",
            "................",
        ],
        {"g": "#d9f2ee", "l": "#eef08c", "L": "#cfd45a", "c": "#f2c14e", "C": "#a8791f", "W": "#ffffff", "y": "#ffd23e", "n": "#4fa34a"},
    ),
    "kemence": (
        [
            "......kbk.....h.",
            ".....kbbbk...h..",
            "......bbb...h...",
            "......bsb..h....",
            "......bsb.h.....",
            ".....bbsbbh.....",
            ".....bssshb.....",
            ".....bsshsb.....",
            ".....bshssb.....",
            ".....bhBBsb.....",
            "....hbsssb......",
            "...h.bsssb......",
            "..h..bbsbb......",
            ".h....bbb.......",
            "................",
            "................",
        ],
        {"b": "#b5651d", "B": "#5a2c0c", "s": "#f4e9cf", "k": "#3a1c08", "h": "#fff4d6"},
    ),
    "guest": (
        [
            "................",
            ".....s..s.......",
            "......s..s......",
            ".....s..s.......",
            "................",
            ".....rrrrrr.....",
            "....rrrgrrrr....",
            "...rrrrrrrorr...",
            "..rrgrrrrrrrrr..",
            "..rrrrrorrrgrr..",
            ".WWWWWWWWWWWWWW.",
            "WWWWWWWWWWWWWWWW",
            ".wwwwwwwwwwwwww.",
            "...wwwwwwwwww...",
            "................",
            "................",
        ],
        {"r": "#fff4d6", "g": "#6fbf4a", "o": "#f2a81d", "W": "#ffffff", "w": "#d9c9cb", "s": "#f3b9bd"},
    ),
    "kuymak": (
        [
            "................",
            "...........SS...",
            "..........ySS...",
            ".........yy.S...",
            "........yy..S...",
            ".......yy...S...",
            "......yy........",
            "..KKKKyyKKKK....",
            ".KyyyyyyyyyyK...",
            ".KyyYyyyyYyyKKKK",
            ".KyyyyyYyyyyK...",
            ".KyYyyyyyyYyK...",
            "..KKKKKKKKKK....",
            "................",
            "................",
            "................",
        ],
        {"K": "#1c1412", "y": "#ffd23e", "Y": "#f2a81d", "S": "#d9dde2"},
    ),
    "hamsi": (
        [
            "................",
            "................",
            "....bbbbbb...b..",
            "..bbbbbbbbbbbb..",
            ".bkssssssssbb...",
            "..ssssssssss.b..",
            "....ssssss...b..",
            "................",
            "................",
            "....bbbbbb...b..",
            "..bbbbbbbbbbbb..",
            ".bkssssssssbb...",
            "..ssssssssss.b..",
            "....ssssss...b..",
            "................",
            "................",
        ],
        {"b": "#4d7ea3", "s": "#dbeaf2", "k": "#0a1a26"},
    ),
    "kofte": (
        [
            "................",
            "................",
            "................",
            "................",
            "..mm...mm...mm..",
            ".mdmm.mdmm.mdmm.",
            ".mmdm.mmdm.mmdm.",
            ".mdmm.mdmm.mdmm.",
            "..mm...mm...mm..",
            ".WWWWWWWWWWWWWW.",
            "WWWWWWWWWWWWWWWW",
            ".wwwwwwwwwwwwww.",
            "...wwwwwwwwww...",
            "................",
            "................",
            "................",
        ],
        {"m": "#9a5526", "d": "#4a240c", "W": "#ffffff", "w": "#d9c9cb"},
    ),
    "doner": (
        [
            ".......SS.......",
            ".......SS.......",
            ".....mmmmmm.....",
            "....mhmmmmMm....",
            "....mmmMmmmm....",
            "....mhmmmMmm....",
            ".....mmMmmm.....",
            ".....hmmmMm.....",
            ".....mmMmmm.....",
            "......mmmm......",
            "......mMmm......",
            ".......SS.......",
            "....SSSSSSSS....",
            "...SSSSSSSSSS...",
            "................",
            "................",
        ],
        {"m": "#b5652a", "M": "#7a3a14", "h": "#e09a52", "S": "#d9dde2"},
    ),
    "manti": (
        [
            "................",
            "................",
            "................",
            "..BBBBBBBBBBBB..",
            ".ByyyyyyyyyyyyB.",
            ".ByrdyydyrydyyB.",
            ".BydyryydyydryB.",
            ".ByyrydyyryydyB.",
            "..BBBBBBBBBBBB..",
            "..WWWWWWWWWWWW..",
            "...WWWWWWWWWW...",
            "....WWWWWWWW....",
            ".....wwwwww.....",
            "................",
            "................",
            "................",
        ],
        {"B": "#8fb7e8", "y": "#ffffff", "d": "#e9c98a", "r": "#e23b1a", "W": "#f4f4f4", "w": "#d9c9cb"},
    ),
    "fasulye": (
        [
            "................",
            "................",
            "................",
            "..BBBBBBBBBBBB..",
            ".BooooooooooooB.",
            ".BobboobboobboB.",
            ".BoobboobboobbB.",
            ".BobboobboobboB.",
            "..BBBBBBBBBBBB..",
            "..WWWWWWWWWWWW..",
            "...WWWWWWWWWW...",
            "....WWWWWWWW....",
            ".....wwwwww.....",
            "................",
            "................",
            "................",
        ],
        {"B": "#8fb7e8", "o": "#e0622a", "b": "#fff1d0", "W": "#f4f4f4", "w": "#d9c9cb"},
    ),
    "caydanlik": (
        [
            ".....s...s......",
            "......s...s.....",
            ".......kk.......",
            ".....tttttt.....",
            "....tttttttt.hh.",
            "..ptttthtttt..h.",
            "....tttttttt.hh.",
            ".....tttttt.....",
            "...TTTTTTTTTT...",
            "..TTTTTTTTTTTThh",
            "ppTTThTTTTTTTT.h",
            ".pTTTTTTTTTTTT.h",
            "..TTTTTTTTTTTThh",
            "...TTTTTTTTTT...",
            "................",
            "................",
        ],
        {"t": "#dfe5ea", "T": "#b9c2cb", "h": "#1c1412", "k": "#1c1412", "p": "#b9c2cb", "s": "#f3b9bd"},
    ),
}

# The cat on top of the box, in pictures 24 pixels square. It sleeps in two of them: breathing
# out, and breathing in with its back a pixel higher and another Z drifting up from it. Poked,
# it opens its eyes, gets half up, and sits. The pictures of it lying down are 16 pixels tall
# and stand at the bottom of the square.
CAT_LYING = [
    [
        "........................",
        "........................",
        "...............zzzz.....",
        ".................z......",
        "................z.......",
        "...............zzzz.....",
        "........................",
        "..o......o..............",
        ".oio....oio...ooooooo...",
        ".oooooooooo.oosoosoooo..",
        "ooooooooooooooooooooooo.",
        "okookookookosoosoosooooo",
        "ookkooookkoosooooooooooo",
        "obbooppoobbosooooooooooo",
        ".ooooccccoooooooooooooo.",
        "..oooocccoosoosoosoooo..",
    ],
    [
        "...................zzzzz",
        "..............zzzz....z.",
        "................z....z..",
        "...............z....z...",
        "..............zzzz.zzzzz",
        "........................",
        "..............ooooooo...",
        "..o......o..oosoosoooo..",
        ".oio....oio.ooooooooooo.",
        ".oooooooooo.ooooooooooo.",
        "ooooooooooooooooooooooo.",
        "okookookookosoosoosooooo",
        "ookkooookkoosooooooooooo",
        "obbooppoobbosooooooooooo",
        ".ooooccccoooooooooooooo.",
        "..oooocccoosoosoosoooo..",
    ],
    # Awake, still lying.
    [
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "..o......o..............",
        ".oio....oio...ooooooo...",
        ".oooooooooo.oosoosoooo..",
        "ooooooooooooooooooooooo.",
        "ooKWooooKWoosoosoosooooo",
        "ooKKooooKKoosooooooooooo",
        "obbooppoobbosooooooooooo",
        ".ooooccccoooooooooooooo.",
        "..oooocccoosoosoosoooo..",
    ],
]

# Half up: its front legs straight, its back still low.
CAT_RISING = [
    ".....o......o...........",
    "....oio....oio..........",
    "....oooooooooo..........",
    "...ooooooooooo..........",
    "...ooKWooooKWo..........",
    "...ooKKooooKKo..........",
    "...obbooppoobb..ooooo...",
    "....oooccccooooosoosoo..",
    ".....oocccccooooooooooo.",
    ".....oocccccosoosoosooo.",
    ".....ooccccooooooooooooo",
    ".....oocccooosoosoosoooo",
    ".....oocccooooooooooooo.",
    ".....occcoooccooooooooo.",
    ".....occcoooccoooooooo..",
]

# Sitting up, facing us, with its tail beside it.
CAT_SITTING = [
    ".........o......o.......",
    "........oio....oio......",
    "........oooooooooo......",
    ".......ooooooooooo......",
    ".......ooKWooooKWo......",
    ".......ooKKooooKKo......",
    ".......obbooppoobb......",
    "........oooccccooo......",
    ".........ooccccoo.......",
    "........oooccccooo......",
    ".......soocccccoos......",
    ".......ooocccccooo......",
    "......osoocccccooso.....",
    "......oooocccccoooo.....",
    ".....ooooocccccooooo....",
    ".....osooocccccooosoo...",
    ".....oooooocccooooooos..",
    ".....ooooooooooooooo.oo.",
    ".....oooooooooooooooooo.",
    "......occcoooooccco.....",
    "......occcoooooccco.....",
]


def cat_poses():
    """The cat's pictures in the order the page counts them (see src/home/SleepingCat.tsx)."""

    def square(rows):
        return ["." * 24] * (24 - len(rows)) + rows

    def paw_up(columns):
        """The sitting cat with one front paw off the ground: where it stood there is only fur."""
        feet = [row[: columns.start] + row[columns].replace("c", "o") + row[columns.stop :] for row in CAT_SITTING[-2:]]
        return CAT_SITTING[:-2] + feet

    poses = [*CAT_LYING, CAT_RISING, CAT_SITTING, paw_up(slice(6, 11)), paw_up(slice(14, 19))]
    return [square(rows) for rows in poses]


CAT_POSE_COLORS = {**CAT_COLORS, "z": "#ffffff"}

# The mouse cursors of the portfolio, in pixels like everything else on it: an arrow, a hand
# that points at whatever can be clicked, and a bar for text. Each is shown at two screen pixels
# to each of its own. The cat's swat draws them too (see src/home/SleepingCat.tsx), so the page
# says there where each one's point is.
CURSORS = {
    "arrow": [
        "k.......",
        "kk......",
        "kwk.....",
        "kwwk....",
        "kwwwk...",
        "kwwwwk..",
        "kwwwwwk.",
        "kwwwwwwk",
        "kwwwwkkk",
        "kwwkwk..",
        "kwk.kwk.",
        "kk..kwk.",
        ".....kk.",
    ],
    "hand": [
        "...kk.....",
        "..kwwk....",
        "..kwwk....",
        "..kwwk....",
        "..kwwkkkk.",
        "..kwwkwwwk",
        "kkkwwwwwwk",
        "kwwwwwwwwk",
        "kwwwwwwwwk",
        ".kwwwwwwk.",
        "..kwwwwk..",
        "..kkkkkk..",
    ],
    "text": [
        "kkk.kkk",
        "kwwkwwk",
        "kkkwkkk",
        "..kwk..",
        "..kwk..",
        "..kwk..",
        "..kwk..",
        "..kwk..",
        "..kwk..",
        "..kwk..",
        "kkkwkkk",
        "kwwkwwk",
        "kkk.kkk",
    ],
}
CURSOR_COLORS = {"k": "#120f26", "w": "#ffffff"}
CURSOR_SCALE = 2


def small_picture(rows, colors):
    """A grid of letters as a see-through image, one pixel to a letter."""
    width = len(rows[0])
    assert all(len(row) == width for row in rows), [len(row) for row in rows]
    image = Image.new("RGBA", (width, len(rows)), (0, 0, 0, 0))
    pixels = image.load()
    for y, row in enumerate(rows):
        for x, cell in enumerate(row):
            if cell != ".":
                pixels[x, y] = rgb(colors[cell]) + (255,)
    return image


def turkish_pictures():
    PICTURES.mkdir(parents=True, exist_ok=True)
    made = dict(SMALL_PICTURES)
    makers = {"simit": picture_simit, "nazar": picture_nazar, "lahmacun": picture_lahmacun, "tavla": picture_tavla, "baklava": picture_baklava}
    for name, make in makers.items():
        made[name] = make()
    for name, (rows, colors) in made.items():
        small_picture(rows, colors).save(PICTURES / f"{name}.png", optimize=True)
    # The cat's pictures go side by side in one image.
    poses = cat_poses()
    strip = Image.new("RGBA", (24 * len(poses), 24), (0, 0, 0, 0))
    for i, rows in enumerate(poses):
        strip.paste(small_picture(rows, CAT_POSE_COLORS), (24 * i, 0))
    strip.save(PICTURES / "sleeping-cat.png", optimize=True)
    return sorted(made) + ["sleeping-cat"]


def pixel_svg(rows, colors, scale):
    """A grid of letters as an SVG picture with hard edges, `scale` screen pixels to a letter."""
    paths = []
    for letter, color in colors.items():
        runs = []
        for y, row in enumerate(rows):
            x = 0
            while x < len(row):
                if row[x] != letter:
                    x += 1
                    continue
                start = x
                while x < len(row) and row[x] == letter:
                    x += 1
                runs.append(f"M{start} {y}h{x - start}v1H{start}z")
        if runs:
            paths.append(f'<path fill="{color}" d="{"".join(runs)}"/>')
    width, height = len(rows[0]), len(rows)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width * scale}" height="{height * scale}" '
        f'viewBox="0 0 {width} {height}" shape-rendering="crispEdges">{"".join(paths)}</svg>\n'
    )


def cursors():
    """
    The mouse cursors, next to the stylesheet that uses them. Each is an SVG, which stays sharp on
    every screen, and a PNG of the same picture for a browser that will not take an SVG cursor.
    """
    out = ROOT / "src" / "home" / "assets"
    for name, rows in CURSORS.items():
        assert all(len(row) == len(rows[0]) for row in rows), name
        (out / f"cursor-{name}.svg").write_text(pixel_svg(rows, CURSOR_COLORS, CURSOR_SCALE))
        picture = small_picture(rows, CURSOR_COLORS)
        size = (picture.width * CURSOR_SCALE, picture.height * CURSOR_SCALE)
        picture.resize(size, Image.Resampling.NEAREST).save(out / f"cursor-{name}.png", optimize=True)
    return sorted(CURSORS)


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
        "turkey-mentioned": button_turkey_mentioned,
        "powered-by-cay": button_cay,
        "nazar": button_nazar,
        "street-cat": button_cat,
        "kahve": button_kahve,
        "simit": button_simit,
        "tavla": button_tavla,
    }
    for name, make in buttons.items():
        make().save(BUTTONS / f"{name}.png", optimize=True)
    print("buttons:", ", ".join(buttons))
    print("pictures:", ", ".join(turkish_pictures()))
    print("cursors:", ", ".join(cursors()))
    print(walk_thumbnail())
    print(star_tile())
    print(preview_image())


if __name__ == "__main__":
    main()
