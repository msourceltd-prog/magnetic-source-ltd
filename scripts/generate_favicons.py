from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "client" / "public"
PAPER = "#FFFEFA"
COBALT = "#1555A0"
INK = "#18222D"
GOLD = "#C78B25"

def scale_points(points, scale):
    return [(round(x * scale), round(y * scale)) for x, y in points]

def render(size):
    scale = 6
    image = Image.new("RGBA", (64 * scale, 64 * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((2 * scale, 2 * scale, 62 * scale, 62 * scale), radius=8 * scale, fill=PAPER, outline=COBALT, width=2 * scale)
    for points in [
        [(12, 18), (26, 29), (21, 34), (8, 23)],
        [(52, 18), (56, 23), (43, 34), (38, 29)],
        [(12, 46), (8, 41), (21, 30), (26, 35)],
        [(52, 46), (38, 35), (43, 30), (56, 41)],
    ]:
        draw.polygon(scale_points(points, scale), fill=COBALT)
    for points in [[(18, 11), (30, 21)], [(46, 11), (34, 21)], [(18, 53), (30, 43)], [(46, 53), (34, 43)]]:
        draw.line(scale_points(points, scale), fill=INK, width=round(2.4 * scale), joint="curve")
    draw.ellipse((27 * scale, 27 * scale, 37 * scale, 37 * scale), fill=INK)
    draw.ellipse((30.4 * scale, 30.4 * scale, 33.6 * scale, 33.6 * scale), fill=GOLD)
    return image.resize((size, size), Image.Resampling.LANCZOS)

for size, name in [(48, "favicon-48.png"), (180, "apple-touch-icon.png")]:
    render(size).save(OUT / name, "PNG", optimize=True)
