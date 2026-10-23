import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { smooth } from '@/components/round-trip/math';
import { type Shared, shader } from '@/components/round-trip/world/gl';
import type { Glow } from '@/components/round-trip/world/glow';
import { GROUND, LANDS, POOL } from '@/components/round-trip/world/land';
import type { Route } from '@/components/round-trip/world/route';

/** Premultiplied alpha: the disc covers what is behind it (rgb already scaled by alpha), and adds light. */
const WINDOW: THREE.ShaderMaterialParameters = {
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
};

type Sign = { mesh: THREE.Object3D; uOn: THREE.IUniform<number> };

type Portal = {
    u: number;
    center: THREE.Vector3;
    /** The gateway's own group, its light strip and its event horizon. */
    g: THREE.Group;
    strip: THREE.Mesh;
    disc: THREE.Mesh;
    /** The strip's colour, dimmed and brightened as the ship nears. */
    glow: THREE.Color;
    /** The project's title in lights over the ring; null without a title. */
    sign: Sign | null;
    /** A lighthouse in the project's colour, so the gate is something to aim at from far off. */
    beacon: THREE.Sprite;
    horizon: { uOn: THREE.IUniform<number>; uFlash: THREE.IUniform<number> };
    colour: THREE.Color;
    near: number;
    passed: boolean;
};

export type Rings = {
    centers: THREE.Vector3[];
    /** 0–1: how hard the ship is rushing at the portal ahead (set by `update`). */
    rush: number;
    /** 0–1: how close the ship is to the portal on screen, before or after it. */
    close: number;
    /**
     * 0–1: how far the camera is through the throat of the portal it is entering: rising with the
     * jump to 1 at the cut, held at 1 while the window fades into the new place, then 0.
     */
    entry: number;
    /** 1 while a portal's entry is under way (from the crossing to the end of its jump), else 0. */
    crossing: number;
    /**
     * Advances the portals, showing only `show` (the current landscape's exit; -1 for none).
     * `jump` (0–1) is the jump under way, which drives the entry through the window.
     */
    update: (u: number, t: number, dt: number, show: number, jump?: number) => number | null;
};

/** The gateway model: its ring is 5 m across, centred 2.5 m above its base. */
const RING_Y = 2.5;
/** Fallback inner radius of the ring (m) until the model has been measured. */
const INNER = 2.05;

/** Inner radius of the gateway's ring, measured from its own vertices (in metres). */
function innerRadius(model: THREE.Object3D): number {
    let best = Infinity;
    const v = new THREE.Vector3();
    model.updateMatrixWorld(true);
    model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || !/portal_main/.test(m.name)) return;
        const p = m.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
            if (Math.abs(v.z) < 0.4) best = Math.min(best, Math.hypot(v.x, v.y - RING_Y));
        }
    });
    return Number.isFinite(best) ? best : INNER;
}

/**
 * The view through a portal: the next place, looked up by direction (so it sits at infinity, like
 * a real window): that place's skyline (rolling hills, dunes, mesas, peaks, a volcano's cone with
 * its glowing crater, or the flat sea), a bright line of air along it, its sky darkening overhead,
 * and stars. Shared by the event horizon and the lens the camera enters through.
 */
