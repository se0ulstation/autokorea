#!/usr/bin/env python3
"""Generate AutoKorea icons (16/48/128) — minimal monochrome wordmark."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "icons"
OUT.mkdir(exist_ok=True)

# Monochrome palette
INK = (18, 18, 20, 255)      # near-black, slightly warm
PAPER = (255, 255, 255, 255)
RULE = (18, 18, 20, 255)

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


def fit_font(text, max_width, max_height, start=400):
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
    draw = ImageDraw.Draw(img)

    # Squircle ink card filling almost the entire frame
    pad = max(2, s // 80)
    radius = int(s * 0.24)
    draw.rounded_rectangle((pad, pad, s - pad, s - pad), radius=radius, fill=INK)

    # Inset a thin keyline border one pixel thick (after downscale) for refinement
    keyline_w = max(1, s // 256)
    keyline_inset = pad + max(2, s // 32)
    draw.rounded_rectangle(
        (keyline_inset, keyline_inset, s - keyline_inset, s - keyline_inset),
        radius=int(radius * 0.7), outline=(255, 255, 255, 36), width=keyline_w
    )

    # Type area: leave generous margins
    side = int(s * 0.14)
    avail_w = s - side * 2

    # Both words sized to the same width — KOREA is longer, so it sets the scale.
    f_korea = fit_font("KOREA", avail_w, int(s * 0.34), start=int(s * 0.45))
    f_auto = f_korea  # same metrics → unified wordmark

    def text_metrics(font, text):
        bbox = font.getbbox(text)
        return bbox[2] - bbox[0], bbox[3] - bbox[1], bbox[1]

    aw, ah, a_off = text_metrics(f_auto, "AUTO")
    kw, kh, k_off = text_metrics(f_korea, "KOREA")

    # Vertical layout: AUTO / thin rule / KOREA, group centered
    rule_gap_above = int(s * 0.025)
    rule_gap_below = int(s * 0.025)
    rule_h = max(1, s // 96)
    total_h = ah + rule_gap_above + rule_h + rule_gap_below + kh
    top = (s - total_h) // 2

    auto_x = (s - aw) // 2
    auto_y = top - a_off
    draw.text((auto_x, auto_y), "AUTO", font=f_auto, fill=PAPER)

    # Thin divider rule between the two words, width slightly less than KOREA
    rule_w = int(kw * 0.9)
    rule_x0 = (s - rule_w) // 2
    rule_y = top + ah + rule_gap_above
    draw.rectangle((rule_x0, rule_y, rule_x0 + rule_w, rule_y + rule_h), fill=PAPER)

    korea_x = (s - kw) // 2
    korea_y = rule_y + rule_h + rule_gap_below - k_off
    draw.text((korea_x, korea_y), "KOREA", font=f_korea, fill=PAPER)

    # For the smallest icon (16px), the divider rule is illegible — drop it cleanly.
    if size < 32:
        # Re-render without rule for 16px clarity
        return render_simple(size)

    return img.resize((size, size), Image.LANCZOS)


def render_simple(size: int) -> Image.Image:
    """Stripped-down version for tiny sizes (16px) — no divider rule."""
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = max(2, s // 80)
    radius = int(s * 0.24)
    draw.rounded_rectangle((pad, pad, s - pad, s - pad), radius=radius, fill=INK)

    side = int(s * 0.10)
    avail_w = s - side * 2
    f = fit_font("KOREA", avail_w, int(s * 0.42), start=int(s * 0.5))

    def text_metrics(font, text):
        bbox = font.getbbox(text)
        return bbox[2] - bbox[0], bbox[3] - bbox[1], bbox[1]

    aw, ah, a_off = text_metrics(f, "AUTO")
    kw, kh, k_off = text_metrics(f, "KOREA")

    gap = int(s * 0.04)
    total_h = ah + gap + kh
    top = (s - total_h) // 2

    draw.text(((s - aw) // 2, top - a_off), "AUTO", font=f, fill=PAPER)
    draw.text(((s - kw) // 2, top + ah + gap - k_off), "KOREA", font=f, fill=PAPER)

    return img.resize((size, size), Image.LANCZOS)


for n in (16, 48, 128):
    out = OUT / f"{n}.png"
    img = render(n)
    img.save(out, optimize=True)
    print(f"wrote {out} ({n}x{n})")
