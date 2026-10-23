import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { ADD, boxes, type Shared, shader, WRAP_VERT } from '@/components/round-trip/world/gl';
import { addMotes } from '@/components/round-trip/world/land';
import { lean } from '@/components/round-trip/world/landmarks';

/** Street level, below the path; the grid the blocks sit on, and one tile of the endless city. */
export const FLOOR = -60;
const GRID = 18;
const COLS = 27;
const ROWS = 24;
const TILE = new THREE.Vector2(COLS * GRID, ROWS * GRID);
const CLEAR = 20;
/** The scanned downtown stands left of the path, from this x outward; no built towers there. */
const DOWNTOWN_X = -55;

/** The wrapping vertex shader, plus where each tower's roof and (wrapped) centre are. */
const TOWER_VERT = WRAP_VERT.replace(
    'varying float vR, vD;',
    'varying float vR, vD, vTop; varying vec3 vS; varying vec2 vC;'
).replace(
    'vW = w.xyz;',
    `vW = w.xyz; vC = wc; vTop = (modelMatrix * instanceMatrix * vec4(0.0, 0.5, 0.0, 1.0)).y;
    vS = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));`
);

/** Skill billboards: atlas row height and width (px), most rows the shader takes, text line height (m). */
const ROW = 36;
const ATLAS_W = 2048;
const MAX_ROWS = 16;
const LINE = 2.4;

/**
 * The scrolling LED text on the billboards: one board per tower shows one skill group, its name on
 * the top line and its items on the bottom one, read from an atlas of those exact strings.
 */
const BOARD = /* glsl */ `
    uniform sampler2D tSkill; uniform float uGroups; uniform float uLen[${MAX_ROWS}];
    const float PITCH = 0.22;
    // Lit LEDs (0-1) for one line of a group at board metres m; du and dv are the uv derivatives.
    float ledText(float grp, float line, vec2 m, vec2 du, vec2 dv, float speed) {
        float row = grp * 2.0 + line;
        float y0 = line > 0.5 ? 1.2 : 5.0;
        float k = ${ROW.toFixed(1)} / (${LINE.toFixed(1)} * ${ATLAS_W.toFixed(1)});
        vec2 q = (floor(m / PITCH) + 0.5) * PITCH;
        float ly = (q.y - y0) / ${LINE.toFixed(1)};
        if (ly < 0.0 || ly > 1.0) return 0.0;
        float len = uLen[int(row)];
        float u = mod((q.x + floor(uTime * speed / PITCH) * PITCH + grp * 7.0) * k, len);
        float v = 1.0 - (row + 1.0 - ly) * ${ROW.toFixed(1)} / (${ROW.toFixed(1)} * uGroups * 2.0);
        return textureGrad(tSkill, vec2(u, v), du, dv).r;
    }
`;

/** Lays the skill groups out as atlas rows (name, then items), white on black, once. */
function skillAtlas(skills: Array<{ group: string; items: string }>): {
    tex: THREE.Texture | null;
    len: number[];
} {
    const len = new Array<number>(MAX_ROWS).fill(1);
    const rows = skills.slice(0, MAX_ROWS / 2).flatMap((s) => [s.group, s.items]);
    if (!rows.length) return { tex: null, len };
    const c = document.createElement('canvas');
    c.width = ATLAS_W;
    c.height = rows.length * ROW;
    const x = c.getContext('2d');
    if (!x) return { tex: null, len };
    x.fillStyle = '#000';
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#fff';
    x.textBaseline = 'middle';
    x.font = `bold ${ROW - 8}px ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace`;
    rows.forEach((t, i) => {
        const w = Math.min(x.measureText(t).width, ATLAS_W - 360);
        x.fillText(t, 0, i * ROW + ROW / 2, ATLAS_W - 360);
        // Text, then a gap of blank board before it comes round again.
        len[i] = (w + 300) / ATLAS_W;
    });
    const tex = new THREE.CanvasTexture(c);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = 8;
    return { tex, len };
}

/**
 * Who is in at night. Each tower keeps its own hours (`mood`); its floors are offices (stacks of
 * three, cool white, nearly every window on), flats (warm, lit in pairs, about half) or dark (a
 * stray lamp). Six windows in ten stay dark. Seen from far off, windows average out per floor and
 * then per tower, so distant facades resolve to calm bands and a calm glow, not static.
 */
const OCCUPANCY = /* glsl */ `
    struct Lights { float lit; vec3 col; float office; };
    Lights occupancy(vec2 cell, float h, float vR, vec2 farA) {
        float mood = fract(vR * 5.17);
        float po = 0.15 + 0.2 * mood;
        float pf = (1.0 - po) * (0.32 + 0.15 * mood);
        float office = step(1.0 - po, hash(vec2(floor(cell.y / 3.0), vR * 13.0)));
        float flats = (1.0 - office) * step(0.68 - 0.15 * mood, hash(vec2(cell.y, vR * 29.0)));
        float dark = 1.0 - office - flats;
        float pair = hash(vec2(floor(cell.x / 2.0), cell.y) + vR * 7.0);
        float one = office * step(0.12, h) + flats * step(0.55, pair) + dark * step(0.97, h);
        float perFloor = office * 0.88 + flats * 0.45 + dark * 0.03;
        float perTower = po * 0.88 + pf * 0.45 + (1.0 - po - pf) * 0.03;
        Lights L;
        L.lit = mix(mix(one, perFloor, farA.x), perTower, farA.y);
        vec3 cool = mix(vec3(0.74, 0.86, 1.0), vec3(0.86, 0.95, 0.9), step(0.7, fract(vR * 2.9)));
        vec3 warm = mix(vec3(1.0, 0.64, 0.38), vec3(1.0, 0.84, 0.62), fract(h * 7.3));
        vec3 warmAvg = vec3(1.0, 0.74, 0.5);
        vec3 floorCol = mix(warmAvg, cool, office);
        vec3 towerCol = (cool * po * 0.88 + warmAvg * (pf * 0.45 + 0.03)) / max(perTower, 1e-3);
        vec3 near = mix(warm, cool, office);
        L.col = mix(mix(near, floorCol, farA.x), towerCol, farA.y);
        L.office = office;
        return L;
    }
`;

