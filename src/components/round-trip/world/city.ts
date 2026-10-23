import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

import { ADD, boxes, rng, type Shared, shader } from '@/components/round-trip/world/gl';
import { addMotes } from '@/components/round-trip/world/land';
import { lean } from '@/components/round-trip/world/landmarks';

/**
 * 2 · Edge: La Paz, Bolivia, at night. The city fills a canyon bowl below the El Alto plateau; its
 * lights climb the walls from the towers of El Prado, and Illimani stands to the south-east. Built
 * by scripts/lapaz.py from open data: ground from AWS Terrain Tiles (SRTM, GMTED2010: USGS; ETOPO1:
 * NOAA), footprints from Google Open Buildings (CC BY 4.0). The map is drawn at 2:5 across and its
 * relief at 0.55, levelled along the avenue the ship follows; building heights are stylised (no
 * open height data): towers along the Prado, one to three storeys up the walls.
 */

/** Street level of the avenue, below the path. */
export const FLOOR = -60;
/** The avenue the ship follows (the stretch under the flight path is levelled to FLOOR). */
const AVENUE = { half: 13, edge: 48, from: -180, to: -1100 };
/** Illimani is drawn at this fraction of its distance (and size), so it stands inside the sky. */
const FAR_K = 0.2;
/** Towers this tall carry red obstruction lights. */
const BEACON_H = 75;

/**
 * The bowl's own air: far thinner than the world's fog so the canyon walls read across it, and
 * only a trace of the ground mist (which would otherwise fill the bowl at street level).
 */
const CITY_AIR = /* glsl */ `
    float cityAir(float d, vec3 w) { return 1.0 - exp(-uFog * 0.14 * d - 0.08 * mist(w, d)); }
    vec3 cityFog(vec3 c, float d, vec3 w) { return mix(c, haze(normalize(w - cameraPosition)), cityAir(d, w)); }
    float cityFade(float d) { return exp(-uFog * 0.1 * d); }
`;

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
 * Who is in at night. Each building keeps its own hours (`mood`); its floors are offices (stacks of
 * three, cool white, nearly every window on), flats (warm, lit in pairs, about half) or dark (a
 * stray lamp). Six windows in ten stay dark. Seen from far off, windows average out per floor and
 * then per building, so distant facades resolve to calm bands and a calm glow, not static.
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
 * Each block, from its real footprint's rectangle: where its centre and roof are, its size, and
 * which way its own x axis runs (footprints are turned every which way).
 */
const BLOCK_VERT = /* glsl */ `
    attribute float aRand;
    varying vec3 vW, vN, vL, vWN, vS; varying vec2 vC, vAx; varying float vR, vD, vTop;
    void main() {
        vL = position; vN = normal; vR = aRand;
        mat4 m = modelMatrix * instanceMatrix;
        vC = (m * vec4(0.0, 0.0, 0.0, 1.0)).xz;
        vTop = (m * vec4(0.0, 0.5, 0.0, 1.0)).y;
        vS = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vAx = instanceMatrix[0].xz / vS.x;
        vWN = normalize(mat3(m) * normal);
        vec4 w = m * vec4(position, 1.0);
        vW = w.xyz;
        vec4 mv = viewMatrix * w;
        vD = -mv.z;
        gl_Position = projectionMatrix * mv;
    }
`;

/**
 * Facades. Two kinds of building: concrete with punched windows, and glass curtain walls. Unlit
 * glass reflects the sky (stronger at grazing angles, but held back so edges don't flare white).
 * Lit windows are fake rooms: the back wall shifts with the camera, so each window reads as a lit
 * room with depth; flats have blinds, a few flicker like a TV. Street level glows like shopfronts;
 * some towers wear a lit crown. Towers along the avenue turn a billboard towards the flight path.
 */
