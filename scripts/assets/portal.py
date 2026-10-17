"""The project portal: "Sci-Fi Portal Gateway" by Igrium (Sketchfab, CC BY 4.0), supplied by the
owner as a .blend. Exports the ring, clamps, side housings and walkway as one GLB.
Run headless: blender -b <portal_bundle.blend> --python portal.py -- <out.glb>"""
import sys

import bpy

out = sys.argv[sys.argv.index('--') + 1]
keep = {'portal_main', 'clamps', 'side_housing', 'walkway'}
for o in list(bpy.data.objects):
    if o.name not in keep:
        bpy.data.objects.remove(o, do_unlink=True)
for o in bpy.data.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True,
                          export_animations=False, export_yup=True, export_vertex_color='NONE')
print('EXPORTED')