/**
 * Facades. Two kinds of tower: concrete with punched windows, and glass curtain walls. Unlit glass
 * reflects the sky (stronger at grazing angles, but held back so edges don't flare white). Lit
 * windows are fake rooms: the back wall shifts with the camera, so each window reads as a lit room
 * with depth; flats have blinds, a few flicker like a TV. Street level glows like shopfronts; some
 * towers wear a lit crown. Towers along the flight path turn a billboard towards it.
 */
const TOWER_FRAG = /* glsl */ `
    uniform sampler2D tEnv; uniform float uEnvOn;
    varying vec3 vW, vN, vL, vWN, vS; varying vec2 vC; varying float vR, vD, vTop;
    ${BOARD}
    ${OCCUPANCY}
    void main() {
        // The tower's random, snapped: interpolation can wobble a "constant" varying in its last
        // bits, and the hashes below would turn that into per-pixel static.
        float R = (floor(vR * 4096.0) + 0.5) / 4096.0;
        vec3 n = normalize(vWN);
        float side = 1.0 - step(0.5, abs(n.y));
        vec2 nh = normalize(n.xz + vec2(1e-4, 0.0));
        vec3 T = vec3(-nh.y, 0.0, nh.x);
        vec2 f = vec2(dot(vW, T), vW.y);
        float glassy = step(0.58, R);
        vec2 cs = mix(vec2(2.4, 3.4), vec2(1.7, 3.1), glassy);
        vec2 cell = floor(f / cs), g = fract(f / cs);
        vec2 lo = mix(vec2(0.15, 0.24), vec2(0.05, 0.12), glassy);
        // Box-filtered by the pixel's footprint in cells, per axis: once a pixel spans a good part
        // of a window across, a floor shows its average; once it spans floors, the whole tower does.
        vec2 fw = clamp(fwidth(f / cs), vec2(1e-4), vec2(0.5));
        vec2 farA = smoothstep(vec2(0.06), vec2(0.22), fw);
        float far = max(farA.x, farA.y);
        vec2 wm = smoothstep(lo - fw, lo + fw, g) * (1.0 - smoothstep(1.0 - lo - fw, 1.0 - lo + fw, g));
        vec2 wa = mix(wm, 1.0 - 2.0 * lo, farA);
        float win = wa.x * wa.y * side;
        float h = hash(cell + R * 91.7);
        Lights L = occupancy(cell, h, R, farA);
        float litP = L.lit;
        // Seen edge-on from afar, glass shows the sky, not the rooms behind it.
        litP *= mix(1.0, smoothstep(0.08, 0.45, abs(dot(normalize(vW - cameraPosition), n))), far);
        float lit = litP * win;

        vec3 V = normalize(vW - cameraPosition);
        float into = max(dot(V, -n), 0.15);
        vec2 bp = (g - 0.5) + vec2(dot(V, T), V.y) / into * (1.3 / cs);
        float backWall = 1.0 - smoothstep(0.36, 0.5, max(abs(bp.x), abs(bp.y)));
        float ceilingLight = smoothstep(-0.3, 0.6, bp.y);
        float tv = step(0.95, fract(h * 3.7)) * (1.0 - L.office);
        float flick = mix(1.0, 0.75 + 0.25 * sin(uTime * (6.0 + h * 9.0) + h * 40.0), tv);
        vec3 wc = mix(L.col, vec3(0.45, 0.65, 1.0), tv);
        float blinds = step(0.6, fract(h * 5.3)) * (1.0 - L.office);
        float slats = mix(1.0, 0.55 + 0.45 * step(0.45, fract(g.y * 10.0)), blinds * (1.0 - smoothstep(0.03, 0.08, fw.y)));
        vec3 room = wc * (0.3 + 0.95 * backWall) * (0.8 + 0.35 * ceilingLight) * flick * slats;
        room = mix(room, L.col * 0.5, far);

        // Glass: the night city's own HDRI by reflection (blurred for roughness), Schlick Fresnel,
        // so face-on glass goes near-black and grazing glass carries the skyline.
        vec3 sky = mix(vec3(0.045, 0.06, 0.1), vec3(0.14, 0.17, 0.26), clamp(0.5 - V.y * 0.6, 0.0, 1.0));
        // Each pane reflects one direction (from its centre), as a flat pane does: per-pixel lookups
        // of the HDRI's tiny street lights sparkle like static wherever its mips can't be filtered.
        vec3 pane = vW + T * (0.5 - g.x) * cs.x + vec3(0.0, (0.5 - g.y) * cs.y, 0.0);
        vec3 Rr = reflect(normalize(pane - cameraPosition), n);
        vec2 euv = vec2(atan(Rr.z, Rr.x) / 6.2831853 + 0.5, asin(clamp(Rr.y, -1.0, 1.0)) / 3.1415927 + 0.5);
        // Its hot street lights are compressed, not clipped: blurred mips would otherwise turn every
        // pane into the same flat white.
        vec3 ev = textureLod(tEnv, euv, 4.0).rgb;
        vec3 env = mix(sky, ev / (1.0 + ev) * 0.6, uEnvOn);
        env = mix(env, sky * 0.8, far);
        float F = 0.04 + 0.96 * pow(1.0 - clamp(abs(dot(V, n)), 0.0, 1.0), 5.0);
        // Grazing glass is capped: full Fresnel lines every tower edge with a white strip.
        vec3 glass = env * (mix(0.12, 0.08, far) + mix(0.8, 0.3, far) * min(F, 0.6));
        float hgt = clamp((vW.y + 60.0) / 210.0, 0.0, 1.0);
        vec3 concrete = mix(vec3(0.02, 0.022, 0.03), vec3(0.06, 0.064, 0.078), hgt) * (0.78 + 0.22 * abs(nh.x));
        concrete *= 0.9 + 0.2 * hash(floor(f * 0.5));
        vec3 curtain = (vec3(0.016, 0.024, 0.04) + glass * 0.55) * mix(1.0, 0.5, mix(step(g.y, lo.y), lo.y, farA.y) * glassy);
        vec3 col = mix(concrete, curtain, glassy);
        col += mix(1.0 - smoothstep(0.0, 0.05, g.y), 0.03, farA.y) * side * (1.0 - glassy) * vec3(0.03);
        col = mix(col, glass, win * (1.0 - litP));
        col = mix(col, room * 1.15 + glass * 0.2, lit);
        float shop = side * step(0.35, R) * smoothstep(-60.0, -59.0, vW.y) * (1.0 - smoothstep(-56.0, -55.0, vW.y));
        col += shop * mix(vec3(1.0, 0.7, 0.45), vec3(0.6, 0.85, 1.0), step(0.8, R)) * 0.8 * (1.0 - uDrop * 0.75);
        // Roofs: a parapet rim and a plant room in the middle, not a flat lid.
        float hut = step(abs(vL.x), 0.2) * step(abs(vL.z), 0.2);
        float rim = step(0.44, max(abs(vL.x), abs(vL.z)));
        col = mix(col, vec3(0.025, 0.03, 0.042) * (1.0 + 0.8 * rim) + vec3(0.03, 0.028, 0.025) * hut, step(0.5, n.y));
        // LED billboards: a few of the taller towers carry one up high; most towers along the flight
        // path turn one towards it at the ship's height, on their full-width face. A 9 m panel in a
        // dark frame, scrolling one skill group (its name above, its items below).
        float pick = fract(R * 11.3);
        float toPath = pathX(vC.y) - vC.x;
        float lane = (1.0 - step(46.0, abs(toPath))) * step(0.7, n.x * sign(toPath)) * step(0.45, max(abs(vL.x), abs(vL.z)));
        float yb = -14.0 + 9.0 * fract(R * 3.9);
        lane *= step(0.45, pick) * step(yb + 11.0, vTop);
        float high = step(0.82, pick) * step(60.0, vTop + 60.0) * (1.0 - lane);
        float board = max(high, lane) * side;
        float bw = mix(0.72, 0.9, lane) * dot(vS.xz, abs(T.xz));
        // Metres from the panel's lower left as seen from outside (T runs right to left).
        vec2 bm = vec2(bw * 0.5 - dot(vL.xz * vS.xz, T.xz), mix((vL.y + 0.25 - 0.3 * fract(R * 3.9)) * vS.y, vW.y - yb, lane));
        vec2 buv = bm / vec2(bw, 9.0);
        float onBoard = step(0.0, buv.x) * step(buv.x, 1.0) * step(0.0, buv.y) * step(buv.y, 1.0) * board;
        float frameB = step(0.03, buv.x) * step(buv.x, 0.97) * step(0.05, buv.y) * step(buv.y, 0.95);
        vec3 hueA = mix(vec3(1.0, 0.25, 0.5), vec3(0.2, 0.7, 1.0), step(0.5, fract(R * 6.7)));
        vec3 hueB = mix(vec3(1.0, 0.6, 0.15), vec3(0.5, 1.0, 0.7), step(0.5, fract(R * 4.3)));
        vec3 screen = mix(hueA, hueB, fbm(buv * vec2(3.0, 1.5) + uTime * 0.15 + R * 7.0)) * (0.5 + 0.5 * fbm(buv * 6.0 - uTime * 0.1));
        // Atlas uv per board metre, for mip selection (taken here: derivatives need every pixel).
        vec2 sk = bm * vec2(${ROW.toFixed(1)} / (${LINE.toFixed(1)} * ${ATLAS_W.toFixed(1)}), 1.0 / (${LINE.toFixed(1)} * max(uGroups, 1.0) * 2.0));
        vec2 du = dFdx(sk), dv = dFdy(sk);
        vec2 led = fract(bm / PITCH) - 0.5;
        float dots = mix(smoothstep(0.5, 0.3, length(led)), 0.6, smoothstep(0.3, 0.6, max(fwidth(bm.x), fwidth(bm.y)) / PITCH));
        vec3 text = vec3(0.0);
        if (onBoard * frameB > 0.5 && uGroups > 0.5) {
            float grp = mod(floor(fract(R * 17.9) * 97.0), uGroups);
            text = hueA * ledText(grp, 0.0, bm, du, dv, 2.0) + vec3(1.0, 0.92, 0.8) * ledText(grp, 1.0, bm, du, dv, 3.6);
        }
        col = mix(col, vec3(0.01), onBoard);
        // The panel's glow spills a little onto the wall around it.
        float spill = side * max(high, lane) * (1.0 - onBoard) * exp(-max(max(-buv.y, buv.y - 1.0) * 9.0, 0.0) * 2.0)
            * step(-0.05, buv.x) * step(buv.x, 1.05);
        col += hueA * spill * 0.05;
        col += (screen * mix(1.7, 0.16, step(0.5, uGroups)) + text * 2.4 * dots) * onBoard * frameB;
        // A lit crown on some towers: a band of light around the top floors and a parapet line.
        float crowned = step(0.7, fract(R * 7.31)) * side;
        float band = smoothstep(vTop - 9.0, vTop - 8.0, vW.y) * (1.0 - smoothstep(vTop - 3.0, vTop - 2.4, vW.y));
        float parapet = smoothstep(vTop - 0.9, vTop - 0.4, vW.y);
        vec3 crownCol = mix(vec3(1.0, 0.82, 0.55), vec3(0.6, 0.85, 1.0), step(0.5, fract(R * 3.7)));
        col += crownCol * (band * 0.35 + parapet * 0.5) * crowned;
        col += vec3(1.0, 0.86, 0.7) * glowAt(vW, 18.0) * 0.1;
        gl_FragColor = vec4(fogAt(col, vD, vW), 1.0);
    }
`;