const BLOCK_FRAG = /* glsl */ `
    uniform sampler2D tEnv; uniform float uEnvOn;
    varying vec3 vW, vN, vL, vWN, vS; varying vec2 vC, vAx; varying float vR, vD, vTop;
    ${CITY_AIR}
    ${BOARD}
    ${OCCUPANCY}
    void main() {
        // The block's random, snapped: interpolation can wobble a "constant" varying in its last
        // bits, and the hashes below would turn that into per-pixel static.
        float R = (floor(vR * 4096.0) + 0.5) / 4096.0;
        vec3 n = normalize(vWN);
        float side = 1.0 - step(0.5, abs(n.y));
        vec2 nh = normalize(n.xz + vec2(1e-4, 0.0));
        vec3 T = vec3(-nh.y, 0.0, nh.x);
        vec2 f = vec2(dot(vW, T), vW.y);
        float tower = step(30.0, vS.y);
        float glassy = step(0.58, R) * tower;
        vec2 cs = mix(vec2(2.4, 3.4), vec2(1.7, 3.1), glassy);
        vec2 cell = floor(f / cs), g = fract(f / cs);
        vec2 lo = mix(vec2(0.15, 0.24), vec2(0.05, 0.12), glassy);
        // Box-filtered by the pixel's footprint in cells, per axis: once a pixel spans a good part
        // of a window across, a floor shows its average; once it spans floors, the whole block does.
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
        float base = vTop - vS.y;
        float hgt = clamp((vW.y - base) / 150.0, 0.0, 1.0);
        // Towers in grey concrete; the low blocks up the walls in bare brick, as most are there.
        vec3 wall = mix(vec3(0.02, 0.022, 0.03), vec3(0.035, 0.022, 0.018), 1.0 - tower);
        vec3 concrete = mix(wall, vec3(0.06, 0.064, 0.078), hgt) * (0.78 + 0.22 * abs(nh.x));
        concrete *= 0.9 + 0.2 * hash(floor(f * 0.5));
        vec3 curtain = (vec3(0.016, 0.024, 0.04) + glass * 0.55) * mix(1.0, 0.5, mix(step(g.y, lo.y), lo.y, farA.y) * glassy);
        vec3 col = mix(concrete, curtain, glassy);
        col += mix(1.0 - smoothstep(0.0, 0.05, g.y), 0.03, farA.y) * side * (1.0 - glassy) * vec3(0.03);
        col = mix(col, glass * mix(0.25, 1.0, tower), win * (1.0 - litP));
        col = mix(col, room * 1.15 + glass * 0.2, lit);
        float shop = side * step(0.35, R) * smoothstep(base, base + 1.0, vW.y) * (1.0 - smoothstep(base + 4.0, base + 5.0, vW.y));
        col += shop * mix(vec3(1.0, 0.7, 0.45), vec3(0.6, 0.85, 1.0), step(0.8, R)) * 0.8 * (1.0 - uDrop * 0.75);
        // Roofs: a parapet rim and a plant room in the middle, not a flat lid.
        float hut = step(abs(vL.x), 0.2) * step(abs(vL.z), 0.2) * tower;
        float rim = step(0.44, max(abs(vL.x), abs(vL.z)));
        col = mix(col, vec3(0.025, 0.03, 0.042) * (1.0 + 0.8 * rim) + vec3(0.03, 0.028, 0.025) * hut, step(0.5, n.y));
        // LED billboards: a few of the taller towers carry one up high; most towers along the flight
        // path turn one towards it at the ship's height, on their widest face to it. A 9 m panel in
        // a dark frame, scrolling one skill group (its name above, its items below).
        float pick = fract(R * 11.3);
        float toPath = pathX(vC.y) - vC.x;
        float lane = (1.0 - step(46.0, abs(toPath))) * step(0.7, n.x * sign(toPath)) * step(0.45, max(abs(vL.x), abs(vL.z)));
        float yb = -14.0 + 9.0 * fract(R * 3.9);
        lane *= step(0.45, pick) * step(yb + 11.0, vTop) * tower;
        float high = step(0.82, pick) * step(60.0, vS.y) * (1.0 - lane);
        float board = max(high, lane) * side;
        float faceW = vS.x * abs(dot(vAx, T.xz)) + vS.z * abs(dot(vec2(-vAx.y, vAx.x), T.xz));
        float bw = mix(0.72, 0.9, lane) * faceW;
        // Metres from the panel's lower left as seen from outside (T runs right to left).
        vec2 bm = vec2(bw * 0.5 - dot(vW.xz - vC, T.xz), mix((vL.y + 0.25 - 0.3 * fract(R * 3.9)) * vS.y, vW.y - yb, lane));
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
        float crowned = step(0.7, fract(R * 7.31)) * side * step(45.0, vS.y);
        float band = smoothstep(vTop - 9.0, vTop - 8.0, vW.y) * (1.0 - smoothstep(vTop - 3.0, vTop - 2.4, vW.y));
        float parapet = smoothstep(vTop - 0.9, vTop - 0.4, vW.y);
        vec3 crownCol = mix(vec3(1.0, 0.82, 0.55), vec3(0.6, 0.85, 1.0), step(0.5, fract(R * 3.7)));
        col += crownCol * (band * 0.35 + parapet * 0.5) * crowned;
        col += vec3(1.0, 0.86, 0.7) * glowAt(vW, 18.0) * 0.1;
        gl_FragColor = vec4(cityFog(col, vD, vW), 1.0);
    }
`;

