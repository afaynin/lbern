"""Touch up jewelry photos: neutral white balance, levels, consistent 4:5 crop, light sharpening.

usage: touchup.py OUT_DIR IMAGE [IMAGE ...]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

LONG_SIDE = 2000
ASPECT = 4 / 5  # width / height, matches the site grid
MAX_GAIN = 1.2  # cap per-channel white-balance correction
WB_STRENGTH = 0.7  # 1.0 = fully neutral background; less keeps some natural warmth
BG_TARGET = 238.0  # brightness to lift light backgrounds to
MAX_BRIGHTEN = 1.35
CONTRAST = 0.08


def border_pixels(a):
    h, w, _ = a.shape
    return np.concatenate([a[: h // 20].reshape(-1, 3), a[-h // 20 :].reshape(-1, 3),
                           a[:, : w // 20].reshape(-1, 3), a[:, -w // 20 :].reshape(-1, 3)])


def white_balance(a):
    """Pull the background colour most of the way to neutral grey/white."""
    ref = np.median(border_pixels(a), axis=0)
    full = np.clip(ref.mean() / ref, 1 / MAX_GAIN, MAX_GAIN)
    gains = 1 + WB_STRENGTH * (full - 1)
    return a * gains


def levels(a):
    """Brighten light backgrounds toward white, set a black point, add a touch of contrast."""
    bg = np.median(border_pixels(a).mean(axis=1))
    lo = min(np.percentile(a.mean(axis=2), 0.5), 25.0)  # don't crush genuinely dark pieces
    gain = 1.0
    if bg > 130:  # light backdrop: lift it toward BG_TARGET
        gain = min(BG_TARGET / max(bg - lo, 1.0), MAX_BRIGHTEN)
    a = (a - lo) * gain
    x = np.clip(a / 255.0, 0, 1)
    x = x + CONTRAST * x * (1 - x) * (2 * x - 1)  # gentle S-curve
    return x * 255.0


def subject_box(a):
    """Bounding box of pixels that differ clearly from the background colour."""
    h, w, _ = a.shape
    bg = np.median(border_pixels(a), axis=0)
    diff = np.abs(a - bg).max(axis=2)
    mask = diff > max(40.0, np.percentile(diff, 60))
    # ignore stray specks: use 1st/99th percentile of subject pixel coordinates
    ys, xs = np.nonzero(mask)
    if len(ys) < 0.02 * h * w:
        return None
    return (np.percentile(xs, 0.5), np.percentile(ys, 0.5),
            np.percentile(xs, 99.5), np.percentile(ys, 99.5))


def crop_4x5(img, box):
    w, h = img.size
    if box is None:
        cx, cy, bw, bh = w / 2, h / 2, w, h
    else:
        x0, y0, x1, y1 = box
        pad = 0.08
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        bw, bh = (x1 - x0) * (1 + 2 * pad), (y1 - y0) * (1 + 2 * pad)
    # grow the box to 4:5 around the subject
    if bw / bh > ASPECT:
        bh = bw / ASPECT
    else:
        bw = bh * ASPECT
    # never larger than the photo
    scale = min(1.0, w / bw, h / bh)
    bw, bh = bw * scale, bh * scale
    left = min(max(cx - bw / 2, 0), w - bw)
    top = min(max(cy - bh / 2, 0), h - bh)
    return img.crop((round(left), round(top), round(left + bw), round(top + bh)))


def process(src, out_dir):
    img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    a = np.asarray(img, dtype=np.float32)
    a = levels(white_balance(a))
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    img = crop_4x5(img, subject_box(np.asarray(img, dtype=np.float32)))
    img.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=3))
    out = Path(out_dir) / (Path(src).stem + ".jpg")
    img.save(out, "JPEG", quality=85, optimize=True, progressive=True)
    print(out, img.size)


if __name__ == "__main__":
    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    for src in sys.argv[2:]:
        process(src, out_dir)
