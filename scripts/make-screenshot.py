#!/usr/bin/env python3
"""Process the raw screenshot into a Chrome Web Store ready 1280x800 image.

Crops are hand-tuned for the source at /Users/jungyoonkim/.claude/image-cache/...:
  - removes window chrome + bookmarks bar (privacy)
  - keeps the H1 title, the toast, and the first three fixtures
  - trims empty right gutter while preserving the toast
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = Path("/Users/jungyoonkim/.claude/image-cache/7d6e68a8-cb4b-4147-9f55-f72dca8c248b/1.png")
OUT_DIR = ROOT / "store" / "screenshots"
OUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET_W, TARGET_H = 1280, 800
BG = (242, 244, 248, 255)

# Source: 2576x1585. Hand-tuned bounds (coords in source pixels).
# After dark-pixel survey: bookmark bar ends ~y=240, toast at y=280..360 / x=1300..1700,
# H1 around y=400, fixtures from y=440+, content box bottom edge at y≈1480.
CROP_LEFT = 100
CROP_TOP = 240
CROP_RIGHT = 1900
CROP_BOTTOM = 1490

src = Image.open(SRC).convert("RGBA")
W, H = src.size
print(f"source: {W}x{H}")

CROP_BOTTOM = min(CROP_BOTTOM, H)
content = src.crop((CROP_LEFT, CROP_TOP, CROP_RIGHT, CROP_BOTTOM))
print(f"cropped: {content.size}")

# Letterbox onto 1280x800.
src_ratio = content.width / content.height
tgt_ratio = TARGET_W / TARGET_H
if src_ratio > tgt_ratio:
    new_w = TARGET_W
    new_h = int(TARGET_W / src_ratio)
else:
    new_h = TARGET_H
    new_w = int(TARGET_H * src_ratio)
resized = content.resize((new_w, new_h), Image.LANCZOS)

canvas = Image.new("RGBA", (TARGET_W, TARGET_H), BG)

# Add a soft drop shadow under the content panel so it floats.
shadow = Image.new("RGBA", (new_w + 80, new_h + 80), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.rounded_rectangle((40, 40, new_w + 40, new_h + 40), radius=18, fill=(0, 0, 0, 50))
shadow = shadow.filter(ImageFilter.GaussianBlur(20))
sx = (TARGET_W - shadow.width) // 2
sy = (TARGET_H - shadow.height) // 2 + 10
canvas.alpha_composite(shadow, (sx, sy))

# Round the resized panel corners.
mask = Image.new("L", (new_w, new_h), 0)
md = ImageDraw.Draw(mask)
md.rounded_rectangle((0, 0, new_w, new_h), radius=14, fill=255)
panel = Image.new("RGBA", (new_w, new_h), (0, 0, 0, 0))
panel.paste(resized, (0, 0), mask=mask)

px = (TARGET_W - new_w) // 2
py = (TARGET_H - new_h) // 2
canvas.alpha_composite(panel, (px, py))

out = OUT_DIR / "screenshot-native-select.png"
canvas.convert("RGB").save(out, optimize=True)
print(f"wrote {out} ({TARGET_W}x{TARGET_H})")