const BEYOND = /* glsl */ `
    uniform vec3 uNext; uniform float uKind;
    // Height of the next place's skyline (radians above the horizon) at azimuth az.
    float skyline(float az) {
        float n = vnoise(vec2(az * 5.0, 1.7)), m = vnoise(vec2(az * 19.0, 4.1));
        if (uKind < 0.5) return 0.02 + 0.035 * n + 0.006 * m;
        if (uKind < 1.5) return 0.012 + 0.04 * smoothstep(0.15, 0.95, vnoise(vec2(az * 3.0, 2.3)));
        if (uKind < 2.5) return 0.015 + 0.075 * smoothstep(0.52, 0.56, vnoise(vec2(az * 7.0, 5.9))) + 0.004 * m;
        if (uKind < 3.5) return 0.02 + 0.2 * pow(ridged(vec2(az * 2.4, 3.3)), 1.6);
        if (uKind < 4.5) return 0.015 + 0.01 * n + 0.16 * clamp(1.0 - abs(az - 0.25) * 2.6, 0.0, 0.82);
        return 0.0;
    }
    vec3 beyond(vec3 d) {
        float el = asin(clamp(d.y, -1.0, 1.0));
        float az = atan(d.x, -d.z);
        float top = skyline(az);
        vec3 hz = uNext * 3.2 + 0.012;
        // Sky: the place's air glowing along the skyline, near-black overhead.
        vec3 sky = mix(hz, vec3(0.004, 0.007, 0.02), smoothstep(0.0, 0.5, el - top * 0.5));
        vec2 sp = vec2(az, el) * 120.0;
        vec2 id = floor(sp);
        float star = step(0.96, hash(id)) * smoothstep(0.3, 0.0, length(fract(sp) - 0.5));
        sky += vec3(0.9, 0.95, 1.0) * star * (0.5 + 1.4 * hash(id + 7.3)) * smoothstep(top + 0.02, top + 0.15, el);
        // Ground: a dark silhouette, the sea a dull sheen; lava glows in the crater and its flanks.
        vec3 ground = hz * mix(0.12, 0.3, step(4.5, uKind)) * (0.6 + 0.4 * smoothstep(-0.3, 0.0, el));
        float lava = step(3.5, uKind) * step(uKind, 4.5) * smoothstep(top - 0.03, top, el) * step(0.12, top);
        ground += vec3(1.6, 0.45, 0.08) * lava;
        vec3 c = mix(ground, sky, smoothstep(-0.002, 0.002, el - top));
        // The line of air on the skyline, so the horizon reads at a glance.
        return c + hz * 1.4 * exp(-pow((el - top) / 0.01, 2.0));
    }
    // The swirl round a throat of radius 1 at r: spiral arms wound in log-polar space, drifting
    // inward, fine streaks riding on them, kept to the outer ring; pull winds them faster.
    vec3 swirl(vec3 col, float r, float a, float pull) {
        vec2 sp = vec2(a * 3.0 + log(r) * 0.9 + uTime * 0.12, log(r) * 1.6 - uTime * 0.35 - pull);
        float arms = smoothstep(0.42, 0.78, fbm(sp * vec2(2.0, 1.4)));
        float streaks = smoothstep(0.55, 0.9, fbm(sp * vec2(7.0, 3.0) + 3.1));
        float outer = smoothstep(0.55, 0.95, r);
        float rim = pow(smoothstep(0.8, 0.995, r), 3.0);
        return col * ((arms * 0.3 + streaks * 0.4) * outer + rim * 1.1);
    }
`;

/**
 * The portal's event horizon: a window onto the next place (BEYOND), held by a swirl in the
 * project's colour that stays out at the rim, leaving the middle clear as glass. It forms as the
 * ship comes close and flashes as the ship crosses.
 */
const HORIZON_FRAG =
    BEYOND +
    /* glsl */ `
    uniform vec3 uCol; uniform float uOn, uFlash;
    varying vec2 vUv; varying vec3 vW; varying float vD;
    void main() {
        vec2 c = vUv - 0.5;
        float r = max(length(c) * 2.0, 1e-3);
        float inside = 1.0 - smoothstep(0.985, 1.0, r);
        vec3 col = swirl(uCol, r, atan(c.y, c.x) / 6.2831853, 0.0);
        // Premultiplied: the throat covers the scene behind with the place beyond; the swirl adds light.
        float alpha = 0.92 * uOn * inside * fade(vD);
        vec3 glow = col * uOn + mix(uCol, vec3(1.0), 0.5) * uFlash * (1.0 - r * 0.6);
        gl_FragColor = vec4(beyond(normalize(vW - cameraPosition)) * alpha + glow * inside * fade(vD), alpha);
    }
`;

/**
 * The lens: how the camera enters a portal. A screen-filling quad (built in clip space, so it
 * needs no camera) that cuts a circle the size and place of the portal's window on screen; as the
 * camera goes through the throat (uOpen 0–1) the circle swells to the centre and past the
 * corners, so the next place arrives through the window, its swirling rim sweeping out past the
 * lens, its light spilling a little outside. At the cut the frame flashes briefly in the ring's
 * colour; then the window fades (uShow) into the place itself.
 */
