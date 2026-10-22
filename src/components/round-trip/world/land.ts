import * as THREE from 'three';

import { ADD, MOON, MOONLIGHT, type Shared, shader } from '@/components/round-trip/world/gl';

/**
 * Project landscapes (cycle if more projects than kinds). Kind ids stay stable for AIR / sound /
 * framing; the ground shaders read as Chocolate Hills, Lençóis Maranhenses, Zhangye Danxia,
 * Mount Roraima, and Erta Ale — matching the DEM horizons in `places.ts`.
 */
export const LANDS = ['grass', 'desert', 'canyon', 'alpine', 'volcano'] as const;
export type LandKind = (typeof LANDS)[number];
/** Roughly where the ground is under the path in each, for the search beam. */
export const GROUND: Record<LandKind, number> = {
    grass: -10, // Chocolate Hills — valley floor between cones
    desert: -14, // Lençóis — dune flats
    canyon: -14, // Danxia — wash between banded ridges
    alpine: -18, // Roraima — floor under the tepui walls
    volcano: -16, // Erta Ale — shield apron
};

/**
 * A pool of light on the ground at the foot of the open portal, in its colour: xyz is the gate's
 * base, w its radius times how far open it is (0 for none). Set by the portals each frame.
 */
export const POOL = {
    uPool: { value: new THREE.Vector4(0, -999, 0, 0) },
    uPoolCol: { value: new THREE.Color() },
};

/**
 * Ground height for each landscape, in GLSL so the land is endless: the mesh follows the camera and
 * every vertex asks for its own height. All of them keep a valley along the path.
 * 0 Chocolate Hills · 1 Lençóis · 2 Danxia · 3 Roraima · 4 Erta Ale.
 */
const HEIGHT = /* glsl */ `
    uniform int uKind;
    // Jittered cell centre; s is the lattice spacing (Chocolate Hills dense, Erta Ale sparse).
    vec2 cellAt(vec2 p, float s) {
        vec2 cell = floor(p / s);
        return (cell + 0.5 + (vec2(hash(cell), hash(cell + 3.1)) - 0.5) * 0.48) * s;
    }
    vec2 coneAt(vec2 p) { return cellAt(p, 720.0); }
    float landH(vec2 p) {
        float d = abs(p.x - pathX(p.y));
        if (uKind == 0) {
            // Chocolate Hills: dense field of smooth grass cones; path stays in the green troughs.
            vec2 c = cellAt(p, 260.0);
            float r = length(p - c);
            float keep = smoothstep(28.0, 95.0, abs(c.x - pathX(c.y)));
            float cone = pow(max(0.0, 1.0 - r / 115.0), 1.55) * 52.0;
            float hummock = (fbm(p * 0.02 + 4.0) - 0.5) * 3.5;
            return -10.0 + hummock * (0.3 + 0.7 * smoothstep(8.0, 50.0, d)) + cone * keep * smoothstep(12.0, 55.0, d);
        }
        if (uKind == 1) {
            // Lençóis Maranhenses: soft white-dune flats; rainwater lagoons dig shallow dark bowls.
            float warp = fbm(p * 0.01) * 4.0;
            float crest = 1.0 - abs(sin((p.x * 0.7 + p.y * 0.55) * 0.028 + warp));
            float dunes = pow(crest, 2.2) * (2.5 + 5.5 * fbm(p * 0.014 + 5.0)) * (0.25 + 0.75 * smoothstep(6.0, 35.0, d));
            float basin = smoothstep(0.58, 0.74, fbm(p * 0.009 + 3.2)) * smoothstep(0.5, 0.72, fbm(p * 0.021 + 8.0));
            float lagoon = basin * 5.5 * (0.4 + 0.6 * smoothstep(10.0, 45.0, d));
            return -14.0 + dunes - lagoon;
        }
        if (uKind == 2) {
            // Zhangye Danxia: banded ridges with uneven benches; a wash along the path.
            float m = (fbm(p * 0.005 + 4.0) * 1.3 - 0.45) * smoothstep(22.0, 70.0, d) + smoothstep(30.0, 140.0, d) * 0.85;
            float t = max(clamp(m, 0.0, 1.4) * 150.0 / 16.0 + (fbm(p * 0.012 + 8.0) - 0.5) * 0.8 * smoothstep(0.0, 0.2, m), 0.0);
            float i = floor(t), f = fract(t);
            float lip = 0.6 + 0.28 * hash(vec2(i, 1.3));
            float scree = smoothstep(0.1, lip, f);
            float h = (i + smoothstep(lip, 1.0, f) * 0.88 + scree * scree * 0.12) * 16.0;
            h += 5.0 * sin(h * 0.045);
            return -14.0 + h + (fbm(p * 0.06) - 0.5) * 2.5;
        }
        if (uKind == 3) {
            // Mount Roraima: sheer tepui plateaus — flat tops, near-vertical walls, path in the gap.
            vec2 c = cellAt(p, 980.0);
            vec2 q = (p - c) * vec2(1.0, 0.82);
            float edge = length(q) - (290.0 + (fbm(c * 0.01) - 0.5) * 70.0 + fbm(p * 0.008 + 2.0) * 28.0);
            float keep = smoothstep(55.0, 175.0, abs(c.x - pathX(c.y)));
            float wall = smoothstep(55.0, 6.0, edge);
            float talus = smoothstep(120.0, 55.0, edge) * (1.0 - wall) * 0.22;
            float top = 195.0 + (fbm(p * 0.015) - 0.5) * 8.0;
            float h = (wall * 0.92 + talus) * top;
            float floorN = (fbm(p * 0.012) - 0.5) * 6.0;
            return -18.0 + floorN * (0.35 + 0.65 * smoothstep(10.0, 70.0, d)) + h * keep * smoothstep(30.0, 120.0, d);
        }
        // Erta Ale: broad shield, annular rim, lava-lake pit — not a steep stratocone.
        vec2 c = coneAt(p);
        float r = length(p - c);
        float keep = smoothstep(90.0, 210.0, abs(c.x - pathX(c.y)));
        float shield = pow(max(0.0, 1.0 - r / 480.0), 2.35) * 88.0;
        float rim = smoothstep(62.0, 40.0, r) * smoothstep(16.0, 34.0, r) * 14.0;
        float pit = smoothstep(36.0, 6.0, r) * 38.0;
        float plain = (fbm(p * 0.01) - 0.5) * 10.0 + ridged(p * 0.018) * 3.0;
        return -16.0 + plain * (0.4 + 0.6 * smoothstep(10.0, 60.0, d)) + (shield + rim - pit) * keep * smoothstep(30.0, 130.0, d);
    }
`;

