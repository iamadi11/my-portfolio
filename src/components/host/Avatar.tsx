'use client';

import { useEffect, useRef } from 'react';

import type { ChatState, GaussianSplatRenderer } from 'gaussian-splat-renderer-for-lam';

/** Face weights by ARKit blendshape name, 0..1. */
export type Face = Record<string, number>;

type Props = {
    src: string;
    /** Where the head is shown. Changing it moves the same canvas; nothing reloads. */
    mount: HTMLElement | null;
    face: () => Face;
    state: () => ChatState;
    onProgress?: (progress: number) => void;
    onReady?: () => void;
    onError?: (error: unknown) => void;
};

type Controls = {
    stopListenToKeyEvents?: () => void;
    enableZoom: boolean;
    enablePan: boolean;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
};

/**
 * The renderer's OrbitControls listen to arrow keys on window and eat the wheel.
 * On a page that scrolls, keep only a gentle drag-to-turn.
 */
function tame(renderer: GaussianSplatRenderer, box: HTMLDivElement): void {
    const viewer = (renderer as unknown as { viewer?: { controls?: Controls } }).viewer;
    const controls = viewer?.controls;
    if (controls) {
        controls.stopListenToKeyEvents?.();
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.minAzimuthAngle = -0.55;
        controls.maxAzimuthAngle = 0.55;
    }
    const canvas = box.querySelector('canvas');
    if (canvas) canvas.style.touchAction = 'pan-y';
}

/**
 * LAM Gaussian-splat head. The renderer is large and touches `document` at import,
 * so it loads on mount only. It pulls face weights and chat state every frame.
 * The box lives outside React so it can move between the portrait frame and the dock
 * without remounting (and without a layout shift: a moved node is new to the layout).
 */
export default function Avatar({ src, mount, face, state, onProgress, onReady, onError }: Props): null {
    const box = useRef<HTMLDivElement | null>(null);
    const latest = useRef({ face, state, onProgress, onReady, onError });
    latest.current = { face, state, onProgress, onReady, onError };

    useEffect(() => {
        if (!mount) return;
        if (!box.current) {
            box.current = document.createElement('div');
            box.current.className = 'host-avatar';
        }
        mount.appendChild(box.current);
    }, [mount]);

    const mounted = mount !== null;
    useEffect(() => {
        const el = box.current;
        if (!mounted || !el) return undefined;
        let disposed = false;
        let renderer: GaussianSplatRenderer | undefined;

        (async () => {
            try {
                const { GaussianSplatRenderer: Renderer } = await import('gaussian-splat-renderer-for-lam');
                if (disposed) return;
                renderer = await Renderer.getInstance(el, src, {
                    getChatState: () => latest.current.state(),
                    getExpressionData: () => latest.current.face(),
                    downloadProgress: (p) => latest.current.onProgress?.(p * 0.8),
                    loadProgress: (p) => {
                        latest.current.onProgress?.(0.8 + p * 0.2);
                        if (p >= 1) latest.current.onReady?.();
                    },
                    alpha: 0,
                });
                // getInstance swallows its own errors and resolves undefined.
                if (!renderer) throw new Error(`Avatar failed to load: ${src}`);
                if (disposed) {
                    renderer.dispose();
                    return;
                }
                tame(renderer, el);
            } catch (error) {
                if (!disposed) latest.current.onError?.(error);
            }
        })();

        return () => {
            disposed = true;
            renderer?.dispose();
        };
        // Runs after the mount effect above has created and placed the box. Moving the box
        // between mounts keeps `mounted` true, so the head never reloads.
    }, [src, mounted]);

    useEffect(() => () => box.current?.remove(), []);

    return null;
}
