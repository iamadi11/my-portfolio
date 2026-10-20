import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { ADD, boxes, type Shared, shader, WRAP_VERT } from '@/components/round-trip/world/gl';
import { addMotes } from '@/components/round-trip/world/land';

/** Street level, below the path; the grid the blocks sit on, and one tile of the endless city. */
export const FLOOR = -60;
const GRID = 18;
const COLS = 27;
const ROWS = 24;
const TILE = new THREE.Vector2(COLS * GRID, ROWS * GRID);
const CLEAR = 20;
/** The scanned downtown stands left of the path, from this x outward; no built towers there. */
const DOWNTOWN_X = -55;

/** The wrapping vertex shader, plus where each tower's roof is (for its lit crown). */
const TOWER_VERT = WRAP_VERT.replace(
    'varying float vR, vD;',
    'varying float vR, vD, vTop; varying vec3 vS;'
).replace(
    'vW = w.xyz;',
    `vW = w.xyz; vTop = (modelMatrix * instanceMatrix * vec4(0.0, 0.5, 0.0, 1.0)).y;
    vS = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));`
);

/** Skill billboards: atlas row height and width (px), most rows the shader takes, text line height (m). */
const ROW = 36;
const ATLAS_W = 2048;
const MAX_ROWS = 16;
const LINE = 3.3;

/**
 * The scrolling LED text on the billboards: one board per tower shows one skill group, its name on
 * the top line and its items on the bottom one, read from an atlas of those exact strings.
 */