const FRAG = /* glsl */ `
    uniform vec3 uMoon, uMoonCol, uPoolCol; uniform vec4 uPool;
    varying vec3 vW, vN; varying float vD, vSh, vCav;
    // Bump mapping from a height b, in screen space: one noise per pixel instead of three.
    vec3 bumpN(vec3 n, float b, float k) {
        vec3 dpx = dFdx(vW), dpy = dFdy(vW);
        vec3 r1 = cross(dpy, n), r2 = cross(n, dpx);
        float det = dot(dpx, r1);
        vec3 grad = sign(det) * (dFdx(b) * r1 + dFdy(b) * r2);
        return normalize(abs(det) * n - k * grad);
    }
    // Molten rock by temperature (0–1): crust near-black, dull red, #ff4a10, then #ffd27a cores.
    // Only the hottest cores pass 1.0 in luminance, so only they bloom.
    vec3 lava(float t) {
        vec3 c = vec3(0.3, 0.018, 0.002) * smoothstep(0.08, 0.4, t);
        c = mix(c, vec3(1.0, 0.066, 0.005) * 1.4, smoothstep(0.35, 0.72, t));
        return mix(c, vec3(1.0, 0.644, 0.195) * 2.6, smoothstep(0.8, 1.0, t));
    }
    float plates(vec2 q) { return abs(vnoise(q) * 0.65 + vnoise(q * 2.3 + 7.0) * 0.35 - 0.5); }
    // Lava in the low channels: crust plates drifting along the river with glowing seams between
    // them, broken open along the middle where it runs hottest. Returns the temperature.
    float river(vec2 p, out float bed) {
        float f = fbm(p * 0.012 + 11.0);
        float rv = 1.0 - abs(f * 2.0 - 1.0);
        bed = smoothstep(0.91, 0.975, rv) * smoothstep(-8.0, -16.0, vW.y);
        if (bed <= 0.0) return 0.0;
        float core = smoothstep(0.96, 0.997, rv);
        // Downstream runs along the contour: across the field's gradient.
        vec2 gr = vec2(fbm((p + vec2(3.0, 0.0)) * 0.012 + 11.0), fbm((p + vec2(0.0, 3.0)) * 0.012 + 11.0)) - f;
        vec2 dir = normalize(vec2(-gr.y, gr.x) + 1e-6);
        // Two phases of drift, each faded out as it resets, so the crust flows without stretching.
        float ph = fract(uTime * 0.07);
        vec2 q = p * 0.17;
        float c1 = plates(q - dir * ph * 2.4);
        float c2 = plates(q - dir * fract(ph + 0.5) * 2.4 + 5.3);
        float cr = mix(c1, c2, abs(ph * 2.0 - 1.0));
        float plate = smoothstep(0.015, 0.07, cr);
        float open = smoothstep(0.6, 0.95, core * 0.9 + (vnoise(q * 0.7 - dir * uTime * 0.3) - 0.5) * 0.8);
        float crust = 0.1 + 0.12 * vnoise(q * 3.0);
        return bed * mix(0.6 + 0.15 * core, crust, plate * (1.0 - open)) + open * bed * 0.35;
    }
    // Fissures down a shield's flanks from the lava-lake rim, broken into glowing segments.
    float fissures(vec2 p) {
        vec2 dc = p - coneAt(p);
        float r = length(dc);
        float a = atan(dc.y, dc.x);
        float line = 1.0 - smoothstep(0.0, 0.07, abs(sin(a * 5.0 + fbm(dc * 0.02) * 4.0)));
        float seg = smoothstep(0.45, 0.6, vnoise(vec2(a * 9.0, r * 0.04)));
        return line * seg * smoothstep(200.0, 40.0, r) * smoothstep(8.0, 55.0, vW.y);
    }
    // What weather has done to a wall, at distance a along it and height y, in bed id: a vertical
    // fracture (x, 1 in the crack), a varnish streak running down (y), and how much of a
    // hard ledge survives here (z: erosion breaks every ledge into lengths).
    vec3 weathering(float a, float y, float id, float close) {
        float fr = vnoise(vec2(a * 0.07, y * 0.006 + 3.0));
        float crack = (1.0 - smoothstep(0.0, mix(0.035, 0.014, close), abs(fr - 0.5))) * smoothstep(0.45, 0.65, vnoise(vec2(a * 0.03, y * 0.04)));
        float streak = smoothstep(0.45, 0.8, vnoise(vec2(a * 0.42, y * 0.018 + 9.0))) * smoothstep(0.3, 0.7, vnoise(vec2(a * 0.06, 2.0)));
        float whole = smoothstep(0.25, 0.55, vnoise(vec2(a * 0.045, id * 3.1)));
        return vec3(crack, streak, whole);
    }
    // Zhangye Danxia: coloured strata beds of uneven thickness. Hard ledges catch the moon; soft
    // beds scoop back. Palette cycles rose / saffron / cream / crimson / wine. Wash floor is
    // finer pink sand with rubble at the wall foot.
    vec3 danxia(vec2 p, float slope, float rocky, float close, float g, inout vec3 n, inout float ao, out float rim) {
        float wall = smoothstep(0.3, 0.7, slope);
        float y = vW.y + (fbm(p * 0.012) - 0.5) * 7.0 + p.x * 0.015;
        float bed = y * 0.38 + 1.8 * sin(y * 0.08) + 0.85 * sin(y * 0.21 + 1.7);
        float id = floor(bed), fb = fract(bed);
        float aa = 1.0 - smoothstep(0.3, 0.8, fwidth(bed));
        float hard = hash(vec2(id, 3.7));
        vec2 nh = normalize(n.xz + vec2(1e-4, 0.0));
        vec3 mk = mix(weathering(p.y, y, id, close), weathering(p.x, y, id, close), nh.y * nh.y) * wall;
        float ledge = smoothstep(0.5, 0.8, hard) * mix(0.35, 1.0, mk.z) * aa;
        float cap = smoothstep(0.55, 0.88, fb) * (1.0 - smoothstep(0.92, 1.0, fb));
        float under = smoothstep(0.25, 0.5, fb) * (1.0 - smoothstep(0.5, 0.6, fb));
        float scoop = sin(fb * 3.1416) * (1.0 - hard) * aa;
        rim = ledge * smoothstep(0.8, 0.88, fb) * (1.0 - smoothstep(0.9, 0.95, fb)) * wall;
        float lam = mix(0.5, vnoise(vec2((p.x + p.y) * 0.2, y * 3.0)), close * aa);
        float xbed = mix(0.5, 0.5 + 0.5 * sin((y + (p.x - p.y) * 0.3) * 5.0), close * aa * step(0.5, fract(hard * 7.0)));
        vec3 rose = vec3(0.72, 0.32, 0.28), saffron = vec3(0.78, 0.48, 0.18), cream = vec3(0.7, 0.58, 0.42);
        vec3 crimson = vec3(0.55, 0.14, 0.1), wine = vec3(0.38, 0.12, 0.16);
        float hc = hash(vec2(id, 9.1));
        vec3 rock = hc < 0.22 ? rose : hc < 0.42 ? saffron : hc < 0.6 ? cream : hc < 0.8 ? crimson : wine;
        rock = mix(vec3(0.55, 0.28, 0.2), rock, aa * 0.7 + 0.15);
        rock *= (0.78 + 0.3 * lam) * (0.9 + 0.12 * xbed) * (0.8 + 0.4 * fbm(p * 0.01 + 1.0)) * (0.88 + 0.24 * g);
        rock = mix(rock, vec3(0.08, 0.05, 0.045), mk.y * 0.7);
        rock *= 1.0 - 0.45 * mk.x;
        rock = mix(rock, rock * 1.28 + 0.04, rim);
        float drift = vnoise(p * 0.07 + 2.0) * 0.6 + vnoise(p * 0.19) * 0.4;
        float rip = sin(dot(p, vec2(0.8, 0.6)) * 3.2 + vnoise(p * 0.3) * 5.0) * close;
        float talus = max(smoothstep(0.06, 0.24, slope), smoothstep(0.5, 3.0, vCav)) * (1.0 - wall);
        float rubble = smoothstep(0.55, 0.78, vnoise(p * 0.5 + 7.0)) * talus;
        float pebble = smoothstep(0.7, 0.8, vnoise(p * 2.3 + 3.0) * 0.75 + drift * 0.25) * close;
        vec3 sand = mix(vec3(0.58, 0.36, 0.28), vec3(0.45, 0.22, 0.16), smoothstep(0.35, 0.7, drift)) * (0.92 + 0.12 * rip);
        sand = mix(sand, vec3(0.3, 0.14, 0.1), pebble * 0.75);
        sand = mix(sand, vec3(0.48, 0.2, 0.14) * (0.7 + 0.5 * hash(floor(p * 0.5))), rubble);
        float rb = (cap * ledge * 0.9 - scoop * 0.5 - mk.x * 0.3 + lam * 0.08) * wall;
        float fl = rip * 0.025 * (1.0 - talus) + pebble * 0.04 + rubble * 0.5;
        n = bumpN(n, mix(fl, rb, rocky), close);
        ao *= mix(1.0, (1.0 - 0.6 * under * ledge) * (1.0 - 0.35 * scoop) * (1.0 - 0.4 * mk.x), rocky * wall);
        ao *= 1.0 - 0.3 * rubble * (1.0 - rocky);
        return mix(sand, rock, rocky);
    }
    void main() {
        vec3 n = normalize(vN);
        vec2 p = vW.xz;
        float slope = 1.0 - n.y;
        float close = exp(-vD * 0.012);
        float g = fbm(p * 0.35 + vW.y * 0.2);
        float rocky = smoothstep(0.14, 0.32, slope + (fbm(p * 0.05) - 0.5) * 0.25);
        n = normalize(n + vec3(g - 0.5, 0.0, fbm(p.yx * 0.35) - 0.5) * 0.35 * rocky * close);
        // Hollows and clefts hold less light (curvature from the mesh), crests a touch more.
        float ao = 1.0 - smoothstep(0.0, 4.0, vCav) * 0.6 + smoothstep(0.0, 4.0, -vCav) * 0.1;
        vec3 albedo;
        vec3 glow = vec3(0.0);
        vec3 amb = vec3(0.016, 0.024, 0.042);
        float snow = 0.0;
        float fogD = vD;
        if (uKind == 0) {
            // Chocolate Hills: green turf with dry-season brown on the cone crests; wind waves.
            float wave = 0.5 + 0.5 * sin(dot(p, vec2(0.6, 0.8)) * 0.07 - uTime * 1.3 + fbm(p * 0.02) * 6.0);
            float crest = smoothstep(-6.0, 28.0, vW.y) * (0.55 + 0.45 * (1.0 - rocky));
            vec3 green = vec3(0.04, 0.068, 0.03) * (0.75 + 0.45 * fbm(p * 0.05)) * (0.8 + 0.45 * wave);
            vec3 choc = vec3(0.12, 0.07, 0.035) * (0.85 + 0.25 * g);
            albedo = mix(green, choc, crest * 0.7);
            albedo = mix(albedo, vec3(0.09, 0.08, 0.06), rocky * 0.45);
        } else if (uKind == 1) {
            // Lençóis: near-white dune flats; lagoon bowls go to dark water under the moon.
            float rip = sin(dot(p, vec2(0.8, 0.6)) * 2.8 + fbm(p * 0.2) * 5.0);
            n = normalize(n + vec3(0.8, 0.0, 0.6) * rip * 0.05 * (1.0 - rocky) * close);
            float basin = smoothstep(0.58, 0.74, fbm(p * 0.009 + 3.2)) * smoothstep(0.5, 0.72, fbm(p * 0.021 + 8.0));
            float lagoon = basin * (1.0 - rocky) * smoothstep(-10.0, -15.5, vW.y + basin * 2.0);
            vec3 sand = vec3(0.78, 0.74, 0.66) * (0.88 + 0.2 * fbm(p * 0.03)) * (0.92 + 0.1 * rip);
            vec3 water = vec3(0.015, 0.035, 0.055) * (0.7 + 0.4 * g);
            albedo = mix(sand, water, lagoon);
            glow = uMoonCol * lagoon * 0.12 * vSh;
            n = mix(n, vec3(0.0, 1.0, 0.0), lagoon * 0.65);
            n = normalize(n);
        } else if (uKind == 2) {
            float rim;
            albedo = danxia(p, slope, rocky, close, g, n, ao, rim);
            glow = albedo * uMoonCol * rim * 0.55 * vSh;
        } else if (uKind == 3) {
            // Mount Roraima: dark sheer walls, scrub plateau top; mist cools the ambient.
            float steep = smoothstep(0.28, 0.55, slope + (g - 0.5) * 0.25);
            float plateau = smoothstep(40.0, 120.0, vW.y) * (1.0 - steep);
            n = bumpN(n, mix(fbm(p * 0.25), g, plateau), mix(1.6, 0.5, plateau) * close);
            vec3 cliff = vec3(0.045, 0.048, 0.055) * (0.65 + 0.5 * g);
            vec3 scrub = vec3(0.06, 0.075, 0.05) * (0.8 + 0.3 * fbm(p * 0.04));
            vec3 bare = vec3(0.12, 0.12, 0.13) * (0.85 + 0.2 * g);
            albedo = mix(cliff, mix(scrub, bare, smoothstep(0.4, 0.75, g)), plateau);
            amb = mix(amb, vec3(0.028, 0.04, 0.08), 0.55 + 0.25 * plateau);
            fogD *= mix(1.0, 0.55, smoothstep(-10.0, 80.0, vW.y));
        } else {
            // Erta Ale: black shield crust; lava lake in the summit pit, cracks and flank fissures.
            albedo = mix(vec3(0.022, 0.02, 0.024), vec3(0.055, 0.048, 0.045), rocky) * (0.7 + 0.55 * g);
            float bed;
            float heat = river(p, bed) * 0.55;
            albedo *= 1.0 - bed * 0.5;
            float crack = (1.0 - smoothstep(0.0, 0.02 * (0.4 + 0.6 * close), abs(fbm(p * 0.09) - 0.5))) * (1.0 - rocky);
            heat = max(heat, crack * (0.38 + 0.1 * sin(uTime * 1.3 + g * 9.0)));
            heat = max(heat, fissures(p) * 0.75);
            float rc = length(p - coneAt(p));
            float lake = smoothstep(34.0, 8.0, rc) * smoothstep(8.0, 45.0, vW.y + 16.0);
            heat = max(heat, lake * (0.85 + 0.15 * sin(uTime * 0.9 + g * 6.0)));
            glow = lava(heat);
            n = bumpN(n, g, 0.8 * close * (1.0 - bed) * (1.0 - lake * 0.8));
            amb += vec3(0.055, 0.014, 0.004) * (1.0 - n.y * 0.5) * (0.5 + 0.5 * lake);
            fogD *= mix(1.0, 0.25, smoothstep(-4.0, 90.0, vW.y + 16.0));
        }
        vec3 V = normalize(cameraPosition - vW);
        float lit = max(dot(n, uMoon), 0.0) * vSh;
        vec3 col = albedo * (uMoonCol * lit + amb * (0.6 + 0.4 * n.y)) * ao + glow;
        vec3 R = reflect(-uMoon, n);
        float sparkle = step(0.985, hash(floor(p * 6.0))) * pow(max(dot(R, V), 0.0), 6.0);
        col += uMoonCol * (pow(max(dot(R, V), 0.0), 30.0) * 0.25 * snow + sparkle * snow * 1.2 * close) * vSh;
        col += beamAt(vW) * (albedo * 4.0 + 0.04);
        vec3 pd = vW - uPool.xyz;
        col += uPoolCol * exp(-dot(pd, pd) / max(uPool.w * uPool.w, 1e-3)) * (albedo * 1.2 + 0.01) * step(0.01, uPool.w);
        gl_FragColor = vec4(fogAt(col, fogD, vW), 1.0);
    }
`;

