"""Night sky: NASA/Goddard SVS Deep Star Maps 2020 (starmap_2020_4k.exr) tone-mapped to JPEG.
Run headless: blender -b --python stars.py -- <starmap.exr> <out dir>"""
import sys

import bpy
import numpy as np

src, out = sys.argv[sys.argv.index('--') + 1:][:2]
im = bpy.data.images.load(src)
w, h = im.size
a = np.empty(w * h * 4, dtype=np.float32)
im.pixels.foreach_get(a)
a = a.reshape(h, w, 4)[..., :3]
# A black point so space is black, then exposure, a soft shoulder and gamma: faint stars stay,
# the Milky Way glows, bright stars roll off instead of clipping.
x = np.maximum(a - 0.006, 0) * 2.2
x = np.power(np.clip(x / (1.0 + x), 0, 1), 1 / 1.8)
bpy.context.scene.render.image_settings.quality = 82
for name, size in (('stars-4k', 4096), ('stars-2k', 2048)):
    img = bpy.data.images.new(name, w, h, alpha=False, float_buffer=False)
    img.colorspace_settings.name = 'Non-Color'
    rgba = np.ones((h, w, 4), dtype=np.float32)
    rgba[..., :3] = x
    img.pixels.foreach_set(rgba.ravel())
    if size != w:
        img.scale(size, size // 2)
    img.filepath_raw = f'{out}/{name}.jpg'
    img.file_format = 'JPEG'
    img.save()
