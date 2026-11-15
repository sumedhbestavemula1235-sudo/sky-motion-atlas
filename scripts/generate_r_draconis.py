"""Render actual DSS plate data, retaining observation dates and provenance.

Usage: python scripts/generate_r_draconis.py poss1.fits poss2.fits
The STScI download URLs are included in the output metadata.
"""
import json
import sys
from pathlib import Path
import numpy as np
from astropy.io import fits
from PIL import Image
import generate_fallbacks as renderer

renderer.CENTER = (248.1666666667, 66.7547222222)
renderer.SIZE = 256
renderer.PIXEL_SCALE = 1.05 / 3600
output = Path(__file__).resolve().parent.parent / 'public' / 'assets'
records = []
for path, survey, label in zip(sys.argv[1:], ['poss1_red', 'poss2ukstu_red'], ['POSS I red', 'POSS II red']):
    header = fits.getheader(path)
    frame = renderer.aligned_frame(Path(path))
    low, high = np.nanpercentile(frame, [10, 99.7])
    pixels = np.uint8(255 * np.arcsinh(8 * np.clip(np.nan_to_num((frame-low)/(high-low)), 0, 1)) / np.arcsinh(8))
    name = 'r-draconis-' + header['DATE-OBS'][:10] + '.png'
    Image.fromarray(pixels).save(output / name, optimize=True)
    records.append({'src': '/assets/'+name, 'date': header['DATE-OBS'][:10], 'raw_date_obs_header': header['DATE-OBS'], 'survey': label, 'plate': header['PLATEID'], 'source': 'https://archive.stsci.edu/cgi-bin/dss_search?v='+survey+'&r=16+32+40&d=%2B66+45+17&e=J2000&h=5&w=5&f=fits&c=none'})
metadata = {'target': 'R Draconis', 'center_icrs_degrees': list(renderer.CENTER), 'pixel_scale_arcsec': 1.05, 'field_arcmin': 4.48, 'processing': 'North up, east left; WCS resampling with nearest neighbors. Each plate independently stretched with 10–99.7 percentile asinh. Not calibrated photometry: brightness is not directly comparable across plates.', 'credit': 'Digitized Sky Survey, STScI/AURA; photographic data from the Palomar Observatory Sky Survey.', 'frames': records}
(output / 'r-draconis-metadata.json').write_text(json.dumps(metadata, indent=2)+'\n')
print(json.dumps(metadata, indent=2))