/** Chocolate Hills turf near the ship: tapered blades, wind-bent, silver tips under the moon. */
const BLADE_VERT = /* glsl */ `
    uniform vec2 uTile;
    attribute vec2 aOff; attribute vec3 aBlade;
    varying float vT, vD; varying vec3 vW;
    void main() {
        vec2 c = wrapAround(aOff, uTile);
        float far = length(c - cameraPosition.xz);
        float h = aBlade.y * (1.0 - smoothstep(uTile.x * 0.38, uTile.x * 0.58, far));
        float t = position.y;
        vT = t;
        vec2 dir = vec2(cos(aBlade.x), sin(aBlade.x));
        vec3 p = vec3(c.x, landH(c), c.y);
        p.xz += vec2(-dir.y, dir.x) * position.x;
        p.y += t * h;
        float gust = (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 1.6 + dot(c, vec2(0.08, 0.05))))) * fbm(c * 0.02 + uTime * 0.1);
        p.xz += vec2(0.8, 0.6) * t * t * h * 0.5 * gust;
        p.y -= t * t * h * 0.12 * gust;
        vW = p;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        vD = -mv.z;
        gl_Position = projectionMatrix * mv;
    }
`;
const BLADE_FRAG = /* glsl */ `
    uniform vec3 uMoonCol;
    varying float vT, vD; varying vec3 vW;
    void main() {
        vec3 c = mix(vec3(0.012, 0.022, 0.01), vec3(0.11, 0.16, 0.085), vT);
        vec3 col = c * (uMoonCol * 0.55 + 0.15) + uMoonCol * pow(vT, 4.0) * 0.05;
        col += beamAt(vW) * c * 4.0;
        gl_FragColor = vec4(fogIt(col, vD), 1.0);
    }
`;

