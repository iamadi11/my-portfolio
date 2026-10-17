"""Earth textures (night lights, clouds, day) resized for the web, hi for desktop and lo for phones.
Run headless: blender -b --python earth.py -- <textures dir> <out dir>"""
import sys

import bpy

src, out = sys.argv[sys.argv.index('--') + 1:][:2]
jobs = [
    ('earth night_lights_modified.png', 'earth-lights', 4096, 2048),
    ('clouds earth.png', 'earth-clouds', 2048, 1024),
    ('earth albedo.jpg', 'earth-day', 2048, 1024),
]
bpy.context.scene.render.image_settings.quality = 86
for name, base, hi, lo in jobs:
    for tag, w in (('hi', hi), ('lo', lo)):
        im = bpy.data.images.load(f'{src}/{name}')
        im.scale(w, w // 2)
        im.filepath_raw = f'{out}/{base}-{tag}.jpg'
        im.file_format = 'JPEG'
        im.save()
        bpy.data.images.remove(im)
