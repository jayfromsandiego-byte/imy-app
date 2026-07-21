#!/usr/bin/env python3
"""Deterministic end-to-end renderer smoke test, with no production data."""
import json
import os
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import render_film as rf


def make_photo(path, index):
    colors = [
        ((77, 91, 72), (205, 178, 137)),
        ((91, 67, 51), (196, 143, 100)),
        ((51, 73, 87), (180, 190, 183)),
        ((103, 83, 62), (224, 195, 156)),
    ]
    a, b = colors[index % len(colors)]
    img = Image.new("RGB", (1600, 1000))
    draw = ImageDraw.Draw(img)
    for y in range(img.height):
        t = y / img.height
        col = tuple(int(x + (z - x) * t) for x, z in zip(a, b))
        draw.line([(0, y), (img.width, y)], fill=col)
    draw.ellipse([220 + index * 18, 170, 720 + index * 18, 670], fill=(238, 224, 198), outline=(94, 70, 52), width=8)
    draw.rectangle([820, 220 + index * 10, 1390, 760 + index * 5], outline=(250, 245, 236), width=10)
    img.save(path, quality=92)


def main(output_dir):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="imy-film-smoke-") as td:
        td = Path(td)
        photos = []
        for i in range(8):
            path = td / f"photo-{i}.jpg"
            make_photo(path, i)
            photos.append({"url": path.as_uri(), "cap": f"A kept family moment, number {i + 1}"})

        rf.ALLOW_PRIVATE_MEDIA = True
        rf.FPS = 12
        rf.XF = 0.35
        rf.TITLE_SEC = 2.2
        rf.CLOSE_SEC = 2.4
        rf.PHOTO_SEC = 1.7
        rf.CARD_SEC = 1.2
        rf.CLIP_SEC = 1.7
        os.environ["MAX_FILM_BYTES"] = str(20 * 1024 * 1024)

        spec = {
            "name": "Mara Ellis",
            "first": "Mara",
            "years": "1948 to 2024",
            "place": "San Diego, California",
            "slug": "qa-film",
            "pos": "her",
            "chapters": [{"title": "The girl by the sea", "yrs": "1948 to 1966", "photos": photos}],
            "photos": [],
            "clips": [],
            "portrait": photos[0]["url"],
            "variant": "full",
            "music": "gymnopedie-1",
        }
        film, poster, duration = rf.render(spec, str(out))
        result = {
            "film": film,
            "poster": poster,
            "duration": duration,
            "bytes": os.path.getsize(film),
            "poster_bytes": os.path.getsize(poster),
        }
        if duration <= 5 or result["bytes"] <= 100_000 or result["poster_bytes"] <= 2_000:
            raise SystemExit("render smoke output did not meet the minimum contract")
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "qa-output"
    main(target)