function bladeGeometry(n: number, tile: number, rand: () => number): THREE.InstancedBufferGeometry {
    const g = new THREE.InstancedBufferGeometry();
    const w = 0.09;
    const pos = [
        -w,
        0,
        0,
        w,
        0,
        0,
        -w * 0.7,
        0.4,
        0,
        w * 0.7,
        0.4,
        0,
        -w * 0.35,
        0.75,
        0,
        w * 0.35,
        0.75,
        0,
        0,
        1,
        0,
    ];
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4, 4, 3, 5, 4, 5, 6]);
    const off = new Float32Array(n * 2);
    const blade = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        off.set([rand() * tile, rand() * tile], i * 2);
        blade.set([rand() * Math.PI * 2, 1.1 + rand() * 1.6, rand()], i * 3);
    }
    g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 2));
    g.setAttribute('aBlade', new THREE.InstancedBufferAttribute(blade, 3));
    g.instanceCount = n;
    return g;
}

/** Air motes per place: fireflies (0), Erta Ale embers (1), Roraima mist/rain (2), Lençóis sand (3). */
export type Motes = {
    n: number;
    tile: number;
    y: [number, number];
    colour: THREE.Color;
    size: number;
    mode: number;
    /** Fall speed for mode 2 (snow drifts, rain drops). */
    fall?: number;
};

