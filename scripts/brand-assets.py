"""
JOVE brand assets: builds every logo file the website, HQ and print use, from the masters in .assets-raw/.

    python scripts/brand-assets.py

Sources (git-ignored, copied from OPERATIONS/01_BRAND/logo/ in the HQ data):
    .assets-raw/lockup-graphite-4k.png   the drawn logo (arm forms the O), graphite ink, transparent, 4096 x 2185
    .assets-raw/lockup-white-4k.png      the same in paper-white ink
    .assets-raw/emblem-transparent.png   the symbol (arm + ring), graphite ink, transparent
    .assets-raw/emblem-dark.png          the symbol in paper-white ink, for dark backgrounds
    .assets-raw/fonts/Montserrat.ttf     Montserrat variable (Google Fonts, OFL), for the tagline

The drawn letters are never redrawn or re-typed: the word is cut from the master (corner notes removed,
construction lines faded where they are cut). Only the tagline is set, letter by letter in Montserrat.
No glows or effects (JOVE brand guidelines). When the logo changes: copy the new masters in and run this again.
"""
from __future__ import annotations

import io
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / ".assets-raw"
BRAND = ROOT / "public" / "brand"
KIT = BRAND / "kit"
PREVIEW = KIT / "preview"
APP = ROOT / "src" / "app"

# brand colours (OPERATIONS/01_BRAND/01_Brand_Guidelines.md)
PAPER = (245, 241, 232)
GRAPHITE = (43, 43, 43)
INK = (22, 22, 22)

TAGLINE = "Journey of Visionation & Excellence"
TAGLINE_LINES = ("Journey of", "Visionation & Excellence")

# where things sit in the 4096 x 2185 master
CORNER_NOTE = (250, 100, 880, 535)  # "PRECISION / LEARNING / ..." block, top left
WORD_FADE = (1500, 1590)  # construction lines fade out between these rows; the tagline row starts below
LETTERS_Y = (785, 1475)  # the band of the letters J, O, V, E (the arm rises above it)


# ───────────────────────────── helpers ─────────────────────────────


def load(name: str) -> Image.Image:
    return Image.open(RAW / name).convert("RGBA")


def trim(im: Image.Image, threshold: int = 8) -> tuple[Image.Image, tuple[int, int, int, int]]:
    """Crop to the pixels that are visible (alpha above `threshold`)."""
    a = np.array(im)[:, :, 3]
    ys, xs = np.nonzero(a > threshold)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    return im.crop(box), box


def fit(im: Image.Image, w: int, h: int) -> Image.Image:
    """Scale to fit inside w x h, keeping the proportions (never squashed)."""
    s = min(w / im.width, h / im.height)
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)


def canvas(w: int, h: int, color: tuple[int, int, int] | None = None) -> Image.Image:
    return Image.new("RGBA", (w, h), (*color, 255) if color else (0, 0, 0, 0))


def paste(base: Image.Image, im: Image.Image, x: float, y: float) -> None:
    base.alpha_composite(im, (round(x), round(y)))


def square_icon(icon: Image.Image, side: int, pad: float = 0.08, bg: tuple[int, int, int] | None = None) -> Image.Image:
    """The icon centred in a square, fitted by its own proportions with `pad` of the side around it."""
    c = canvas(side, side, bg)
    inner = round(side * (1 - 2 * pad))
    f = fit(icon, inner, inner)
    paste(c, f, (side - f.width) / 2, (side - f.height) / 2)
    return c


def recolour(im: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    """One colour: every pixel `rgb`, the shape kept in the alpha."""
    out = canvas(im.width, im.height, rgb)
    out.putalpha(im.getchannel("A"))
    return out


def font(size: int, weight: int = 500) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(RAW / "fonts" / "Montserrat.ttf"), size)
    f.set_variation_by_axes([weight])
    return f