const BOARD = /* glsl */ `
    uniform sampler2D tSkill; uniform float uGroups; uniform float uLen[${MAX_ROWS}];
    // Lit LEDs (0-1) for one line of a group at board metres m; du and dv are the uv derivatives.
    float ledText(float grp, float line, vec2 m, vec2 du, vec2 dv, float speed) {
        float row = grp * 2.0 + line;
        float y0 = line > 0.5 ? 0.9 : 4.95;
        float k = ${ROW.toFixed(1)} / (${LINE.toFixed(1)} * ${ATLAS_W.toFixed(1)});
        float pitch = 0.28;
        vec2 q = (floor(m / pitch) + 0.5) * pitch;
        float ly = (q.y - y0) / ${LINE.toFixed(1)};
        if (ly < 0.0 || ly > 1.0) return 0.0;
        float len = uLen[int(row)];
        float u = mod((q.x + floor(uTime * speed / pitch) * pitch + grp * 7.0) * k, len);
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
    tex.anisotropy = 4;
    return { tex, len };
}

/**
 * Facades. Two kinds of tower: concrete with punched windows, and glass curtain walls. Unlit glass
 * reflects the sky (stronger at grazing angles). Lit windows are fake rooms: the back wall shifts
 * with the camera, so each window reads as a lit room with depth, some with blinds, a few flickering
 * like a TV. Street level glows like shopfronts; some towers wear a lit crown on their top floors.
 * Works for walls facing any way, so octagonal towers get windows and rooms too.
 */
const TOWER_FRAG = /* glsl */ `
    uniform sampler2D tEnv; uniform float uEnvOn;
    varying vec3 vW, vN, vL, vWN, vS; varying float vR, vD, vTop;
    ${BOARD}
    void main() {
        vec3 n = normalize(vWN);
        float side = 1.0 - step(0.5, abs(n.y));
        vec2 nh = normalize(n.xz + vec2(1e-4, 0.0));
        vec3 T = vec3(-nh.y, 0.0, nh.x);
        vec2 f = vec2(dot(vW, T), vW.y);
        float glassy = step(0.58, vR);
        vec2 cs = mix(vec2(2.4, 3.4), vec2(1.7, 3.1), glassy);
        vec2 cell = floor(f / cs), g = fract(f / cs);
        vec2 lo = mix(vec2(0.15, 0.24), vec2(0.05, 0.12), glassy);
        // Box-filtered by the pixel's footprint in cells; once a pixel spans most of a window (per
        // axis, so floors survive at grazing angles) the facade fades to its average, and far curtain
        // walls don't sparkle like static.
        vec2 fw = clamp(fwidth(f / cs), vec2(1e-4), vec2(0.5));
        vec2 farA = smoothstep(0.22, 0.4, fw);
        float far = max(farA.x, farA.y);
        vec2 wm = smoothstep(lo - fw, lo + fw, g) * (1.0 - smoothstep(1.0 - lo - fw, 1.0 - lo + fw, g));
        vec2 wa = mix(wm, 1.0 - 2.0 * lo, farA);
        float win = wa.x * wa.y * side;
        float h = hash(cell + vR * 91.7);
        float floorOn = step(0.45, hash(vec2(cell.y, vR * 13.0)));
        // Each tower keeps its own hours: some nearly dark, some busy, whole floors on or off.
        float occ = 0.12 + 0.45 * fract(vR * 5.17);
        float litP = mix(step(1.0 - occ - 0.2 * floorOn, h), mix(occ + 0.2 * floorOn, occ + 0.11, farA.y), far);
        // Seen edge-on from afar, glass shows the sky, not the rooms behind it.
        litP *= mix(1.0, smoothstep(0.08, 0.45, abs(dot(normalize(vW - cameraPosition), n))), far);
        float lit = litP * win;

        vec3 V = normalize(vW - cameraPosition);
        float into = max(dot(V, -n), 0.15);
        vec2 bp = (g - 0.5) + vec2(dot(V, T), V.y) / into * (1.3 / cs);
        float backWall = 1.0 - smoothstep(0.36, 0.5, max(abs(bp.x), abs(bp.y)));
        float ceilingLight = smoothstep(-0.3, 0.6, bp.y);
        vec3 warm = mix(vec3(1.0, 0.72, 0.48), vec3(1.0, 0.88, 0.7), fract(h * 7.3));
        vec3 wc = mix(warm, vec3(0.6, 0.8, 1.0), step(0.86, fract(h * 13.1)));
        // Offices run cool white; a third of the towers lean that way throughout.
        wc = mix(wc, vec3(0.72, 0.84, 1.0), step(0.68, fract(vR * 2.9)) * 0.7);
        vec3 wcAvg = mix(vec3(0.98, 0.8, 0.6), vec3(0.72, 0.84, 1.0), step(0.68, fract(vR * 2.9)) * 0.7);
        float tv = step(0.94, fract(h * 3.7));
        float flick = mix(1.0, 0.75 + 0.25 * sin(uTime * (6.0 + h * 9.0) + h * 40.0), tv);
        wc = mix(wc, vec3(0.45, 0.65, 1.0), tv);
        float blinds = step(0.72, fract(h * 5.3));
        float slats = mix(1.0, 0.55 + 0.45 * step(0.45, fract(g.y * 10.0)), blinds * (1.0 - smoothstep(0.03, 0.08, fw.y)));
        vec3 room = wc * (0.3 + 0.95 * backWall) * (0.8 + 0.35 * ceilingLight) * flick * slats;
        room = mix(room, wcAvg * 0.62, far);

        // Glass: the night city's own HDRI by reflection (blurred for roughness), Schlick Fresnel,
        // so face-on glass goes near-black and grazing glass carries the skyline.
        vec3 sky = mix(vec3(0.045, 0.06, 0.1), vec3(0.14, 0.17, 0.26), clamp(0.5 - V.y * 0.6, 0.0, 1.0));
        vec3 Rr = reflect(V, n);
        vec2 euv = vec2(atan(Rr.z, Rr.x) / 6.2831853 + 0.5, asin(clamp(Rr.y, -1.0, 1.0)) / 3.1415927 + 0.5);
        // Blurred as a mip bias of 3 would, without the seam where the map's longitude wraps.
        vec2 ex = dFdx(euv), ey = dFdy(euv);
        ex.x -= floor(ex.x + 0.5); ey.x -= floor(ey.x + 0.5);
        // Its hot street lights are compressed, not clipped: blurred mips would otherwise turn every
        // pane into the same flat white.
        vec3 ev = textureGrad(tEnv, euv, ex * 8.0, ey * 8.0).rgb;
        vec3 env = mix(sky, ev / (1.0 + ev) * 0.75, uEnvOn);
        float F = 0.04 + 0.96 * pow(1.0 - clamp(abs(dot(V, n)), 0.0, 1.0), 5.0);
        // Held back where the facade is averaged: at grazing angles far glass would read as plaster.
        vec3 glass = env * (mix(0.2, 0.12, far) + mix(2.0, 0.5, far) * F);
        float hgt = clamp((vW.y + 60.0) / 210.0, 0.0, 1.0);
        vec3 concrete = mix(vec3(0.02, 0.022, 0.03), vec3(0.06, 0.064, 0.078), hgt) * (0.78 + 0.22 * abs(nh.x));
        concrete *= 0.9 + 0.2 * hash(floor(f * 0.5));
        vec3 curtain = (vec3(0.016, 0.024, 0.04) + glass * 0.55) * mix(1.0, 0.5, mix(step(g.y, lo.y), lo.y, farA.y) * glassy);
        vec3 col = mix(concrete, curtain, glassy);
        col += mix(1.0 - smoothstep(0.0, 0.05, g.y), 0.03, farA.y) * side * (1.0 - glassy) * vec3(0.03);
        col = mix(col, glass, win * (1.0 - litP));
        col = mix(col, room * 1.15 + glass * 0.2, lit);
        float shop = side * step(0.35, vR) * smoothstep(-60.0, -59.0, vW.y) * (1.0 - smoothstep(-56.0, -55.0, vW.y));
        col += shop * mix(vec3(1.0, 0.7, 0.45), vec3(0.6, 0.85, 1.0), step(0.8, vR)) * 0.8 * (1.0 - uDrop * 0.75);
        // Roofs: a parapet rim and a plant room in the middle, not a flat lid.
        float hut = step(abs(vL.x), 0.2) * step(abs(vL.z), 0.2);
        float rim = step(0.44, max(abs(vL.x), abs(vL.z)));
        col = mix(col, vec3(0.025, 0.03, 0.042) * (1.0 + 0.8 * rim) + vec3(0.03, 0.028, 0.025) * hut, step(0.5, n.y));
        // LED billboards on a few of the taller towers: a 9 m panel in a dark frame, scrolling one
        // skill group (its name above, its items below) over a faint drifting colour.
        float board = step(0.82, fract(vR * 11.3)) * side * step(60.0, vTop + 60.0);
        float bw = 0.72 * dot(vS.xz, abs(T.xz));
        // Metres from the panel's lower left as seen from outside (T runs right to left).
        vec2 bm = vec2(bw * 0.5 - dot(vL.xz * vS.xz, T.xz), (vL.y + 0.25 - 0.3 * fract(vR * 3.9)) * vS.y);
        vec2 buv = bm / vec2(bw, 9.0);
        float onBoard = step(0.0, buv.x) * step(buv.x, 1.0) * step(0.0, buv.y) * step(buv.y, 1.0) * board;
        float frameB = step(0.04, buv.x) * step(buv.x, 0.96) * step(0.06, buv.y) * step(buv.y, 0.94);
        vec3 hueA = mix(vec3(1.0, 0.25, 0.5), vec3(0.2, 0.7, 1.0), step(0.5, fract(vR * 6.7)));
        vec3 hueB = mix(vec3(1.0, 0.6, 0.15), vec3(0.5, 1.0, 0.7), step(0.5, fract(vR * 4.3)));
        vec3 screen = mix(hueA, hueB, fbm(buv * vec2(3.0, 1.5) + uTime * 0.15 + vR * 7.0)) * (0.5 + 0.5 * fbm(buv * 6.0 - uTime * 0.1));
        // Atlas uv per board metre, for mip selection (taken here: derivatives need every pixel).
        vec2 sk = bm * vec2(${ROW.toFixed(1)} / (${LINE.toFixed(1)} * ${ATLAS_W.toFixed(1)}), 1.0 / (${LINE.toFixed(1)} * max(uGroups, 1.0) * 2.0));
        vec2 du = dFdx(sk), dv = dFdy(sk);
        vec2 led = fract(bm / 0.28) - 0.5;
        float dots = mix(smoothstep(0.5, 0.3, length(led)), 0.6, smoothstep(0.3, 0.6, max(fwidth(bm.x), fwidth(bm.y)) / 0.28));
        vec3 text = vec3(0.0);
        if (onBoard * frameB > 0.5 && uGroups > 0.5) {
            float grp = mod(floor(fract(vR * 17.9) * 97.0), uGroups);
            text = hueA * ledText(grp, 0.0, bm, du, dv, 2.0) + vec3(1.0, 0.92, 0.8) * ledText(grp, 1.0, bm, du, dv, 3.6);
        }
        col = mix(col, vec3(0.01), onBoard);
        col += (screen * mix(1.7, 0.18, step(0.5, uGroups)) + text * 2.2 * dots) * onBoard * frameB;
        // A lit crown on some towers: a band of light around the top floors and a bright parapet.
        float crowned = step(0.62, fract(vR * 7.31)) * side;
        float band = smoothstep(vTop - 9.0, vTop - 8.0, vW.y) * (1.0 - smoothstep(vTop - 3.0, vTop - 2.4, vW.y));
        float parapet = smoothstep(vTop - 0.9, vTop - 0.4, vW.y);
        vec3 crownCol = mix(vec3(1.0, 0.82, 0.55), vec3(0.6, 0.85, 1.0), step(0.5, fract(vR * 3.7)));
        col += crownCol * (band * 0.55 + parapet * 1.3) * crowned;
        col += vec3(1.0, 0.86, 0.7) * glowAt(vW, 18.0) * 0.1;
        gl_FragColor = vec4(fogAt(col, vD, vW), 1.0);
    }
