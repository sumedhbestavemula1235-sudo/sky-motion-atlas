from html.parser import HTMLParser
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parent.parent


class Parser(HTMLParser):
    pass


class StaticSiteTests(unittest.TestCase):
    def test_html_parses(self):
        for name in ("index.html", "practice.html"):
            parser = Parser()
            parser.feed((ROOT / "public" / name).read_text(encoding="utf-8"))
            parser.close()

    def test_scientific_status_is_visible(self):
        index = (ROOT / "public" / "index.html").read_text(encoding="utf-8")
        self.assertIn('src="atlas.js"', index)
        viewer = (ROOT / "public" / "atlas.js").read_text(encoding="utf-8")
        self.assertIn("barnards-star-2025.png", viewer)
        self.assertNotIn("requestAnimationFrame", viewer)
        self.assertIn("No proper motion", viewer)
        self.assertIn("Predicted sky positions", viewer)

    def test_comet_records_are_valid_sorted_predictions(self):
        import json
        import math
        data = json.loads((ROOT / "public" / "comet-data.json").read_text())
        self.assertTrue(data["source_url"].startswith("https://irsa.ipac.caltech.edu/"))
        rows = data["rows"]
        self.assertGreater(len(rows), 1)
        self.assertEqual(rows, sorted(rows))
        for time, ra, dec in rows:
            self.assertTrue(all(math.isfinite(v) for v in (time, ra, dec)))
            self.assertTrue(0 <= ra < 360)
            self.assertTrue(-90 <= dec <= 90)


if __name__ == "__main__":
    unittest.main()
