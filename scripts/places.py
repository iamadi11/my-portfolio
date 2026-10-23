#!/usr/bin/env python3
"""Real-place heightfields for the horizon of each landscape on / (world/landmarks.ts).

Elevation: AWS Terrain Tiles ("Terrarium" PNGs, Mapzen/Tilezen joerd), open data. In these areas
the tiles come from SRTM (NASA), with ETOPO1 (NOAA) and GMTED2010 (USGS) at coarser zooms; see
https://github.com/tilezen/joerd/blob/master/docs/attribution.md.

Usage (stdlib only; run isolated, downloads are data):
    python3 -I scripts/places.py <tile-cache-dir> [<preview-dir>]

Writes public/env/places/<id>-hi.bin and <id>-lo.bin: a little-endian header of four float32
(grid size n, lowest and highest height in metres, span in metres), then n*n uint16, rows north
to south, columns west to east: the height mapped linearly from lowest to highest in the top 15
bits, and in the lowest bit whether that point is water.
With a preview dir, also writes a moonlit hillshade PNG of each place there for checking.
"""

import math
import os
import struct
import sys
import urllib.request
import zlib

TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

# id: (lat, lon, span in km, zoom, lakes). Each is written at two grid sizes, HI and LO.
PLACES = {
    # Chocolate Hills, Bohol, Philippines: the densest part of the field of cone hills.
    'chocolate_hills': (9.844, 124.12, 5.0, 13, False),
    # Badain Jaran, Inner Mongolia, China: megadunes with lakes in the hollows between them.
    # (Lencois Maranhenses was tried first: its dunes are lost in the radar noise at this scale.)
    'badain_jaran': (39.78, 102.42, 10.0, 12, True),
    # Zhangye Danxia, Gansu, China: banded sandstone ridges.
    'zhangye_danxia': (38.912, 100.024, 8.0, 13, False),
    # Mount Roraima (right) and Kukenan (left), tepuis on the Venezuela-Brazil-Guyana border.
    'roraima': (5.204, -60.812, 20.0, 12, False),
    # Nyiragongo, DR Congo: a steep cone with a lava lake in its summit crater. (Erta Ale was tried
    # first: its shield rises only ~270 m in the 4 km around the caldera and reads as flat.)
    'nyiragongo': (-1.52, 29.25, 12.0, 12, False),
}
HI, LO = 384, 192

OUT = os.path.join('public', 'env', 'places')


def tile_xy(lat, lon, z):
    n = 2**z
    x = (lon + 180.0) / 360.0 * n
    r = math.radians(lat)
    y = (1.0 - math.log(math.tan(r) + 1.0 / math.cos(r)) / math.pi) / 2.0 * n
    return x, y


def png_rgb(data):
    """Decode an 8-bit RGB or RGBA, non-interlaced PNG into rows of RGB bytes."""
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG'
    pos, idat, w = 8, b'', 0
    while pos < len(data):
        length, kind = struct.unpack('>I4s', data[pos : pos + 8])
        body = data[pos + 8 : pos + 8 + length]
        if kind == b'IHDR':
            w, h, depth, ctype, _, _, lace = struct.unpack('>IIBBBBB', body)
            assert depth == 8 and ctype in (2, 6) and lace == 0, 'unsupported PNG'
            bpp = 3 if ctype == 2 else 4
        elif kind == b'IDAT':
            idat += body
        pos += 12 + length
    raw = zlib.decompress(idat)
    stride = w * bpp
    rows, prev = [], bytearray(stride)
    for r in range(h):
        f = raw[r * (stride + 1)]
        line = bytearray(raw[r * (stride + 1) + 1 : (r + 1) * (stride + 1)])
        unfilter(line, prev, f, bpp)
        rows.append(bytes(line) if bpp == 3 else bytes(b for i, b in enumerate(line) if i % 4 != 3))
        prev = line
    return w, rows


def paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    return a if pa <= pb and pa <= pc else b if pb <= pc else c


