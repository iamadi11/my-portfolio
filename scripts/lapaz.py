#!/usr/bin/env python3
"""
Builds the city on / (world/city.ts): La Paz, Bolivia, at night, from open data.

    python3 -I scripts/lapaz.py <workdir>

Downloads into <workdir> (cached; treat as untrusted data, parsed here only as numbers):
  - AWS Terrain Tiles (Mapzen terrarium PNGs, s3.amazonaws.com/elevation-tiles-prod), whose
    sources here are SRTM and GMTED2010 (courtesy of the U.S. Geological Survey) and ETOPO1
    (U.S. NOAA): the canyon bowl at zoom 13, Illimani at zoom 12.
  - Google Open Buildings v3 (CC BY 4.0), the S2 level-6 cell 915f (inside level-4 cell 915),
    stream-filtered to the bowl, confidence >= 0.75.
Writes public/data/lapaz-hi.bin and lapaz-lo.bin (phones): a JSON header, then typed arrays.

What is real and what is not:
  - Ground heights, footprint positions, sizes and orientations are real; footprints are reduced
    to their minimum-area rectangle. The map is drawn at 2:5 across (S) and its relief at 0.55
    (SV), so the canyon walls stand inside the fog and steepen a little.
  - Building heights are stylised: there is no open height data. A seeded random from footprint
    area and distance to El Prado: towers along the Prado and in the centre, 1-3 storeys on the
    canyon walls. The map is levelled along the avenue (its own gentle grade is taken out) and a
    corridor is kept clear for the flight path.
Standard library only.
"""
import csv
import gzip
import json
import math
import os
import random
import struct
import sys
import urllib.request
import zlib

S = 0.4  # horizontal scale, world metres per real metre
SV = 0.55  # vertical scale of the relief
FLOOR = -60.0  # street level on / (city.ts FLOOR)
FLOOR_STEP = 3.4  # world metres per storey (the window grid in city.ts)
# Two points on the centre line of the main avenue (Av. Mariscal Santa Cruz into El Prado / Av. 16
# de Julio, heading south-east), read off the gap in the footprints; the first sits at world z Z0.
AV0 = (-16.49923, -68.13487)
AV1 = (-16.50665, -68.12888)
Z0 = -400.0
CITY = (-300.0, -800.0)  # the stretch of path flown over the city (route.ts: SPACE to SPACE+CITY)
CLEAR = 18.0  # metres either side of the flight path kept free of anything taller than LOW
LOW = 30.0
LAT0, LON0 = -16.5005, -68.1330
KY, KX = 110574.0, 111320.0 * math.cos(math.radians(LAT0))
ILLIMANI = (-16.643, -67.789)  # searched around for the summit
BBOX = (-16.548, -16.458, -68.182, -68.084)  # S, N, W, E of the footprints kept
OB = 'https://storage.googleapis.com/open-buildings-data/v3/polygons_s2_level_6_gzip_no_header/'
TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/'
TIERS = {
    'hi': {'n': 320, 'far': 160, 'boxes': 42000, 'points': 70000},
    'lo': {'n': 200, 'far': 112, 'boxes': 14000, 'points': 32000},
}
GRID_HALF = 3000.0  # world metres either side of the grid's centre
GRID_C = None  # set in main: (x, z)


def path_x(z):
    """The flight path's sway (gl.ts pathX, route.ts swayX)."""
    return math.sin(-z * 0.0175) * 6 + math.sin(-z * 0.0061) * 16