type Tower = { x: number; z: number; h: number; w: number; d: number; kind: number; spire: number };

/** Tower shapes, each one unit tall around its centre: a plain slab, a setback, an octagon. */
function shapes(): THREE.BufferGeometry[] {
    const box = (w: number, h: number, y: number): THREE.BufferGeometry =>
        new THREE.BoxGeometry(w, h, w).translate(0, y, 0);
    // Flat-shaded: smooth normals would bend the window grid across each face and flare its edges.
    const oct = (r: number, h: number, y: number): THREE.BufferGeometry => {
        const g = new THREE.CylinderGeometry(r, r, h, 8, 1)
            .rotateY(Math.PI / 8)
            .translate(0, y, 0)
            .toNonIndexed();
        g.computeVertexNormals();
        return g;
    };
    const setback = mergeGeometries(
        [box(1, 0.22, -0.39), box(0.78, 0.5, -0.03), box(0.52, 0.28, 0.36)].map((g) => g.toNonIndexed())
    );
    const octagon = mergeGeometries([oct(0.56, 0.82, -0.09), oct(0.4, 0.18, 0.41)]);
    return [new THREE.BoxGeometry(1, 1, 1), setback, octagon];
}

/** Tall towers step back or turn octagonal (a few short ones step back too). */
const shapeFor = (h: number, pick: number): number => {
    if (h <= 90) return pick < 0.2 ? 1 : 0;
    return pick < 0.45 ? 1 : pick < 0.75 ? 2 : 0;
};

