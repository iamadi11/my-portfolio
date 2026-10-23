import * as THREE from 'three';

import { hazeGlsl, MIST, MOON, MOONLIGHT } from '@/components/round-trip/world/gl';
import { GROUND, type LandKind, LANDS } from '@/components/round-trip/world/land';

/**
 * A real, little-known place on the horizon of each landscape, standing beyond that scene's exit
 * portal so it grows as the ship closes in. Each is a heightfield of the real ground (AWS Terrain
 * Tiles: SRTM from NASA, with ETOPO1 and GMTED2010 from NOAA and USGS), built by
 * scripts/places.py into public/env/places/, shaded here by moonlight in the colours of the place.
 */
type Place = {
    id: string;
    /** What the page can call it. */
    name: string;
    /** How it is coloured: an index into the shader's looks (see FRAG). */
    look: number;
    /** Width in metres in the world (the real place is scaled down to it). */
    width: number;
    /** Relief exaggeration over that scale, where the real relief is too gentle to read far off. */
    lift: number;
    /** Metres past the exit portal; below the ground; off the path; turned (radians) about up. */
    ahead: number;
    sink: number;
    side: number;
    turn: number;
};

const PLACES: Record<LandKind, Place> = {
    // A field of grassy cone hills 30–50 m high. `lift` exaggerates every relief to read at a km.
    grass: {
        id: 'chocolate_hills',
        name: 'Chocolate Hills, Bohol, Philippines',
        look: 0,
        width: 1700,
        lift: 4,
        ahead: 1050,
        sink: 30,
        side: -80,
        turn: 0,
    },
    // Megadunes up to ~400 m with small lakes in the hollows between them.
    desert: {
        id: 'badain_jaran',
        name: 'Badain Jaran Desert, Inner Mongolia, China',
        look: 1,
        width: 2200,
        lift: 2.5,
        ahead: 1250,
        sink: 40,
        side: 110,
        turn: 0,
    },
    // Folded sandstone ridges banded red, ochre, cream and grey-green.
    canyon: {
        id: 'zhangye_danxia',
        name: 'Zhangye Danxia, Gansu, China',
        look: 2,
        width: 2000,
        lift: 1.5,
        ahead: 1050,
        sink: 60,
        side: 170,
        turn: 0,
    },
    // Roraima and Kukenan, table mountains walled by cliffs some 400 m high, mist on their tops.
    alpine: {
        id: 'roraima',
        name: 'Mount Roraima, Venezuela, Brazil and Guyana',
        look: 3,
        width: 2600,
        lift: 1.4,
        ahead: 1300,
        sink: 90,
        side: 120,
        turn: 0,
    },
    // A steep cone with a lava lake in its summit crater.
    volcano: {
        id: 'nyiragongo',
        name: 'Nyiragongo, DR Congo',
        look: 4,
        width: 1600,
        lift: 1.3,
        ahead: 950,
        sink: 30,
        side: 160,
        turn: 0,
    },
};

/** Nyiragongo's summit crater in the heightfield: east, north, radius (m) and the lake's level. */
const CRATER = new THREE.Vector4(0, -200, 540, 3230);

/** The line the page shows for the elevation data, per its providers' attribution terms. */
const PLACES_CREDIT =
    'Real-place terrain: AWS Terrain Tiles (Mapzen/Tilezen) from SRTM (NASA), ETOPO1 (NOAA) and GMTED2010 (USGS)';

export type Landmarks = {
    show: (zone: number) => void;
    /** The real place on the horizon of each landscape, by zone (the portal it stands beyond). */
    names?: string[];
    credit?: string;
};

const VERT = /* glsl */ `
    attribute float aWet;
    uniform float uLo; uniform vec2 uScale;
    varying vec3 vW, vN; varying vec2 vP; varying float vH, vWet;
    void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        // Real metres: east, north and height above sea level.
        vP = vec2(position.x, -position.z) / uScale.x;
        vH = uLo + position.y / uScale.y;
        vWet = aWet;
        gl_Position = projectionMatrix * viewMatrix * w;
    }
`;

/**
 * Moonlit relief in the colours of each place, then the world's haze and ground mist (gl.ts), with
 * the distance fog much lighter than the land's so the place's relief and colour still read.
 */
