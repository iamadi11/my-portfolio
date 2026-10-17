"""The ship: Intergalactic Spaceship by Dennis Haupt (3DHaupt, free3d.com), Blender 2.8 file.
Keeps the hull and the two engine plumes, bakes the artist's node maths into plain glTF PBR maps
(colour x AO x metal, roughness and metalness packed), and exports a GLB without vertex colours.
Run headless: blender -b <ship.blend> --python ship.py -- <out dir>"""
import bpy, numpy as np, sys
OUT = sys.argv[sys.argv.index('--') + 1]
SIZE = 2048
keep = {'Ship', 'Circle', 'Circle.001'}
for o in list(bpy.data.objects):
    if o.name not in keep:
        bpy.data.objects.remove(o, do_unlink=True)
for o in bpy.data.objects:
    o.animation_data_clear()
ship = bpy.data.objects['Ship']
ship.location = (0, 0, 0)
ship.rotation_euler = (1.5708, 0, 0)
bpy.data.objects['Circle'].name = 'FlameL'
bpy.data.objects['Circle.001'].name = 'FlameR'

def px(name):
    im = bpy.data.images[name]
    if im.size[0] != SIZE: im.scale(SIZE, SIZE)
    a = np.empty(SIZE * SIZE * 4, dtype=np.float32); im.pixels.foreach_get(a)
    return a.reshape(SIZE, SIZE, 4)
def save(name, arr, colorspace):
    im = bpy.data.images.new(name, SIZE, SIZE, alpha=False, float_buffer=False)
    im.colorspace_settings.name = colorspace
    im.pixels.foreach_set(np.ascontiguousarray(arr, dtype=np.float32).ravel())
    im.filepath_raw = f'{OUT}/{name}.png'; im.file_format = 'PNG'; im.save()
    return im

col = px('Intergalactic Spaceship_color_4.jpg.001')
ao = px('Intergalactic Spaceship Ao_Blender.jpg')
metal = px('Intergalactic Spaceship_metalness.jpg')
rough = px('Intergalactic Spaceship_rough.jpg')
# Pixels come back linear for sRGB images. Base = colour x mix(1, AO, .5) x mix(1, metal, .5), as the artist wired it.
base = col.copy()
base[..., :3] = col[..., :3] * (0.5 + 0.5 * ao[..., :3]) * (0.5 + 0.5 * metal[..., :1])
base[..., 3] = 1
base_im = save('ship_base', base, 'Linear Rec.709')
orm = np.ones_like(col)
r = rough[..., 0]
orm[..., 0] = 1
orm[..., 1] = r * (1 - 0.127) + (1 - r) * 0.127
orm[..., 2] = np.clip(metal[..., 0] * 2.9, 0, 1)
orm_im = save('ship_orm', orm, 'Non-Color')
nmap = bpy.data.images['Intergalactic Spaceship_nmap_2_Tris.jpg']; nmap.scale(SIZE, SIZE)
emi = bpy.data.images['Intergalactic Spaceship_emi.jpg']; emi.scale(SIZE, SIZE)

m = bpy.data.materials['Material.001']
m.blend_method = 'OPAQUE'
nt = m.node_tree; nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputMaterial'); bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
def tex(im, cs):
    n = nt.nodes.new('ShaderNodeTexImage'); n.image = im; im.colorspace_settings.name = cs; return n
tb = tex(base_im, 'sRGB'); nt.links.new(tb.outputs['Color'], bsdf.inputs['Base Color'])
to = tex(orm_im, 'Non-Color'); sep = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(to.outputs['Color'], sep.inputs['Color'])
nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness']); nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
tn = tex(nmap, 'Non-Color'); nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
te = tex(emi, 'sRGB'); nt.links.new(te.outputs['Color'], bsdf.inputs['Emission Color']); bsdf.inputs['Emission Strength'].default_value = 1.0
# Flames: plain blue emission; the page gives them their own additive shader.
fm = bpy.data.materials['Material.002']; fm.name = 'Flame'; fm.blend_method = 'OPAQUE'
ft = fm.node_tree; ft.nodes.clear(); fo = ft.nodes.new('ShaderNodeOutputMaterial'); fb = ft.nodes.new('ShaderNodeBsdfPrincipled')
fb.inputs['Base Color'].default_value = (0, 0, 0, 1); fb.inputs['Emission Color'].default_value = (0.095, 0.631, 1.0, 1); fb.inputs['Emission Strength'].default_value = 1
ft.links.new(fb.outputs['BSDF'], fo.inputs['Surface'])
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=f'{OUT}/ship-raw.glb', export_format='GLB', use_selection=True, export_apply=True,
    export_animations=False, export_yup=True, export_vertex_color='NONE', export_image_format='AUTO', export_materials='EXPORT')
print('EXPORTED')