function tower(x: number, z: number, rand: () => number): Tower {
    // A few supertalls stand clear of the rest.
    const h =
        (22 + Math.pow(rand(), 1.8) * 175 * (1 - (Math.abs(x) / 240) * 0.4)) * (rand() < 0.05 ? 1.55 : 1);
    const kind = shapeFor(h, rand());
    const w = 8 + rand() * 5;
    const d = kind === 2 ? w : 8 + rand() * 5;
    // The tallest shaped towers carry a spire.
    const spire = h > 120 && kind > 0 ? 8 + rand() * 14 : 0;
    return { x, z, h, w, d, kind, spire };
}

/** Lays out one tile of blocks, leaving the strip where the scanned downtown stands. */
function planTowers(rand: () => number): Tower[] {
    const towers: Tower[] = [];
    for (let k = 0; k < COLS; k++)
        for (let j = 0; j < ROWS; j++) {
            const x = (k - (COLS - 1) / 2) * GRID + (rand() - 0.5) * 3;
            const z = -j * GRID + (rand() - 0.5) * 3;
            const t = tower(x, z, rand);
            if (x > DOWNTOWN_X) towers.push(t);
        }
    return towers;
}

/**
 * The scan, graded for the night it is flown through. Its texture is a photograph: lamps, signs and
 * lit windows (bright and saturated) are kept as light; the rest, and the grey filler where the
 * camera never saw, sinks into a cool dark that the moon picks out by face (normals from the
 * surface itself: the scan has none). On the walls, a grid of rooms lit here and there, averaged
 * out with distance as the built towers do; warm light from the streets climbs the lowest floors.
 */
const SCAN_VERT = /* glsl */ `varying vec2 vUv; varying vec3 vW; varying float vD;
    void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`;
