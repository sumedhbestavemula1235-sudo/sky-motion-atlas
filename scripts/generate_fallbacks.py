"""Generate small, aligned PNG previews from two downloaded SPHEREx FITS cutouts.

Usage:
    python scripts/generate_fallbacks.py first.fits second.fits output_directory

The two images use the same output WCS and intensity stretch so they are suitable
as an availability fallback. They are still exploratory previews, not a proper
motion measurement.
"""
from io import BytesIO
from pathlib import Path
import sys

import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from PIL import Image


CENTER = (269.448, 4.768)
SIZE = 192
PIXEL_SCALE = 1.6 / 3600


def aligned_frame(path: Path) -> np.ndarray:
    with fits.open(path, memmap=False) as hdus:
        hdu = hdus["IMAGE"] if "IMAGE" in hdus else next(
            item for item in hdus if item.data is not None and item.data.ndim == 2
        )
        source_wcs = WCS(hdu.header, fobj=hdus).celestial
        y, x = np.indices((SIZE, SIZE), dtype=float)
        output_wcs = WCS(naxis=2)
        output_wcs.wcs.crpix = [(SIZE + 1) / 2, (SIZE + 1) / 2]
        output_wcs.wcs.crval = list(CENTER)
        output_wcs.wcs.cdelt = [-PIXEL_SCALE, PIXEL_SCALE]
        output_wcs.wcs.ctype = ["RA---TAN", "DEC--TAN"]
        ra, dec = output_wcs.pixel_to_world_values(x, SIZE - 1 - y)
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
            raise ValueError(f"Insufficient sky coverage in {path}")
        return frame


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("Expected: first.fits second.fits output_directory")
    output = Path(sys.argv[3])
    output.mkdir(parents=True, exist_ok=True)
    frames = [aligned_frame(Path(name)) for name in sys.argv[1:3]]
    low, high = np.nanpercentile(np.stack(frames), [3, 99.7])
    names = ["barnards-star-2025.png", "barnards-star-2026.png"]
    for frame, name in zip(frames, names):
        contrast = np.clip((frame - low) / max(high - low, 1e-9), 0, 1)
        pixels = (
            255 * np.arcsinh(8 * np.nan_to_num(contrast)) / np.arcsinh(8)
        ).astype("uint8")
        Image.fromarray(pixels).save(output / name, optimize=True)
        print(output / name)


if __name__ == "__main__":
    main()
