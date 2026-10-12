"""
JOVE asset pipeline.
Turns the raw 4K logo + Higgsfield renders in .assets-raw/ into:
  - public/brand/*      (web logo variants, symbol mark, OG image)
  - src/app/icon.png, apple-icon.png, favicon.ico
  - public/images/**    (optimised WebP for the website)
  - OPERATIONS/01_BRAND/logo/* (print-grade masters)
Run:  python scripts/process-assets.py
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, ".assets-raw")
PUB = os.path.join(ROOT, "public")
BRAND_OUT = os.path.join(PUB, "brand")
IMG_OUT = os.path.join(PUB, "images")
OPS_BRAND = os.path.join(ROOT, "OPERATIONS", "01_BRAND", "logo")
APP = os.path.join(ROOT, "src", "app")
for d in (BRAND_OUT, IMG_OUT, OPS_BRAND):
    os.makedirs(d, exist_ok=True)

GRAPHITE = (43, 43, 43)
PAPER = (245, 241, 232)


def ink_alpha(img: Image.Image, lo=0.10, hi=0.78) -> np.ndarray:
    """Luminance -> alpha. Paper becomes transparent, graphite stays opaque,
    faint grid lines are suppressed by the smoothstep floor."""
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    lum = a.mean(axis=2)
    paper = np.percentile(lum, 80)
    ink = np.clip((paper - lum) / (paper - 25.0), 0, 1)
    t = np.clip((ink - lo) / (hi - lo), 0, 1)
    return (t * t * (3 - 2 * t) * 255).astype(np.uint8)


def tinted(alpha: np.ndarray, rgb) -> Image.Image:
    h, w = alpha.shape
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = rgb
    out[..., 3] = alpha
    return Image.fromarray(out, "RGBA")


def trim(img: Image.Image, pad=40) -> Image.Image:
    bbox = img.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


# ---------------------------------------------------------------- logo
logo = Image.open(os.path.join(RAW, "logo-4k.png")).convert("RGB")  # 4096 x 2185
W, H = logo.size
logo.save(os.path.join(OPS_BRAND, "JOVE_Logo_4K_Paper.png"), optimize=True)

alpha = ink_alpha(logo)
ink_dark = tinted(alpha, GRAPHITE)
ink_light = tinted(alpha, PAPER)
ink_dark.save(os.path.join(OPS_BRAND, "JOVE_Logo_4K_Transparent_Graphite.png"), optimize=True)
ink_light.save(os.path.join(OPS_BRAND, "JOVE_Logo_4K_Transparent_White.png"), optimize=True)

# reversed (white sketch on graphite) master, like the brand sheet
rev = Image.new("RGB", (W, H), GRAPHITE)
rev.paste(ink_light, (0, 0), ink_light)
rev.save(os.path.join(OPS_BRAND, "JOVE_Logo_4K_Reversed.png"), optimize=True)

# web sizes (2000w is plenty for retina nav/hero usage)
for name, im in (("jove-logo-ink", ink_dark), ("jove-logo-ink-white", ink_light)):
    w = 2000
    im.resize((w, round(H * w / W)), Image.LANCZOS).save(os.path.join(BRAND_OUT, f"{name}.png"), optimize=True)
    im.resize((w, round(H * w / W)), Image.LANCZOS).save(os.path.join(BRAND_OUT, f"{name}.webp"), quality=90, method=6)
logo.resize((2400, round(H * 2400 / W)), Image.LANCZOS).save(os.path.join(BRAND_OUT, "jove-logo-paper.webp"), quality=88, method=6)

# wordmark only (no corner annotations) for the navbar: mask the top-left
# "PRECISION / LEARNING ..." annotation, then crop the central lockup
_wa = alpha.copy()
_wa[int(H * 0.04):int(H * 0.25), int(W * 0.05):int(W * 0.225)] = 0
ink_dark_clean = tinted(_wa, GRAPHITE)
ink_light_clean = tinted(_wa, PAPER)
word = ink_dark_clean.crop((int(W * 0.07), int(H * 0.03), int(W * 0.93), int(H * 0.80)))
word = trim(word, pad=20)
word.resize((1400, round(word.height * 1400 / word.width)), Image.LANCZOS).save(os.path.join(BRAND_OUT, "jove-wordmark.png"), optimize=True)
wordw = ink_light_clean.crop((int(W * 0.07), int(H * 0.03), int(W * 0.93), int(H * 0.80)))
wordw = trim(wordw, pad=20)
wordw.resize((1400, round(wordw.height * 1400 / wordw.width)), Image.LANCZOS).save(os.path.join(BRAND_OUT, "jove-wordmark-white.png"), optimize=True)

# ---------------------------------------------------------------- symbol mark (O + robotic arm)
yy, xx = np.mgrid[0:H, 0:W]
cx, cy, r = 1624, 1130, 450
mask = ((xx - cx) ** 2 + (yy - cy) ** 2 <= r * r)          # the O ring
mask |= (yy < 772) & (xx > 1080) & (xx < 2420)              # arm + gripper (above the V)
mask |= (xx < 1950) & (yy < 1100) & (xx > 1080)             # shoulder joint
mark_alpha = np.where(mask, alpha, 0).astype(np.uint8)
mark = trim(tinted(mark_alpha, GRAPHITE), pad=30)
mark_w = trim(tinted(mark_alpha, PAPER), pad=30)
mark.save(os.path.join(OPS_BRAND, "JOVE_Symbol_Mark_Graphite.png"), optimize=True)
mark_w.save(os.path.join(OPS_BRAND, "JOVE_Symbol_Mark_White.png"), optimize=True)
mark.resize((1024, round(mark.height * 1024 / mark.width)), Image.LANCZOS).save(os.path.join(BRAND_OUT, "jove-mark.png"), optimize=True)
mark_w.resize((1024, round(mark_w.height * 1024 / mark_w.width)), Image.LANCZOS).save(os.path.join(BRAND_OUT, "jove-mark-white.png"), optimize=True)


def app_icon(size: int, dark=False) -> Image.Image:
    """Rounded-square app icon like the brand sheet: paper tile + mark."""
    s = size * 4
    bg = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(bg)
    d.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.22), fill=GRAPHITE if dark else PAPER)
    m = mark_w if dark else mark
    inner = int(s * 0.84)
    scale = inner / max(m.width, m.height)
    mm = m.resize((int(m.width * scale), int(m.height * scale)), Image.LANCZOS)
    bg.alpha_composite(mm, ((s - mm.width) // 2, (s - mm.height) // 2 + int(s * 0.01)))
    return bg.resize((size, size), Image.LANCZOS)


app_icon(512).save(os.path.join(APP, "icon.png"))
app_icon(180).save(os.path.join(APP, "apple-icon.png"))
app_icon(256).save(os.path.join(APP, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
app_icon(1024).save(os.path.join(OPS_BRAND, "JOVE_App_Icon_1024.png"))
app_icon(1024, dark=True).save(os.path.join(OPS_BRAND, "JOVE_App_Icon_1024_Dark.png"))
app_icon(512).save(os.path.join(BRAND_OUT, "icon-512.png"))
app_icon(192).save(os.path.join(BRAND_OUT, "icon-192.png"))

# ---------------------------------------------------------------- OG image 1200x630
og = Image.open(os.path.join(RAW, "logo-4k.png")).convert("RGB")
og_ratio = 1200 / 630
ow, oh = og.size
target_h = int(ow / og_ratio)
if target_h > oh:  # pad paper top/bottom
    canvas = Image.new("RGB", (ow, target_h), og.getpixel((10, 10)))
    canvas.paste(og, (0, (target_h - oh) // 2))
    og = canvas
og.resize((1200, 630), Image.LANCZOS).save(os.path.join(BRAND_OUT, "og-image.jpg"), quality=88)
og.resize((1200, 630), Image.LANCZOS).save(os.path.join(APP, "opengraph-image.jpg"), quality=88)

# ---------------------------------------------------------------- website imagery
groups = {
    "hero": ["hero-arm"],
    "age": ["age-1", "age-2", "age-3", "age-4"],
    "studio": ["media-crew", "drone-campus", "kids-build", "trainer-class"],
    "kits": ["kit-spark", "kit-explorer", "kit-builder", "kit-innovator", "kit-knolling"],
    "labs": ["lab-arm", "lab-ml", "lab-line", "lab-logic", "lab-rover", "lab-sensor"],
    "misc": ["hq-command", "lost-robot"],
}
for folder, names in groups.items():
    os.makedirs(os.path.join(IMG_OUT, folder), exist_ok=True)
    for n in names:
        src = os.path.join(RAW, n + ".png")
        if not os.path.exists(src):
            continue
        im = Image.open(src).convert("RGB")
        maxw = 2400 if folder in ("hero", "studio") else 1600
        if im.width > maxw:
            im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
        im.save(os.path.join(IMG_OUT, folder, n + ".webp"), quality=80, method=6)

# hero sketch as a transparent ink layer (lets the 3D scene sit on our own paper)
hero = Image.open(os.path.join(RAW, "hero-arm.png")).convert("RGB")
ha = ink_alpha(hero, lo=0.14, hi=0.8)
hero_ink = tinted(ha, GRAPHITE).resize((2400, round(hero.height * 2400 / hero.width)), Image.LANCZOS)
hero_ink.save(os.path.join(IMG_OUT, "hero", "hero-arm-ink.webp"), quality=85, method=6, lossless=False)

print("done")
for root, _, files in os.walk(PUB):
    for f in files:
        p = os.path.join(root, f)
        print(os.path.relpath(p, ROOT), os.path.getsize(p) // 1024, "KB")
