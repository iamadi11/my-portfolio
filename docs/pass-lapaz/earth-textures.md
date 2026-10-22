# Earth textures (`public/env/earth-*.jpg`)

**Status (2026-10-22):** Replaced owner-supplied `59-earth.zip` maps with NASA Earth Observatory / Visible Earth media. Not a licence blocker.

## Why NASA-3D-Resources was not enough

Sparse checkout of `nasa/NASA-3D-Resources` @ `11ebb4ee043715aefbba6aeec8a61746fad67fa7` found no usable day / night-lights / cloud equirectangulars for `space.ts`:

| Path | What it is | Why it fails |
| --- | --- | --- |
| `Images and Textures/Earth (A)/Earth (A).jpg` | 1440×720 hypsometric shaded relief | Not true-colour day |
| `Images and Textures/Earth (B)/Earth (B).jpg` | 4095×4095 Apollo whole-disc photo | Not equirectangular; no lights/clouds |

## Sources used (reachable 2026-10-22 via `eoimages.gsfc.nasa.gov`)

| Role | File in `assets-src/nasa/earth/` | URL | Output sizes |
| --- | --- | --- | --- |
| Day | `day-src.jpg` | [BMNG Dec 2004 topo+bathy 5400×2700](https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg) | `earth-day-hi.jpg` 2048×1024, `earth-day-lo.jpg` 1024×512 |
| Lights | `lights-src.jpg` | [Black Marble 2016 3 km](https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg) | `earth-lights-hi.jpg` 4096×2048, `earth-lights-lo.jpg` 2048×1024 (grayscale; shader uses `.r`) |
| Clouds | `clouds-src.jpg` | [Blue Marble clouds 2048×1024](https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg) | `earth-clouds-hi.jpg` 2048×1024, `earth-clouds-lo.jpg` 1024×512 |

Rebuild: `scripts/assets.sh` (ffmpeg block under “Earth textures”). Sources live under git-ignored `assets-src/nasa/earth/`.

## Licence / credit

NASA media is generally not copyrighted in the United States; credit NASA; do not imply endorsement.

- [NASA Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)
- Earth Observatory reuse FAQ: credit NASA (Earth Observatory optional)

Credits line on the `200 OK` panel and `docs/round-trip.md` name Blue Marble NG, Black Marble 2016, and Blue Marble clouds.
