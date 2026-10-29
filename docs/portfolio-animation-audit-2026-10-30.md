# Portfolio source and animation audit · 30 October 2026

All five featured public repositories were rechecked through GitHub metadata and their public README/source records. The inspected revisions match the preceding audit; no private employment outcome was inferred from these repositories. The following commit-pinned records back the new walkthroughs.

| Project | Public source | Walkthrough boundary |
| --- | --- | --- |
| Eidos | [README @6676f67](https://github.com/sweidos/eidos/blob/6676f6763c4aac25854c6aa827afb275002fbb3f/README.md) | Durable client intent and stable-key replay; server deduplication is an explicit assumption. Delivery is at least once, not exactly once. |
| MCP UI studio | [README @e45df38](https://github.com/iamadi11/mcp-ui-poc/blob/e45df38ab4af32e557cf8f9622dc4e6e135ca260/README.md) | Authoring, preview, versioned publish and pinned versus live embeds. Redis/Mongo availability depends on configuration. |
| Spatial | [metrics.ts @bafde9f](https://github.com/iamadi11/spatial/blob/bafde9ff9ef4bce6e44496550b3b2514e9c4ac14/src/adapters/metrics.ts) | Frame-gap/drop heuristic and optional browser memory; no direct FPS or independently measured improvement claim. |
| Sidecar | [loader.ts @e78b8de](https://github.com/iamadi11/progressive-image/blob/e78b8deebf748b5fd0e7daaeab5701f09b812fe9/packages/runtime/src/loader.ts) | Concurrent preview/full fetch; full may win. Tiles are a failure fallback. Public build-package gap and unmeasured size target remain disclosed in the preceding audit. |
| Video Light Sync | [README @03fdf67](https://github.com/iamadi11/video-light-sync/blob/03fdf6753b7d565041de6342f002bed8d5d02793/README.md), [Yeelight adapter](https://github.com/iamadi11/video-light-sync/blob/03fdf6753b7d565041de6342f002bed8d5d02793/packages/adapters/yeelight/src/YeelightAdapter.ts), [WLED adapter](https://github.com/iamadi11/video-light-sync/blob/03fdf6753b7d565041de6342f002bed8d5d02793/packages/adapters/wled/src/WledAdapter.ts) | Capture/vision/local hub; TCP versus UDP dispatch and mock mode without IP. Command dispatch does not establish physical illumination or measured latency. |

`src/content/project-films.ts` authors these conceptual flows. Each project opens only its own lazy film in a native dialog. The renderer, hardware, pacing and transport controls are shared with the course. The existing exploded software assembly now explicitly says its spacing is schematic; it does not claim measured chassis construction.

Portfolio light/dark/system preference is independent of course preference. A pre-hydration whitelist handles stored values, system CSS follows OS appearance, storage failure falls back to system, and print uses light paper. The existing Arimo font remains in use. Root drawing timing is now owned by a disposable GSAP context and ScrollTrigger, retaining deterministic drawing state and native sticky layout.

All five dialogs were opened in the production browser with their expected films and pinned source links. Escape closes the dialog and returns focus to its launch button. Phone and desktop themes, six viewport widths, existing exploded Eidos motion and the new light-device drawing were inspected. This does not certify hardware behavior, exact physical dimensions, every animation frame or private career data. Full checks and limits: [ANATOMY_GSAP_QA.md](system-design/ANATOMY_GSAP_QA.md).