/**
 * The bowl's ground: bare slopes and the plateau's edge pale under the moon; where it is built
 * up, dark, with the warm glow of lit streets winding between the blocks.
 */
const GROUND_VERT = /* glsl */ `attribute float aDen; varying vec3 vW, vN; varying float vD, vDen;
    void main() { vDen = aDen; vN = normal; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`;
const GROUND_FRAG = /* glsl */ `
    uniform vec3 uGrid; varying vec3 vW, vN; varying float vD, vDen;
    ${CITY_AIR}
    void main() {
        vec3 n = normalize(vN);
        float moon = max(dot(n, MOON_DIR), 0.0);
        vec3 bare = vec3(0.05, 0.052, 0.066) * (0.3 + 1.1 * moon) * (0.75 + 0.5 * fbm(vW.xz * 0.02));
        float built = smoothstep(0.03, 0.5, vDen);
        float lanes = pow(1.0 - abs(vnoise(vW.xz * 0.11) * 2.0 - 1.0), 14.0);
        vec3 lit = vec3(1.0, 0.56, 0.26) * (0.03 + 0.07 * lanes) * built * (1.0 - uDrop * 0.4);
        vec3 col = mix(bare, vec3(0.016, 0.014, 0.018), built) + lit;
        // The map's edge, seen from high on the drop, melts into the air rather than ending.
        float edge = smoothstep(uGrid.z - 700.0, uGrid.z - 40.0, max(abs(vW.x - uGrid.x), abs(vW.z - uGrid.y)));
        gl_FragColor = vec4(mix(col, haze(normalize(vW - cameraPosition)), max(cityAir(vD, vW), edge)), 1.0);
    }
`;

/**
 * The lamps of the hillside barrios and of El Alto on the rim: a point of light per block beyond
 * the built ones, and between the low ones. Mostly sodium, some warm white, some cool LED.
 */
const LIGHT_VERT = /* glsl */ `attribute float aKind; varying vec3 vCol; varying float vA;
    ${CITY_AIR}
    void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec4 mv = viewMatrix * w;
        float d = -mv.z;
        float kind = floor(aKind / 64.0), b = mod(aKind, 64.0) / 63.0;
        vCol = kind < 0.5 ? vec3(1.0, 0.55, 0.22) : kind < 1.5 ? vec3(1.0, 0.8, 0.56) : vec3(0.72, 0.86, 1.0);
        float px = uPR * 700.0 / max(d, 1.0);
        gl_PointSize = clamp(px, 1.5 * uPR, 9.0 * uPR);
        // Smaller than the smallest point: dimmer, not bigger.
        vA = (0.35 + 0.65 * b) * min(1.0, px / (1.5 * uPR)) * (1.0 - cityAir(d * 0.7, w.xyz)) * (1.0 - uDrop * 0.35);
        gl_Position = projectionMatrix * mv;
    }`;
const LIGHT_FRAG = /* glsl */ `varying vec3 vCol; varying float vA;
    void main() { float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r);
        gl_FragColor = vec4(vCol * vA * (a * a * 1.4 + smoothstep(0.16, 0.0, r)), 1.0); }`;

/**
 * Illimani (6,438 m), the triple-peaked massif to the south-east, from the same terrain data. It is
 * drawn around the eye at FAR_K of its distance and size, so it keeps its place and size in view
 * but stands inside the sky. Moonlit snow above the snowline; its foot dissolves into the haze.
 */
const FAR_VERT = /* glsl */ `uniform float uK; varying vec3 vT, vN;
    void main() { vN = normal; vT = (modelMatrix * vec4(position, 1.0)).xyz;
        vec3 w = cameraPosition + uK * (vT - cameraPosition);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }`;
