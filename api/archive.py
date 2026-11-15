"""Read-only IRSA gateway with bundled, real-data preview fallbacks."""
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET
import base64
import json
import time
import traceback


BASE = "https://irsa.ipac.caltech.edu"
CUTOUT_SERVICE = BASE + "/ibe/cutout"
CENTER = (269.448, 4.768)
EXPOSURES = [
    ("spherex_dr1", "2025W33_2C_0321_1"),
    ("spherex_qr3", "2026W34_2A_0081_1"),
]
FALLBACK_IMAGES = [
    "/assets/barnards-star-2025.png",
    "/assets/barnards-star-2026.png",
]


def read(url, attempts=3):
    """Read an upstream resource, retrying short-lived IRSA failures."""
    error = None
    for attempt in range(attempts):
        try:
            request = Request(url, headers={"User-Agent": "MotionAtlas/1.1"})
            with urlopen(request, timeout=20) as response:
                return response.read()
        except (HTTPError, URLError, TimeoutError) as exc:
            error = exc
            if attempt + 1 < attempts:
                time.sleep(0.25 * (2**attempt))
    raise error


def table(url):
    root = ET.fromstring(read(url))
    for tab in root.findall(".//{*}TABLE"):
        columns = [field.get("name", "").lower() for field in tab.findall("{*}FIELD")]
        for row in tab.findall(".//{*}TR"):
            values = [(cell.text or "").strip() for cell in row.findall("{*}TD")]
            yield dict(zip(columns, values))


def cutout_url(which):
    """Resolve IRSA's DataLink #cutout row instead of downloading the full FITS."""
    collection, observation = EXPOSURES[which]
    datalink = BASE + "/datalink/links/spherex?" + urlencode(
        {"ID": f"ivo://irsa.ipac/{collection}?{observation}/D3"}
    )
    record = next(
        row
        for row in table(datalink)
        if row.get("semantics", "").endswith("#cutout") and row.get("path")
    )
    return CUTOUT_SERVICE + "?" + urlencode(
        {
            "ra": CENTER[0],
            "dec": CENTER[1],
            "size": 0.12,
            "path": record["path"],
        }
    )


def cutout(which):
    from astropy.io import fits
    from astropy.wcs import WCS
    import numpy as np

    with fits.open(BytesIO(read(cutout_url(which))), memmap=False) as hdus:
        hdu = hdus["IMAGE"] if "IMAGE" in hdus else next(
            item for item in hdus if item.data is not None and item.data.ndim == 2
        )
        source_wcs = WCS(hdu.header, fobj=hdus).celestial
        y, x = np.indices((192, 192), dtype=float)
        output_wcs = WCS(naxis=2)
        output_wcs.wcs.crpix = [96.5, 96.5]
        output_wcs.wcs.crval = list(CENTER)
        output_wcs.wcs.cdelt = [-1.6 / 3600, 1.6 / 3600]
        output_wcs.wcs.ctype = ["RA---TAN", "DEC--TAN"]
        ra, dec = output_wcs.pixel_to_world_values(x, 191 - y)
        source_x, source_y = source_wcs.world_to_pixel_values(ra, dec)
        ix, iy = np.rint(source_x).astype(int), np.rint(source_y).astype(int)
        good = (
            (ix >= 0)
            & (iy >= 0)
            & (ix < hdu.data.shape[1])
            & (iy < hdu.data.shape[0])
        )
        frame = np.full(x.shape, np.nan)
        frame[good] = hdu.data[iy[good], ix[good]]
        if np.isfinite(frame).mean() < 0.5:
            raise ValueError("Insufficient sky coverage")
        return frame


def pair():
    import numpy as np
    from PIL import Image

    with ThreadPoolExecutor(2) as pool:
        frames = list(pool.map(cutout, range(2)))
    low, high = np.nanpercentile(np.stack(frames), [3, 99.7])
    images = []
    for frame in frames:
        contrast = np.clip((frame - low) / max(high - low, 1e-9), 0, 1)
        pixels = (
            255 * np.arcsinh(8 * np.nan_to_num(contrast)) / np.arcsinh(8)
        ).astype("uint8")
        stream = BytesIO()
        Image.fromarray(pixels).save(stream, format="PNG", optimize=True)
        images.append("data:image/png;base64," + base64.b64encode(stream.getvalue()).decode())
    return {"images": images, "source": "live-irsa-cutout"}


