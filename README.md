# Sky Motion Atlas — What Moved?

An interactive NASA Space Apps Challenge project that helps a general audience
explore how the infrared sky changes between SPHEREx observations.

**Live demo:** https://sky-atlas-web.vercel.app/#home

## The challenge

This project responds to the **Planet X and SPHEREx** challenge. SPHEREx maps
the entire sky repeatedly in 102 near-infrared wavelength channels. Repeated
visits can reveal objects that move against distant stars or change in
brightness. Raw astronomy archives are powerful, but their files, coordinate
systems, and metadata can be difficult for a first-time visitor to understand.

Sky Motion Atlas turns that investigation into a guided question: **what
moved?** Visitors can explore a comet, a high-proper-motion star, and a variable
star; move through time; reveal a target; and learn why wavelength, alignment,
and image quality matter.

## What the experience includes

- An animated, responsive landing page and moving sky background
- An Explore gallery for 3I/ATLAS, Barnard's Star, and R Draconis
- Time sliders, playback controls, target reveals, and a practice round
- A guide to the six SPHEREx detector bands
- Two verified SPHEREx D3 observation records for Barnard's Star
- Real, aligned preview images generated from those two IRSA FITS cutouts
- A serverless archive endpoint for live cutouts and comet-position records
- Bundled previews that keep the demonstration working when IRSA is unavailable

## Real data and simulations

The interface separates measured archive material from illustration:

- The animated landing page, Explore cards, and object motion previews are
  explicitly labelled simulations or illustrations.
- The Barnard's Star archive viewer uses two real SPHEREx D3 records from
  **15 August 2025** and **20 August 2026**. The server requests small cutouts
  through IRSA's DataLink-declared `ibe-cutout` service, aligns both observations
  to one north-up sky grid, and applies a shared intensity stretch.
- The bundled Barnard's Star PNGs were generated from those same real FITS
  cutouts. They are availability fallbacks, not synthetic replacements.
- The 3I/ATLAS path uses predicted positions published in IRSA's observation
  table. It is not presented as a motion measurement made by this project.
- The R Draconis animation is an educational brightness-change illustration.

The Barnard's Star frames contain a bright, partly saturated target. They are
useful exploratory previews, but this prototype does **not** claim a precise
proper-motion measurement. A scientific measurement would additionally need
quality masks, matched effective wavelength, point-spread-function modelling,
and an uncertainty estimate.

## Data provenance

| Visit | SPHEREx collection | Observation ID | Detector |
| --- | --- | --- | --- |
| 2025-08-15 | `spherex_dr1` | `2025W33_2C_0321_1` | D3 |
| 2026-08-20 | `spherex_qr3` | `2026W34_2A_0081_1` | D3 |

The original one-row metadata exports are preserved in `data/`. The generated
fallback previews are in `public/assets/`. Both previews use a common output
grid centred near Barnard's Star at RA 269.448°, Dec +4.768°, with north up and
a shared asinh display stretch.

## Architecture

```text
public/                  Static browser experience
  index.html             Hash-routed interactive atlas
  guide.js / guide.css   Science guide and archive controls
  assets/                Real-data fallback previews
api/archive.py           Vercel Python handler and IRSA gateway
data/                    Original observation metadata
scripts/                 Reproducible fallback-preview generator
tests/                   Archive and static-site checks
.github/workflows/       Continuous integration
```

The browser first requests `/api/archive`. For Barnard's Star, the function
resolves the DataLink `#cutout` record, requests only the relevant region from
IRSA, aligns the frames, and returns compact PNG data. Temporary upstream
failures are retried. If the live image pipeline still fails, the endpoint
returns the bundled real-data previews with a source label, keeping the judge
demo usable without misrepresenting simulated imagery as archive pixels.

## Run locally

Create a Python environment and install the dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m http.server --directory public 8000
```

The static experience will be available at `http://localhost:8000`. The archive
buttons require the Vercel Python handler or another compatible local server.

Run the automated checks with:

```bash
python -m unittest discover -s tests -v
node --check public/guide.js
```

## Regenerate the fallback previews

Download the two IRSA cutouts identified by the records in `data/`, then run:

```bash
python scripts/generate_fallbacks.py first.fits second.fits public/assets
```

The generator uses the same output grid and shared intensity stretch as the
serverless endpoint. Generated images should be visually inspected before they
are committed.

## Deploy

Import this repository into Vercel and deploy the `main` branch. The static
interface lives in `public/`, while `pyproject.toml` identifies
`api.archive:handler` as the Python entrypoint. After deployment, verify:

1. `/` renders the website rather than raw JSON.
2. `/guide.js`, `/guide.css`, and both `/assets/` previews return HTTP 200.
3. `/api/archive?target=comet` returns a `rows` array.
4. `/api/archive?target=star` returns two images and a `source` field.

## Sources

- [SPHEREx Data Explorer](https://irsa.ipac.caltech.edu/applications/spherex/)
- [SPHEREx archive documentation](https://irsa.ipac.caltech.edu/spherex-archive-documentation/)
- [SPHEREx observations of 3I/ATLAS](https://irsa.ipac.caltech.edu/data/SPHEREx/docs/comet3iatlas/index.html)
- [NASA/JPL 3I/ATLAS image notes](https://www.jpl.nasa.gov/images/pia26720-nasas-spherex-examines-comet-3iatlass-coma/)

NASA and JPL imagery remains credited to its stated source. This independent
hackathon project is not an official NASA website.

## Team

Project owner and maintainer: [@sumedhbestavemula1235-sudo](https://github.com/sumedhbestavemula1235-sudo)

## License

Project code is available under the [MIT License](LICENSE). Third-party data and
imagery remain subject to their source terms and attribution requirements.
