# Aleph evaluation (Belluxx/Aleph)

Evaluated 2026-10-22 against https://github.com/Belluxx/Aleph for Round trip storytelling.

## What it is

CLI + dashboard that captures a map rectangle and downloads layers: Street View, satellite, OSM, terrain, and optional Google Earth textured `mesh.glb`.

## Verdict for this portfolio

**Use the open layers only. Do not use Google meshes / Street View / satellite.**

| Layer | Licence / terms | Use on `/`? |
| --- | --- | --- |
| Terrain (AWS Terrain Tiles) | Open; Joerd attribution required | **Yes** — shipped via `scripts/places/build-dem.py` |
| OSM buildings / geocoding | ODbL | Possible later for footprints; not in this round |
| Street View | © Google; README says download violates Google's terms | **No** |
| Satellite imagery | © Google / providers; same caution | **No** |
| Google 3D mesh (`mesh` source) | © Google; against terms | **No** |

Aleph is useful as a research tool for OSM + terrain, and as documentation of the capture workflow. We implemented the same open terrain path directly (S3 Terrarium tiles → heightfield GLB) so the build does not depend on Aleph at runtime or in CI.

## What we shipped instead

Unique, under-seen places as DEM meshes:

- **City:** La Paz bowl + Illimani
- **Landscapes:** Chocolate Hills, Lençóis Maranhenses, Zhangye Danxia, Mount Roraima, Erta Ale

Osaka downtown (Sketchfab CC BY) stays as the night photogrammetry mass beside the La Paz path.
