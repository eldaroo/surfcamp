from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

WIDTH, HEIGHT = 1600, 900
FONT_PATH = r"C:\\Windows\\Fonts\\Arial.ttf"

posts = [
    {
        "filename": "santa-teresa-surf-guide.jpg",
        "title": "Santa Teresa Surf Guide",
        "subtitle": "Breakdown of spots, seasons & local tips",
        "colors": ((15, 50, 60), (140, 200, 210)),
        "accent": (236, 233, 127)
    },
    {
        "filename": "surf-yoga-retreat-santa-teresa.jpg",
        "title": "Surf + Yoga Retreat",
        "subtitle": "What to expect at Zeneidas Surf Garden",
        "colors": ((22, 30, 55), (138, 94, 71)),
        "accent": (255, 255, 255)
    },
    {
        "filename": "wellness-breathwork-ice-baths.jpg",
        "title": "Wellness, Breathwork & Ice Baths",
        "subtitle": "Build resilience with nervous system training",
        "colors": ((13, 38, 54), (34, 125, 135)),
        "accent": (180, 232, 255)
    }
]

output_dir = Path('public/assets/blog')
output_dir.mkdir(parents=True, exist_ok=True)

try:
    title_font = ImageFont.truetype(FONT_PATH, 96)
    subtitle_font = ImageFont.truetype(FONT_PATH, 46)
except OSError:
    title_font = ImageFont.load_default()
    subtitle_font = ImageFont.load_default()

for post in posts:
    top, bottom = post["colors"]
    img = Image.new("RGB", (WIDTH, HEIGHT), top)
    pixels = img.load()
    for y in range(HEIGHT):
        ratio = y / (HEIGHT - 1)
        r = int(top[0] * (1 - ratio) + bottom[0] * ratio)
        g = int(top[1] * (1 - ratio) + bottom[1] * ratio)
        b = int(top[2] * (1 - ratio) + bottom[2] * ratio)
        for x in range(WIDTH):
            pixels[x, y] = (r, g, b)

    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    draw_overlay.rectangle([0, HEIGHT * 0.55, WIDTH, HEIGHT], fill=(0, 0, 0, 90))
    draw_overlay.rectangle([0, 0, WIDTH, HEIGHT * 0.2], fill=(0, 0, 0, 70))
    img = Image.alpha_composite(img.convert("RGBA"), overlay)

    draw = ImageDraw.Draw(img)

    accent_color = post["accent"]
    draw.rectangle([80, HEIGHT * 0.18, 200, HEIGHT * 0.19], fill=accent_color)

    title = post["title"]
    subtitle = post["subtitle"]

    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_w = title_bbox[2] - title_bbox[0]
    title_h = title_bbox[3] - title_bbox[1]
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_w = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_h = subtitle_bbox[3] - subtitle_bbox[1]

    title_x = (WIDTH - title_w) / 2
    title_y = HEIGHT * 0.32 - title_h / 2
    subtitle_x = (WIDTH - subtitle_w) / 2
    subtitle_y = title_y + title_h + 40

    draw.text((title_x, title_y), title, font=title_font, fill=accent_color)
    draw.text((subtitle_x, subtitle_y), subtitle, font=subtitle_font, fill=(255, 255, 255))

    stamp_text = "Zeneidas Surf Garden · Santa Teresa, CR"
    stamp_bbox = draw.textbbox((0, 0), stamp_text, font=subtitle_font)
    stamp_w = stamp_bbox[2] - stamp_bbox[0]
    stamp_h = stamp_bbox[3] - stamp_bbox[1]
    draw.text(((WIDTH - stamp_w) / 2, HEIGHT - stamp_h - 60), stamp_text, font=subtitle_font, fill=(255, 255, 255))

    output_path = output_dir / post["filename"]
    img.convert("RGB").save(output_path, format="JPEG", quality=92)
    print(f"Created {output_path}")