const FAR_FRAG = /* glsl */ `uniform vec2 uSnow, uFoot; varying vec3 vT, vN;
    void main() {
        vec3 n = normalize(vN);
        vec3 V = normalize(vT - cameraPosition);
        float key = max(dot(n, normalize(vec3(0.45, 0.55, 0.7))), 0.0);
        float snow = smoothstep(uSnow.x, uSnow.y, vT.y + 80.0 * (fbm(vT.xz * 0.004) - 0.5)) * smoothstep(0.3, 0.7, n.y);
        vec3 rock = vec3(0.025, 0.03, 0.045) * (0.4 + key);
        vec3 ice = vec3(0.5, 0.6, 0.8) * (0.2 + 0.8 * key);
        vec3 col = mix(rock, ice, snow);
        float f = 1.0 - exp(-length(vT - cameraPosition) * 0.00004);
        col = mix(col, haze(V), max(f, 1.0 - smoothstep(uFoot.x, uFoot.y, vT.y)));
        gl_FragColor = vec4(col, 1.0);
    }`;

type Grid = { cx: number; cz: number; half: number; n: number };
type Head = { grid: Grid; far: Grid; sections: Record<string, [number, number, string]> };
/** lapaz-*.bin: a JSON header, then one typed array per section. */
type LaPaz = { head: Head; i16: (name: string) => Int16Array; u8: (name: string) => Uint8Array };

function parse(buf: ArrayBuffer): LaPaz {
    const len = new DataView(buf).getUint32(0, true);
    const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, len))) as Head;
    const at = (name: string): [number, number] => {
        const [off, n] = head.sections[name];
        return [4 + len + off, n];
    };
    return {
        head,
        i16: (name) => new Int16Array(buf, ...at(name)),
        u8: (name) => new Uint8Array(buf, ...at(name)),
    };
}

/** A heightfield grid as a mesh: x and z from the grid, y from the samples (times k). */
function gridMesh(g: Grid, ys: Int16Array, k: number): THREE.BufferGeometry {
    const { cx, cz, half, n } = g;
    const step = (half * 2) / (n - 1);
    const pos = new Float32Array(n * n * 3);
    for (let v = 0; v < n * n; v++)
        pos.set([cx - half + (v % n) * step, ys[v] * k, cz - half + Math.floor(v / n) * step], v * 3);
    const idx = new Uint32Array((n - 1) * (n - 1) * 6);
    let o = 0;
    for (let j = 0; j < n - 1; j++)
        for (let i = 0; i < n - 1; i++) {
            const a = j * n + i;
            idx.set([a, a + n, a + 1, a + 1, a + n, a + n + 1], o);
            o += 6;
        }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    return geo;
}

function addGround(group: THREE.Object3D, s: Shared, lp: LaPaz): void {
    const geo = gridMesh(lp.head.grid, lp.i16('ground'), 0.05);
    geo.setAttribute('aDen', new THREE.BufferAttribute(lp.u8('density'), 1, true));
    const { cx, cz, half } = lp.head.grid;
    const mesh = new THREE.Mesh(
        geo,
        shader(s, GROUND_VERT, GROUND_FRAG, { uGrid: { value: new THREE.Vector3(cx, cz, half) } })
    );
    mesh.frustumCulled = false;
    group.add(mesh);
}

function addIllimani(group: THREE.Object3D, s: Shared, lp: LaPaz): void {
    const geo = gridMesh(lp.head.far, lp.i16('far'), 0.1);
    // World heights of the snowline (~5,000 m) and of the haze its foot fades into (~4,300 m).
    const mesh = new THREE.Mesh(
        geo,
        shader(s, FAR_VERT, FAR_FRAG, {
            uK: { value: FAR_K },
            uSnow: { value: new THREE.Vector2(640, 820) },
            uFoot: { value: new THREE.Vector2(300, 620) },
        })
    );
    mesh.frustumCulled = false;
    group.add(mesh);
}

type Block = { at: THREE.Vector3; size: THREE.Vector3; angle: number };

function blocksOf(lp: LaPaz): Block[] {
    const [x, z, y] = ['bx', 'bz', 'by'].map((k) => lp.i16(k));
    const [w, d, a, h] = ['bw', 'bd', 'ba', 'bh'].map((k) => lp.u8(k));
    return Array.from(x, (_, i) => ({
        at: new THREE.Vector3(x[i] * 0.125, y[i] * 0.05, z[i] * 0.125),
        size: new THREE.Vector3(w[i] / 4, h[i], d[i] / 4),
        angle: (a[i] / 256) * Math.PI,
    }));
}

