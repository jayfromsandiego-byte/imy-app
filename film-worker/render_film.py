#!/usr/bin/env python3
"""render_film — weave a memorial film from a tribute's own media.

The locked house template (v1): a wreath title card over cream; the family's
chapters as quiet cream-deep cards; Ken Burns photo passages carrying the
family's own captions; up to three short clips woven into the life; the Stone
portrait; a closing card in warm dark brown and gold. Warm grade, gentle grain,
1s crossfades, a public-domain bed (Satie, Gymnopédie No. 1).

Small-worker safe: segments render one at a time; assembly is hierarchical
(groups of 5) so memory stays bounded — a naive 25-input xfade OOMs a 4 GB box.

Spec dict (built by worker.py from Supabase rows):
  name, years ("1948 to 2024"), place, slug, pos ("her"|"his"|"their"),
  chapters: [{title, yrs, photos: [{url, cap}]}],   # may be []
  photos:   [{url, cap}],                            # unchaptered/fallback, in family order
  clips:    [url, ...],                              # direct mp4/webm files, ≤3 used
  portrait: url | None,                              # the Stone photo
  variant:  "full" | "teaser"
"""
import ipaddress, json, os, socket, subprocess, sys, math, shutil, tempfile, urllib.parse, urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps

FPS = 25
W, H = 1920, 1080
XF = 1.0
CREAM = (250, 245, 236); CREAM_DEEP = (243, 236, 221); INK = (44, 37, 32)
INK_SOFT = (110, 97, 86); TERRA = (168, 124, 95); GOLD = (201, 165, 114)
DARK_TOP = (63, 44, 26); DARK_BOT = (36, 23, 17)
ASSETS = os.environ.get("ASSETS_DIR", os.path.join(os.path.dirname(__file__), "assets"))
GRADE = ("curves=r='0/0.02 0.5/0.55 1/1':g='0/0.01 0.5/0.505 1/0.995':b='0/0.005 0.5/0.47 1/0.965',"
         "eq=saturation=0.88:contrast=1.01")

FULL_MIN_PHOTOS = 3          # below this we decline, gently
CHAPTER_MIN_PHOTOS = 8       # below this: the short form, no chapter cards
FULL_MAX_PHOTOS = 24
TEASER_PHOTOS = 5
PHOTO_SEC = 5.0
CARD_SEC = 3.2
TITLE_SEC = 6.0
CLOSE_SEC = 7.5
CLIP_SEC = 6.5
MAX_CLIPS = 3
MAX_PHOTO_BYTES = int(os.environ.get("MAX_PHOTO_BYTES", str(30 * 1024 * 1024)))
MAX_CLIP_BYTES = int(os.environ.get("MAX_CLIP_BYTES", str(40 * 1024 * 1024)))
ALLOW_PRIVATE_MEDIA = os.environ.get("ALLOW_PRIVATE_MEDIA_URLS") == "1"
ALLOWED_MEDIA_HOSTS = {
    h.strip().lower()
    for h in os.environ.get("ALLOWED_MEDIA_HOSTS", "").split(",")
    if h.strip()
}


# ---------------- helpers ----------------

def run(cmd, timeout=1800):
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg failed ({' '.join(cmd)[:180]}): {r.stderr[-800:]}")

def _public_host(hostname):
    """Reject loopback/private/link-local media hosts before the worker fetches them."""
    if not hostname:
        return False
    host = hostname.rstrip(".").lower()
    if host in ALLOWED_MEDIA_HOSTS:
        return True
    try:
        addrs = {item[4][0] for item in socket.getaddrinfo(host, None)}
    except socket.gaierror as exc:
        raise ValueError("media-host-unreachable") from exc
    for raw in addrs:
        ip = ipaddress.ip_address(raw)
        if not ip.is_global:
            return False
    return True


def validate_media_url(url):
    parsed = urllib.parse.urlparse(str(url or ""))
    if parsed.scheme == "file" and ALLOW_PRIVATE_MEDIA:
        return
    if parsed.scheme != "https" or parsed.username or parsed.password:
        raise ValueError("unsafe-media-url")
    if not _public_host(parsed.hostname or ""):
        raise ValueError("unsafe-media-host")