const SCAN_FRAG = /* glsl */ `
    uniform sampler2D tMap; varying vec2 vUv; varying vec3 vW; varying float vD;
    void main() {
        vec3 t = texture2D(tMap, vUv).rgb;
        float L = dot(t, vec3(0.2126, 0.7152, 0.0722));
        float hi = max(t.r, max(t.g, t.b));
        float sat = (hi - min(t.r, min(t.g, t.b))) / max(hi, 1e-3);
        float lamp = smoothstep(0.1, 0.4, L) * smoothstep(0.25, 0.6, sat) + smoothstep(0.35, 0.75, L) * 0.5;
        vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
        float side = 1.0 - smoothstep(0.4, 0.7, abs(n.y));
        float moon = max(dot(n, MOON_DIR), 0.0);
        vec3 col = t * vec3(0.5, 0.6, 0.85) * (0.34 + 0.25 * moon) + vec3(0.006, 0.009, 0.016);
        col += t * lamp * 2.4;
        // Rooms: a window grid on the walls, about one in five lit.
        // On fixed axes (whichever the wall faces more), so a rough scan keeps a steady grid.
        vec2 f = vec2(abs(n.x) > abs(n.z) ? vW.z : vW.x, vW.y) / vec2(2.3, 3.4);
        vec2 fw = clamp(fwidth(f), vec2(1e-4), vec2(0.5));
        float far = smoothstep(0.08, 0.3, max(fw.x, fw.y));
        vec2 g = fract(f);
        vec2 wm = smoothstep(0.18 - fw, 0.18 + fw, g) * (1.0 - smoothstep(0.82 - fw, 0.82 + fw, g));
        float h = hash(floor(f) + floor(f.x / 9.0) * 7.1);
        float lit = mix(step(0.84, h) * wm.x * wm.y, 0.16 * 0.41, far) * side * smoothstep(${(FLOOR + 3).toFixed(1)}, ${(FLOOR + 6).toFixed(1)}, vW.y);
        vec3 room = mix(vec3(1.0, 0.7, 0.42), vec3(0.75, 0.86, 1.0), step(0.93, h)) * (0.7 + 0.3 * fract(h * 13.0));
        col += room * lit * 0.45 * (1.0 - lamp);
        col += vec3(1.0, 0.6, 0.32) * 0.05 * exp(-(vW.y - ${FLOOR.toFixed(1)}) / 14.0);
        gl_FragColor = vec4(fogAt(col, vD, vW), 1.0);
    }
`;

/** Aviation lights on the scan's tallest roofs: local high points over its upper half (model units). */
function scanRoofs(model: THREE.Object3D, box: THREE.Box3): THREE.Vector3[] {
    const size = box.getSize(new THREE.Vector3());
    const N = 28;
    const top = new Float32Array(N * N).fill(-Infinity);
    const at = new Array<THREE.Vector3 | null>(N * N).fill(null);
    const v = new THREE.Vector3();
    model.updateMatrixWorld(true);
    model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const p = m.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
            const cx = Math.min(N - 1, Math.floor(((v.x - box.min.x) / size.x) * N));
            const cz = Math.min(N - 1, Math.floor(((v.z - box.min.z) / size.z) * N));
            const c = cz * N + cx;
            if (v.y > top[c]) {
                top[c] = v.y;
                at[c] = v.clone();
            }
        }
    });
    const peak = (cx: number, cz: number): boolean => {
        const y = top[cz * N + cx];
        if (y < box.min.y + size.y * 0.42) return false;
        for (let dz = -1; dz <= 1; dz++)
            for (let dx = -1; dx <= 1; dx++) {
                const x = cx + dx;
                const z = cz + dz;
                if ((dx || dz) && x >= 0 && z >= 0 && x < N && z < N && top[z * N + x] > y) return false;
            }
        return true;
    };
    const roofs: THREE.Vector3[] = [];
    for (let cz = 0; cz < N; cz++)
        for (let cx = 0; cx < N; cx++) if (peak(cx, cz)) roofs.push(at[cz * N + cx] as THREE.Vector3);
    return roofs;
}

/** Red obstruction lights at the given points: slow, out of step, a soft flash rather than a cut. */
function roofLights(s: Shared, points: THREE.Vector3[]): THREE.Points {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    const pts = new THREE.Points(
        g,
        shader(
            s,
            /* glsl */ `varying float vD, vP;
            void main() { vP = fract(dot(position, vec3(0.137, 0.071, 0.113)));
                vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z;
                gl_PointSize = clamp(uPR * 1100.0 / vD, 2.0, 20.0); gl_Position = projectionMatrix * mv; }`,
            /* glsl */ `varying float vD, vP;
            void main() { float ph = fract(uTime * 0.5 + vP); float on = smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.35, 0.6, ph));
                float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
                gl_FragColor = vec4(vec3(2.6, 0.18, 0.1) * a * (0.12 + 0.88 * on) * fade(vD * 0.7), 1.0); }`,
            {},
            ADD
        )
    );
    pts.frustumCulled = false;
    return pts;
}

/**
 * The downtown: "Osaka downtown" by matousekfoto (Sketchfab, CC BY 4.0), a night photogrammetry
 * scan of lit towers, standing on the left of the path, graded by SCAN_FRAG and in the same air as
 * the rest of the city. Three copies ride along the path so it never ends.
 */
function addDowntown(
    scene: THREE.Object3D,
    s: Shared,
    small: boolean
): { update: (eye: THREE.Vector3) => void } {
    const copies: THREE.Group[] = [0, 1, 2].map(() => {
        const g = new THREE.Group();
        scene.add(g);
        return g;
    });
    let period = 500;
    let x = DOWNTOWN_X - 220;
    // 4.8 MB even for phones: skipped on Save-Data or a slow connection; the towers stand alone.
    if (lean()) return { update: () => undefined };
    new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .loadAsync(`/models/osaka-${small ? 'lo' : 'hi'}.glb`)
        .then((gltf) => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            // Its tallest tower reaches 150 m; the block then runs ~470 m along the path.
            const k = 150 / size.y;
            period = size.z * k * 0.97;
            x = DOWNTOWN_X - (size.x * k) / 2;
            const center = box.getCenter(new THREE.Vector3());
            const shift = new THREE.Vector3(-center.x * k, -box.min.y * k, -center.z * k);
            const roofs = scanRoofs(model, box).map((p) => p.multiplyScalar(k).add(shift));
            model.traverse((o) => {
                const m = o as THREE.Mesh;
                if (!m.isMesh) return;
                const old = m.material as THREE.MeshStandardMaterial;
                m.material = shader(
                    s,
                    SCAN_VERT,
                    SCAN_FRAG,
                    { tMap: { value: old.map } },
                    { side: THREE.DoubleSide }
                );
                m.frustumCulled = false;
            });
            copies.forEach((g) => {
                const c = model.clone();
                c.scale.setScalar(k);
                c.position.copy(shift);
                g.add(c);
                if (roofs.length) g.add(roofLights(s, roofs));
            });
        })
        .catch(() => undefined);
    return {
        update: (eye) => {
            const base = Math.round(eye.z / period) * period;
            copies.forEach((g, i) => g.position.set(x, FLOOR - 1.5, base + (i - 1) * period));
        },
    };
}

