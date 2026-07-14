# film-worker — weaves Their film on the smallest box.
# Build:  docker build -t imy-film-worker .
# Run:    docker run -e SUPABASE_URL=... -e SUPABASE_SERVICE_ROLE_KEY=... imy-film-worker
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Brand assets, pinned to their canonical sources.
#  - Besley + Sometype Mono: Google Fonts (OFL)
#  - The wreath: the production site's own art
#  - The bed: Satie, Gymnopédie No. 1 — Michael Laucke recording,
#    Public Domain (Wikimedia Commons). Provenance in README.md.
RUN mkdir -p assets \
 && curl -fsSL -o assets/Besley.ttf        "https://raw.githubusercontent.com/google/fonts/main/ofl/besley/Besley%5Bwght%5D.ttf" \
 && curl -fsSL -o assets/Besley-Italic.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/besley/Besley-Italic%5Bwght%5D.ttf" \
 && curl -fsSL -o assets/SometypeMono.ttf  "https://raw.githubusercontent.com/google/fonts/main/ofl/sometypemono/SometypeMono%5Bwght%5D.ttf" \
 && curl -fsSL -o assets/wreath.png        "https://imissyoumemorial.com/art/wreath2-64e82a.png" \
 && curl -fsSL -o assets/gymnopedie-1.flac "https://upload.wikimedia.org/wikipedia/commons/a/a6/Satie_Gymnopedie_No_1_performed_by_Michael_Laucke.flac"

COPY render_film.py imy_api.py storage.py email_notify.py worker.py ./

ENV ASSETS_DIR=/app/assets
CMD ["python", "worker.py"]
