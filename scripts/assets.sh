#!/bin/bash
# Rebuilds the 3D assets used on / from sources kept in git-ignored assets-src/.
#   models/ship.glb, ship-1k.glb  Intergalactic Spaceship by Dennis Haupt (3DHaupt), free3d.com,
#                                 personal-use licence; supplied by the owner as a .blend file.
#   models/portal.glb, portal-1k.glb  "Sci-Fi Portal Gateway" by Igrium, Sketchfab, CC BY 4.0;
#                                 supplied by the owner as a .blend.
#   env/earth-*.jpg               Earth model textures supplied by the owner (59-earth.zip); their
#                                 original source is not known (see "Earth textures" below).
#   env/stars-*.jpg               NASA/Goddard SVS Deep Star Maps 2020 (svs.gsfc.nasa.gov/4851),
#                                 credit NASA/GSFC SVS, ESA/Gaia/DPAC.
#   env/night.hdr                 "Modern Buildings Night", Poly Haven, CC0 (reflections).
#   env/moon.webp                 NASA full-moon photograph, NASA 3D Resources (free and without
#                                 copyright), credit NASA.
#   models/iss.glb                International Space Station (ISS) (B), NASA 3D Resources (free and
#                                 without copyright), credit NASA.
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
# "Snowy Mountain - Terrain" and "Death Valley - Terrain" (artfromheath, CC BY 4.0), 4k GLBs.
land snowy_mountain "$T/snowy_mountain.glb" 2048 1024
land death_valley "$T/death_valley.glb" 2048 1024
# "Osaka downtown" (matousekfoto, CC BY 4.0): a scanned night skyline standing beside the city
# path. 790k triangles in the source, so it is simplified hard; one tile per city block.
C=$A/sketchfab/city
base="--compress meshopt --texture-compress webp --flatten true --join true --instance false --palette false"
npx -y @gltf-transform/cli@4 optimize "$C/osaka_downtown.glb" public/models/osaka-hi.glb $base --texture-size 2048 --simplify-ratio 0.35
npx -y @gltf-transform/cli@4 optimize "$C/osaka_downtown.glb" public/models/osaka-lo.glb $base --texture-size 1024 --simplify-ratio 0.15

# NASA 3D Resources (github.com/nasa/NASA-3D-Resources @ 11ebb4ee043715aefbba6aeec8a61746fad67fa7),
# "free and without copyright", credit NASA. Download into assets-src/nasa/:
#   "Images and Textures/Moon/Moon.jpg"  -> assets-src/nasa/Moon.jpg (1913x1911, full moon)
#   "3D Models/International Space Station (ISS) (B)/International Space Station (ISS) (B).glb"
#                                        -> assets-src/nasa/International_Space_Station_ISS_B.glb
# The moon: cropped square to its disc (centre 1015,963, radius ~765 px), 512 px WebP; sky.ts maps
# the disc radius to 0.497 of the texture.
N=$A/nasa
ffmpeg -y -i "$N/Moon.jpg" -vf "crop=1536:1536:247:195,scale=512:512:flags=lanczos" -c:v libwebp -quality 82 public/env/moon.webp
# The ISS (untextured; space.ts gives the arrays and the truss their materials in code): Draco
# decoded, welded and meshopt-compressed (simplify ratio 1: no triangles removed). space.ts
# leaves out the seven stray rings that float above the station in the source.
npx -y @gltf-transform/cli@4 optimize "$N/International_Space_Station_ISS_B.glb" public/models/iss.glb \
  --compress meshopt --texture-compress webp --flatten true --join true --instance false --palette false --texture-size 1024 --simplify-ratio 1

# Earth textures: looked for a NASA replacement (2026-10-21, again 2026-10-22) in
# nasa/NASA-3D-Resources @ 11ebb4ee043715aefbba6aeec8a61746fad67fa7, fetched with
#   git clone --depth 1 --filter=blob:none --sparse https://github.com/nasa/NASA-3D-Resources
#   git -C NASA-3D-Resources ls-tree -r --name-only HEAD | grep -i -E 'earth|night|lights|cloud'
#   git -C NASA-3D-Resources sparse-checkout set --no-cone '/Images and Textures/Earth (A)/' \
#     '/Images and Textures/Earth (B)/'
# The repository has no night-lights or cloud map. "Images and Textures/Earth (A)/Earth (A).jpg"
# is a 1440x720 equirectangular shaded-relief map (hypsometric false colour with bathymetry), and
# "Images and Textures/Earth (B)/Earth (B).jpg" a 4095x4095 Apollo photograph of the whole disc;
# neither can stand in for the day, lights or cloud maps space.ts reads (earth-{day,lights,
# clouds}-{hi,lo}.jpg: day and clouds 2048x1024 / 1024x512, lights 4096x2048 / 2048x1024), so the
# owner's files stay until NASA maps are supplied. Candidates with the same terms: NASA Earth
# Observatory "Blue Marble" (day), "Black Marble" (night lights) and Blue Marble clouds. Once one
# is in assets-src/nasa/earth/, resize with ffmpeg to the sizes above, for example:
#   ffmpeg -y -i "$N/earth/day.jpg" -vf scale=2048:1024:flags=lanczos -q:v 3 public/env/earth-day-hi.jpg