def fetch(url, dest, max_bytes):
    validate_media_url(url)
    req = urllib.request.Request(url, headers={"User-Agent": "imy-film-worker/1.0"})
    with urllib.request.urlopen(req, timeout=90) as r, open(dest, "wb") as f:
        declared = int(r.headers.get("Content-Length") or 0)
        if declared and declared > max_bytes:
            raise ValueError("media-too-large")
        total = 0
        while True:
            chunk = r.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > max_bytes:
                raise ValueError("media-too-large")
            f.write(chunk)
    return dest

def besley(size, weight=400, italic=False):
    path = os.path.join(ASSETS, "Besley-Italic.ttf" if italic else "Besley.ttf")
    f = ImageFont.truetype(path, size)
    try: f.set_variation_by_axes([weight])
    except Exception: pass
    return f

def mono(size, weight=500):
    f = ImageFont.truetype(os.path.join(ASSETS, "SometypeMono.ttf"), size)
    try: f.set_variation_by_axes([weight])
    except Exception: pass
    return f

def fit_font(draw, text, maker, start_size, max_w, min_size=40, **kw):
    size = start_size
    while size > min_size:
        f = maker(size, **kw)
        b = draw.textbbox((0, 0), text, font=f)
        if b[2] - b[0] <= max_w: return f
        size -= 4
    return maker(min_size, **kw)

def draw_tracked(draw, y, s, font, fill, tracking, center_x):
    w = sum(draw.textlength(c, font=font) + tracking for c in s) - tracking
    x = center_x - w / 2
    for c in s:
        draw.text((x, y), c, font=font, fill=fill)
        x += draw.textlength(c, font=font) + tracking

def center_text(draw, y, s, font, fill):
    b = draw.textbbox((0, 0), s, font=font)
    draw.text(((W - (b[2] - b[0])) / 2 - b[0], y), s, font=font, fill=fill)


def wrap_lines(draw, text, font, max_width, max_lines=2):
    """Fit family-authored captions without letting a long line leave the frame."""
    words = str(text or "").replace("\n", " ").split()
    if not words:
        return []
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if not current or draw.textlength(candidate, font=font) <= max_width:
            current = candidate
            continue
        lines.append(current)
        current = word
        if len(lines) == max_lines:
            break
    if len(lines) < max_lines and current:
        lines.append(current)
    consumed = " ".join(lines)
    original = " ".join(words)
    if consumed != original and lines:
        last = lines[-1]
        while last and draw.textlength(last + "…", font=font) > max_width:
            last = last[:-1].rstrip()
        lines[-1] = (last + "…") if last else "…"
    return lines[:max_lines]


# ---------------- cards ----------------