const LENS_VERT = /* glsl */ `
    uniform vec3 uAt; uniform float uR, uOpen;
    varying vec2 vS, vC; varying vec3 vDir; varying float vRad;
    void main() {
        float asp = projectionMatrix[1][1] / projectionMatrix[0][0];
        vS = position.xy * vec2(asp, 1.0);
        vDir = (vec4(position.x / projectionMatrix[0][0], position.y / projectionMatrix[1][1], -1.0, 0.0) * viewMatrix).xyz;
        vec4 c = projectionMatrix * viewMatrix * vec4(uAt, 1.0);
        bool ahead = c.w > 0.5;
        vec2 at = ahead ? c.xy / c.w * vec2(asp, 1.0) : vec2(0.0);
        float rn = ahead ? uR * projectionMatrix[1][1] / c.w : 9.0;
        float reach = length(vec2(asp, 1.0)) * 1.45;
        vC = mix(at, vec2(0.0), smoothstep(0.1, 0.85, uOpen));
        vRad = max(rn, mix(rn, reach, smoothstep(0.04, 0.96, uOpen)));
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;
const LENS_FRAG =
    BEYOND +
    /* glsl */ `
    uniform vec3 uCol; uniform float uOpen, uShow, uFlash;
    varying vec2 vS, vC; varying vec3 vDir; varying float vRad;
    void main() {
        vec2 q = (vS - vC) / vRad;
        float r = max(length(q), 1e-3);
        float aa = fwidth(r) * 1.5;
        float inside = 1.0 - smoothstep(1.0 - aa, 1.0, r);
        // The rim thickens and burns brighter as it rushes past.
        vec3 col = swirl(uCol, r, atan(q.y, q.x) / 6.2831853, uOpen * 3.0) * (1.0 + uOpen) * inside;
        col += uCol * 0.7 * exp(-max(r - 1.0, 0.0) * 10.0) * (1.0 - inside);
        float alpha = uShow * inside;
        vec3 flash = mix(uCol, vec3(1.0), 0.45) * uFlash * (0.6 + 0.4 * inside);
        gl_FragColor = vec4(beyond(normalize(vDir)) * alpha + col * uShow + flash, alpha);
    }
`;

/**
 * The light strip lining the ring: segments chasing round it. Each project's gate runs its own
 * pattern (how many segments, which way, how fast), so no two gates blink alike.
 */
const STRIP_FRAG = /* glsl */ `
    uniform vec3 uCol; uniform float uSegs, uSpin; varying vec2 vUv; varying float vD;
    void main() {
        float chase = smoothstep(0.25, 0.45, fract(vUv.x * uSegs - uTime * uSpin));
        gl_FragColor = vec4(fogIt(uCol * (0.35 + 1.3 * chase), vD), 1.0);
    }
