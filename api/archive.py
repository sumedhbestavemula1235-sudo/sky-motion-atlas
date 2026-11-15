"""Read-only IRSA gateway. Only two fixed exposures and one mission table."""
from http.server import BaseHTTPRequestHandler
from urllib.request import urlopen, Request
from urllib.parse import urlsplit, parse_qs, urlencode
from xml.etree import ElementTree as ET
from io import BytesIO
import base64, json

BASE = "https://irsa.ipac.caltech.edu"
EXPOSURES = [
    ("spherex_dr1", "2025W33_2C_0321_1"),
    ("spherex_qr3", "2026W34_2A_0081_1"),
]

def read(url):
    with urlopen(Request(url, headers={"User-Agent": "MotionAtlas/1.0"}), timeout=20) as response:
        return response.read()

def table(url):
    root = ET.fromstring(read(url))
    for tab in root.findall(".//{*}TABLE"):
        cols = [f.get("name", "").lower() for f in tab.findall("{*}FIELD")]
        for row in tab.findall(".//{*}TR"):
            yield dict(zip(cols, [(c.text or "").strip() for c in row.findall("{*}TD")]))

def cutout(which):
    from astropy.io import fits
    from astropy.wcs import WCS
    import numpy as np
    collection, obs = EXPOSURES[which]
    link = BASE + "/datalink/links/spherex?" + urlencode({"ID":f"ivo://irsa.ipac/{collection}?{obs}/D3"})
    url = next(r["access_url"] for r in table(link) if r.get("semantics","").endswith("#this"))
    url += ("&" if "?" in url else "?") + urlencode({"center":"269.448,4.768", "size":"0.12"})
    with fits.open(BytesIO(read(url)), memmap=False) as hdus:
        hdu = hdus["IMAGE"] if "IMAGE" in hdus else next(h for h in hdus if h.data is not None and h.data.ndim == 2)
        wcs = WCS(hdu.header, fobj=hdus).celestial
        y,x = np.indices((192,192),dtype=float)
        output = WCS(naxis=2)
        output.wcs.crpix = [96.5,96.5]
        output.wcs.crval = [269.448,4.768]
        output.wcs.cdelt = [-1.6/3600,1.6/3600]
        output.wcs.ctype = ["RA---TAN","DEC--TAN"]
        ra,dec=output.pixel_to_world_values(x,191-y)
        sx,sy=wcs.world_to_pixel_values(ra,dec)
        ix,iy=np.rint(sx).astype(int),np.rint(sy).astype(int)
        good=(ix>=0)&(iy>=0)&(ix<hdu.data.shape[1])&(iy<hdu.data.shape[0])
        frame=np.full(x.shape,np.nan)
        frame[good]=hdu.data[iy[good],ix[good]]
        if np.isfinite(frame).mean()<0.5:
            raise ValueError("Insufficient sky coverage")
        return frame

def pair():
    import numpy as np
    from PIL import Image
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(2) as pool:
        frames=list(pool.map(cutout,range(2)))
    low,high=np.nanpercentile(frames,[3,99.7])
    images=[]
    for frame in frames:
        contrast=np.clip((frame-low)/max(high-low,1e-9),0,1)
        pixels=(255*np.arcsinh(8*np.nan_to_num(contrast))/np.arcsinh(8)).astype("uint8")
        stream=BytesIO()
        Image.fromarray(pixels).save(stream,format="PNG")
        images.append("data:image/png;base64,"+base64.b64encode(stream.getvalue()).decode())
    return {"images":images}

from pathlib import Path

PUBLIC = Path(__file__).resolve().parent.parent / "public"
PAGES = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/practice.html": ("practice.html", "text/html; charset=utf-8"),
    "/guide.css": ("guide.css", "text/css; charset=utf-8"),
    "/guide.js": ("guide.js", "application/javascript; charset=utf-8"),
}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if path in PAGES:
            name, mime = PAGES[path]
            content = (PUBLIC / name).read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.end_headers()
            self.wfile.write(content)
            return
        if path.rstrip("/") != "/api/archive":
            self.send_error(404)
            return
        try:
            if parse_qs(urlsplit(self.path).query).get("target")==["comet"]:
                rows=[]
                for r in table(BASE+"/data/SPHEREx/docs/comet3iatlas/obscore_3I_Atlas.vot"):
                    rows.append([float(r["t_min"]),float(r["comet_ra"]),float(r["comet_dec"])])
                if not rows: raise ValueError("Empty archive table")
                result={"rows":sorted(set(map(tuple,rows)))}
            else:
                result=pair()
            status=200
        except Exception:
            result={"error":"Archive retrieval failed. Retry or open the source records."}
            status=503
        self.send_response(status)
        self.send_header("Content-Type","application/json")
        self.send_header("Cache-Control","public, s-maxage=86400" if status==200 else "no-store")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())
