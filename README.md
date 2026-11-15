# Sky Motion Atlas

An interactive NASA Space Apps Challenge prototype for exploring how objects change between SPHEREx observations.

## Features

- Animated landing page and moving sky background
- Explore gallery for 3I/ATLAS, Barnard's Star, and R Draconis
- Time sliders, playback controls, and target reveals
- Interactive guide to the six SPHEREx detector bands
- Two verified D3 observation records for Barnard's Star
- Serverless archive endpoint for SPHEREx image cutouts and comet positions

## Data status

The Barnard's Star records identify SPHEREx D3 observations from August 15, 2025 and August 20, 2026. The interface labels its animated previews as simulations. The archive loader attempts to retrieve and align the underlying telescope images at runtime.

The 3I/ATLAS section links to NASA and IRSA sources and uses IRSA's published observation table for predicted comet positions. The animated path is illustrative.

## Run locally

The static interface is in `public/`. Open `public/index.html` to inspect the UI. The Python endpoint in `api/archive.py` is designed for Vercel's Python runtime.

## Deploy

Import this repository into Vercel or deploy it with Vercel CLI. The `pyproject.toml` file identifies the Python entrypoint.

## Sources

- [SPHEREx Data Explorer](https://irsa.ipac.caltech.edu/applications/spherex/)
- [SPHEREx archive documentation](https://irsa.ipac.caltech.edu/spherex-archive-documentation/)
- [SPHEREx observations of 3I/ATLAS](https://irsa.ipac.caltech.edu/data/SPHEREx/docs/comet3iatlas/index.html)
- [NASA/JPL 3I/ATLAS image notes](https://www.jpl.nasa.gov/images/pia26720-nasas-spherex-examines-comet-3iatlass-coma/)