/** Slim dark masts on the tallest setback and octagonal towers. */
function addSpires(
    scene: THREE.Object3D,
    towers: Tower[],
    s: Shared,
    wrap: Record<string, THREE.IUniform>,
    rand: () => number
): void {
    const q = new THREE.Quaternion();
    const spires = towers
        .filter((t) => t.spire > 0)
        .map((t) =>
            new THREE.Matrix4().compose(
                new THREE.Vector3(t.x, FLOOR + t.h + t.spire / 2, t.z),
                q,
                new THREE.Vector3(0.9, t.spire, 0.9)
            )
        );
    if (!spires.length) return;
    const material = shader(
        s,
        WRAP_VERT,
        /* glsl */ `varying vec3 vW, vN, vL, vWN; varying float vR, vD;
        void main() { vec3 V = normalize(vW - cameraPosition); float rim = pow(1.0 - abs(dot(normalize(vWN), V)), 3.0);
            gl_FragColor = vec4(fogIt(vec3(0.03, 0.035, 0.045) + vec3(0.12, 0.15, 0.22) * rim, vD), 1.0); }`,
        wrap
    );
    scene.add(boxes(material, spires, rand, new THREE.CylinderGeometry(0.05, 0.5, 1, 6)));
}

/** One tile of blocks; the shader repeats it around the camera and keeps the flight path clear. */
function addTowers(
    scene: THREE.Object3D,
    s: Shared,
    rand: () => number,
    env: Env,
    skills: Array<{ group: string; items: string }>
): Tower[] {
    const towers = planTowers(rand);
    const q = new THREE.Quaternion();
    const wrap = { uTile: { value: TILE }, uClear: { value: CLEAR } };
    const atlas = skillAtlas(skills);
    const material = shader(s, TOWER_VERT, TOWER_FRAG, {
        ...wrap,
        tEnv: env.tEnv,
        uEnvOn: env.uEnvOn,
        tSkill: { value: atlas.tex },
        uGroups: { value: atlas.tex ? Math.min(skills.length, MAX_ROWS / 2) : 0 },
        uLen: { value: atlas.len },
    });
    shapes().forEach((geo, kind) => {
        const mine = towers.filter((t) => t.kind === kind);
        if (!mine.length) return;
        const transforms = mine.map((t) =>
            new THREE.Matrix4().compose(
                new THREE.Vector3(t.x, FLOOR + t.h / 2, t.z),
                q,
                new THREE.Vector3(t.w, t.h, t.d)
            )
        );
        scene.add(boxes(material, transforms, rand, geo));
    });
    addSpires(scene, towers, s, wrap, rand);
    return towers;
}

/** Blinking red aviation lights on the masts of the tallest towers. */
function addBeacons(scene: THREE.Object3D, towers: Tower[], s: Shared, rand: () => number): void {
    const lights: number[] = [];
    for (const t of towers) if (t.h > 115) lights.push(t.x, FLOOR + t.h + (t.spire || 1.5 + rand()), t.z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(lights, 3));
    const blink = new THREE.Points(
        g,
        shader(
            s,
            /* glsl */ `uniform vec2 uTile; uniform float uClear; varying float vD; varying float vP;
            void main() {
                vec3 p = position; p.xz = wrapAround(p.xz, uTile); vP = fract(position.x * 0.137);
                vec4 mv = viewMatrix * vec4(p, 1.0); vD = -mv.z;
                gl_PointSize = abs(p.x - pathX(p.z)) < uClear ? 0.0 : min(22.0, uPR * 900.0 / vD);
                gl_Position = projectionMatrix * mv; }`,
            /* glsl */ `varying float vD; varying float vP;
            void main() { float on = step(0.55, fract(uTime * 0.6 + vP)); float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
                gl_FragColor = vec4(vec3(2.4, 0.15, 0.1) * a * on * fade(vD), 1.0); }`,
            { uTile: { value: TILE }, uClear: { value: CLEAR } },
            ADD
        )
    );
    blink.frustumCulled = false;
    scene.add(blink);
}

/**
 * Wet streets. Grid streets run between the blocks (their centre lines 9 m off the 18 m grid) and a
 * boulevard follows the flight path, so there is always a lit street below the ship. Lamps every
 * 12 m pool sodium light on the grid and white light along the boulevard; shopfronts spill colour
 * on the pavement. Puddles (large-scale noise) mirror the city; between them the road only smears
 * the lights. Desktop renders a real mirrored city for the puddles; phones get the lamps' own sheen.
 * Lamps are light sources, so the haze dims them less than the asphalt.
 */
