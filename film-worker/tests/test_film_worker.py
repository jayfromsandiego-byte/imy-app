import os
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, ROOT)

import render_film
import storage
import worker


class PlanTests(unittest.TestCase):
    def photo(self, n):
        return {"url": f"https://media.example/photo-{n}.jpg", "cap": f"Photo {n}"}

    def spec(self, count=3, variant="full"):
        return {
            "name": "Mara Ellis",
            "years": "1948 to 2024",
            "place": "San Diego",
            "slug": "mara",
            "pos": "her",
            "chapters": [],
            "photos": [self.photo(i) for i in range(count)],
            "clips": [],
            "portrait": self.photo(0)["url"],
            "variant": variant,
        }

    def test_teaser_uses_at_most_five_photos(self):
        plan = render_film.build_plan(self.spec(12, "teaser"), "/tmp")
        self.assertEqual(5, len([item for item in plan if item[0] == "photo"]))
        self.assertEqual("title", plan[0][0])
        self.assertEqual("closing", plan[-1][0])

    def test_full_short_form_works_at_three_photos(self):
        plan = render_film.build_plan(self.spec(3), "/tmp")
        self.assertGreaterEqual(len([item for item in plan if item[0] in ("photo", "hero")]), 3)
        self.assertNotIn("chapter_photo", [item[0] for item in plan])

    def test_chapters_use_showcase_overlay_on_first_photo(self):
        spec = self.spec(0)
        spec["chapters"] = [
            {"title": "The girl by the sea", "yrs": "1948 to 1966", "photos": [self.photo(i) for i in range(8)]}
        ]
        plan = render_film.build_plan(spec, "/tmp")
        chapter = next(item for item in plan if item[0] == "chapter_photo")
        self.assertEqual("The girl by the sea", chapter[3]["title"])
        self.assertEqual("1948 to 1966", chapter[3]["yrs"])
        self.assertEqual(1, len([item for item in plan if item[0] == "chapter_photo"]))

    def test_full_film_caps_photo_passages(self):
        plan = render_film.build_plan(self.spec(40), "/tmp")
        passages = [item for item in plan if item[0] in ("photo", "chapter_photo")]
        self.assertLessEqual(len(passages), render_film.FULL_MAX_PHOTOS)


class MediaSafetyTests(unittest.TestCase):
    def test_http_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "unsafe-media-url"):
            render_film.validate_media_url("http://example.com/photo.jpg")

    def test_loopback_is_rejected(self):
        with patch.object(render_film, "TRUSTED_MEDIA_HOSTS", {"local.example"}), patch("render_film.socket.getaddrinfo", return_value=[(None, None, None, None, ("127.0.0.1", 0))]):
            with self.assertRaisesRegex(ValueError, "unsafe-media-host"):
                render_film.validate_media_url("https://local.example/photo.jpg")

    def test_public_host_is_allowed(self):
        with patch.object(render_film, "TRUSTED_MEDIA_HOSTS", {"media.example"}), patch("render_film.socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]):
            render_film.validate_media_url("https://media.example/photo.jpg")

    def test_untrusted_public_host_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "untrusted-media-host"):
            render_film.validate_media_url("https://attacker.example/photo.jpg")

    def test_download_limit_stops_large_media(self):
        class Response:
            headers = {"Content-Length": "1000"}
            def __enter__(self): return self
            def __exit__(self, *_args): return False
            def geturl(self): return "https://media.example/big.jpg"
            def read(self, _n): return b""
        class Opener:
            def open(self, *_args, **_kwargs): return Response()
        with patch.object(render_film, "validate_media_url"), patch("render_film.urllib.request.build_opener", return_value=Opener()):
            with tempfile.TemporaryDirectory() as td:
                with self.assertRaisesRegex(ValueError, "media-too-large"):
                    render_film.fetch("https://media.example/big.jpg", os.path.join(td, "x"), 100)

    def test_supabase_upload_sends_apikey_and_bearer(self):
        class Response:
            ok = True
            status_code = 200
            text = "{}"
        with tempfile.TemporaryDirectory() as td:
            path = os.path.join(td, "film.mp4")
            with open(path, "wb") as f:
                f.write(b"film")
            with patch.object(storage, "SB_URL", "https://project.supabase.co"), \
                 patch.object(storage, "SB_KEY", "service-role-jwt"), \
                 patch("storage.requests.post", return_value=Response()) as post:
                url = storage._upload_supabase(path, "films/job.mp4", "video/mp4")
        headers = post.call_args.kwargs["headers"]
        self.assertEqual("service-role-jwt", headers["apikey"])
        self.assertEqual("Bearer service-role-jwt", headers["Authorization"])
        self.assertEqual("https://project.supabase.co/storage/v1/object/public/tribute-films/films/job.mp4", url)

    def test_browser_normalization_pins_public_codecs(self):
        with tempfile.TemporaryDirectory() as td:
            film = os.path.join(td, "film.mp4")
            with open(film, "wb") as f:
                f.write(b"old")
            seen = {}
            def fake_run(cmd, timeout=1800):
                seen["cmd"] = cmd
                with open(cmd[-1], "wb") as f:
                    f.write(b"browser-safe")
            with patch.object(render_film, "run", side_effect=fake_run):
                render_film.normalize_browser_media(film)
            with open(film, "rb") as f:
                self.assertEqual(b"browser-safe", f.read())
        cmd = seen["cmd"]
        self.assertIn("libx264", cmd)
        self.assertIn("yuv420p", cmd)
        self.assertIn("avc1", cmd)
        self.assertIn("aac", cmd)