PUBLIC = Path(__file__).resolve().parent.parent / "public"
PAGES = {
    "/auto-track.js": ("auto-track.js", "application/javascript; charset=utf-8"),
    "/sequence.js": ("sequence.js", "application/javascript; charset=utf-8"),
    "/sequence.css": ("sequence.css", "text/css; charset=utf-8"),
    "/variable.js": ("variable.js", "application/javascript; charset=utf-8"),
    "/assets/r-draconis-1955-04-23.png": ("assets/r-draconis-1955-04-23.png", "image/png"),
    "/assets/r-draconis-1993-08-13.png": ("assets/r-draconis-1993-08-13.png", "image/png"),
    "/assets/r-draconis-metadata.json": ("assets/r-draconis-metadata.json", "application/json"),
    "/targets.js": ("targets.js", "application/javascript; charset=utf-8"),
    "/targets.css": ("targets.css", "text/css; charset=utf-8"),
    "/assets/earth-apollo17.jpg": ("assets/earth-apollo17.jpg", "image/jpeg"),
    "/assets/mars-viking.jpg": ("assets/mars-viking.jpg", "image/jpeg"),
    "/atlas.css": ("atlas.css", "text/css; charset=utf-8"),
    "/effects.css": ("effects.css", "text/css; charset=utf-8"),
    "/effects.js": ("effects.js", "application/javascript; charset=utf-8"),
    "/comet-data.json": ("comet-data.json", "application/json"),
    "/atlas.js": ("atlas.js", "application/javascript; charset=utf-8"),
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/practice.html": ("practice.html", "text/html; charset=utf-8"),
    "/guide.css": ("guide.css", "text/css; charset=utf-8"),
    "/guide.js": ("guide.js", "application/javascript; charset=utf-8"),
    "/assets/barnards-star-2025.png": ("assets/barnards-star-2025.png", "image/png"),
    "/assets/barnards-star-2026.png": ("assets/barnards-star-2026.png", "image/png"),
}


# Only enumerate bundled sequence files; request paths never become filesystem paths.
for asset in (PUBLIC / "sequences").glob("*"):
    if asset.is_file() and asset.suffix in {".json", ".jpg"}:
        PAGES["/sequences/" + asset.name] = (
            "sequences/" + asset.name,
            "application/json" if asset.suffix == ".json" else "image/jpeg",
        )

class handler(BaseHTTPRequestHandler):
    def send_bytes(self, status, mime, content, cache_control=None):
        self.send_response(status)
        self.send_header("Content-Type", mime)
        if cache_control:
            self.send_header("Cache-Control", cache_control)
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path in PAGES:
            name, mime = PAGES[path]
            cache = "public, max-age=3600" if mime == "image/png" else "no-cache"
            self.send_bytes(200, mime, (PUBLIC / name).read_bytes(), cache)
            return
        if path.rstrip("/") != "/api/archive":
            self.send_error(404)
            return

        target = parse_qs(urlsplit(self.path).query).get("target", ["star"])[0]
        try:
            if target == "comet":
                rows = [
                    [float(row["t_min"]), float(row["comet_ra"]), float(row["comet_dec"])]
                    for row in table(
                        BASE + "/data/SPHEREx/docs/comet3iatlas/obscore_3I_Atlas.vot"
                    )
                ]
                if not rows:
                    raise ValueError("Empty archive table")
                result = {"rows": sorted(set(map(tuple, rows))), "source": "irsa-table"}
            else:
                try:
                    result = pair()
                except Exception:
                    traceback.print_exc()
                    result = {
                        "images": FALLBACK_IMAGES,
                        "source": "bundled-irsa-previews",
                        "notice": "Live archive unavailable; showing bundled previews.",
                    }
            status = 200
        except Exception:
            traceback.print_exc()
            result = {"error": "Archive retrieval failed. Retry or open the source records."}
            status = 503

        self.send_bytes(
            status,
            "application/json",
            json.dumps(result).encode(),
            "public, s-maxage=86400" if status == 200 else "no-store",
        )