const MOTE_VERT = /* glsl */ `
    uniform vec2 uTile, uY; uniform float uSize, uMode, uFall, uStreak;
    attribute vec4 aSeed; varying float vA, vD;
    void main() {
        float r = aSeed.w, span = uY.y - uY.x;
        float y = uMode > 2.5 ? uY.x + aSeed.z * span + sin(uTime * 2.0 + r * 30.0) * 0.6
                : uMode > 1.5 ? uY.y - mod(aSeed.z * span + uTime * (uFall + r * uFall * 1.2), span)
                : uMode > 0.5 ? uY.x + mod(aSeed.z * span + uTime * (3.0 + r * 6.0), span)
                : uY.x + aSeed.z * span + sin(uTime * (0.5 + r) + r * 20.0) * 1.5;
        float blow = uMode > 2.5 ? uTime * (18.0 + r * 14.0) : 0.0;
        vec3 p = vec3(aSeed.x + blow + sin(uTime * (0.3 + r * 0.5) + r * 31.0) * 3.0, y, aSeed.y + cos(uTime * (0.25 + r * 0.4) + r * 17.0) * 3.0);
        p.xz = wrapAround(p.xz, uTile);
        vA = uMode < 0.5 ? smoothstep(0.55, 1.0, sin(uTime * (0.8 + r * 1.7) + r * 40.0))
           : uMode < 1.5 ? (0.6 + 0.4 * sin(uTime * 9.0 + r * 50.0)) * (1.0 - (y - uY.x) / span)
           : uMode < 2.5 ? 0.8 : 0.35 + 0.35 * sin(uTime * 3.0 + r * 60.0);
        vec4 mv = viewMatrix * vec4(p, 1.0);
        vD = -mv.z;
        gl_PointSize = min(18.0 + uStreak * 20.0, uSize * uPR * 40.0 * (1.0 + uStreak * 1.5) / vD);
        gl_Position = projectionMatrix * mv;
    }
`;

