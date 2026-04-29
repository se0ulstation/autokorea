#!/usr/bin/env python3
"""Generate AutoKorea icons (16/48/128) — two-line wordmark "AUTO / KOREA"."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "icons"
OUT.mkdir(exist_ok=True)

RED = (205, 46, 58, 255)
BLUE = (0, 71, 160, 255)
BG = (255, 255, 255, 255)
SHADOW = (0, 0, 0, 50)

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Black.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/Helvetica.ttc",
]


def load_font(size_px):
    for path in FONT_CANDIDATES:
        try:
            if path.endswith(".ttc"):
                return ImageFont.truetype(path, size_px, index=0)
            return ImageFont.truetype(path, size_px)
        except Exception:
            continue
    return ImageFont.load_default()


def fit_font(text, max_width, max_height, start=200):
    """Binary-search for the largest font size that fits text within bounds."""
    lo, hi = 4, start
    best = lo
    while lo <= hi:
        mid = (lo + hi) // 2
        f = load_font(mid)
        bbox = f.getbbox(text)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        if w <= max_width and h <= max_height:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return load_font(best)


def render(size: int) -> Image.Image:
    s = size * 4  # supersample
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))

    # Soft shadow + rounded background card
    pad = max(2, s // 64)
    radius = int(s * 0.22)

    shadow_layer = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_layer)
    sd.rounded_rectangle((pad, pad + s // 80, s - pad, s - pad + s // 80),
                         radius=radius, fill=SHADOW)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(s // 80))
    img = Image.alpha_composite(img, shadow_layer)

    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((pad, pad, s - pad, s - pad), radius=radius, fill=BG)

    # Layout: two stacked lines centered. KOREA defines the width budget.
    side_pad = int(s * 0.08)
    avail_w = s - side_pad * 2
    avail_h = (s - side_pad * 2)
    line_h_budget = int(avail_h * 0.42)  # each line ~42% of vertical space

    f_korea = fit_font("KOREA", avail_w, line_h_budget, start=int(s * 0.55))
    # Match AUTO's font size to KOREA's so both lines feel like a single wordmark.
    f_auto = f_korea

    def text_size(font, text):
        bbox = font.getbbox(text)
        return bbox[2] - bbox[0], bbox[3] - bbox[1], bbox[1]

    aw, ah, a_off = text_size(f_auto, "AUTO")
    kw, kh, k_off = text_size(f_korea, "KOREA")

    gap = int(s * 0.02)
    total_h = ah + gap + kh
    top_y = (s - total_h) // 2

    auto_x = (s - aw) // 2
    auto_y = top_y - a_off

    korea_x = (s - kw) // 2
    korea_y = top_y + ah + gap - k_off

    draw.text((auto_x, auto_y), "AUTO", font=f_auto, fill=RED)
    draw.text((korea_x, korea_y), "KOREA", font=f_korea, fill=BLUE)

    return img.resize((size, size), Image.LANCZOS)


for n in (16, 48, 128):
    out = OUT / f"{n}.png"
    img = render(n)
    img.save(out, optimize=True)
    print(f"wrote {out} ({n}x{n})")