const STREET_FRAG = /* glsl */ `
    uniform sampler2D tReflect; uniform float uMirror;
    varying vec4 vRuv; varying vec3 vW; varying float vD;
    // A row of lamps 'gap' metres apart: their pool and their bright head, 'across' metres off the row.
    vec2 lamps(float across, float along, float gap) {
        vec2 l = vec2(across, (fract(along / gap) - 0.5) * gap);
        float d2 = dot(l, l);
        return vec2(exp(-d2 / 10.0), exp(-d2 / 0.12));
    }
    void main() {
        vec3 V = normalize(vW - cameraPosition);
        float puddle = smoothstep(0.48, 0.6, fbm(vW.xz * 0.045));
        float grain = fbm(vW.xz * 1.9);
        // Metres to the nearest street centre line, along x and along z; and across the boulevard.
        vec2 q = abs(fract(vW.xz / 18.0) - 0.5) * 18.0;
        float bq = abs(vW.x - pathX(vW.z));
        float road = max(max(step(q.x, 3.6), step(q.y, 3.6)), step(bq, 13.0));
        vec3 asphalt = mix(vec3(0.03, 0.032, 0.038), vec3(0.01, 0.012, 0.018), road) * (0.6 + 0.8 * grain);
        // Dashed centre lines, and the boulevard's lanes either side of its median.
        float grid = step(13.0, bq);
        float lanes = step(abs(fract(bq / 4.2) - 0.5) * 4.2, 0.1) * step(0.5, fract(vW.z / 7.0)) * (1.0 - grid);
        float dashes = step(q.x, 0.1) * step(0.5, fract(vW.z / 6.0)) + step(q.y, 0.1) * step(0.5, fract(vW.x / 6.0));
        float marks = max(dashes * grid, lanes);
        vec3 base = asphalt + vec3(0.5, 0.52, 0.55) * marks * 0.06 * (1.0 - puddle * 0.6);
        // Street lamps on the kerbs of the grid (sodium) and along the boulevard (white LED).
        vec2 lx = lamps(q.x - 3.3, vW.z, 12.0), lz = lamps(q.y - 3.3, vW.x, 12.0);
        vec2 lb = lamps(bq - 13.0, vW.z, 15.0), lm = lamps(bq, vW.z + 7.5, 15.0);
        vec3 light = vec3(1.0, 0.68, 0.38) * (lx.x + lz.x) * 0.5 * grid + vec3(0.82, 0.9, 1.0) * (lb.x + lm.x) * 0.4;
        vec3 heads = vec3(1.0, 0.8, 0.55) * (lx.y + lz.y) * grid + vec3(0.9, 0.95, 1.0) * (lb.y + lm.y);
        // Shopfronts: colour spilling onto the pavement at the foot of the blocks.
        vec2 blk = floor(vW.xz / 18.0);
        vec3 shopCol = mix(vec3(1.0, 0.55, 0.3), vec3(0.4, 0.75, 1.0), step(0.6, hash(blk)));
        float shop = (exp(-pow(q.x - 4.8, 2.0) / 1.2) + exp(-pow(q.y - 4.8, 2.0) / 1.2)) * step(0.35, hash(blk + 3.1));
        light += shopCol * shop * 0.12;
        // Wet: puddles reflect strongly even looking down; the lamps glare off them.
        float wet = mix(0.15, 1.0, puddle) * mix(0.3, 1.0, pow(1.0 - abs(V.y), 3.0));
        vec2 ripple = (vec2(fbm(vW.xz * 0.8 + uTime * 0.04), fbm(vW.xz * 0.8 - uTime * 0.04)) - 0.5) * 0.035;
        vec4 uv = vRuv;
        uv.xy += ripple * uv.w * (1.0 - puddle * 0.75);
        // One tap, blurrier on rough asphalt than in the puddles (the target has mips).
        vec3 refl = texture2DProj(tReflect, uv, mix(4.0, 0.5, puddle)).rgb * uMirror;
        vec3 emit = light * (1.0 + puddle * 0.8) + heads * 1.4 + refl * wet;
        vec3 lp = vec3(uPacket.x, vW.y, uPacket.z);
        emit += vec3(1.0, 0.75, 0.5) * exp(-dot(vW - lp, vW - lp) / 900.0) * 0.1;
        gl_FragColor = vec4(fogIt(base, vD) + emit * (1.0 - uDrop * 0.5) * fade(vD * 0.6), 1.0);
    }
`;

export type City = {
    /** The street follows the ship; mirroring runs only while the city is on screen. */
    update: (eye: THREE.Vector3, on: boolean) => void;
};

/** The night HDRI, once it has loaded, for the glass to reflect. */
export type Env = { tEnv: THREE.IUniform<THREE.Texture | null>; uEnvOn: THREE.IUniform<number> };