def unfilter(line, prev, f, bpp):
    for i in range(len(line)):
        a = line[i - bpp] if i >= bpp else 0
        c = prev[i - bpp] if i >= bpp else 0
        pred = (0, a, prev[i], (a + prev[i]) // 2, paeth(a, prev[i], c))[f]
        line[i] = (line[i] + pred) & 255


def fetch(cache, z, x, y):
    path = os.path.join(cache, f'{z}-{x}-{y}.png')
    if not os.path.exists(path):
        with urllib.request.urlopen(TILES.format(z=z, x=x, y=y), timeout=60) as r:
            body = r.read()
        with open(path, 'wb') as f:
            f.write(body)
    with open(path, 'rb') as f:
        return f.read()


def mosaic(cache, lat, lon, span, z):
    """Heights (m) of every tile pixel around the place, and a sampler at (north, east) metres."""
    half = span * 500.0
    dlat = half / 111320.0
    dlon = half / (111320.0 * math.cos(math.radians(lat)))
    x0, y0 = tile_xy(lat + dlat, lon - dlon, z)
    x1, y1 = tile_xy(lat - dlat, lon + dlon, z)
    tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
    cols = (tx1 - tx0 + 1) * 256
    grid = [[0.0] * cols for _ in range((ty1 - ty0 + 1) * 256)]
    for ty in range(ty0, ty1 + 1):
        for tx in range(tx0, tx1 + 1):
            w, rows = png_rgb(fetch(cache, z, tx, ty))
            assert w == 256
            for r, row in enumerate(rows):
                out = grid[(ty - ty0) * 256 + r]
                for c in range(256):
                    R, G, B = row[c * 3], row[c * 3 + 1], row[c * 3 + 2]
                    out[(tx - tx0) * 256 + c] = R * 256 + G + B / 256 - 32768

    def at(north, east):
        la = lat + north / 111320.0
        lo = lon + east / (111320.0 * math.cos(math.radians(la)))
        px, py = tile_xy(la, lo, z)
        fx, fy = (px - tx0) * 256 - 0.5, (py - ty0) * 256 - 0.5
        ix, iy = int(math.floor(fx)), int(math.floor(fy))
        u, v = fx - ix, fy - iy
        g = lambda yy, xx: grid[min(max(yy, 0), len(grid) - 1)][min(max(xx, 0), cols - 1)]
        top = g(iy, ix) * (1 - u) + g(iy, ix + 1) * u
        bot = g(iy + 1, ix) * (1 - u) + g(iy + 1, ix + 1) * u
        return top * (1 - v) + bot * v

    return at


def sample(at, span, n):
    half = span * 500.0
    step = span * 1000.0 / (n - 1)
    return [[at(half - r * step, -half + c * step) for c in range(n)] for r in range(n)]


def clean(hs):
    """Fill the radar's few deep voids: nothing lower than the lowest 0.05% of the place."""
    flat = sorted(h for r in hs for h in r)
    floor = flat[len(flat) // 2000]
    return [[max(h, floor) for h in r] for r in hs]


def lakes(hs):
    """Water: the radar returns a lake as a dead-flat patch; 5x5 neighbourhoods within 1 m."""
    n = len(hs)
    wet = [[False] * n for _ in range(n)]
    for r in range(2, n - 2):
        for c in range(2, n - 2):
            win = [hs[r + i][c + j] for i in range(-2, 3) for j in range(-2, 3)]
            if max(win) - min(win) < 1.0:
                for i in range(-2, 3):
                    for j in range(-2, 3):
                        wet[r + i][c + j] = True
    return wet


def write_bin(path, hs, span, wet):
    """Heights in the top 15 bits of each uint16; the lowest bit is set where there is water."""
    n = len(hs)
    lo = min(min(r) for r in hs)
    hi = max(max(r) for r in hs)
    k = 32767.0 / max(hi - lo, 1e-6)
    body = bytearray(struct.pack('<4f', n, lo, hi, span * 1000.0))
    for r, row in enumerate(hs):
        q = (int(round((h - lo) * k)) * 2 + (1 if wet and wet[r][c] else 0) for c, h in enumerate(row))
        body += struct.pack(f'<{n}H', *q)
    with open(path, 'wb') as f:
        f.write(body)
    return lo, hi


def png_gray(path, rows):
    w = len(rows[0])
    raw = b''.join(b'\x00' + bytes(r) for r in rows)
    chunk = lambda k, d: struct.pack('>I', len(d)) + k + d + struct.pack('>I', zlib.crc32(k + d))
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', w, len(rows), 8, 0, 0, 0, 0)))
        f.write(chunk(b'IDAT', zlib.compress(raw, 9)))
        f.write(chunk(b'IEND', b''))


def hillshade(hs, span, exag=2.0):
    n = len(hs)
    cell = span * 1000.0 / (n - 1)
    lx, ly, lz = -0.5, 0.5, 0.7
    out = []
    for r in range(n):
        row = []
        for c in range(n):
            dx = (hs[r][min(c + 1, n - 1)] - hs[r][max(c - 1, 0)]) * exag / (2 * cell)
            dy = (hs[max(r - 1, 0)][c] - hs[min(r + 1, n - 1)][c]) * exag / (2 * cell)
            nx, ny, nz = -dx, -dy, 1.0
            ln = math.sqrt(nx * nx + ny * ny + 1)
            row.append(max(0, min(255, int(255 * max(0.0, (nx * lx + ny * ly + nz * lz) / ln)))))
        out.append(row)
    return out


def main():
    cache = sys.argv[1]
    preview = sys.argv[2] if len(sys.argv) > 2 else None
    os.makedirs(cache, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    for pid, (lat, lon, span, z, water) in PLACES.items():
        at = mosaic(cache, lat, lon, span, z)
        for tier, n in (('hi', HI), ('lo', LO)):
            hs = clean(sample(at, span, n))
            wet = lakes(hs) if water else None
            lo, hi = write_bin(os.path.join(OUT, f'{pid}-{tier}.bin'), hs, span, wet)
            if preview and tier == 'hi':
                shade = hillshade(hs, span)
                if wet:
                    shade = [[0 if w else v for v, w in zip(sr, wr)] for sr, wr in zip(shade, wet)]
                png_gray(os.path.join(preview, f'{pid}.png'), shade)
        print(f'{pid}: {lo:.0f}-{hi:.0f} m over {span} km')


if __name__ == '__main__':
    main()