const FRAG = /* glsl */ `
    uniform vec3 uMoon, uMoonCol; uniform int uLook; uniform float uTime; uniform vec4 uCrater;
    uniform float uMist; uniform vec3 fogColor; uniform float fogDensity;
    varying vec3 vW, vN; varying vec2 vP; varying float vH, vWet;
    float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vn(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fb(vec2 p) { return vn(p) * 0.55 + vn(p * 2.1 + 3.0) * 0.3 + vn(p * 4.3 + 7.0) * 0.15; }
    ${hazeGlsl('fogColor', 'uMist')}
    // Strata of the Danxia: tilted beds, each its own colour.
    vec3 bands(float slope) {
        float t = vH * 0.045 + vP.x * 0.0012 - vP.y * 0.0007 + (fb(vP * 0.004) - 0.5) * 1.6;
        float id = floor(t);
        float k = h1(vec2(id, 4.0));
        vec3 c = k < 0.3 ? vec3(0.62, 0.16, 0.08) : k < 0.5 ? vec3(0.72, 0.46, 0.2) : k < 0.66 ? vec3(0.78, 0.68, 0.52) : k < 0.82 ? vec3(0.3, 0.46, 0.42) : vec3(0.48, 0.2, 0.2);
        return mix(c, vec3(0.5, 0.3, 0.2), smoothstep(0.75, 1.0, fract(t)) * 0.5) * (0.8 + 0.3 * smoothstep(0.1, 0.5, slope));
    }
    vec3 albedo(float slope, float n, inout vec3 glow) {
        if (uLook == 0) {
            // Green on the floor between the hills, their crowns burnt brown.
            float crown = smoothstep(0.3, 0.75, fract(vH * 0.02) * 0.5 + n * 0.6);
            return mix(vec3(0.07, 0.13, 0.05), vec3(0.24, 0.15, 0.07), crown);
        }
        if (uLook == 1) return vec3(0.6, 0.5, 0.36) * (0.85 + 0.3 * n) * (1.0 - 0.35 * smoothstep(0.35, 0.7, slope));
        if (uLook == 2) return bands(slope);
        if (uLook == 3) {
            // Dark sandstone walls; scrub on the tops and the forest below.
            float wall = smoothstep(0.35, 0.6, slope);
            vec3 ground = mix(vec3(0.05, 0.08, 0.05), vec3(0.11, 0.11, 0.09), smoothstep(2200.0, 2500.0, vH));
            return mix(ground, vec3(0.13, 0.1, 0.09) * (0.7 + 0.6 * n), wall);
        }
        // Black basalt; the lava lake in the crater, its crust cracking open, and the walls above it lit red.
        vec2 dc = vP - uCrater.xy;
        float inCrater = smoothstep(uCrater.z, uCrater.z * 0.8, length(dc));
        float lake = inCrater * smoothstep(uCrater.w + 10.0, uCrater.w - 20.0, vH);
        float crust = smoothstep(0.42, 0.6, fb(dc * 0.02 + uTime * 0.05));
        glow = mix(vec3(2.4, 0.5, 0.06), vec3(0.35, 0.03, 0.0), crust) * lake;
        glow += vec3(0.5, 0.08, 0.01) * inCrater * (1.0 - lake) * smoothstep(uCrater.w + 200.0, uCrater.w, vH);
        return vec3(0.03, 0.028, 0.03) * (0.7 + 0.6 * n);
    }
    void main() {
        vec3 n = normalize(vN);
        float slope = 1.0 - n.y;
        float g = fb(vP * 0.01);
        vec3 glow = vec3(0.0);
        vec3 col = albedo(slope, g, glow);
        vec3 V = normalize(cameraPosition - vW);
        float lit = max(dot(n, uMoon), 0.0);
        vec3 amb = vec3(0.016, 0.024, 0.042) * (0.6 + 0.4 * n.y);
        col = col * (uMoonCol * lit * 2.4 + amb * 3.0) + glow;
        if (vWet > 0.5) {
            // A lake: black water holding the moon.
            vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0));
            col = vec3(0.004, 0.008, 0.016) + uMoonCol * pow(max(dot(R, uMoon), 0.0), 40.0) * 0.6;
        }
        if (uLook == 3) {
            // Cloud lying on the tepui tops.
            col = mix(col, vec3(0.16, 0.19, 0.24), smoothstep(2350.0, 2700.0, vH) * (0.4 + 0.5 * fb(vP * 0.0015 + uTime * 0.01)));
        }
        float hazeD = length(vW - cameraPosition);
        float fogFactor = 1.0 - exp(-fogDensity * fogDensity * 0.02 * hazeD * hazeD - 0.3 * mist(vW, hazeD));
        gl_FragColor = vec4(mix(col, haze((vW - cameraPosition) / hazeD), fogFactor), 1.0);
    }
`;

type Field = { n: number; lo: number; hi: number; span: number; q: Uint16Array };

function readField(buf: ArrayBuffer): Field {
    const [n, lo, hi, span] = new Float32Array(buf, 0, 4);
    return { n, lo, hi, span, q: new Uint16Array(buf, 16, n * n) };
}

/**
 * The real ground as a mesh, scaled to the place's width; the rim of the square is eased down
 * into a round foot below the land, so it ends in the ground and never in a cut edge.
 */