`;

/**
 * The marquee over each gate, mounted on it like a cinema's: a black cabinet in a thin dark trim,
 * the project's title in channel letters lit in the ring's colour, their cores white-hot (well
 * over the bloom's threshold, so only they bloom), their glow washing the backing, and a track of
 * bulbs chasing round inside the trim (kept under the threshold). Now and then the letters buzz.
 * Mask channels: r the letters, g their halo, b the letters eased in (near 1 only well inside a
 * stroke: the core). The letters' edge is cut from r at half coverage, so up close they stay crisp.
 */
const SIGN_FRAG = /* glsl */ `
    uniform sampler2D tText; uniform vec3 uCol; uniform vec2 uSize; uniform float uOn, uSpin, uSegs, uK;
    varying vec2 vUv; varying float vD;
    // Signed distance (units) to the bulb track, and how far round the track this point is.
    vec2 track(vec2 q, vec2 hs) {
        vec2 e = abs(q) - hs;
        float side = step(e.y, e.x);
        float sx = mix(3.0 * hs.x + 2.0 * hs.y - q.x, hs.x + q.x, step(0.0, q.y)) * (1.0 - side);
        float sy = mix(4.0 * hs.x + 3.0 * hs.y + q.y, 2.0 * hs.x + hs.y - q.y, step(0.0, q.x)) * side;
        return vec2(max(e.x, e.y), sx + sy);
    }
    void main() {
        vec2 q = (vUv - 0.5) * uSize;
        vec3 m = texture2D(tText, vUv).rgb;
        float fp = max(fwidth(q.x), fwidth(q.y));
        float buzz = 1.0 - 0.55 * step(0.9, hash(vec2(floor(uTime * 15.0), uK))) * step(0.82, fract(uTime * 0.09 + uK * 0.37));
        float on = (0.55 + 0.45 * uOn) * buzz;
        // Backing: black. What is lit (the glow, the letters, the bulbs) is a light source: the haze
        // dims it less than the cabinet, so the title reads from far off; the black holds too.
        vec3 base = vec3(0.004, 0.004, 0.005);
        vec3 light = uCol * m.g * 0.05 * on;
        // Letters: the ring's colour through each stroke, white-hot only in its core.
        float cut = clamp(fwidth(m.r) * 0.75, 0.02, 0.5);
        float letter = smoothstep(0.5 - cut, 0.5 + cut, m.r);
        float core = smoothstep(0.94, 1.0, m.b);
        light = mix(light, mix(uCol * 0.85, mix(uCol, vec3(1.0), 0.45) * 3.0, core) * on, letter);
        base *= 1.0 - letter;
        // Trim: dark metal, a touch lighter along the top where the moon catches it; a coloured inner edge.
        vec2 e = uSize * 0.5 - abs(q);
        float border = min(e.x, e.y);
        float trim = 1.0 - smoothstep(0.07, 0.07 + fp, border);
        vec3 metal = mix(vec3(0.015, 0.016, 0.02), vec3(0.06, 0.065, 0.075), smoothstep(-0.5, 0.5, q.y / uSize.y));
        base = mix(base, metal, trim);
        light *= 1.0 - trim;
        light += uCol * 0.4 * (1.0 - smoothstep(0.0, 0.015 + fp, abs(border - 0.08))) * on;
        // The bulb track, chasing in segments, the off bulbs glowing faintly; far off, a bulb
        // averages out over its share of the track.
        vec2 t = track(q, uSize * 0.5 - 0.17);
        float sp = 0.16;
        float bulb = smoothstep(0.05, 0.02, length(vec2((fract(t.y / sp) - 0.5) * sp, t.x)));
        bulb = mix(bulb, 0.3 * (1.0 - smoothstep(0.0, 0.06, abs(t.x))), smoothstep(0.012, 0.04, fp));
        float chase = step(0.55, fract(floor(t.y / sp) / uSegs - uTime * uSpin));
        vec3 warm = mix(vec3(1.0, 0.86, 0.62), uCol, 0.35);
        light += bulb * warm * mix(0.08, 0.85, chase) * (0.5 + 0.5 * uOn);
        gl_FragColor = vec4(fogIt(base, vD * 0.45) + light * fade(vD * 0.6), 1.0);
    }
