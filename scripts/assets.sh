#!/bin/bash
# Rebuilds the 3D assets used on / from sources kept in git-ignored assets-src/.
#   models/ship.glb, ship-1k.glb  Intergalactic Spaceship by Dennis Haupt (3DHaupt), free3d.com,
#                                 personal-use licence; supplied by the owner as a .blend file.
#   models/portal.glb, portal-1k.glb  "Sci-Fi Portal Gateway" by Igrium, Sketchfab, CC BY 4.0;
#                                 supplied by the owner as a .blend.
#   env/earth-*.jpg               Earth model textures supplied by the owner (59-earth.zip).
#   env/stars-*.jpg               NASA/Goddard SVS Deep Star Maps 2020 (svs.gsfc.nasa.gov/4851),
#                                 credit NASA/GSFC SVS, ESA/Gaia/DPAC.
#   env/night.hdr                 "Modern Buildings Night", Poly Haven, CC0 (reflections).
# Needs Blender 4.2 (BLENDER=/path/to/Blender) for the .blend and the image work.
set -euo pipefail
BLENDER=${BLENDER:-blender}
A=assets-src
OUT=$A/ships/intergalactic/out
mkdir -p "$OUT" public/models public/env
"$BLENDER" -b "$A/ships/intergalactic/Intergalactic Spaceship_Blender_2.8_Packed textures.blend" \
  --python scripts/assets/ship.py -- "$OUT"
for size in 2048 1024; do
  npx -y @gltf-transform/cli@4 resize "$OUT/ship-raw.glb" "$OUT/ship-$size.glb" --width $size --height $size
done
opt="--compress meshopt --texture-compress webp --flatten false --join false --instance false --palette false --simplify false"
npx -y @gltf-transform/cli@4 optimize "$OUT/ship-2048.glb" public/models/ship.glb $opt
npx -y @gltf-transform/cli@4 optimize "$OUT/ship-1024.glb" public/models/ship-1k.glb $opt
P=$A/sketchfab/portal
"$BLENDER" -b "$P/source/portal_bundle.blend" --python scripts/assets/portal.py -- "$(pwd)/$P/portal-raw.glb"
npx -y @gltf-transform/cli@4 optimize "$P/portal-raw.glb" public/models/portal.glb $opt --texture-size 2048
npx -y @gltf-transform/cli@4 optimize "$P/portal-raw.glb" public/models/portal-1k.glb $opt --texture-size 1024
"$BLENDER" -b --python scripts/assets/earth.py -- "$A/earth/model/textures" public/env
"$BLENDER" -b --python scripts/assets/stars.py -- "$A/stars/starmap_2020_4k.exr" public/env
cp "$A/story/hdri/modern_buildings_night_1k.hdr" public/env/night.hdr

# Horizon landmarks on / (Sketchfab, CC BY 4.0), from the files the owner downloaded into
# assets-src/sketchfab/terrain/: "Mountain Range 01" (solararchitect), "Snowy Volcano" (Pukar
# Shiwakoti), "Horseshoe bend near Grand Canyon" (Ignazio Pillitteri). Two tiers each: -hi for wide
# screens, -lo for phones. Add a line per new landmark; landmarks.ts picks them by LandKind.
T=$A/sketchfab/terrain
mkdir -p public/models/terrain
land() { # name, source, hi texture size, lo texture size
  base="--compress meshopt --texture-compress webp --flatten true --join true --instance false --palette false"
  npx -y @gltf-transform/cli@4 optimize "$2" "public/models/terrain/$1-hi.glb" $base --texture-size "$3" --simplify-ratio 0.6
  npx -y @gltf-transform/cli@4 optimize "$2" "public/models/terrain/$1-lo.glb" $base --texture-size "$4" --simplify-ratio 0.3
}
land mountain_range_01 "$T/mountain_range_01.glb" 2048 1024
land snowy_volcano "$T/snowy_volcano.glb" 2048 1024
land horseshoe "$T/horseshoe/source/grancanyon.gltf" 512 256