/** Every block in one draw call, each on its own footprint, turned to it, standing on the ground. */
function addBlocks(
    group: THREE.Object3D,
    s: Shared,
    blocks: Block[],
    env: Env,
    skills: Array<{ group: string; items: string }>
): void {
    const atlas = skillAtlas(skills);
    const material = shader(s, BLOCK_VERT, BLOCK_FRAG, {
        tEnv: env.tEnv,
        uEnvOn: env.uEnvOn,
        tSkill: { value: atlas.tex },
        uGroups: { value: atlas.tex ? Math.min(skills.length, MAX_ROWS / 2) : 0 },
        uLen: { value: atlas.len },
    });
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion();
    const transforms = blocks.map((b) =>
        new THREE.Matrix4().compose(
            b.at.clone().setY(b.at.y + b.size.y / 2),
            q.setFromAxisAngle(up, b.angle),
            b.size
        )
    );
    group.add(boxes(material, transforms, rng(1825)));
}

function addLights(group: THREE.Object3D, s: Shared, lp: LaPaz): void {
    const [x, z, y] = ['px', 'pz', 'py'].map((k) => lp.i16(k));
    const pos = new Float32Array(x.length * 3);
    for (let i = 0; i < x.length; i++) pos.set([x[i] * 0.125, y[i] * 0.05, z[i] * 0.125], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aKind', new THREE.BufferAttribute(Float32Array.from(lp.u8('pk')), 1));
    const pts = new THREE.Points(g, shader(s, LIGHT_VERT, LIGHT_FRAG, {}, ADD));
    pts.frustumCulled = false;
    group.add(pts);
}

/** Red obstruction lights on the tallest roofs: slow, out of step, a soft flash rather than a cut. */
function addBeacons(group: THREE.Object3D, s: Shared, blocks: Block[]): void {
    const points = blocks
        .filter((b) => b.size.y >= BEACON_H)
        .map((b) => b.at.clone().setY(b.at.y + b.size.y + 1.2));
    if (!points.length) return;
    const pts = new THREE.Points(
        new THREE.BufferGeometry().setFromPoints(points),
        shader(
            s,
            /* glsl */ `varying float vD, vP;
            void main() { vP = fract(dot(position, vec3(0.137, 0.071, 0.113)));
                vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z;
                gl_PointSize = clamp(uPR * 1100.0 / vD, 2.0, 20.0); gl_Position = projectionMatrix * mv; }`,
            /* glsl */ `varying float vD, vP;
            ${CITY_AIR}
            void main() { float ph = fract(uTime * 0.5 + vP); float on = smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.35, 0.6, ph));
                float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
                gl_FragColor = vec4(vec3(2.6, 0.18, 0.1) * a * (0.12 + 0.88 * on) * cityFade(vD), 1.0); }`,
            {},
            ADD
        )
    );
    pts.frustumCulled = false;
    group.add(pts);
}

/**
 * La Paz, once its data has arrived: phones and Save-Data or slow connections get the lighter
 * tier (0.5 MB: a coarser ground, the blocks nearest the avenue, fewer lamps); others 1.3 MB.
 */
function addLaPaz(
    scene: THREE.Object3D,
    s: Shared,
    small: boolean,
    env: Env,
    skills: Array<{ group: string; items: string }>
): void {
    const group = new THREE.Group();
    scene.add(group);
    fetch(`/data/lapaz-${small || lean() ? 'lo' : 'hi'}.bin`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((buf) => {
            const lp = parse(buf);
            const blocks = blocksOf(lp);
            addGround(group, s, lp);
            addIllimani(group, s, lp);
            addBlocks(group, s, blocks, env, skills);
            addLights(group, s, lp);
            addBeacons(group, s, blocks);
        })
        .catch(() => undefined);
}

/**
 * The avenue under the flight path, wet. Its lanes either side of the median, white LED lamps along
 * the kerbs and the median, shopfronts spilling colour on the pavement. Puddles (large-scale noise)
 * mirror the city; between them the road only smears the lights. Desktop renders a real mirrored
 * city for the puddles; phones get the lamps' own sheen. Lamps are light sources, so the haze dims
 * them less than the asphalt. Beyond the pavement the ground of the bowl takes over.
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
        float bq = abs(vW.x - pathX(vW.z));
        if (bq > ${AVENUE.edge.toFixed(1)} || vW.z > ${AVENUE.from.toFixed(1)} || vW.z < ${AVENUE.to.toFixed(1)}) discard;
        vec3 V = normalize(vW - cameraPosition);
        float puddle = smoothstep(0.48, 0.6, fbm(vW.xz * 0.045));
        float grain = fbm(vW.xz * 1.9);
        float road = step(bq, ${AVENUE.half.toFixed(1)});
        vec3 asphalt = mix(vec3(0.03, 0.032, 0.038), vec3(0.01, 0.012, 0.018), road) * (0.6 + 0.8 * grain);
        float lanes = step(abs(fract(bq / 4.2) - 0.5) * 4.2, 0.1) * step(0.5, fract(vW.z / 7.0)) * road;
        vec3 base = asphalt + vec3(0.5, 0.52, 0.55) * lanes * 0.06 * (1.0 - puddle * 0.6);
        vec2 lb = lamps(bq - ${AVENUE.half.toFixed(1)}, vW.z, 15.0), lm = lamps(bq, vW.z + 7.5, 15.0);
        vec3 light = vec3(0.82, 0.9, 1.0) * (lb.x + lm.x) * 0.4;
        vec3 heads = vec3(0.9, 0.95, 1.0) * (lb.y + lm.y);
        // Shopfronts: colour spilling onto the pavement, a shop every 18 m or so, either side.
        vec2 shopAt = vec2(floor(vW.z / 18.0), step(0.0, vW.x - pathX(vW.z)));
        vec3 shopCol = mix(vec3(1.0, 0.55, 0.3), vec3(0.4, 0.75, 1.0), step(0.6, hash(shopAt)));
        float shop = exp(-pow(bq - 19.0, 2.0) / 6.0) * step(0.35, hash(shopAt + 3.1));
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
    const geo = new THREE.PlaneGeometry(AVENUE.edge * 2 + 30, 900);
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

/** How far a boulevard car drives before it comes round again. */
const LOOP = 600;

/** Other requests driving the avenue under the flight path: white heading one way, red the other. */
function addTraffic(scene: THREE.Object3D, s: Shared, density: number, rand: () => number): void {
    const cars = Array.from({ length: Math.round(220 * density) }, () => {
        const fwd = rand() < 0.5 ? 1 : -1;
        // Three lanes each way either side of the median; x is the offset from the path.
        const lane = fwd * (2 + Math.floor(rand() * 3) * 3.6);
        const phase = rand() * 1000; // kept in the unused y of the direction
        const col = fwd > 0 ? [2.6, 2.2, 1.7] : [2.6, 0.35, 0.22];
        return { base: [lane, FLOOR + 0.6, 0], dir: [0, phase, fwd], sp: [8 + rand() * 22, LOOP], col };
    });
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.setIndex(unit.index);
    g.setAttribute('position', unit.getAttribute('position'));
    g.instanceCount = cars.length;
    const attr = (
        pick: (c: (typeof cars)[number]) => number[],
        size: number
    ): THREE.InstancedBufferAttribute =>
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
    const mesh = new THREE.Mesh(
        g,
        shader(
            s,
            /* glsl */ `uniform vec2 uTile; attribute vec3 aBase, aDir, aCol; attribute vec2 aSp;
            varying vec3 vC; varying float vD;
            void main() {
                vec3 d = vec3(aDir.x, 0.0, aDir.z);
                vec3 lp = position * vec3(0.35, 0.18, 2.2);
                float s = mod(uTime * aSp.x + aDir.y, aSp.y) - aSp.y * 0.5;
                vC = aCol;
                vec3 c = aBase + d * s;
                c.xz = wrapAround(c.xz, uTile);
                // Cars keep to their lane under the swaying flight path.
                c.x = pathX(c.z) + aBase.x;
                vec4 mv = viewMatrix * vec4(c + lp, 1.0);
                vD = -mv.z;
                gl_Position = projectionMatrix * mv;
            }`,
            /* glsl */ `varying vec3 vC; varying float vD; void main() { gl_FragColor = vec4(fogIt(vC * (1.0 - uDrop * 0.8), vD * 0.7), 1.0); }`,
            { uTile: { value: new THREE.Vector2(LOOP, LOOP) } }
        )
    );
    mesh.frustumCulled = false;
    scene.add(mesh);
}

/** 2 · Edge: La Paz at night, the canyon bowl of lights the ship dives into, in the rain. */
export function addCity(
    scene: THREE.Object3D,
    s: Shared,
    density: number,
    rand: () => number,
    env: Env,
    skills: Array<{ group: string; items: string }> = []
): City {
    addLaPaz(scene, s, density < 1, env, skills);
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
    return { update: (eye, on) => streets.update(eye, on) };
}
