"""
Builds the brand's pictures from brand.json and the landing's own images:

  artifacts/esim-store/public/og-image.jpg         1200x630 link-preview card
  artifacts/esim-store/public/favicon.svg          browser-tab icon
  artifacts/esim-store/public/apple-touch-icon.png home-screen icon

Run from the repo root after changing brand.json or the images in
public/images/brand/:

    python scripts/og-image.py

Needs Pillow and Montserrat[wght].ttf (Google Fonts, OFL) next to this script:
https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf
"""
import json
import os

from PIL import Image, ImageChops, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = "artifacts/esim-store/public/"
IMAGES = PUBLIC + "images/brand/"

brand = json.load(open("brand.json", encoding="utf-8"))
card = brand["shareCard"]
ACCENT = brand["colors"]["brand"]
ON_ACCENT = brand["colors"]["onBrand"]
INK = "#111111"
WHITE = "#FFFFFF"


def font(size, weight):
    f = ImageFont.truetype(os.path.join(HERE, "Montserrat.ttf"), size)
    f.set_variation_by_name(weight)
    return f


def infinity_points(cx, cy, w, n=200):
    """Lemniscate of Bernoulli, `w` wide, centred on (cx, cy)."""
    import math
    a = w / 2
    pts = []
    for i in range(n + 1):
        t = 2 * math.pi * i / n
        k = 1 + math.sin(t) ** 2
        pts.append((cx + a * math.cos(t) / k, cy + a * math.sin(t) * math.cos(t) / k))
    return pts


def stroke(d, pts, r, fill):
    """Round-pen line through `pts`: PIL's own wide lines notch at joints."""
    for x, y in pts:
        d.ellipse((x - r, y - r, x + r, y + r), fill=fill)


def share_card():
    # Red hero with white type: the photo sits right, the copy on the plain
    # red left half, as on the landing.
    W, H = 1200, 630
    img = Image.new("RGBA", (W, H))
    g = ImageDraw.Draw(img)
    top, bottom = (142, 7, 14), (97, 1, 6)
    for y in range(H):
        f = y / H
        g.line([(0, y), (W, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * f) for i in range(3)))

    photo = Image.open(IMAGES + "hero-desktop.webp").convert("RGBA")
    ph = int(H * 0.9)
    photo = photo.resize((int(photo.width * ph / photo.height), ph), Image.LANCZOS)
    photo = photo.crop((photo.width - 700, 0, photo.width, ph))
    fade = Image.new("L", photo.size, 255)
    fd = ImageDraw.Draw(fade)
    for x in range(160):
        fd.line([(x, 0), (x, ph)], fill=int(255 * x / 160))
    edge = Image.new("L", photo.size, 255)
    ed = ImageDraw.Draw(edge)
    for y in range(90):
        ed.line([(0, y), (photo.width, y)], fill=int(255 * y / 90))
    fade = ImageChops.multiply(fade, edge)
    photo.putalpha(fade)
    img.alpha_composite(photo, (W - photo.width, H - ph))

    d = ImageDraw.Draw(img)
    stroke(d, infinity_points(92, 78, 60, 600), 3.5, WHITE)
    d.text((136, 58), brand["name"].upper(), font=font(30, b"ExtraBold"), fill=WHITE)

    bf = font(20, b"Bold")
    d.text((64, 150), card["badge"].upper(), font=bf, fill=(255, 255, 255, 215))

    hf = font(58, b"ExtraBold")
    y = 192
    for line in card["headline"]:
        d.text((60, y), line, font=hf, fill=WHITE)
        y += 66
    d.text((60, y), card["headlineAccent"], font=hf, fill=WHITE)

    sf = font(24, b"Medium")
    y += 92
    for line in card["lines"]:
        d.text((64, y), line, font=sf, fill=(255, 255, 255, 225))
        y += 34

    cf = font(24, b"Bold")
    cw = d.textlength(card["button"], font=cf)
    d.rounded_rectangle((64, 548, 64 + cw + 64, 598), 25, fill=WHITE)
    d.text((96, 556), card["button"], font=cf, fill=ACCENT)

    out = PUBLIC + "og-image.jpg"
    img.convert("RGB").save(out, "JPEG", quality=85, optimize=True, progressive=True)
    print(out, os.path.getsize(out) // 1024, "KB")


def icons():
    pts = infinity_points(90, 90, 124)
    path = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + " Z"
    svg = f"""<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="180" height="180" rx="40" fill="{ACCENT}"/>
<path d="{path}" stroke="{ON_ACCENT}" stroke-width="16" stroke-linejoin="round"/>
</svg>
"""
    open(PUBLIC + "favicon.svg", "w", encoding="utf-8").write(svg)

    S, k = 180, 4  # draw 4x and shrink, for smooth edges
    im = Image.new("RGBA", (S * k, S * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, S * k - 1, S * k - 1), 40 * k, fill=ACCENT)
    stroke(d, infinity_points(90 * k, 90 * k, 124 * k, 1500), 8 * k, ON_ACCENT)
    im.resize((S, S), Image.LANCZOS).save(PUBLIC + "apple-touch-icon.png")
    print("icons:", ACCENT)


share_card()
icons()
