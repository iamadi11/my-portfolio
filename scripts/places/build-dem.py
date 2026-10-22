#!/usr/bin/env python3
"""
Build heightfield GLBs from AWS Terrain Tiles (Terrarium) for Round trip.

Licences (must be credited on /):
  Terrain: AWS Terrain Tiles / Mapzen Joerd sources — see
  https://github.com/tilezen/joerd/blob/master/docs/attribution.md
  Commercial use allowed with the credits listed there.

Does NOT use Google Street View, satellite, or Google 3D meshes (Aleph can
fetch those, but they violate Google's terms — out of scope here).

Outputs under public/models/places/:
  <id>-hi.glb, <id>-lo.glb
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import sys
import urllib.request
import zlib
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "models" / "places"
CACHE = ROOT / "assets-src" / "terrain" / "cache"

# Unique places: lesser-known (or under-seen) landforms that read at night.
# Each is a lat/lon centre, slippy zoom, tile radius (half-width in tiles),
# vertical exaggeration, and world width in metres for the mesh.
PLACES: dict[str, dict] = {
    # City chapter: La Paz amphitheater + Illimani on the horizon.
    "lapaz-bowl": {
        "lat": -16.50,
        "lon": -68.15,
        "zoom": 12,
        "radius": 2,
        "exag": 2.4,
        "width": 4200,
        "note": "La Paz canyon bowl",
    },
    "illimani": {
        "lat": -16.5547,
        "lon": -67.7628,
        "zoom": 11,
        "radius": 2,
        "exag": 1.8,
        "width": 5200,
        "note": "Illimani massif east of La Paz",
    },
    # Project landscapes — places people rarely see in 3D portfolios.
    "chocolate-hills": {
        "lat": 9.83,
        "lon": 124.145,
        "zoom": 12,
        "radius": 2,
        "exag": 3.2,
        "width": 2800,
        "note": "Chocolate Hills, Bohol",
    },
    "lencois": {
        "lat": -2.485,
        "lon": -43.128,
        "zoom": 11,
        "radius": 2,
        "exag": 4.0,
        "width": 3600,
        "note": "Lençóis Maranhenses dune lagoons",
    },
    "zhangye-danxia": {
        "lat": 38.966,
        "lon": 100.033,
        "zoom": 12,
        "radius": 2,
        "exag": 2.6,
        "width": 3200,
        "note": "Zhangye Danxia coloured hills",
    },
    "roraima": {
        "lat": 5.143,
        "lon": -60.762,
        "zoom": 11,
        "radius": 2,
        "exag": 2.0,
        "width": 4800,
        "note": "Mount Roraima tepui",
    },
    "erta-ale": {
        "lat": 13.606,
        "lon": 40.661,
        "zoom": 12,
        "radius": 2,
        "exag": 2.8,
        "width": 2600,
        "note": "Erta Ale shield / lava lake rim",
    },
}


def deg2num(lat: float, lon: float, zoom: int) -> tuple[int, int]:
    lat_r = math.radians(lat)
    n = 2**zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_r)) / math.pi) / 2.0 * n)
    return x, y


def fetch_tile(z: int, x: int, y: int) -> Image.Image:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"{z}_{x}_{y}.png"
    if not path.exists():
        url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
        print(f"  fetch {url}", flush=True)
        urllib.request.urlretrieve(url, path)
    return Image.open(path).convert("RGB")


def terrarium_heights(rgb: np.ndarray) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    return (r * 256.0 + g + b / 256.0) - 32768.0


def stitch(lat: float, lon: float, zoom: int, radius: int) -> np.ndarray:
    cx, cy = deg2num(lat, lon, zoom)
    tiles = []
    for dy in range(-radius, radius + 1):
        row = []
        for dx in range(-radius, radius + 1):
            img = fetch_tile(zoom, cx + dx, cy + dy)
            row.append(np.asarray(img, dtype=np.uint8))
        tiles.append(np.concatenate(row, axis=1))
    rgb = np.concatenate(tiles, axis=0)
    return terrarium_heights(rgb)


def downsample(h: np.ndarray, max_edge: int) -> np.ndarray:
    rows, cols = h.shape
    step = max(1, int(math.ceil(max(rows, cols) / max_edge)))
    return h[::step, ::step]


def mesh_from_heights(
    h: np.ndarray, width_m: float, exag: float
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rows, cols = h.shape
    # Flatten base so the lowest point sits at y=0; exaggerate relief.
    base = float(np.nanmin(h))
    elev = (h - base) * exag
    # Horizontal span matches width_m on the longer axis.
    aspect = cols / max(rows, 1)
    if aspect >= 1:
        sx, sz = width_m, width_m / aspect
    else:
        sx, sz = width_m * aspect, width_m
    xs = np.linspace(-sx / 2, sx / 2, cols, dtype=np.float32)
    zs = np.linspace(-sz / 2, sz / 2, rows, dtype=np.float32)
    xx, zz = np.meshgrid(xs, zs)
    pos = np.stack([xx, elev.astype(np.float32), zz], axis=-1).reshape(-1, 3)

    # Triangle indices (two per cell).
    idx = []
    for j in range(rows - 1):
        for i in range(cols - 1):
            a = j * cols + i
            b = a + 1
            c = a + cols
            d = c + 1
            idx.extend((a, c, b, b, c, d))
    indices = np.asarray(idx, dtype=np.uint32)

    # Smooth-ish normals from cross products.
    normals = np.zeros_like(pos)
    p = pos
    for t in range(0, len(indices), 3):
        i0, i1, i2 = int(indices[t]), int(indices[t + 1]), int(indices[t + 2])
        e1 = p[i1] - p[i0]
        e2 = p[i2] - p[i0]
        n = np.cross(e1, e2)
        normals[i0] += n
        normals[i1] += n
        normals[i2] += n
    lens = np.linalg.norm(normals, axis=1, keepdims=True)
    lens = np.maximum(lens, 1e-6)
    normals = (normals / lens).astype(np.float32)
    return pos.astype(np.float32), normals, indices


def _pad(data: bytes, align: int = 4, fill: bytes = b"\x00") -> bytes:
    rem = len(data) % align
    return data if rem == 0 else data + fill * (align - rem)


def write_glb(
    path: Path,
    positions: np.ndarray,
    normals: np.ndarray,
    indices: np.ndarray,
    color: tuple[float, float, float] = (0.35, 0.38, 0.42),
) -> None:
    """Minimal glTF 2.0 binary: one mesh, POSITION + NORMAL + indices, PBR colour."""
    pos_b = positions.astype("<f4").tobytes()
    nor_b = normals.astype("<f4").tobytes()
    # Component type 5125 = UNSIGNED_INT
    idx_b = indices.astype("<u4").tobytes()

    pos_min = positions.min(axis=0).tolist()
    pos_max = positions.max(axis=0).tolist()

    pos_pad = _pad(pos_b)
    nor_pad = _pad(nor_b)
    idx_pad = _pad(idx_b)
    bin_blob = pos_pad + nor_pad + idx_pad
    pos_off = 0
    nor_off = len(pos_pad)
    idx_off = nor_off + len(nor_pad)

    gltf = {
        "asset": {"version": "2.0", "generator": "scripts/places/build-dem.py"},
        "scenes": [{"nodes": [0]}],
        "scene": 0,
        "nodes": [{"mesh": 0}],
        "meshes": [
            {
                "primitives": [
                    {
                        "attributes": {"POSITION": 0, "NORMAL": 1},
                        "indices": 2,
                        "material": 0,
                    }
                ]
            }
        ],
        "materials": [
            {
                "pbrMetallicRoughness": {
                    "baseColorFactor": [color[0], color[1], color[2], 1.0],
                    "metallicFactor": 0.05,
                    "roughnessFactor": 0.92,
                },
                "doubleSided": False,
            }
        ],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": len(positions),
                "type": "VEC3",
                "max": pos_max,
                "min": pos_min,
            },
            {
                "bufferView": 1,
                "componentType": 5126,
                "count": len(normals),
                "type": "VEC3",
            },
            {
                "bufferView": 2,
                "componentType": 5125,
                "count": len(indices),
                "type": "SCALAR",
            },
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": pos_off, "byteLength": len(pos_b), "target": 34962},
            {"buffer": 0, "byteOffset": nor_off, "byteLength": len(nor_b), "target": 34962},
            {"buffer": 0, "byteOffset": idx_off, "byteLength": len(idx_b), "target": 34963},
        ],
        "buffers": [{"byteLength": len(bin_blob)}],
    }
    # glTF JSON chunks must be space-padded; BIN chunks null-padded.
    json_b = _pad(json.dumps(gltf, separators=(",", ":")).encode("utf-8"), fill=b" ")
    total = 12 + 8 + len(json_b) + 8 + len(bin_blob)
    with path.open("wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total))
        f.write(struct.pack("<I4s", len(json_b), b"JSON"))
        f.write(json_b)
        f.write(struct.pack("<I4s", len(bin_blob), b"BIN\x00"))
        f.write(bin_blob)


# Night-grade rock colours per place (read under moonlight).
COLORS = {
    "lapaz-bowl": (0.18, 0.16, 0.2),
    "illimani": (0.55, 0.58, 0.62),
    "chocolate-hills": (0.28, 0.22, 0.16),
    "lencois": (0.62, 0.55, 0.42),
    "zhangye-danxia": (0.42, 0.22, 0.18),
    "roraima": (0.32, 0.3, 0.28),
    "erta-ale": (0.2, 0.16, 0.14),
}


def build_one(place_id: str, hi_edge: int = 128, lo_edge: int = 64) -> None:
    cfg = PLACES[place_id]
    print(f"Building {place_id}: {cfg['note']}", flush=True)
    heights = stitch(cfg["lat"], cfg["lon"], cfg["zoom"], cfg["radius"])
    OUT.mkdir(parents=True, exist_ok=True)
    color = COLORS.get(place_id, (0.35, 0.38, 0.42))
    for tag, edge in (("hi", hi_edge), ("lo", lo_edge)):
        h = downsample(heights, edge)
        pos, nor, idx = mesh_from_heights(h, cfg["width"], cfg["exag"])
        path = OUT / f"{place_id}-{tag}.glb"
        write_glb(path, pos, nor, idx, color)
        print(
            f"  wrote {path.relative_to(ROOT)}  "
            f"verts={len(pos)} tris={len(idx) // 3} bytes={path.stat().st_size}",
            flush=True,
        )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "places",
        nargs="*",
        default=list(PLACES),
        help="Place ids to build (default: all)",
    )
    args = ap.parse_args()
    unknown = [p for p in args.places if p not in PLACES]
    if unknown:
        print(f"Unknown places: {unknown}", file=sys.stderr)
        print(f"Known: {', '.join(PLACES)}", file=sys.stderr)
        return 1
    for p in args.places:
        build_one(p)
    # Manifest for credits / docs.
    manifest = {
        "source": "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        "attribution": "https://github.com/tilezen/joerd/blob/master/docs/attribution.md",
        "places": {
            k: {**{kk: vv for kk, vv in v.items()}, "files": [f"{k}-hi.glb", f"{k}-lo.glb"]}
            for k, v in PLACES.items()
            if k in args.places
        },
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote {OUT / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