`;

type Tower = { x: number; z: number; h: number; w: number; d: number; kind: number; spire: number };

/** Tower shapes, each one unit tall around its centre: a plain slab, a setback, an octagon. */
function shapes(): THREE.BufferGeometry[] {
    const box = (w: number, h: number, y: number): THREE.BufferGeometry =>
        new THREE.BoxGeometry(w, h, w).translate(0, y, 0);
    const oct = (r: number, h: number, y: number): THREE.BufferGeometry =>
        new THREE.CylinderGeometry(r, r, h, 8, 1)
            .rotateY(Math.PI / 8)
            .translate(0, y, 0)
            .toNonIndexed();
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
 * The downtown: "Osaka downtown" by matousekfoto (Sketchfab, CC BY 4.0), a night photogrammetry
 * scan of lit towers, standing on the left of the path. Its own night is baked into the texture,
 * so it is drawn unlit. Three copies ride along the path so it never ends.
 */
function addDowntown(scene: THREE.Object3D, small: boolean): { update: (eye: THREE.Vector3) => void } {
    const copies: THREE.Group[] = [0, 1, 2].map(() => {
        const g = new THREE.Group();
        scene.add(g);
        return g;
    });
    let period = 500;
    let x = DOWNTOWN_X - 220;
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
            model.traverse((o) => {
                const m = o as THREE.Mesh;
                if (!m.isMesh) return;
                const old = m.material as THREE.MeshStandardMaterial;
                // Lifted a little: the scan's own exposure is darker than the built towers.
                m.material = new THREE.MeshBasicMaterial({
                    map: old.map,
                    color: new THREE.Color(1.35, 1.35, 1.45),
                    fog: true,
                });
                m.frustumCulled = false;
            });
            copies.forEach((g) => {
                const c = model.clone();
                c.scale.setScalar(k);
                c.position.set(-center.x * k, -box.min.y * k, -center.z * k);
                g.add(c);
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
 * Wet asphalt. Puddles (large-scale noise) mirror the city; between them the road is rough and
 * only smears the lights. Desktop renders a real mirrored city for the puddles; phones fake it.
 */
const STREET_FRAG = /* glsl */ `
    uniform sampler2D tReflect; uniform float uMirror;
    varying vec4 vRuv; varying vec3 vW; varying float vD;
    void main() {
        float puddle = smoothstep(0.5, 0.62, fbm(vW.xz * 0.045));
        float grain = fbm(vW.xz * 1.9);
        vec2 ripple = (vec2(fbm(vW.xz * 0.8 + uTime * 0.04), fbm(vW.xz * 0.8 - uTime * 0.04)) - 0.5) * 0.035;
        vec4 uv = vRuv;
        uv.xy += ripple * uv.w * (1.0 - puddle * 0.75);
        // One tap, blurrier on rough asphalt than in the puddles (the target has mips).
        vec3 refl = texture2DProj(tReflect, uv, mix(4.0, 0.5, puddle)).rgb;
        vec3 V = normalize(vW - cameraPosition);
        float fres = 0.03 + 0.97 * pow(1.0 - abs(V.y), 5.0);
        vec3 asphalt = vec3(0.01, 0.012, 0.018) * (0.6 + 0.8 * grain);
        vec2 q = abs(fract((vW.xz - 9.0) / 18.0) - 0.5) * 18.0;
        float lane = smoothstep(0.4, 0.0, min(q.x, q.y)) * (1.0 - puddle * 0.6);
        vec3 col = asphalt + vec3(0.32, 0.36, 0.42) * lane * 0.05;
        // Street lamps: sodium pools every 9 m along both sets of roads.
        vec2 la = vec2(q.x, abs(fract(vW.z / 9.0) - 0.5) * 9.0);
        vec2 lb = vec2(q.y, abs(fract(vW.x / 9.0) - 0.5) * 9.0);
        float pools = exp(-dot(la, la) / 14.0) + exp(-dot(lb, lb) / 14.0);
        col += vec3(1.0, 0.76, 0.48) * pools * 0.14 * (1.0 - puddle * 0.4);
        col += refl * uMirror * mix(0.3, 1.0, puddle) * fres;
        vec3 lp = vec3(uPacket.x, vW.y, uPacket.z);
        col += vec3(1.0, 0.75, 0.5) * exp(-dot(vW - lp, vW - lp) / 900.0) * 0.1;
        gl_FragColor = vec4(fogIt(col, vD), 1.0);
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

/** Other requests driving the streets: white heading one way, red the other. */
function addTraffic(scene: THREE.Object3D, s: Shared, density: number, rand: () => number): void {
    const n = Math.round(900 * density);
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.setIndex(unit.index);
    g.setAttribute('position', unit.getAttribute('position'));
    g.instanceCount = n;
    const base = new Float32Array(n * 3);
    const dir = new Float32Array(n * 3);
    const sp = new Float32Array(n * 2);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        const fwd = rand() < 0.5 ? 1 : -1;
        if (rand() < 0.55) {
            base.set(
                [(Math.floor(rand() * COLS) - (COLS - 1) / 2) * GRID + 9 + fwd * 1.6, FLOOR + 0.6, 0],
                i * 3
            );
            dir.set([0, 0, fwd], i * 3);
            sp.set([8 + rand() * 22, TILE.y], i * 2);
        } else {
            base.set([0, FLOOR + 0.6, -Math.floor(rand() * ROWS) * GRID - 9 + fwd * 1.6], i * 3);
            dir.set([fwd, 0, 0], i * 3);
            sp.set([8 + rand() * 22, TILE.x], i * 2);
        }
        dir[i * 3 + 1] = rand() * 1000; // phase, kept in the unused y of the direction
        col.set(fwd > 0 ? [2.6, 2.2, 1.7] : [2.6, 0.35, 0.22], i * 3);
    }
    g.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 3));
    g.setAttribute('aDir', new THREE.InstancedBufferAttribute(dir, 3));
    g.setAttribute('aSp', new THREE.InstancedBufferAttribute(sp, 2));
    g.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 3));
    const cars = new THREE.Mesh(
        g,
        shader(
            s,
            /* glsl */ `uniform vec2 uTile; attribute vec3 aBase, aDir, aCol; attribute vec2 aSp; varying vec3 vC; varying float vD;
            void main() {
                vec3 d = vec3(aDir.x, 0.0, aDir.z);
                vec3 lp = (abs(d.x) > 0.5 ? position.zyx : position) * vec3(0.35, 0.18, 2.2);
                float s = mod(uTime * aSp.x + aDir.y, aSp.y) - aSp.y * 0.5;
                vC = aCol;
                vec3 c = aBase + d * s;
                c.xz = wrapAround(c.xz, uTile);
                vec4 mv = viewMatrix * vec4(c + lp, 1.0);
                vD = -mv.z;
                gl_Position = projectionMatrix * mv;
            }`,
            /* glsl */ `varying vec3 vC; varying float vD; void main() { gl_FragColor = vec4(fogIt(vC * (1.0 - uDrop * 0.8), vD), 1.0); }`,
            { uTile: { value: TILE } }
        )
    );
    cars.frustumCulled = false;
    scene.add(cars);
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
    const downtown = addDowntown(scene, density < 1);
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
