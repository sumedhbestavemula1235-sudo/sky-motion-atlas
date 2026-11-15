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
        guide = (ROOT / "public" / "guide.js").read_text(encoding="utf-8")
        self.assertIn('src="atlas.js"', index)
        viewer = (ROOT / "public" / "atlas.js").read_text(encoding="utf-8")
        self.assertIn("barnards-star-2025.png", viewer)
        self.assertNotIn("requestAnimationFrame", viewer)
        self.assertIn("two archive visits", guide)
        self.assertIn("Load telescope images", guide)


if __name__ == "__main__":
    unittest.main()
