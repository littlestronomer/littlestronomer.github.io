"""Make the picture shown when the site's link is shared (Open Graph, 1200x630).

It is a crop of the painting around the trees and the girl.

Usage (needs Pillow):
  python scripts/make_og_image.py [painting.jpg] [output.jpg]
"""

import sys
from pathlib import Path

from PIL import Image

PORTFOLIO = Path(__file__).resolve().parent.parent
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else PORTFOLIO / "src" / "horizon" / "assets" / "painting.jpg"
OUTPUT = Path(sys.argv[2]) if len(sys.argv) > 2 else PORTFOLIO / "public" / "og-image.jpg"

SIZE = (1200, 630)
# Where the crop is centred, as a fraction of the painting's width: between the trees and the girl.
FOCUS = 0.33


def main():
    painting = Image.open(SOURCE).convert("RGB")
    scale = SIZE[1] / painting.height
    scaled = painting.resize((round(painting.width * scale), SIZE[1]), Image.LANCZOS)
    left = min(max(0, round(scaled.width * FOCUS - SIZE[0] / 2)), scaled.width - SIZE[0])
    scaled.crop((left, 0, left + SIZE[0], SIZE[1])).save(OUTPUT, quality=86, optimize=True, progressive=True)
    print(f"wrote {OUTPUT} {SIZE[0]}x{SIZE[1]}")


if __name__ == "__main__":
    main()