def set_text(text: str, size: int, rgb: tuple[int, int, int], tracking: float = 0.08, weight: int = 500) -> Image.Image:
    """Text set letter by letter in Montserrat with exact letter-spacing (`tracking` in em), on transparent."""
    f = font(size, weight)
    gap = size * tracking
    advances = [f.getlength(ch) for ch in text]
    width = sum(advances) + gap * (len(text) - 1)
    asc, desc = f.getmetrics()
    im = canvas(int(width) + size, asc + desc + size // 2)
    d = ImageDraw.Draw(im)
    x = size / 2
    for ch, adv in zip(text, advances):
        d.text((x, size / 4), ch, font=f, fill=(*rgb, 255))
        x += adv + gap
    return trim(im, 2)[0]


def dash(length: int, thick: int, rgb: tuple[int, int, int]) -> Image.Image:
    im = canvas(length, thick)
    ImageDraw.Draw(im).rectangle((0, 0, length - 1, thick - 1), fill=(*rgb, 255))
    return im


# ───────────────────────────── the drawn word ─────────────────────────────


def drawn_word(master: Image.Image) -> tuple[Image.Image, tuple[int, int]]:
    """The drawn JOVE from the master, without the corner note and the tagline row.
    Returns the word and the letters' band (top, bottom) in the word's own coordinates."""
    im = master.copy()
    a = np.array(im)
    x0, y0, x1, y1 = CORNER_NOTE
    a[y0:y1, x0:x1, 3] = 0
    f0, f1 = WORD_FADE
    ramp = np.linspace(1, 0, f1 - f0)[:, None]
    a[f0:f1, :, 3] = (a[f0:f1, :, 3] * ramp).astype(np.uint8)
    a[f1:, :, 3] = 0
    word, box = trim(Image.fromarray(a), 10)
    return word, (LETTERS_Y[0] - box[1], LETTERS_Y[1] - box[1])


def lockup_group(word: Image.Image, letters: tuple[int, int], width: int, rgb: tuple[int, int, int]) -> Image.Image:
    """Full lockup: the drawn word over the tagline, with a rule each side (as in the master), transparent."""
    w = fit(word, width, 10**6)
    s = w.width / word.width
    letters_h = (letters[1] - letters[0]) * s
    tag = set_text(TAGLINE, round(letters_h * 0.16), rgb, tracking=0.09, weight=450)
    if tag.width > w.width * 0.78:
        tag = fit(tag, round(w.width * 0.78), 10**6)
    gap_y = round(letters_h * 0.16)
    rule_len, rule_gap, rule_t = round(w.width * 0.075), round(tag.height * 0.9), max(2, round(tag.height * 0.07))
    h = w.height + gap_y + tag.height
    g = canvas(w.width, h)
    paste(g, w, 0, 0)
    ty = w.height + gap_y
    tx = (w.width - tag.width) / 2
    paste(g, tag, tx, ty)
    r = dash(rule_len, rule_t, rgb)
    ry = ty + tag.height * 0.55 - rule_t / 2
    paste(g, r, tx - rule_gap - rule_len, ry)
    paste(g, r, tx + tag.width + rule_gap, ry)
    return g


def horizontal_group(word: Image.Image, letters: tuple[int, int], height: int, rgb: tuple[int, int, int]) -> Image.Image:
    """Horizontal lockup: the drawn word, a thin rule, and the tagline in two lines beside the letters."""
    w = fit(word, 10**6, height)
    s = w.height / word.height
    lt, lb = letters[0] * s, letters[1] * s
    size = round((lb - lt) * 0.2)
    lines = [set_text(t, size, rgb, tracking=0.08, weight=450) for t in TAGLINE_LINES]
    lead = round(size * 0.55)
    block_h = sum(i.height for i in lines) + lead
    block_w = max(i.width for i in lines)
    gap = round((lb - lt) * 0.28)
    rule_t = max(2, round(size * 0.07))
    total_w = w.width + gap * 2 + rule_t + block_w
    g = canvas(total_w, w.height)
    paste(g, w, 0, 0)
    mid = (lt + lb) / 2
    paste(g, dash(rule_t, round((lb - lt) * 0.62), rgb), w.width + gap, mid - (lb - lt) * 0.31)
    y = mid - block_h / 2
    for i in lines:
        paste(g, i, w.width + gap * 2 + rule_t, y)
        y += i.height + lead
    return g


def centred(group: Image.Image, w: int, h: int, bg: tuple[int, int, int] | None, max_w: float, max_h: float) -> Image.Image:
    c = canvas(w, h, bg)
    f = fit(group, round(w * max_w), round(h * max_h))
    paste(c, f, (w - f.width) / 2, (h - f.height) / 2)
    return c


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, optimize=True)
    print(f"  {path.relative_to(ROOT)}  {im.width}x{im.height}")


