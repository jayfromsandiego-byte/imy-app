# film-worker — weaves Their film on the smallest box.
# Build:  docker build -t imy-film-worker .
# Run:    docker run -e SUPABASE_URL=... -e SUPABASE_SERVICE_ROLE_KEY=... imy-film-worker
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg curl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Brand assets, pinned to their canonical sources.
#  - Besley + Sometype Mono: Google Fonts (OFL)
#  - The wreath: the production site's own art
#  - The bed: Satie, Gymnopédie No. 1 — Michael Laucke recording,
#    Public Domain (Wikimedia Commons). Provenance in README.md.
COPY fetch_assets.sh ./
RUN sh fetch_assets.sh assets

COPY render_film.py imy_api.py storage.py email_notify.py health.py worker.py ./

RUN useradd --system --uid 10001 --home-dir /app worker \
 && chown -R worker:worker /app

ENV ASSETS_DIR=/app/assets \
    PORT=8080 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
EXPOSE 8080
USER worker
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','8080')+'/healthz',timeout=3)" || exit 1
ENTRYPOINT ["tini", "--"]
CMD ["python", "worker.py"]