`;

/** Sign units (the gate's own, ring 5 across): mask pixels per unit, height, widest, centre height. */
const PX = 128;
const SIGN_H = 3;
const SIGN_MAX_W = 12;
const SIGN_Y = 7.2;

/** The title as a mask (see SIGN_FRAG); null without a title or a canvas. */
function titleMask(title: string): { tex: THREE.Texture; w: number } | null {
    if (!title) return null;
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    if (!x) return null;
    const font = (px: number): string => `800 ${px}px system-ui, "Segoe UI", Roboto, Arial, sans-serif`;
    x.font = font(100);
    const w = Math.min(SIGN_MAX_W, Math.max(2.6, ((x.measureText(title).width / 100) * 0.55 + 0.6) * SIGN_H));
    c.width = Math.round(w * PX);
    c.height = Math.round(SIGN_H * PX);
    x.fillStyle = '#000';
    x.fillRect(0, 0, c.width, c.height);
    x.font = font(c.height * 0.56);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.globalCompositeOperation = 'lighter';
    // One pass per channel: the halo in green, the eased letters in blue, the letters in red. The
    // blurred ones are drawn as a shadow only, the text itself thrown off the canvas (shadow blur
    // works everywhere; canvas filters do not).
    const pass = (colour: string, blur: number): void => {
        const off = blur > 0 ? c.width * 2 : 0;
        x.fillStyle = colour;
        x.shadowColor = colour;
        x.shadowBlur = blur;
        x.shadowOffsetX = off;
        x.fillText(title, c.width / 2 - off, c.height * 0.53, c.width - 0.7 * PX);
    };
    pass('#00ff00', 0.16 * PX);
    pass('#0000ff', 0.06 * PX);
    pass('#ff0000', 0);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 4;
    return { tex, w };
}

const FLAT_VERT = /* glsl */ `varying vec2 vUv; varying float vD;
    void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`;

/** Dark brushed metal for the sign's cabinet and the struts that hold it on the ring. */
const CABINET = new THREE.MeshStandardMaterial({ color: 0x050506, metalness: 0.3, roughness: 0.75 });

/** The marquee for project k, mounted over its ring; null when there is no title. */
function marquee(s: Shared, title: string, colour: THREE.Color, k: number): Sign | null {
    const mask = titleMask(title);
    if (!mask) return null;
    const uOn = { value: 0.5 };
    const face = new THREE.Mesh(
        new THREE.PlaneGeometry(mask.w, SIGN_H),
        shader(s, FLAT_VERT, SIGN_FRAG, {
            tText: { value: mask.tex },
            uCol: { value: colour.clone() },
            uSize: { value: new THREE.Vector2(mask.w, SIGN_H) },
            uOn,
            uK: { value: k + 0.5 },
            uSpin: { value: (k % 2 ? -1 : 1) * (0.7 + 0.3 * (k % 3)) },
            uSegs: { value: 3 + (k % 4) },
        })
    );
    face.position.z = 0.22;
    const box = new THREE.Mesh(new THREE.BoxGeometry(mask.w + 0.16, SIGN_H + 0.16, 0.36), CABINET);
    box.position.z = 0.02;
    const mesh = new THREE.Group();
    mesh.add(face, box);
    // Two struts down onto the top of the ring.
    for (const side of [-1, 1]) {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 8), CABINET);
        strut.position.set(side * Math.min(1.6, mask.w * 0.3), -SIGN_H / 2 - 0.45, 0);
        mesh.add(strut);
    }
    mesh.position.set(0, SIGN_Y, 0);
    return { mesh, uOn };
}

/** The ring's light strip for project k, with that gate's own chase. */
function lightStrip(s: Shared, colour: THREE.Color, k: number): { mesh: THREE.Mesh; col: THREE.Color } {
    const col = colour.clone();
    const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(INNER, 0.025, 8, 160),
        shader(s, FLAT_VERT, STRIP_FRAG, {
            uCol: { value: col },
            uSegs: { value: [5, 8, 3, 12, 6][k % 5] },
            uSpin: { value: (k % 2 ? 1 : -1) * (0.15 + 0.1 * (k % 3)) },
        })
    );
    mesh.position.y = RING_Y;
    return { mesh, col };
}

/** What lies beyond portal k: the next landscape (as `LANDS` indexes them), or the sea (5) after the last. */
const nextKind = (k: number, n: number): number => (k < n - 1 ? (k + 1) % LANDS.length : LANDS.length);

/** Everything about portal k that does not depend on the model having loaded. */
type PortalSpec = {
    k: number;
    n: number;
    colour: string;
    u: number;
    beyond: THREE.Color | undefined;
    title: string;
};

function buildPortal(scene: THREE.Object3D, s: Shared, route: Route, glowAt: Glow, p: PortalSpec): Portal {
    const { k, u } = p;
    const colour = new THREE.Color(p.colour);
    const center = route.curve.getPointAt(u);
    const tangent = route.curve.getTangentAt(u);
    // Big enough to stand on this landscape's ground with its ring around the path.
    const scale = Math.max(4, (center.y - GROUND[LANDS[k % LANDS.length]]) / RING_Y) * 1.05;
    const g = new THREE.Group();
    g.position.copy(center).add(new THREE.Vector3(0, -RING_Y * scale, 0));
    g.lookAt(g.position.clone().sub(tangent.setY(0)));
    g.scale.setScalar(scale);
    scene.add(g);
    const strip = lightStrip(s, colour, k);
    const horizon = { uOn: { value: 0 }, uFlash: { value: 0 } };
    const disc = new THREE.Mesh(
        new THREE.CircleGeometry(INNER, 128),
        shader(
            s,
            /* glsl */ `varying vec2 vUv; varying vec3 vW; varying float vD; void main() { vUv = uv; vW = (modelMatrix * vec4(position, 1.0)).xyz; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
            HORIZON_FRAG,
            {
                uCol: { value: colour.clone() },
                uNext: { value: (p.beyond ?? new THREE.Color(0.03, 0.045, 0.08)).clone() },
                uKind: { value: nextKind(k, p.n) },
                ...horizon,
            },
            { ...WINDOW, side: THREE.DoubleSide }
        )
    );
    disc.position.y = RING_Y;
    g.add(strip.mesh, disc);
    const sign = marquee(s, p.title, colour, k);
    if (sign) g.add(sign.mesh);
    const beacon = glowAt(6, colour.clone(), 0.85);
    beacon.position.copy(center);
    beacon.visible = false;
    return {
        u,
        center,
        g,
        strip: strip.mesh,
        disc,
        glow: strip.col,
        sign,
        beacon,
        horizon,
        colour,
        near: 0,
        passed: false,
    };
}

