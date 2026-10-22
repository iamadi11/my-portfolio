import * as THREE from 'three';

function glowTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    // Tight core + fast falloff: far engines/beacons read as points, not soft white balls.
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.1, 'rgba(255,255,255,.92)');
    gr.addColorStop(0.28, 'rgba(255,255,255,.28)');
    gr.addColorStop(0.55, 'rgba(255,255,255,.04)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

export type Glow = (scale: number, colour: THREE.Color, opacity?: number) => THREE.Sprite;

export function glowMaker(scene: THREE.Object3D): Glow {
    const map = glowTexture();
    return (scale, colour, opacity = 1) => {
        const s = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map,
                color: colour,
                opacity,
                fog: false,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })
        );
        s.scale.setScalar(scale);
        scene.add(s);
        return s;
    };
}
