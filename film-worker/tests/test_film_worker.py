import os
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, ROOT)

import render_film
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
        with patch("render_film.socket.getaddrinfo", return_value=[(None, None, None, None, ("127.0.0.1", 0))]):
            with self.assertRaisesRegex(ValueError, "unsafe-media-host"):
                render_film.validate_media_url("https://local.example/photo.jpg")

    def test_public_host_is_allowed(self):
        with patch("render_film.socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 0))]):
            render_film.validate_media_url("https://media.example/photo.jpg")

    def test_download_limit_stops_large_media(self):
        class Response:
            headers = {"Content-Length": "1000"}
            def __enter__(self): return self
            def __exit__(self, *_args): return False
            def read(self, _n): return b""
        with patch.object(render_film, "validate_media_url"), patch("render_film.urllib.request.urlopen", return_value=Response()):
            with tempfile.TemporaryDirectory() as td:
                with self.assertRaisesRegex(ValueError, "media-too-large"):
                    render_film.fetch("https://media.example/big.jpg", os.path.join(td, "x"), 100)


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

    def test_direct_file_rejects_embeds(self):
        self.assertTrue(worker.direct_file("https://media.example/clip.mp4?token=x"))
        self.assertFalse(worker.direct_file("https://youtube.com/watch?v=abc123"))


if __name__ == "__main__":
    unittest.main()