export function addMotes(group: THREE.Object3D, s: Shared, m: Motes, rand: () => number): void {
    const g = new THREE.BufferGeometry();
    const seed = new Float32Array(m.n * 4);
    for (let i = 0; i < m.n; i++) seed.set([rand() * m.tile, rand() * m.tile, rand(), rand()], i * 4);
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(m.n * 3), 3));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 4));
    const pts = new THREE.Points(
        g,
        shader(
            s,
            MOTE_VERT,
            /* glsl */ `uniform vec3 uCol; uniform float uStreak; varying float vA, vD;
            void main() {
                // Rain is a streak, not a flake: the point is squeezed sideways into a line.
                vec2 q = (gl_PointCoord - 0.5) * mix(vec2(1.0), vec2(7.0, 1.0), uStreak);
                float a = smoothstep(0.5, 0.0, length(q)) * mix(1.0, 0.35, uStreak);
                // Softer distance fade so motes still read mid-chase, not only in the near field.
                gl_FragColor = vec4(uCol * a * vA * fade(vD * 0.62), 1.0); }`,
            {
                uTile: { value: new THREE.Vector2(m.tile, m.tile) },
                uY: { value: new THREE.Vector2(...m.y) },
                uSize: { value: m.size },
                uMode: { value: m.mode },
                uFall: { value: m.fall ?? 1.2 },
                uStreak: { value: (m.fall ?? 0) > 10 ? 1 : 0 },
                uCol: { value: m.colour },
            },
            ADD
        )
    );
    pts.frustumCulled = false;
    group.add(pts);
}