def small_icon(icon: Image.Image, side: int, bg: tuple[int, int, int]) -> Image.Image:
    """An app or favicon icon: drawn big, the pencil lines thickened a little, then scaled down,
    so the arm still reads at 16-48 px."""
    big = square_icon(icon, side * 8, pad=0.1)
    if side <= 64:
        a = big.getchannel("A").filter(ImageFilter.MaxFilter(9))
        a = a.point(lambda v: min(255, int(v * 1.6)))
        big.putalpha(a)
    out = canvas(side * 8, side * 8, bg)
    out.alpha_composite(big)
    return out.resize((side, side), Image.LANCZOS)


# ───────────────────────────── build ─────────────────────────────


def main() -> None:
    KIT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    m_ink, m_white = load("lockup-graphite-4k.png"), load("lockup-white-4k.png")
    word_ink, letters = drawn_word(m_ink)
    word_white, _ = drawn_word(m_white)
    word_mono = recolour(word_ink, INK)
    icon_ink, icon_white = trim(load("emblem-transparent.png"))[0], trim(load("emblem-dark.png"))[0]
    icon_mono = recolour(icon_ink, INK)

    print("Kit (public/brand/kit):")
    S = 3840
    full = {
        "jove-lockup-dark.png": (lockup_group(word_white, letters, 3000, PAPER), GRAPHITE),
        "jove-lockup-light.png": (lockup_group(word_ink, letters, 3000, GRAPHITE), PAPER),
        "jove-lockup-mono.png": (lockup_group(word_mono, letters, 3000, INK), None),
        "jove-lockup-transparent.png": (lockup_group(word_ink, letters, 3000, GRAPHITE), None),
    }
    for name, (g, bg) in full.items():
        save_png(centred(g, S, S, bg, 0.8, 0.8), KIT / name)

    hz = {
        "jove-horizontal-dark.png": (horizontal_group(word_white, letters, 1500, PAPER), GRAPHITE),
        "jove-horizontal-for-dark.png": (horizontal_group(word_white, letters, 1500, PAPER), None),
        "jove-horizontal-for-light.png": (horizontal_group(word_ink, letters, 1500, GRAPHITE), None),
    }
    for name, (g, bg) in hz.items():
        f = fit(g, round(S * 0.88), 10**6)
        save_png(centred(g, S, round(f.height / 0.76), bg, 0.88, 0.76), KIT / name)

    save_png(square_icon(icon_ink, 4096), KIT / "jove-icon-transparent.png")
    save_png(square_icon(icon_mono, 4096), KIT / "jove-icon-mono.png")
    save_png(square_icon(icon_white, 4096, bg=GRAPHITE), KIT / "jove-icon-dark.png")

    # profile picture: every visible pixel of the logo inside a circle of radius 0.43 x side
    g = lockup_group(word_white, letters, 3000, PAPER)
    a = np.array(g)[:, :, 3] > 10
    ys, xs = np.nonzero(a)
    far = float(np.sqrt(((xs - g.width / 2) ** 2) + ((ys - g.height / 2) ** 2)).max())
    scale = (0.42 * S) / far
    g = g.resize((round(g.width * scale), round(g.height * scale)), Image.LANCZOS)
    layer = canvas(S, S)
    paste(layer, g, (S - g.width) / 2, (S - g.height) / 2)
    ys, xs = np.nonzero(np.array(layer)[:, :, 3] > 10)
    r = float(np.sqrt((xs - S / 2) ** 2 + (ys - S / 2) ** 2).max()) / S
    print(f"  profile picture: farthest visible pixel at {r:.4f} x side (limit 0.43)")
    assert r <= 0.43, f"profile picture logo reaches {r:.4f} x side, more than 0.43"
    prof = canvas(S, S, GRAPHITE)
    prof.alpha_composite(layer)
    save_png(prof, KIT / "jove-profile-picture.png")

    print("Site files:")
    sq = square_icon(icon_ink, 512, pad=0.06)
    save_png(sq, BRAND / "emblem-512.png")
    for side in (256, 128):
        p = BRAND / f"emblem-{side}.webp"
        square_icon(icon_ink, side, pad=0.06).save(p, quality=90, method=6)
        print(f"  {p.relative_to(ROOT)}  {side}x{side}")
    for side, path in ((192, BRAND / "icon-192.png"), (512, BRAND / "icon-512.png"), (180, BRAND / "apple-touch-icon.png")):
        save_png(small_icon(icon_white, side, GRAPHITE).convert("RGB"), path)
    save_png(small_icon(icon_white, 512, GRAPHITE).convert("RGB"), APP / "icon.png")
    save_png(small_icon(icon_white, 180, GRAPHITE).convert("RGB"), APP / "apple-icon.png")
    ico = small_icon(icon_white, 48, GRAPHITE)
    ico.save(APP / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], bitmap_format="png")
    print(f"  {(APP / 'favicon.ico').relative_to(ROOT)}  16/32/48")
    svg = APP / "icon.svg"
    if svg.exists():
        svg.unlink()  # the hand-drawn SVG icon is replaced by the built icon.png
        print("  removed src/app/icon.svg (replaced by the built icon.png)")

    hd = fit(horizontal_group(word_white, letters, 1500, PAPER), 900, 10**6)
    hl = fit(horizontal_group(word_ink, letters, 1500, GRAPHITE), 900, 10**6)
    save_png(hd, BRAND / "logo-on-dark.png")
    save_png(hl, BRAND / "logo-on-light.png")

    # the files the website, HQ screens and printables already use, rebuilt from the same masters
    wm_ink = lockup_group(word_ink, letters, 1400, GRAPHITE)
    wm_white = lockup_group(word_white, letters, 1400, PAPER)
    save_png(centred(wm_ink, 1400, 669, None, 1, 1), BRAND / "jove-wordmark.png")
    save_png(centred(wm_white, 1400, 669, None, 1, 1), BRAND / "jove-wordmark-white.png")
    save_png(centred(icon_ink, 1024, 1178, None, 1, 1), BRAND / "jove-mark.png")
    save_png(centred(icon_white, 1024, 1178, None, 1, 1), BRAND / "jove-mark-white.png")
    full_ink, full_white = m_ink.resize((2000, 1067), Image.LANCZOS), m_white.resize((2000, 1067), Image.LANCZOS)
    save_png(full_ink, BRAND / "jove-logo-ink.png")
    save_png(full_white, BRAND / "jove-logo-ink-white.png")
    full_ink.save(BRAND / "jove-logo-ink.webp", quality=88, method=6)
    full_white.save(BRAND / "jove-logo-ink-white.webp", quality=88, method=6)
    paper = canvas(2000, 1067, PAPER)
    paper.alpha_composite(full_ink)
    paper.convert("RGB").save(BRAND / "jove-logo-paper.webp", quality=88, method=6)

    # share image: the horizontal logo on graphite (no glow)
    og = canvas(1200, 630, GRAPHITE)
    h = fit(horizontal_group(word_white, letters, 1500, PAPER), 980, 400)
    paste(og, h, (1200 - h.width) / 2, (630 - h.height) / 2)
    og.convert("RGB").save(BRAND / "og-image.jpg", quality=90)
    og.convert("RGB").save(APP / "opengraph-image.jpg", quality=90)
    print("  public/brand/og-image.jpg and src/app/opengraph-image.jpg  1200x630")

    write_previews_and_sizes()


def write_previews_and_sizes() -> None:
    """A light 900 px WebP preview of every kit PNG, and sizes.json read from the real files."""
    sizes = {}
    for p in sorted(KIT.glob("*.png")):
        with Image.open(p) as im:
            sizes[p.name] = {"w": im.width, "h": im.height, "bytes": p.stat().st_size}
            prev = im.convert("RGBA")
            prev.thumbnail((900, 900), Image.LANCZOS)
            prev.save(PREVIEW / (p.stem + ".webp"), quality=82, method=6)
    text = json.dumps(sizes, indent=2) + "\n"
    (KIT / "sizes.json").write_text(text, encoding="utf-8")
    # the HQ page imports a copy at build time (files in public/ are not readable by the server on Vercel)
    (ROOT / "src" / "lib" / "brand").mkdir(parents=True, exist_ok=True)
    (ROOT / "src" / "lib" / "brand" / "kit-sizes.json").write_text(text, encoding="utf-8")
    print(f"Previews and sizes.json: {len(sizes)} kit files")


if __name__ == "__main__":
    main()
