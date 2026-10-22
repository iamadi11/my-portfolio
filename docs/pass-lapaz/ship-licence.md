# Ship model licence

**Status (2026-10-22):** Do **not** silently swap the current hull. Owner must approve any replacement.

## Current asset

| Field | Value |
| --- | --- |
| Files | `public/models/ship.glb`, `ship-1k.glb` |
| Title | Intergalactic Spaceship |
| Author | Dennis Haupt (3DHaupt) |
| Source | free3d.com (owner-supplied `.blend` → `scripts/assets.sh`) |
| Licence | Personal / non-commercial (free3d personal-use terms) |

Wired in `world/ship.ts` with custom engine plasma, nose glow, wingtip strobes, and graphite grade. A drop-in must keep that material hook surface (named meshes / PBR maps) or those FX need a retune.

## Recommendation

**Keep the free3d ship until the owner explicitly approves a CC0/CC-BY replacement.** The personal NC terms are a residual risk for a public portfolio; that is an owner call, not an automatic swap.

### Free candidates surveyed (not installed)

| Candidate | Licence | Format | Notes |
| --- | --- | --- | --- |
| [Quaternius Ultimate Spaceships Pack](https://quaternius.com/packs/ultimatespaceships.html) | **CC0 1.0** (also on [OpenGameArt](https://opengameart.org/content/lowpoly-spaceships-pack)) | FBX, OBJ, glTF, Blend | Best clear free path: stylised low-poly, commercial OK, no attribution required. **Not a silhouette match** for the current Intergalactic hull — needs art direction + `ship.ts` FX retarget. |
| Grab3D “Sci-Fi Spaceship” / “Spaceship” | Claims CC0 1.0 + GLB | GLB | Convenient GLB downloads; verify `LICENSE.txt` in the download before shipping. Stylised shuttle / starfighter — still not a drop-in. |
| Poly Haven “Ship Pinnace” (via Mixos mirror) | CC0 | GLB | **Watercraft**, not a spaceship — unsuitable. |

No CC0/CC-BY model was found that is both clearly licensed for commercial portfolio use and a faithful drop-in for the current Intergalactic Spaceship. Closest clear licence: **Quaternius Ultimate Spaceships (CC0)** after owner picks a hull and approves the visual change.

## Owner decision needed

1. Accept residual free3d personal/NC risk on the live site, **or**
2. Approve Quaternius (or another named CC0/CC-BY) replacement and a follow-up pass to retarget `ship.ts` FX / credits / `docs/round-trip.md`.