type Lens = {
    /** The camera starts through portal k: the lens takes on its colour and the place beyond. */
    enter: (p: Portal, k: number) => void;
    /** Steps the entry (see `Rings.entry`) and returns it. */
    step: (u: number, show: number, jump: number) => number;
    on: () => boolean;
};

/** The lens the camera enters a portal through (LENS_FRAG). */
function addLens(scene: THREE.Object3D, s: Shared): Lens {
    const u = {
        uCol: { value: new THREE.Color() },
        uNext: { value: new THREE.Color() },
        uKind: { value: 0 },
        uAt: { value: new THREE.Vector3() },
        uR: { value: 1 },
        uOpen: { value: 0 },
        uShow: { value: 0 },
        uFlash: { value: 0 },
    };
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        shader(s, LENS_VERT, LENS_FRAG, u, { ...WINDOW, depthTest: false })
    );
    mesh.frustumCulled = false;
    mesh.renderOrder = 1000;
    mesh.visible = false;
    scene.add(mesh);
    let at: { p: Portal; k: number } | null = null;
    let cut = false;
    const show = (open: number, alpha: number, flash: number): void => {
        u.uOpen.value = open;
        u.uShow.value = alpha;
        u.uFlash.value = flash;
        mesh.visible = alpha > 0.002 || flash > 0.002;
    };
    return {
        enter: (p, k) => {
            at = { p, k };
            cut = false;
            const disc = p.disc.material as THREE.ShaderMaterial;
            u.uCol.value.copy(p.colour);
            u.uNext.value.copy(disc.uniforms.uNext.value as THREE.Color);
            u.uKind.value = disc.uniforms.uKind.value as number;
            u.uAt.value.copy(p.center);
            u.uR.value = INNER * p.disc.scale.x * p.g.scale.x;
        },
        step: (pos, shown, jump) => {
            // Scrolled back out of the throat, or the jump is over (or was a straight cut).
            if (at && (pos < at.p.u || (cut && jump < 0.01) || (shown !== at.k && jump < 0.01))) at = null;
            if (!at) {
                show(0, 0, 0);
                return 0;
            }
            cut = cut || shown !== at.k;
            if (!cut) {
                // Through the throat: the window swells to fill the frame; a flash as it closes over.
                show(jump, smooth(0, 0.12, jump), 0.6 * smooth(0.75, 1, jump));
                return jump;
            }
            // Through: the window fades into the place itself; the flash is gone in a blink.
            show(1, smooth(0, 0.9, jump), 0.6 * Math.pow(jump, 6));
            return 1;
        },
        on: () => at !== null,
    };
}