export type Land = {
    /** Shows one landscape (or none) and keeps the ground under the camera. */
    show: (kind: LandKind | null, eye: THREE.Vector3) => void;
};

/**
 * 3 · Services: one endless moonlit plane per project ring — Chocolate Hills, Lençóis, Danxia,
 * Roraima, Erta Ale (via `uKind` / `LANDS`).
 */
export function addLand(scene: THREE.Object3D, s: Shared, small: boolean, rand: () => number): Land {
    const group = new THREE.Group();
    scene.add(group);
    const size = small ? 1100 : 1500;
    const seg = small ? 120 : 240;
    const cell = size / seg;
    const uKind = { value: 0 };
    const lights = { uMoon: { value: MOON }, uMoonCol: { value: MOONLIGHT }, uKind };
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2),
        shader(
            s,
            HEIGHT +
                /* glsl */ `uniform float uCell; uniform vec3 uMoon; varying vec3 vW, vN; varying float vD, vSh, vCav;
            void main() {
                vec4 w = modelMatrix * vec4(position, 1.0);
                float xp = landH(w.xz + vec2(uCell, 0.0)), xm = landH(w.xz - vec2(uCell, 0.0));
                float zp = landH(w.xz + vec2(0.0, uCell)), zm = landH(w.xz - vec2(0.0, uCell));
                vN = normalize(vec3(xm - xp, 2.0 * uCell, zm - zp));
                w.y = landH(w.xz);
                // Curvature: how far the neighbours stand above this point (> 0 in a hollow or cleft).
                vCav = (xp + xm + zp + zm) * 0.25 - w.y;
                // Shadow: does the ground rise into the moon's line within 12, 40 and 120 m?
                float sh = 1.0;
                for (int k = 0; k < 3; k++) {
                    float r = k == 0 ? 12.0 : k == 1 ? 40.0 : 120.0;
                    sh = min(sh, smoothstep(0.0, 0.25, (w.y + uMoon.y * r - landH(w.xz + uMoon.xz * r)) / r * 2.0));
                }
                vSh = 0.25 + 0.75 * sh;
                vW = w.xyz;
                vec4 mv = viewMatrix * w;
                vD = -mv.z;
                gl_Position = projectionMatrix * mv;
            }`,
            HEIGHT + FRAG,
            { ...lights, ...POOL, uCell: { value: cell } }
        )
    );
    ground.frustumCulled = false;
    group.add(ground);

    const tile = small ? 110 : 150;
    const grass = new THREE.Mesh(
        bladeGeometry(small ? 16000 : 60000, tile, rand),
        shader(
            s,
            HEIGHT + BLADE_VERT,
            BLADE_FRAG,
            { ...lights, uTile: { value: new THREE.Vector2(tile, tile) } },
            {
                side: THREE.DoubleSide,
            }
        )
    );
    grass.frustumCulled = false;
    group.add(grass);

    const motes: Partial<Record<LandKind, THREE.Group>> = {
        grass: new THREE.Group(),
        desert: new THREE.Group(),
        canyon: new THREE.Group(),
        volcano: new THREE.Group(),
        alpine: new THREE.Group(),
    };
    const k = small ? 0.45 : 1;
    const air: Array<[LandKind, Motes]> = [
        [
            'grass',
            {
                n: 340 * k,
                tile: 160,
                y: [-9, -2],
                colour: new THREE.Color(2.2, 1.9, 0.6),
                size: 2.35,
                mode: 0,
            },
        ],
        [
            'desert',
            {
                n: 620 * k,
                tile: 170,
                y: [-13, -5],
                colour: new THREE.Color(0.92, 0.88, 0.8),
                size: 1.55,
                mode: 3,
            },
        ],
        [
            // Danxia: wind-blown red dust so the canyon chase does not die at mid distance.
            'canyon',
            {
                n: 480 * k,
                tile: 165,
                y: [-12, 8],
                colour: new THREE.Color(1.15, 0.45, 0.28),
                size: 1.45,
                mode: 3,
            },
        ],
        [
            'volcano',
            {
                n: 860 * k,
                tile: 180,
                y: [-16, 40],
                colour: new THREE.Color(3.4, 1.05, 0.22),
                size: 1.7,
                mode: 1,
            },
        ],
        [
            'alpine',
            {
                n: 1700 * k,
                tile: 140,
                y: [-16, 50],
                colour: new THREE.Color(0.72, 0.8, 0.9),
                size: 1.05,
                mode: 2,
                fall: 0.55,
            },
        ],
    ];
    for (const [kind, m] of air) {
        const g = motes[kind] as THREE.Group;
        addMotes(g, s, { ...m, n: Math.round(m.n) }, rand);
        group.add(g);
    }

    const show = (kind: LandKind | null, eye: THREE.Vector3): void => {
        group.visible = kind !== null;
        if (!kind) return;
        uKind.value = LANDS.indexOf(kind);
        ground.position.set(Math.round(eye.x / cell) * cell, 0, Math.round(eye.z / cell) * cell - size * 0.3);
        grass.visible = kind === 'grass';
        for (const [name, g] of Object.entries(motes)) if (g) g.visible = name === kind;
    };
    return { show };
}
