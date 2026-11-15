import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

from api import archive


class ArchiveTests(unittest.TestCase):
    def test_cutout_url_uses_datalink_cutout_path(self):
        rows = [
            {"semantics": "#this", "access_url": "https://example/full.fits"},
            {"semantics": "#cutout", "path": "spherex/dr1/example.fits"},
        ]
        with patch.object(archive, "table", return_value=iter(rows)):
            url = archive.cutout_url(0)
        parsed = urlsplit(url)
        query = parse_qs(parsed.query)
        self.assertEqual(parsed.path, "/ibe/cutout")
        self.assertEqual(query["path"], ["spherex/dr1/example.fits"])
        self.assertEqual(query["ra"], [str(archive.CENTER[0])])
        self.assertEqual(query["dec"], [str(archive.CENTER[1])])

    def test_every_fallback_asset_is_routable(self):
        for url in archive.FALLBACK_IMAGES:
            self.assertIn(url, archive.PAGES)
            relative_path, mime = archive.PAGES[url]
            self.assertEqual(mime, "image/png")
            self.assertTrue((archive.PUBLIC / relative_path).is_file())


if __name__ == "__main__":
    unittest.main()
