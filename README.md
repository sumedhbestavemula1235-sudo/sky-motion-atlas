# What Moved? — Sky Motion Atlas

**Live demo:** https://sky-atlas-web.vercel.app/#home  
**Start the investigation:** https://sky-atlas-web.vercel.app/#1?mission=1

An independent NASA Space Apps prototype for **Planet X and SPHEREx**.
It turns public infrared observations into an approachable investigation:
observe, compare, consider alternatives, and preserve the evidence.

## The experience

- A redesigned homepage with an actual-image blink preview and three investigations.
- A guided 90-second mission with progress and a notebook-based conclusion.
- Two real SPHEREx D3 frames: discrete blink, date stepping, side-by-side and
  draggable-divider views.
- Shared zoom and display contrast, a grid, user-selected feature pins, and
  keyboard shortcuts. No interpolated observation frames.
- An observation passport with dates, MJD, pixel scale and original IRSA links.
- A browser-local notebook with alternative explanations and JSON export.
- A downloadable PNG evidence card containing both original-stretch images,
  dates, observation IDs, credits and limitations.
- Share links preserving frame, mode, zoom, contrast, divider and grid settings.
- An explorer of 167 published predicted 3I/ATLAS positions, with date stepping,
  coordinate readouts and CSV export.
- An interactive six-band infrared guide and a scientific-reasoning quiz.
- A sources-and-methods page, mobile layouts and presentation mode.

The [judging walkthrough](docs/JUDGING_DEMO.md) gives a concise demo script.

## Data and scientific boundaries

| Visit | Collection | Observation ID | Detector |
| --- | --- | --- | --- |
| 2025-08-15 | spherex_dr1 | 2025W33_2C_0321_1 | D3 |
| 2026-08-20 | spherex_qr3 | 2026W34_2A_0081_1 | D3 |

Both preview frames were generated from actual IRSA FITS cutouts, sampled using
the archive WCS onto a common north-up 192 × 192 output grid, centred on
RA 269.448°, Dec +4.768°, at 1.6 arcseconds per output pixel. Nearest-neighbor
sampling and one shared 3rd–99.7th percentile asinh stretch are used.

The bright core shows saturation. Exact target wavelengths have not been matched;
the data releases differ; alignment has not been independently fitted to
background stars. Output pixels oversample the input and zoom adds no telescope
resolution. **No precise proper motion, calibrated brightness change, or new
object detection is claimed.** These are exploratory previews.

The comet plot uses predicted positions at observation times from IRSA's
published mission table. It is not an image sequence or a detection by this app.
The bundled table is deduplicated and sorted, with its source URL retained.
The band selector is educational; the image pair remains D3.

## Reliability and privacy

The image pair and comet-position table are bundled with the site, so core demos
do not depend on a live IRSA request. The Python archive gateway remains available
for fresh cutouts and position data, with retry handling and real-image fallbacks.

Notebook text stays in browser local storage until the visitor exports it.
It is not submitted to the server. Shared links contain display settings only.
Google Fonts requests are used for typography, with system-font fallbacks.

## Architecture

- `public/index.html`, `atlas.js`, `atlas.css`: buildless browser interface.
- `public/assets/`: real SPHEREx PNG previews.
- `public/comet-data.json`: attributed snapshot of published predicted positions.
- `api/archive.py`: Vercel Python handler, explicit static routes and IRSA gateway.
- `data/`: original observation metadata.
- `scripts/generate_fallbacks.py`: reproducible preview generator.
- `tests/`: Python checks and desktop/mobile browser regression checks.
- `docs/JUDGING_DEMO.md`: presentation script and scientific boundaries.

The older `guide.js` and `guide.css` remain in the repository for history but
are no longer loaded. The practice page redirects to the real observation lab.

## Run and test locally

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m http.server --directory public 8765
```

Open http://localhost:8765. All bundled demo tools work on this static server;
the optional live archive gateway requires the Python handler.

```bash
python -m unittest discover -s tests -v
node --check public/atlas.js
npm ci
npx playwright install chromium
npm run test:browser
```

The browser suite starts the Python handler itself and checks real-frame controls,
mission completion, notebook persistence, evidence exports, share-state restoration,
comet data, learning tools and responsive geometry. It writes diagnostic screenshots
under ignored `work/`. Set `ATLAS_BASE_URL` to run against a deployment.

## Regenerate preview images

Download the selected IRSA FITS cutouts through each DataLink record's cutout
service, then run:

```bash
python scripts/generate_fallbacks.py first.fits second.fits public/assets
```

Inspect the outputs before committing. Keep the source identifiers with the assets.

## Deploy

Vercel uses `api.archive:handler` from `pyproject.toml`, which declares the Python
dependencies. `.vercelignore` excludes scratch work, credentials and browser-test
dependencies. The existing production project is `sky-atlas-web`.

Verify the homepage, `/atlas.js`, `/atlas.css`, `/comet-data.json`, both PNGs, and
`/api/archive?target=star` after deploying. Static entry files use revalidation
to avoid leaving the UI on stale code.

## Sources and credits

- [SPHEREx Data Explorer](https://irsa.ipac.caltech.edu/applications/spherex/)
- [SPHEREx archive documentation](https://irsa.ipac.caltech.edu/spherex-archive-documentation/)
- [3I/ATLAS observations](https://irsa.ipac.caltech.edu/data/SPHEREx/docs/comet3iatlas/index.html)
- [Comet position VOTable](https://irsa.ipac.caltech.edu/data/SPHEREx/docs/comet3iatlas/obscore_3I_Atlas.vot)
- [SPHEREx instrument guide](https://irsa.ipac.caltech.edu/onlinehelp/spherex/help.pdf)
- [NASA/JPL comet composition image notes](https://www.jpl.nasa.gov/images/pia26720-nasas-spherex-examines-comet-3iatlass-coma/)

Data credits: NASA / JPL-Caltech / IRSA. This is not an official NASA site.
Project owner: [@sumedhbestavemula1235-sudo](https://github.com/sumedhbestavemula1235-sudo).
Project code uses the [MIT License](LICENSE); third-party data retains its source terms.