def smooth(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


# ---- Real <-> world -----------------------------------------------------------------------------


def local(lat, lon):
    return ((lon - LON0) * KX, (lat - LAT0) * KY)


def _frame():
    a, b = local(*AV0), local(*AV1)
    L = math.hypot(b[0] - a[0], b[1] - a[1])
    u = ((b[0] - a[0]) / L, (b[1] - a[1]) / L)
    r = (u[1], -u[0])
    z1 = Z0 - (CITY[0] - CITY[1])
    p0 = (path_x(Z0), Z0)
    d = (path_x(z1) - p0[0], z1 - p0[1])
    dl = math.hypot(*d)
    fw = (d[0] / dl, d[1] / dl)
    rt = (-fw[1], fw[0])
    return a, u, r, p0, fw, rt


A0, U, R, P0, FW, RT = _frame()


def to_world(e, n):
    s = (e - A0[0]) * U[0] + (n - A0[1]) * U[1]
    t = (e - A0[0]) * R[0] + (n - A0[1]) * R[1]
    return (P0[0] + (s * FW[0] + t * RT[0]) * S, P0[1] + (s * FW[1] + t * RT[1]) * S)


def to_real(x, z):
    rx, rz = x - P0[0], z - P0[1]
    s = (rx * FW[0] + rz * FW[1]) / S
    t = (rx * RT[0] + rz * RT[1]) / S
    return (A0[0] + s * U[0] + t * R[0], A0[1] + s * U[1] + t * R[1])


def real_dir_to_world(v):
    s = v[0] * U[0] + v[1] * U[1]
    t = v[0] * R[0] + v[1] * R[1]
    return (s * FW[0] + t * RT[0], s * FW[1] + t * RT[1])


def latlon(e, n):
    return (LAT0 + n / KY, LON0 + e / KX)


# ---- Terrain ------------------------------------------------------------------------------------


def png_rgb(data):
    """Decodes an 8-bit RGB(A), non-interlaced PNG (all terrarium tiles are)."""
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('not a PNG')
    i, idat, w, h, ct = 8, [], 0, 0, 0
    while i < len(data):
        n = struct.unpack('>I', data[i:i + 4])[0]
        kind, body = data[i + 4:i + 8], data[i + 8:i + 8 + n]
        if kind == b'IHDR':
            w, h, depth, ct, _, _, lace = struct.unpack('>IIBBBBB', body[:13])
            if depth != 8 or ct not in (2, 6) or lace:
                raise ValueError('unexpected PNG format')
        elif kind == b'IDAT':
            idat.append(body)
        i += 12 + n
    bpp = 3 if ct == 2 else 4
    raw, stride = zlib.decompress(b''.join(idat)), w * bpp
    out, prev, p = bytearray(h * stride), bytearray(stride), 0
    for y in range(h):
        f, line = raw[p], bytearray(raw[p + 1:p + 1 + stride])
        p += 1 + stride
        unfilter(line, prev, f, bpp)
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, bpp, out


def unfilter(line, prev, f, bpp):
    if f == 0:
        return
    for x in range(len(line)):
        a = line[x - bpp] if x >= bpp else 0
        b = prev[x]
        if f == 1:
            line[x] = (line[x] + a) & 255
        elif f == 2:
            line[x] = (line[x] + b) & 255
        elif f == 3:
            line[x] = (line[x] + (a + b) // 2) & 255
        else:
            c = prev[x - bpp] if x >= bpp else 0
            pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
            line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255


class Dem:
    """Elevation (m) from terrarium tiles at one zoom, bilinear, tiles fetched once and cached."""

    def __init__(self, work, z):
        self.work, self.z, self.tiles = work, z, {}

    def tile(self, tx, ty):
        key = (tx, ty)
        if key not in self.tiles:
            path = os.path.join(self.work, 'tiles', f'{self.z}-{tx}-{ty}.png')
            if not os.path.exists(path):
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with urllib.request.urlopen(f'{TILES}{self.z}/{tx}/{ty}.png') as r:
                    data = r.read()
                with open(path, 'wb') as f:
                    f.write(data)
            with open(path, 'rb') as f:
                w, h, bpp, px = png_rgb(f.read())
            self.tiles[key] = [
                px[k] * 256 + px[k + 1] + px[k + 2] / 256 - 32768 for k in range(0, w * h * bpp, bpp)
            ]
        return self.tiles[key]

    def px(self, gx, gy):
        tx, ty = int(gx // 256), int(gy // 256)
        return self.tile(tx, ty)[int(gy - ty * 256) * 256 + int(gx - tx * 256)]

    def at(self, lat, lon):
        n = 2 ** self.z
        gx = (lon + 180) / 360 * n * 256 - 0.5
        la = math.radians(lat)
        gy = (1 - math.log(math.tan(la) + 1 / math.cos(la)) / math.pi) / 2 * n * 256 - 0.5
        x0, y0 = math.floor(gx), math.floor(gy)
        fx, fy = gx - x0, gy - y0
        a, b = self.px(x0, y0), self.px(x0 + 1, y0)
        c, d = self.px(x0, y0 + 1), self.px(x0 + 1, y0 + 1)
        return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def elev_world(dem, x, z):
    return dem.at(*latlon(*to_real(x, z)))


def profile(dem):
    """The avenue's own grade along the flight path, smoothed, to be levelled out."""
    zs = list(range(int(CITY[0]) + 200, int(CITY[1]) - 401, -10))
    raw = [elev_world(dem, path_x(z), z) for z in zs]
    sm = [sum(raw[max(0, i - 6):i + 7]) / len(raw[max(0, i - 6):i + 7]) for i in range(len(raw))]
    top, step = zs[0], 10

    def prof(z):
        k = min(len(sm) - 1, max(0, int(round((top - z) / step))))
        return sm[k]

    return prof


def corridor(x, z):
    """0-1: inside the levelled street under the flight path."""
    along = smooth(CITY[0] + 250, CITY[0] + 120, z) * smooth(CITY[1] - 420, CITY[1] - 300, z)
    return (1 - smooth(24, 60, abs(x - path_x(z)))) * along


def ground(dem, prof, x, z):
    y = FLOOR + (elev_world(dem, x, z) - prof(z)) * SV
    c = corridor(x, z)
    return y * (1 - c) + (FLOOR - 0.6) * c


def heightfield(dem, prof, n):
    cx, cz = GRID_C
    step = GRID_HALF * 2 / (n - 1)
    ys = []
    for j in range(n):
        z = cz - GRID_HALF + j * step
        for i in range(n):
            ys.append(ground(dem, prof, cx - GRID_HALF + i * step, z))
    return ys


class Field:
    """Samples a heightfield grid (world metres) bilinearly."""

    def __init__(self, ys, n):
        self.ys, self.n = ys, n
        self.step = GRID_HALF * 2 / (n - 1)

    def at(self, x, z):
        gx = (x - GRID_C[0] + GRID_HALF) / self.step
        gz = (z - GRID_C[1] + GRID_HALF) / self.step
        i = min(self.n - 2, max(0, int(gx)))
        j = min(self.n - 2, max(0, int(gz)))
        fx, fz = min(1, max(0, gx - i)), min(1, max(0, gz - j))
        y = self.ys
        a, b = y[j * self.n + i], y[j * self.n + i + 1]
        c, d = y[(j + 1) * self.n + i], y[(j + 1) * self.n + i + 1]
        return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz


# ---- Footprints ---------------------------------------------------------------------------------


def fetch_buildings(work):
    out = os.path.join(work, 'bowl.csv')
    if os.path.exists(out):
        return out
    src = os.path.join(work, '915f_buildings.csv.gz')
    if not os.path.exists(src):
        urllib.request.urlretrieve(OB + '915f_buildings.csv.gz', src)
    csv.field_size_limit(10 ** 8)
    s, n, w, e = BBOX
    with gzip.open(src, 'rt', newline='') as f, open(out, 'w', newline='') as o:
        wr = csv.writer(o)
        for r in csv.reader(f):
            lat, lon = float(r[0]), float(r[1])
            if s <= lat <= n and w <= lon <= e and float(r[3]) >= 0.75:
                wr.writerow(r[:5])
    return out


def ring(wkt):
    """The outer ring of a WKT polygon (the first one of a multipolygon), in local metres."""
    body = wkt[wkt.index('('):].lstrip('(')
    body = body[:body.index(')')]
    pts = []
    for tok in body.split(','):
        lon, lat = tok.split()[:2]
        pts.append(local(float(lat), float(lon)))
    return pts


def hull(pts):
    pts = sorted(set(pts))
    if len(pts) < 3:
        return pts

    def half(seq):
        h = []
        for p in seq:
            while len(h) >= 2 and (
                (h[-1][0] - h[-2][0]) * (p[1] - h[-2][1]) - (h[-1][1] - h[-2][1]) * (p[0] - h[-2][0])
            ) <= 0:
                h.pop()
            h.append(p)
        return h

    lo, hi = half(pts), half(reversed(pts))
    return lo[:-1] + hi[:-1]


def min_rect(pts):
    """Minimum-area rectangle around a convex hull: centre, size along its own axis, axis."""
    best = None
    for i in range(len(pts)):
        p, q = pts[i], pts[(i + 1) % len(pts)]
        L = math.hypot(q[0] - p[0], q[1] - p[1])
        if L < 1e-6:
            continue
        ax = ((q[0] - p[0]) / L, (q[1] - p[1]) / L)
        us = [v[0] * ax[0] + v[1] * ax[1] for v in pts]
        vs = [-v[0] * ax[1] + v[1] * ax[0] for v in pts]
        area = (max(us) - min(us)) * (max(vs) - min(vs))
        if best is None or area < best[0]:
            cu, cv = (max(us) + min(us)) / 2, (max(vs) + min(vs)) / 2
            centre = (cu * ax[0] - cv * ax[1], cu * ax[1] + cv * ax[0])
            best = (area, centre, max(us) - min(us), max(vs) - min(vs), ax)
    return best


def axis_dist(e, n):
    """Real metres from the avenue's axis (San Francisco to San Jorge, a little past Av. Arce)."""
    a, b = local(-16.4950, -68.1395), local(-16.5135, -68.1225)
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((e - a[0]) * dx + (n - a[1]) * dy) / (dx * dx + dy * dy)))
    return math.hypot(e - a[0] - t * dx, n - a[1] - t * dy)


def storeys(rng, area, d_axis):
    """Stylised: no open height data. Towers in the centre, low blocks up the canyon walls."""
    centre = 1 - smooth(150, 700, d_axis)
    if centre > 0.05 and area > 120:
        prado = 1 - smooth(60, 260, d_axis)
        tall = rng.random() ** 1.6 * (5 + 26 * centre + 10 * prado) * min(1.5, max(0.5, area / 450))
        return 2 + int(tall)
    mid = 1 - smooth(900, 1600, d_axis)
    return 1 + int(rng.random() * (2.2 + 3.5 * mid) * min(1.3, max(0.6, area / 90)))


def buildings(path, field, rng):
    out = []
    csv.field_size_limit(10 ** 8)
    with open(path, newline='') as f:
        for r in csv.reader(f):
            b = building(r, field, rng)
            if b:
                out.append(b)
    return out


def building(r, field, rng):
    h = hull(ring(r[4]))
    if len(h) < 3:
        return None
    _, (ce, cn), w, d, ax = min_rect(h)
    x, z = to_world(ce, cn)
    if abs(x - GRID_C[0]) > GRID_HALF - 10 or abs(z - GRID_C[1]) > GRID_HALF - 10:
        return None
    area = float(r[2])
    hgt = storeys(rng, area, axis_dist(ce, cn)) * FLOOR_STEP
    wx, wz = real_dir_to_world(ax)
    ang = math.atan2(-wz, wx) % math.pi
    ww, dd = max(1.6, w * S), max(1.6, d * S)
    reach = math.hypot(ww, dd) / 2
    near = abs(x - path_x(z)) - reach
    if near < CLEAR + 30 and CITY[1] - 300 < z < CITY[0] + 200:
        # Along the avenue: low buildings stay, nothing stands in the flight corridor.
        if near < CLEAR:
            return None
        if near < CLEAR + 12:
            hgt = min(hgt, LOW)
    ca, sa = math.cos(ang), math.sin(ang)
    corners = [(x + ca * sx * ww / 2 + sa * sz * dd / 2, z - sa * sx * ww / 2 + ca * sz * dd / 2)
               for sx in (-1, 1) for sz in (-1, 1)]
    base = min(field.at(cx, cz) for cx, cz in corners) - 0.8
    zc = min(CITY[0], max(CITY[1], z))
    dpath = math.hypot(x - path_x(zc), z - zc)
    return {'x': x, 'z': z, 'y': base, 'w': ww, 'd': dd, 'a': ang, 'h': hgt, 'dp': dpath, 'area': area}


# ---- Illimani -----------------------------------------------------------------------------------


def summit(dem):
    best = (-1e9, None)
    for j in range(-40, 41):
        for i in range(-40, 41):
            lat, lon = ILLIMANI[0] + j * 0.0012, ILLIMANI[1] + i * 0.0012
            e = dem.at(lat, lon)
            if e > best[0]:
                best = (e, (lat, lon))
    return best


def far_patch(dem, top, prof_ref, n, half_real=13000.0):
    """The Illimani massif around its summit, in world metres (scaled into view by city.ts)."""
    cx, cz = to_world(*local(*top))
    half = half_real * S
    step = half * 2 / (n - 1)
    ys = []
    for j in range(n):
        for i in range(n):
            x, z = cx - half + i * step, cz - half + j * step
            ys.append(FLOOR + (elev_world(dem, x, z) - prof_ref) * SV)
    return {'cx': cx, 'cz': cz, 'half': half, 'n': n}, ys


# ---- Output -------------------------------------------------------------------------------------


def density(blds, n):
    """Built-up share around each grid vertex (0-255), for the glow of lit streets on the ground."""
    step = GRID_HALF * 2 / (n - 1)
    acc = [0.0] * (n * n)
    for b in blds:
        i = int(round((b['x'] - GRID_C[0] + GRID_HALF) / step))
        j = int(round((b['z'] - GRID_C[1] + GRID_HALF) / step))
        if 0 <= i < n and 0 <= j < n:
            acc[j * n + i] += b['w'] * b['d']
    cell = step * step
    blur = [0.0] * (n * n)
    for j in range(n):
        for i in range(n):
            s = k = 0
            for dj in (-1, 0, 1):
                for di in (-1, 0, 1):
                    if 0 <= i + di < n and 0 <= j + dj < n:
                        s += acc[(j + dj) * n + i + di]
                        k += 1
            blur[j * n + i] = s / k
    return bytes(min(255, int(v / cell * 2.2 * 255)) for v in blur)


def lights(rest, rng, budget):
    """A lamp or a lit window for the buildings drawn as points: mostly sodium, some LED."""
    rest = sorted(rest, key=lambda b: b['dp'])
    if len(rest) > budget:
        keep = budget / len(rest)
        rest = [b for b in rest if rng.random() < keep]
    pts = []
    for b in rest:
        r = rng.random()
        kind = 0 if r < 0.68 else 1 if r < 0.84 else 2
        bright = 90 + int(rng.random() * 165)
        y = b['y'] + min(b['h'], 7.0) * rng.random() + 1.0
        pts.append((b['x'], b['z'], y, kind * 64 + bright // 4))
    return pts


def pack(tier, ys, dens, boxes, pts, far, fys):
    sections, blobs, off = {}, [], 0

    def add(name, fmt, values):
        nonlocal off
        data = struct.pack('<%d%s' % (len(values), fmt), *values)
        pad = (-len(data)) % 4
        sections[name] = [off, len(values), fmt]
        blobs.append(data + b'\0' * pad)
        off += len(data) + pad

    q = lambda v, k: max(-32768, min(32767, int(round(v / k))))  # noqa: E731
    add('ground', 'h', [q(y, 0.05) for y in ys])
    add('density', 'B', list(dens))
    add('bx', 'h', [q(b['x'], 0.125) for b in boxes])
    add('bz', 'h', [q(b['z'], 0.125) for b in boxes])
    add('by', 'h', [q(b['y'], 0.05) for b in boxes])
    add('bw', 'B', [min(255, int(round(b['w'] * 4))) for b in boxes])
    add('bd', 'B', [min(255, int(round(b['d'] * 4))) for b in boxes])
    add('ba', 'B', [int(b['a'] / math.pi * 256) % 256 for b in boxes])
    add('bh', 'B', [min(255, int(round(b['h']))) for b in boxes])
    add('px', 'h', [q(p[0], 0.125) for p in pts])
    add('pz', 'h', [q(p[1], 0.125) for p in pts])
    add('py', 'h', [q(p[2], 0.05) for p in pts])
    add('pk', 'B', [p[3] for p in pts])
    add('far', 'h', [q(y, 0.1) for y in fys])
    head = {
        'grid': {'cx': GRID_C[0], 'cz': GRID_C[1], 'half': GRID_HALF, 'n': tier['n']},
        'far': far,
        'scale': {'ground': 0.05, 'xz': 0.125, 'size': 0.25, 'far': 0.1},
        'sections': sections,
    }
    js = json.dumps(head, separators=(',', ':')).encode()
    js += b' ' * ((-len(js)) % 4)
    return struct.pack('<I', len(js)) + js + b''.join(blobs)


def build_tier(name, tier, ctx):
    dem, prof, blds_path, top, ref = ctx
    ys = heightfield(dem, prof, tier['n'])
    field = Field(ys, tier['n'])
    blds = buildings(blds_path, field, random.Random(1825))
    blds.sort(key=lambda b: b['dp'])
    boxes, rest = blds[:tier['boxes']], blds[tier['boxes']:]
    rng = random.Random(1548)
    # Street lamps between the low blocks too, not only where blocks give way to points.
    lamps = [
        dict(b, x=b['x'] + (rng.random() - 0.5) * (b['w'] + 3), z=b['z'] + (rng.random() - 0.5) * (b['d'] + 3))
        for b in boxes if b['h'] < 12 and rng.random() < 0.3
    ]
    pts = lights(rest + lamps, rng, tier['points'])
    far, fys = far_patch(Dem(dem.work, 12), top, ref, tier['far'])
    data = pack(tier, ys, density(blds, tier['n']), boxes, pts, far, fys)
    out = os.path.join('public', 'data', f'lapaz-{name}.bin')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'wb') as f:
        f.write(data)
    tall = sum(1 for b in boxes if b['h'] > 60)
    print(f'{out}: {len(data)} bytes; {len(blds)} footprints, {len(boxes)} blocks ({tall} over 60 m),'
          f' {len(pts)} lights; boxes reach {boxes[-1]["dp"]:.0f} m from the path')


def main():
    global GRID_C
    work = sys.argv[1]
    os.makedirs(work, exist_ok=True)
    GRID_C = (path_x(-560.0), -560.0)
    dem = Dem(work, 13)
    prof = profile(dem)
    ref = prof(-560.0)
    top_e, top = summit(Dem(work, 12))
    print(f'avenue {prof(CITY[0]):.0f}-{prof(CITY[1]):.0f} m; Illimani {top_e:.0f} m at {top}')
    ctx = (dem, prof, fetch_buildings(work), top, ref)
    for name, tier in TIERS.items():
        build_tier(name, tier, ctx)


if __name__ == '__main__':
    main()