/**
 * 3 · Services: one gateway per project ("Sci-Fi Portal Gateway" by Igrium, CC BY 4.0), standing
 * on the ground of that project's landscape and sized so the ship flies through the middle of its
 * ring. Each gate is the project's own: its title in lights over the ring (when `titles` gives it),
 * a strip in its colour chasing round the ring in its own pattern, and the event horizon as a
 * window onto the place it leads to.
 */
export function addRings(
    scene: THREE.Object3D,
    s: Shared,
    route: Route,
    colours: string[],
    us: number[],
    small: boolean,
    glowAt: Glow,
    next: THREE.Color[] = [],
    titles: string[] = []
): Rings {
    const portals: Portal[] = colours.map((colour, k) =>
        buildPortal(scene, s, route, glowAt, {
            k,
            n: colours.length,
            colour,
            u: us[k],
            beyond: next[k],
            title: titles[k] ?? '',
        })
    );

    new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .loadAsync(small ? '/models/portal-1k.glb' : '/models/portal.glb')
        .then((gltf) => {
            const inner = innerRadius(gltf.scene);
            gltf.scene.traverse((o) => {
                const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
                if (!m?.isMeshStandardMaterial) return;
                m.envMapIntensity = 0.6;
                // Brushed, not polished: a mirror finish throws glints that bloom into white blobs.
                m.roughness = Math.max(m.roughness, 0.45);
            });
            for (const p of portals as Array<
                Portal & { strip: THREE.Mesh; disc: THREE.Mesh; g: THREE.Group }
            >) {
                p.g.add(gltf.scene.clone());
                p.strip.scale.setScalar(inner / INNER);
                p.disc.scale.setScalar((inner * 0.99) / INNER);
            }
        })
        .catch(() => undefined);

    // The gate lights the ground at its foot as it opens.
    const pool = (p: Portal): void => {
        const r = RING_Y * p.g.scale.x * 0.9;
        POOL.uPool.value.set(p.g.position.x, p.g.position.y, p.g.position.z, r * p.horizon.uOn.value);
        POOL.uPoolCol.value.copy(p.colour).multiplyScalar(0.6);
    };
    const rings: Rings = {
        centers: portals.map((p) => p.center),
        rush: 0,
        close: 0,
        entry: 0,
        crossing: 0,
        update: () => null,
    };
    const lens = addLens(scene, s);
    /** One portal, as the ship nears it, passes it (returns true on the crossing) or leaves it. */
    const advance = (p: Portal, k: number, u: number, dt: number, show: number): boolean => {
        p.g.visible = k === show;
        // The run-up: the last 90 m before the ring, building until the ship is through.
        if (k === show && u < p.u) rings.rush = smooth(90, 8, (p.u - u) * route.len);
        const d = Math.abs(u - p.u) * route.len;
        if (k === show) rings.close = smooth(60, 12, d);
        p.near += (smooth(400, 40, d) - p.near) * (1 - Math.exp(-dt * 4));
        // The beacon holds its size on screen from far off and fades as the ring takes over.
        p.beacon.visible = k === show && u < p.u;
        p.beacon.scale.setScalar(3 + d * 0.03);
        p.beacon.material.opacity = 0.85 * smooth(30, 120, d);
        p.glow.copy(p.colour).multiplyScalar(0.35 + p.near * 0.8);
        if (p.sign) p.sign.uOn.value = 0.45 + 0.55 * p.near;
        p.horizon.uOn.value = smooth(0.15, 0.85, p.near);
        if (k === show) pool(p);
        p.horizon.uFlash.value *= Math.exp(-dt * 3.5);
        if (u < p.u - 0.002) p.passed = false;
        if (p.passed || u <= p.u) return false;
        p.passed = true;
        p.horizon.uFlash.value = 0.45;
        return true;
    };
    const update = (u: number, _t: number, dt: number, show: number, jump = 0): number | null => {
        let hit: number | null = null;
        rings.rush = 0;
        rings.close = 0;
        POOL.uPool.value.w = 0;
        portals.forEach((p, k) => {
            if (advance(p, k, u, dt, show)) hit = k;
        });
        if (hit !== null) lens.enter(portals[hit], hit);
        rings.entry = lens.step(u, show, jump);
        rings.crossing = lens.on() ? 1 : 0;
        return hit;
    };
    rings.update = update;
    return rings;
}