function addStreets(scene: THREE.Object3D, s: Shared, mirror: boolean): City {
    const geo = new THREE.PlaneGeometry(900, 900);
    // The reflector renders the mirrored city; its own material is swapped for the asphalt above.
    const floor = mirror
        ? new Reflector(geo, { textureWidth: 1024, textureHeight: 640, clipBias: 0.003 })
        : new THREE.Mesh(geo);
    if (mirror) {
        const target = (floor as Reflector).getRenderTarget();
        target.texture.generateMipmaps = true;
        target.texture.minFilter = THREE.LinearMipmapLinearFilter;
    }
    const reflectUniforms = mirror
        ? ((floor as Reflector).material as THREE.ShaderMaterial).uniforms
        : { tDiffuse: { value: null }, textureMatrix: { value: new THREE.Matrix4() } };
    floor.material = shader(
        s,
        /* glsl */ `uniform mat4 textureMatrix; varying vec4 vRuv; varying vec3 vW; varying float vD;
        void main() { vRuv = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
            vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
        STREET_FRAG,
        {
            tReflect: reflectUniforms.tDiffuse,
            textureMatrix: reflectUniforms.textureMatrix,
            uMirror: { value: mirror ? 1 : 0 },
        }
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR;
    scene.add(floor);
    return {
        update: (eye, on) => {
            floor.position.x = eye.x;
            floor.position.z = eye.z - 200;
            floor.visible = on;
        },
    };
}

/** One car: where its lane starts, which way it drives, its speed and loop length, its light. */
type Car = { base: number[]; dir: number[]; sp: number[]; col: number[]; blvd: number };

/** A car on the grid streets (`blvd` 0) or on the boulevard under the flight path (1). */
function car(rand: () => number, onBoulevard: boolean): Car {
    const fwd = rand() < 0.5 ? 1 : -1;
    const phase = rand() * 1000; // kept in the unused y of the direction
    const col = fwd > 0 ? [2.6, 2.2, 1.7] : [2.6, 0.35, 0.22];
    const speed = 8 + rand() * 22;
    if (onBoulevard) {
        // Three lanes each way either side of the median; x is the offset from the path.
        const lane = fwd * (2 + Math.floor(rand() * 3) * 3.6);
        return { base: [lane, FLOOR + 0.6, 0], dir: [0, phase, fwd], sp: [speed, TILE.y], col, blvd: 1 };
    }
    if (rand() < 0.55) {
        const x = (Math.floor(rand() * COLS) - (COLS - 1) / 2) * GRID + 9 + fwd * 1.6;
        return { base: [x, FLOOR + 0.6, 0], dir: [0, phase, fwd], sp: [speed, TILE.y], col, blvd: 0 };
    }
    const z = -Math.floor(rand() * ROWS) * GRID - 9 + fwd * 1.6;
    return { base: [0, FLOOR + 0.6, z], dir: [fwd, phase, 0], sp: [speed, TILE.x], col, blvd: 0 };
}

/** Other requests driving the streets: white heading one way, red the other. */
function addTraffic(scene: THREE.Object3D, s: Shared, density: number, rand: () => number): void {
    const cars = [
        ...Array.from({ length: Math.round(900 * density) }, () => car(rand, false)),
        ...Array.from({ length: Math.round(220 * density) }, () => car(rand, true)),
    ];
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.setIndex(unit.index);
    g.setAttribute('position', unit.getAttribute('position'));
    g.instanceCount = cars.length;
    const attr = (pick: (c: Car) => number[], size: number): THREE.InstancedBufferAttribute =>
        new THREE.InstancedBufferAttribute(new Float32Array(cars.flatMap(pick)), size);
    g.setAttribute(
        'aBase',
        attr((c) => c.base, 3)
    );
    g.setAttribute(
        'aDir',
        attr((c) => c.dir, 3)
    );
    g.setAttribute(
        'aSp',
        attr((c) => c.sp, 2)
    );
    g.setAttribute(
        'aCol',
        attr((c) => c.col, 3)
    );
    g.setAttribute(
        'aBlvd',
        attr((c) => [c.blvd], 1)
    );
    const mesh = new THREE.Mesh(
        g,
        shader(
            s,
            /* glsl */ `uniform vec2 uTile; attribute vec3 aBase, aDir, aCol; attribute vec2 aSp; attribute float aBlvd;
            varying vec3 vC; varying float vD;
            void main() {
                vec3 d = vec3(aDir.x, 0.0, aDir.z);
                vec3 lp = (abs(d.x) > 0.5 ? position.zyx : position) * vec3(0.35, 0.18, 2.2);
                float s = mod(uTime * aSp.x + aDir.y, aSp.y) - aSp.y * 0.5;
                vC = aCol;
                vec3 c = aBase + d * s;
                c.xz = wrapAround(c.xz, uTile);
                // Boulevard cars keep to their lane under the swaying flight path.
                c.x = mix(c.x, pathX(c.z) + aBase.x, aBlvd);
                vec4 mv = viewMatrix * vec4(c + lp, 1.0);
                vD = -mv.z;
                gl_Position = projectionMatrix * mv;
            }`,
            /* glsl */ `varying vec3 vC; varying float vD; void main() { gl_FragColor = vec4(fogIt(vC * (1.0 - uDrop * 0.8), vD * 0.7), 1.0); }`,
            { uTile: { value: TILE } }
        )
    );
    mesh.frustumCulled = false;
    scene.add(mesh);
}

/** 2 · Edge: an endless night city of towers the ship weaves above, in the rain. */
export function addCity(
    scene: THREE.Object3D,
    s: Shared,
    density: number,
    rand: () => number,
    env: Env,
    skills: Array<{ group: string; items: string }> = []
): City {
    const towers = addTowers(scene, s, rand, env, skills);
    const downtown = addDowntown(scene, s, density < 1);
    addBeacons(scene, towers, s, rand);
    addTraffic(scene, s, density, rand);
    addMotes(
        scene,
        s,
        {
            n: Math.round(2200 * density),
            tile: 120,
            y: [FLOOR, 70],
            colour: new THREE.Color(0.55, 0.65, 0.8),
            size: 0.6,
            mode: 2,
            fall: 24,
        },
        rand
    );
    const streets = addStreets(scene, s, density >= 1);
    return {
        update: (eye, on) => {
            streets.update(eye, on);
            downtown.update(eye);
        },
    };
}