class WorkerSpecTests(unittest.TestCase):
    def tribute(self, count=3, tier="plus", pronouns="she"):
        return {
            "id": "tribute-1",
            "slug": "mara",
            "loved_one_name": "Mara Ellis",
            "born_on": "1948-01-01",
            "died_on": "2024-01-01",
            "place": "San Diego",
            "pronouns": pronouns,
            "tier": tier,
            "owner_email": "keeper@example.com",
            "placements": {},
            "tribute_photos": [
                {"id": f"p{i}", "url": f"https://media.example/{i}.jpg", "caption": f"Photo {i}", "sort": i, "deleted_at": None}
                for i in range(count)
            ],
            "tribute_videos": [],
            "tribute_chapters": [],
            "tribute_timeline": [],
        }

    def test_paid_auto_resolves_to_full_and_pronouns(self):
        spec = worker.build_spec(self.tribute(), {"variant": "auto"})
        self.assertEqual("full", spec["variant"])
        self.assertEqual("her", spec["pos"])

    def test_free_auto_resolves_to_teaser(self):
        spec = worker.build_spec(self.tribute(tier="free"), {"variant": "auto"})
        self.assertEqual("teaser", spec["variant"])

    def test_unknown_pronouns_never_guess(self):
        spec = worker.build_spec(self.tribute(pronouns=""), {"variant": "full"})
        self.assertEqual("their", spec["pos"])

    def test_paid_full_film_uses_atomic_placement_rpc(self):
        with patch.object(worker.db, "rpc", return_value="video-1") as rpc:
            placed = worker.auto_place(self.tribute(), "job-1", {"variant": "full"}, "https://media.example/film.mp4")
        self.assertEqual("video-1", placed)
        rpc.assert_called_once_with("place_paid_film", {"p_job_id": "job-1"})

    def test_free_film_never_auto_places(self):
        with patch.object(worker.db, "rpc") as rpc:
            placed = worker.auto_place(self.tribute(tier="free"), "job-1", {"variant": "teaser"}, "https://media.example/film.mp4")
        self.assertIsNone(placed)
        rpc.assert_not_called()

    def test_direct_file_rejects_embeds(self):
        self.assertTrue(worker.direct_file("https://media.example/clip.mp4?token=x"))
        self.assertFalse(worker.direct_file("https://youtube.com/watch?v=abc123"))


if __name__ == "__main__":
    unittest.main()
