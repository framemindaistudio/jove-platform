"""
JOVE key visual: a 2560 x 1440 hero / background picture built from the symbol, in the brand's monochrome
blueprint style (graphite, a faint drafting grid, construction lines and fine dust; no colour, no glow).

    python scripts/keyvisual.py

The symbol sits right of centre inside the middle band (y 370-1070 of 1440), so a wide section that crops the
picture to cover never cuts it. Writes public/brand/kit/jove-keyvisual.png (2560 x 1440) and a 1200 x 675 copy.
"""
from __future__ import annotations

import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / ".assets-raw"
KIT = ROOT / "public" / "brand" / "kit"

W, H = 2560, 1440
BAND = (370, 1070)
GRAPHITE = (43, 43, 43)
INK = (22, 22, 22)
LINE = (245, 241, 232)


def main() -> None:
    random.seed(7)  # the same picture every run
    bg = Image.new("RGBA", (W, H), (*GRAPHITE, 255))

    # a soft vignette towards ink at the edges (shading, not a glow)
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W * 0.62) / W) ** 2 + ((yy - H / 2) / H) ** 2)
    shade = np.clip((d - 0.25) * 0.9, 0, 0.6)
    arr = np.array(bg).astype(float)
    for c, (g, k) in enumerate(zip(GRAPHITE, INK)):
        arr[:, :, c] = g * (1 - shade) + k * shade
    bg = Image.fromarray(arr.astype(np.uint8))

    lines = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dr = ImageDraw.Draw(lines)
    # drafting grid: minor every 40 px, major every 200 px
    for x in range(0, W, 40):
        dr.line([(x, 0), (x, H)], fill=(*LINE, 10 if x % 200 else 22), width=1)
    for y in range(0, H, 40):
        dr.line([(0, y), (W, y)], fill=(*LINE, 10 if y % 200 else 22), width=1)

    cx = int(W * 0.64)
    # the ring (the O) sits in the lower part of the symbol: measure it in the drawing and centre on it
    sym_h = BAND[1] - BAND[0]
    cy = BAND[0] + int(sym_h * 0.715)
    ring_dx = -int(sym_h * 0.055)
    # construction circles and crosshair centred on the symbol's ring
    rx = cx + ring_dx
    for r, a in ((470, 24), (330, 32), (215, 18)):
        dr.ellipse((rx - r, cy - r, rx + r, cy + r), outline=(*LINE, a), width=2)
    dr.line([(rx - 640, cy), (rx + 640, cy)], fill=(*LINE, 40), width=2)
    dr.line([(rx, BAND[0] - 160), (rx, cy + 520)], fill=(*LINE, 40), width=2)
    # a few long construction lines across the sheet
    for _ in range(6):
        ang = random.uniform(-0.5, 0.5)
        x0 = random.randint(-200, W // 3)
        y0 = random.randint(BAND[0] - 200, BAND[1] + 200)
        x1 = x0 + 3200 * math.cos(ang)
        y1 = y0 + 3200 * math.sin(ang)
        dr.line([(x0, y0), (x1, y1)], fill=(*LINE, random.randint(14, 30)), width=1)
    # dimension ticks
    for x in range(cx - 600, cx + 601, 120):
        dr.line([(x, BAND[1] + 250), (x, BAND[1] + 270)], fill=(*LINE, 50), width=2)
    bg.alpha_composite(lines)

    # fine dust: tiny graphite-light specks
    dust = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dust)
    for _ in range(1600):
        x, y, s = random.randint(0, W), random.randint(0, H), random.choice((1, 1, 1, 2))
        dd.ellipse((x, y, x + s, y + s), fill=(*LINE, random.randint(18, 60)))
    bg.alpha_composite(dust.filter(ImageFilter.GaussianBlur(0.4)))

    # the symbol, right of centre, inside the middle band
    sym = Image.open(RAW / "emblem-dark.png").convert("RGBA")
    a = np.array(sym)[:, :, 3]
    ys, xs = np.nonzero(a > 8)
    sym = sym.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    h = BAND[1] - BAND[0]
    s = h / sym.height
    sym = sym.resize((round(sym.width * s), h), Image.LANCZOS)
    x = cx - sym.width // 2
    y = BAND[0]
    # faint reflection under it, fading out
    refl = sym.transpose(Image.FLIP_TOP_BOTTOM)
    ra = np.array(refl).astype(float)
    fade = np.linspace(0.16, 0, refl.height)[:, None]
    ra[:, :, 3] *= fade
    bg.alpha_composite(Image.fromarray(ra.astype(np.uint8)), (x, y + h + 12))
    bg.alpha_composite(sym, (x, y))

    KIT.mkdir(parents=True, exist_ok=True)
    out = bg.convert("RGB")
    out.save(KIT / "jove-keyvisual.png", optimize=True)
    out.resize((1200, 675), Image.LANCZOS).save(KIT / "jove-keyvisual-1200.png", optimize=True)
    print("public/brand/kit/jove-keyvisual.png 2560x1440, jove-keyvisual-1200.png 1200x675")


if __name__ == "__main__":
    main()