def card_title(spec, path):
    img = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(img)
    d.rectangle([46, 46, W - 46, H - 46], outline=GOLD, width=2)
    d.rectangle([56, 56, W - 56, H - 56], outline=GOLD, width=1)
    wr = Image.open(os.path.join(ASSETS, "wreath.png")).convert("RGBA").resize((400, 400), Image.LANCZOS)
    img.paste(wr, ((W - 400) // 2, 96), wr)
    draw_tracked(d, 528, "IN LOVING MEMORY", mono(26), TERRA, 14, W / 2)
    name_font = fit_font(d, spec["name"], besley, 104, W - 320, weight=560)
    center_text(d, 596, spec["name"], name_font, INK)
    d.line([(W / 2 - 30, 782), (W / 2 + 30, 782)], fill=GOLD, width=2)
    sub = spec["years"] + (f"  ·  {spec['place'].upper()}" if spec.get("place") else "")
    draw_tracked(d, 826, sub.upper(), mono(27), INK_SOFT, 6, W / 2)
    img.save(path)

def card_chapter(title, yrs, path):
    img = Image.new("RGB", (W, H), CREAM_DEEP); d = ImageDraw.Draw(img)
    if yrs: draw_tracked(d, 428, yrs.upper(), mono(25), TERRA, 10, W / 2)
    f = fit_font(d, title, besley, 84, W - 360, weight=460, italic=True)
    center_text(d, 486, title, f, INK)
    d.line([(W / 2 - 30, 656), (W / 2 + 30, 656)], fill=GOLD, width=2)
    img.save(path)


def chapter_overlay_png(title, yrs, path):
    """The showcase treatment: a chapter title laid gently over its first photo."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    veil = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(veil)
    for y in range(H):
        distance = abs(y - int(H * 0.55)) / max(H * 0.38, 1)
        alpha = int(max(0, 74 * (1 - distance)))
        vd.line([(0, y), (W, y)], fill=(250, 245, 236, alpha))
    img.alpha_composite(veil.filter(ImageFilter.GaussianBlur(12)))
    d = ImageDraw.Draw(img)
    if yrs:
        draw_tracked(d, int(H * 0.44), str(yrs).upper(), mono(24), (88, 68, 55, 230), 8, W / 2)
    title = str(title or "")
    f = fit_font(d, title, besley, 78, W - 340, weight=450, italic=True)
    b = d.textbbox((0, 0), title, font=f)
    x = (W - (b[2] - b[0])) / 2 - b[0]
    y = int(H * 0.50)
    d.text((x + 2, y + 3), title, font=f, fill=(250, 245, 236, 190))
    d.text((x, y), title, font=f, fill=(49, 39, 31, 245))
    d.line([(W / 2 - 30, int(H * 0.66)), (W / 2 + 30, int(H * 0.66))], fill=GOLD + (225,), width=2)
    img.save(path)


def card_closing(spec, path):
    img = Image.new("RGB", (W, H), DARK_BOT); d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(DARK_TOP, DARK_BOT)))
    wr = Image.open(os.path.join(ASSETS, "wreath.png")).convert("RGBA")
    a = wr.getchannel("A"); solid = Image.new("RGBA", wr.size, GOLD + (0,)); solid.putalpha(a)
    wr = solid.resize((330, 330), Image.LANCZOS)
    img.paste(wr, ((W - 330) // 2, 118), wr)
    d = ImageDraw.Draw(img)
    f = fit_font(d, spec["name"], besley, 72, W - 360, weight=520)
    center_text(d, 480, spec["name"], f, CREAM)
    draw_tracked(d, 610, spec["years"].upper(), mono(28), GOLD, 10, W / 2)
    center_text(d, 700, "Kept, with love.", besley(46, weight=430, italic=True), (236, 226, 210))
    fb = besley(30, weight=440); fi = besley(30, weight=440, italic=True)
    segs = [("Made with love  ·  I ", fb, (196, 182, 165)), ("Miss", fi, (196, 141, 108)), (" You Memorial", fb, (196, 182, 165))]
    total = sum(d.textlength(s, font=f2) for s, f2, _ in segs); x = (W - total) / 2
    for s, f2, col in segs:
        d.text((x, 924), s, font=f2, fill=col); x += d.textlength(s, font=f2)
    if spec.get("slug"):
        draw_tracked(d, 986, f"imissyoumemorial.com/sites/{spec['slug']}", mono(22), (172, 150, 120), 3, W / 2)
    img.save(path)

def caption_png(text, path):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    font = mono(36)
    lines = wrap_lines(d, text, font, W - 300, max_lines=2)
    if not lines:
        img.save(path)
        return
    line_h = 52
    x = 110
    y = H - 112 - line_h * len(lines)
    widths = [d.textlength(line, font=font) for line in lines]
    plate = [x - 24, y - 18, min(W - 70, x + max(widths) + 26), y + line_h * len(lines) + 18]
    d.rounded_rectangle(plate, radius=14, fill=(25, 17, 12, 132))
    for i, line in enumerate(lines):
        ty = y + i * line_h
        d.text((x + 2, ty + 2), line, font=font, fill=(10, 7, 5, 210))
        d.text((x, ty), line, font=font, fill=(250, 245, 236, 246))
    img.save(path)


# ---------------- photo prep ----------------

def prep_photo(src_path, out_path):
    """EXIF-correct; portrait photos become a blur-fill wide composite."""
    im = Image.open(src_path)
    im = ImageOps.exif_transpose(im).convert("RGB")
    if im.height > im.width:  # portrait -> blur-fill 16:9 canvas
        cw, ch = 3840, 2160
        s = max(cw / im.width, ch / im.height)
        bg = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
        bg = bg.crop(((bg.width - cw) // 2, (bg.height - ch) // 2,
                      (bg.width - cw) // 2 + cw, (bg.height - ch) // 2 + ch))
        bg = bg.filter(ImageFilter.GaussianBlur(70))
        bg = ImageEnhance.Brightness(bg).enhance(0.62).convert("RGBA")
        fh = int(ch * 0.90); fw = int(im.width * fh / im.height)
        fg = im.resize((fw, fh), Image.LANCZOS)
        x0, y0 = (cw - fw) // 2, (ch - fh) // 2
        sh = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rectangle([x0 - 14, y0 - 6, x0 + fw + 14, y0 + fh + 22], fill=(20, 12, 8, 160))
        bg.alpha_composite(sh.filter(ImageFilter.GaussianBlur(30)))
        bg.paste(fg, (x0, y0))
        bg.convert("RGB").save(out_path, quality=90)
    else:
        im.save(out_path, quality=92)
    return out_path


# ---------------- segments ----------------

def kb_expr(style, frames):
    n = max(frames - 1, 1)
    if style == 0: return (f"1+0.10*on/{n}", "(iw-iw/zoom)/2", "(ih-ih/zoom)*0.40")
    if style == 1: return (f"1.10-0.10*on/{n}", f"(iw-iw/zoom)*(0.55-0.08*on/{n})", "(ih-ih/zoom)*0.42")
    if style == 2: return (f"1+0.09*on/{n}", f"(iw-iw/zoom)*(0.45+0.08*on/{n})", "(ih-ih/zoom)*0.40")
    if style == 3: return (f"1.09-0.09*on/{n}", "(iw-iw/zoom)/2", "(ih-ih/zoom)*0.45")
    return (f"1.06-0.06*on/{n}", "(iw-iw/zoom)/2", "(ih-ih/zoom)/2")  # hero

def seg_card(png, dur, out):
    run(["ffmpeg", "-y", "-loop", "1", "-t", str(dur), "-i", png,
         "-vf", f"scale={W}:{H},fps={FPS},format=yuv420p",
         "-r", str(FPS), "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-an", out])

def seg_photo(jpg, dur, style, cap, workdir, idx, out):
    frames = round(dur * FPS)
    z, x, y = kb_expr(style, frames)
    base = (f"[0:v]scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,"
            f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s={W}x{H}:fps={FPS},{GRADE}")
    if cap:
        cpng = os.path.join(workdir, f"cap{idx:02d}.png")
        caption_png(cap, cpng)
        fc = (base + "[base];"
              f"[1:v]format=rgba,fade=t=in:st=0.9:d=0.8:alpha=1,"
              f"fade=t=out:st={dur-1.6:.2f}:d=1.1:alpha=1[cap];"
              f"[base][cap]overlay=0:0,format=yuv420p[v]")
        run(["ffmpeg", "-y", "-i", jpg, "-loop", "1", "-t", str(dur), "-i", cpng,
             "-filter_complex", fc, "-map", "[v]", "-r", str(FPS),
             "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-an", out])
    else:
        run(["ffmpeg", "-y", "-i", jpg, "-filter_complex", base + ",format=yuv420p[v]",
             "-map", "[v]", "-r", str(FPS), "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-an", out])


def seg_chapter_photo(jpg, dur, style, title, yrs, workdir, idx, out):
    frames = round(dur * FPS)
    z, x, y = kb_expr(style, frames)
    overlay = os.path.join(workdir, f"chapter{idx:02d}.png")
    chapter_overlay_png(title, yrs, overlay)
    base = (f"[0:v]scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,"
            f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s={W}x{H}:fps={FPS},{GRADE}[base];"
            f"[1:v]format=rgba,fade=t=in:st=0.35:d=0.8:alpha=1,"
            f"fade=t=out:st={max(dur-1.25,0):.2f}:d=0.9:alpha=1[chapter];"
            f"[base][chapter]overlay=0:0,format=yuv420p[v]")
    run(["ffmpeg", "-y", "-i", jpg, "-loop", "1", "-t", str(dur), "-i", overlay,
         "-filter_complex", base, "-map", "[v]", "-r", str(FPS),
         "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-an", out])


def seg_clip(src, dur, out):
    run(["ffmpeg", "-y", "-t", str(dur), "-i", src,
         "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},{GRADE},format=yuv420p",
         "-r", str(FPS), "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-an", out])


# ---------------- assembly ----------------

def xfade_group(files, durs, out, tail_filter=None, audio=None, total_override=None,
                crf="16", preset="fast"):
    inputs = []
    for f in files: inputs += ["-i", f]
    if audio: inputs += ["-i", audio]
    fc, off, prev = [], 0.0, "[0:v]"
    for k in range(1, len(files)):
        off += durs[k - 1] - XF
        fc.append(f"{prev}[{k}:v]xfade=transition=fade:duration={XF}:offset={off:.3f}[v{k}]")
        prev = f"[v{k}]"
    total = total_override or (sum(durs) - XF * (len(files) - 1))
    vmap = prev
    if tail_filter:
        if fc:
            fc[-1] = fc[-1][:-len(prev)] + "[vx]"
            src = "[vx]"
        else:
            src = "[0:v]"
        fc.append(f"{src}{tail_filter}[vout]")
        vmap = "[vout]"
    cmd = ["ffmpeg", "-y"] + inputs + ["-filter_complex"]
    graph = ";".join(fc) if fc else f"[0:v]null[vout]"
    if audio:
        graph += (f";[{len(files)}:a]atrim=0:{total:.3f},afade=t=in:st=0:d=2.5,"
                  f"afade=t=out:st={max(total-6,0):.2f}:d=6,volume=0.95[aout]")
        cmd += [graph, "-map", vmap, "-map", "[aout]", "-c:a", "aac", "-b:a", "192k"]
    else:
        cmd += [graph, "-map", vmap]
    cmd += ["-c:v", "libx264", "-crf", crf, "-preset", preset, "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", "-t", f"{total:.3f}", out]
    run(cmd)
    return total


def even_select(items, n):
    if len(items) <= n: return list(items)
    step = len(items) / n
    return [items[min(int(i * step), len(items) - 1)] for i in range(n)]


def build_plan(spec, workdir):
    """Returns [(kind, src, dur, cap, style)] — the film, decided."""
    variant = spec["variant"]
    plan = [("title", None, TITLE_SEC, None, None)]
    styles = [0, 1, 2, 3]
    si = 0

    def photo_item(p, dur=PHOTO_SEC):
        nonlocal si
        it = ("photo", p, dur, (p.get("cap") or "").strip() or None, styles[si % 4])
        si += 1
        return it

    if variant == "teaser":
        pool = []
        for c in spec.get("chapters") or []: pool += c["photos"]
        pool += spec.get("photos") or []
        for p in even_select(pool, TEASER_PHOTOS):
            plan.append(photo_item(p))
        plan.append(("closing", None, CLOSE_SEC, None, None))
        return plan

    chapters = spec.get("chapters") or []
    loose = list(spec.get("photos") or [])
    total_photos = sum(len(c["photos"]) for c in chapters) + len(loose)
    use_chapters = total_photos >= CHAPTER_MIN_PHOTOS and chapters

    # cap the whole film at FULL_MAX_PHOTOS, evenly, chapter shares preserved
    if total_photos > FULL_MAX_PHOTOS:
        keep = FULL_MAX_PHOTOS / total_photos
        for c in chapters:
            c["photos"] = even_select(c["photos"], max(1, round(len(c["photos"]) * keep)))
        loose = even_select(loose, max(0, FULL_MAX_PHOTOS - sum(len(c["photos"]) for c in chapters)))

    photo_segments = []
    if use_chapters:
        for c in chapters:
            if not c["photos"]:
                continue
            first_photo, *rest = c["photos"]
            photo_segments.append((
                "chapter_photo", first_photo, PHOTO_SEC + 1.0,
                {"title": c["title"], "yrs": c.get("yrs") or ""}, styles[si % 4]
            ))
            si += 1
            for p in rest:
                photo_segments.append(photo_item(p))
        if loose:
            first_loose, *rest_loose = loose
            photo_segments.append((
                "chapter_photo", first_loose, PHOTO_SEC + 1.0,
                {"title": f"More of {spec['pos']} days", "yrs": ""}, styles[si % 4]
            ))
            si += 1
            for p in rest_loose:
                photo_segments.append(photo_item(p))
    else:
        pool = []
        for c in chapters: pool += c["photos"]
        pool += loose
        for p in pool:
            photo_segments.append(photo_item(p))

    # weave clips at ~40% · 75% · 90% of the passage, never adjacent to a card
    clips = (spec.get("clips") or [])[:MAX_CLIPS]
    if clips:
        idxs = sorted({max(1, math.floor(len(photo_segments) * f)) for f in (0.4, 0.75, 0.9)})
        for n, (clip, at) in enumerate(zip(clips, idxs)):
            photo_segments.insert(min(at + n, len(photo_segments)), ("clip", clip, CLIP_SEC, None, None))

    plan += photo_segments
    if spec.get("portrait"):
        plan.append(("hero", spec["portrait"], TITLE_SEC, None, 4))
    plan.append(("closing", None, CLOSE_SEC, None, None))
    return plan


def validate_output(film, poster, expected_duration):
    """Refuse to publish a truncated or browser-incompatible render."""
    if not os.path.exists(film) or os.path.getsize(film) < 100_000:
        raise RuntimeError("render-output-too-small")
    if not os.path.exists(poster) or os.path.getsize(poster) < 2_000:
        raise RuntimeError("poster-output-too-small")
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=codec_name,codec_type,width,height,pix_fmt", "-of", "json", film],
        capture_output=True, text=True, timeout=60,
    )
    if probe.returncode != 0:
        raise RuntimeError(f"ffprobe-failed: {probe.stderr[-300:]}")
    info = json.loads(probe.stdout or "{}")
    streams = info.get("streams") or []
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio = next((s for s in streams if s.get("codec_type") == "audio"), None)
    actual = float((info.get("format") or {}).get("duration") or 0)
    if not video or video.get("codec_name") != "h264" or video.get("pix_fmt") != "yuv420p":
        raise RuntimeError("render-video-not-browser-safe")
    if int(video.get("width") or 0) != W or int(video.get("height") or 0) != H:
        raise RuntimeError("render-wrong-dimensions")
    if not audio or audio.get("codec_name") != "aac":
        raise RuntimeError("render-audio-missing")
    if actual <= 0 or abs(actual - expected_duration) > 3.0:
        raise RuntimeError("render-duration-mismatch")
    return round(actual, 2)


def render(spec, out_dir):
    """Weave the film. Returns (film_path, poster_path, duration_seconds)."""
    workdir = tempfile.mkdtemp(prefix="film-", dir=out_dir)
    segs_dir = os.path.join(workdir, "segs"); os.makedirs(segs_dir)
    plan = build_plan(spec, workdir)

    n_photos = sum(1 for k, *_ in plan if k in ("photo", "chapter_photo", "hero"))
    if n_photos < FULL_MIN_PHOTOS:
        raise ValueError("not-enough-photos")

    # download media once
    cache = {}
    def local_for(url, kind, i):
        if url in cache: return cache[url]
        ext = ".mp4" if kind == "clip" else ".img"
        raw = os.path.join(workdir, f"dl{i:02d}{ext}")
        fetch(url, raw, MAX_CLIP_BYTES if kind == "clip" else MAX_PHOTO_BYTES)
        if kind != "clip":
            prepped = os.path.join(workdir, f"ph{i:02d}.jpg")
            prep_photo(raw, prepped)
            cache[url] = prepped
        else:
            cache[url] = raw
        return cache[url]

    files, durs = [], []
    poster_at = None
    t_cursor = 0.0
    for i, (kind, src, dur, cap, style) in enumerate(plan):
        out = os.path.join(segs_dir, f"{i:03d}.mp4")
        if kind == "title":
            p = os.path.join(workdir, "title.png"); card_title(spec, p); seg_card(p, dur, out)
        elif kind == "chapter":
            p = os.path.join(workdir, f"ch{i:03d}.png"); card_chapter(src, cap or "", p); seg_card(p, dur, out)
        elif kind == "closing":
            p = os.path.join(workdir, "closing.png"); card_closing(spec, p); seg_card(p, dur, out)
        elif kind == "photo":
            local = local_for(src["url"], "photo", i)
            seg_photo(local, dur, style, cap, workdir, i, out)
            if poster_at is None:
                poster_at = t_cursor + dur / 2
        elif kind == "chapter_photo":
            local = local_for(src["url"], "photo", i)
            seg_chapter_photo(local, dur, style, cap["title"], cap.get("yrs") or "", workdir, i, out)
            if poster_at is None:
                poster_at = t_cursor + dur / 2
        elif kind == "hero":
            local = local_for(src, "photo", i)
            seg_photo(local, dur, 4, None, workdir, i, out)
        elif kind == "clip":
            local = local_for(src, "clip", i)
            seg_clip(local, dur, out)
        files.append(out); durs.append(dur)
        t_cursor += dur - XF

    # hierarchical assembly, groups of 5
    G = 5
    gfiles, gdurs = [], []
    for gi in range(0, len(files), G):
        gf = files[gi:gi + G]; gd = durs[gi:gi + G]
        if len(gf) == 1:
            gfiles.append(gf[0]); gdurs.append(gd[0]); continue
        gout = os.path.join(segs_dir, f"group{gi//G}.mp4")
        gdurs.append(xfade_group(gf, gd, gout)); gfiles.append(gout)

    total = sum(gdurs) - XF * (len(gfiles) - 1)
    tail = (f"noise=alls=4:allf=t+u,vignette=angle=0.42,"
            f"fade=t=in:st=0:d=0.6,fade=t=out:st={total-1.4:.2f}:d=1.4")
    film = os.path.join(out_dir, "film.mp4")
    music = os.path.join(ASSETS, f"{spec.get('music','gymnopedie-1')}.flac")
    if not os.path.exists(music):
        music = os.path.join(ASSETS, "gymnopedie-1.flac")
    xfade_group(gfiles, gdurs, film, tail_filter=tail, audio=music,
                total_override=total, crf="22", preset="fast")

    # Storage ceiling (Supabase free plan holds files to 50 MB until R2 wakes):
    # if the weave runs heavy, one bitrate-targeted pass fits it, deterministically.
    max_bytes = int(os.environ.get("MAX_FILM_BYTES", str(48 * 1024 * 1024)))
    if os.path.getsize(film) > max_bytes:
        vbits = max(int((max_bytes * 8 * 0.94) / total) - 192_000, 900_000)
        fitted = os.path.join(out_dir, "film_fit.mp4")
        run(["ffmpeg", "-y", "-i", film, "-c:v", "libx264",
             "-b:v", str(vbits), "-maxrate", str(int(vbits * 1.25)),
             "-bufsize", str(vbits * 2), "-preset", "medium",
             "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", fitted])
        os.replace(fitted, film)

    if os.path.getsize(film) > max_bytes:
        raise RuntimeError("render-output-over-storage-limit")

    poster = os.path.join(out_dir, "poster.jpg")
    run(["ffmpeg", "-y", "-ss", f"{(poster_at or 3.0):.2f}", "-i", film, "-frames:v", "1", "-q:v", "3", poster])
    actual_duration = validate_output(film, poster, total)
    shutil.rmtree(workdir, ignore_errors=True)
    return film, poster, actual_duration


if __name__ == "__main__":
    import json
    spec = json.load(open(sys.argv[1]))
    print(render(spec, sys.argv[2] if len(sys.argv) > 2 else "."))