function terrain(f: Field, place: Place): THREE.BufferGeometry {
    const scale = place.width / f.span;
    const geo = new THREE.PlaneGeometry(place.width, place.width, f.n - 1, f.n - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const wet = new Float32Array(f.n * f.n);
    const per = ((f.hi - f.lo) / 32767) * scale * place.lift;
    for (let i = 0; i < f.n * f.n; i++) {
        const r = Math.hypot(pos.getX(i), pos.getZ(i)) / (place.width / 2);
        const foot = 1 - THREE.MathUtils.smoothstep(r, 0.62, 0.98);
        pos.setY(i, (f.q[i] >> 1) * per * foot);
        wet[i] = f.q[i] & 1;
    }
    geo.setAttribute('aWet', new THREE.BufferAttribute(wet, 1));
    geo.computeVertexNormals();
    return geo;
}

function material(f: Field, place: Place, time: THREE.IUniform<number>): THREE.ShaderMaterial {
    const uniforms = THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
            uMoon: { value: MOON },
            uMoonCol: { value: MOONLIGHT },
            uLook: { value: place.look },
            uLo: { value: f.lo },
            uScale: { value: new THREE.Vector2(place.width / f.span, (place.width / f.span) * place.lift) },
            uCrater: { value: CRATER },
        },
    ]);
    // Shared, not copied: the clock and the world's mist move.
    uniforms.uTime = time;
    uniforms.uMist = MIST;
    return new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, fog: true });
}

/** The red light of the lava lake on the fumes above the crater, seen from far off. */
function plume(width: number): THREE.Sprite {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    if (x) {
        const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,120,40,0.9)');
        g.addColorStop(0.4, 'rgba(200,50,10,0.35)');
        g.addColorStop(1, 'rgba(120,20,0,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 64, 64);
    }
    const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(c),
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
        })
    );
    s.scale.set(width * 0.3, width * 0.16, 1);
    return s;
}

type Connection = { saveData?: boolean; effectiveType?: string };

/**
 * The places are scenery, 74–295 kB each: left out on a connection that asks to save data or is
 * slow (3G or worse), where the land, portals and sky still make the place.
 */
export function lean(): boolean {
    const c = (navigator as Navigator & { connection?: Connection }).connection;
    return !!c && (c.saveData === true || ['slow-2g', '2g', '3g'].includes(c.effectiveType ?? ''));
}

function build(g: THREE.Group, place: Place, buf: ArrayBuffer, time: THREE.IUniform<number>): void {
    const f = readField(buf);
    const mesh = new THREE.Mesh(terrain(f, place), material(f, place, time));
    mesh.frustumCulled = false;
    g.add(mesh);
    if (place.look === 4) {
        const s = plume(place.width);
        const k = place.width / f.span;
        s.position.set(CRATER.x * k, (CRATER.w - f.lo) * k * place.lift + place.width * 0.07, -CRATER.y * k);
        g.add(s);
    }
}

export function addLandmarks(
    scene: THREE.Object3D,
    portals: Array<{ center: THREE.Vector3; tangent: THREE.Vector3 }>,
    small: boolean
): Landmarks {
    const names = portals.map((_, k) => PLACES[LANDS[k % LANDS.length]].name);
    if (lean()) return { show: () => undefined, names, credit: PLACES_CREDIT };
    const time: THREE.IUniform<number> = { value: 0 };
    // Each place is fetched when its landscape comes up (and the next one), not all at once.
    const loads: Array<(() => Promise<void>) | undefined> = [];
    const groups = portals.map((p, k) => {
        const kind = LANDS[k % LANDS.length];
        const place = PLACES[kind];
        const g = new THREE.Group();
        g.visible = false;
        scene.add(g);
        const ahead = p.tangent.clone().setY(0).normalize();
        const right = new THREE.Vector3(-ahead.z, 0, ahead.x);
        g.position
            .copy(p.center)
            .addScaledVector(ahead, place.ahead)
            .addScaledVector(right, place.side)
            .setY(GROUND[kind] - place.sink);
        // North away from the ship, so the place is seen from the south as on a map.
        g.rotation.y = Math.atan2(-ahead.x, -ahead.z) + place.turn;
        loads[k] = () =>
            fetch(`/env/places/${place.id}-${small ? 'lo' : 'hi'}.bin`)
                .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
                .then((buf) => build(g, place, buf, time))
                .catch(() => undefined);
        return g;
    });
    const load = (k: number): void => {
        const go = loads[k];
        loads[k] = undefined;
        void go?.();
    };
    return {
        names,
        credit: PLACES_CREDIT,
        show: (zone) => {
            time.value = performance.now() / 1000;
            if (zone >= 0) [zone, zone + 1].forEach(load);
            groups.forEach((g, k) => (g.visible = k === zone));
        },
    };
}
