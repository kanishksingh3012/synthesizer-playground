"""Web export with baked lighting: Cycles bakes the studio lighting, shadows and procedural materials of
PULSE-16 BASIC into one texture atlas, so the browser shows the same look as the renders.

  BAKE=public/models/pulse16-basic.glb [BAKE_RES=4096] [BAKE_SPP=128] python blender/bake_basic.py <outdir>

Parts that change at runtime (screen, LEDs, pad rims) keep plain materials; the app drives them live.
"""
import math
import os
import sys

import bpy
import bmesh  # noqa: E402  (only importable once bpy is loaded)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_basic as bb  # noqa: E402

RES = int(os.environ.get('BAKE_RES', 4096))
SPP = int(os.environ.get('BAKE_SPP', 128))
LIVE = lambda o: o.name == 'screen' or o.name.startswith('led_') or o.name.endswith('_rim')  # noqa: E731
DROP = {'floor', 'screen_acrylic'}  # floor stays for bounce light while baking; acrylic would hide the live screen
CONTROL = ('key_', 'step_', 'track_', 'btn_')


def fonts_to_meshes():
    dg = bpy.context.evaluated_depsgraph_get()
    for o in [o for o in bpy.data.objects if o.type == 'FONT']:
        name, mw, parent = o.name, o.matrix_world.copy(), o.parent
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        bpy.data.objects.remove(o)
        mo = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(mo)
        mo.parent = parent
        mo.matrix_world = mw


def parent_prints_to_caps():
    """Labels printed on a key/pad/button must travel with it when it is pressed."""
    caps = [o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith(CONTROL) and not LIVE(o)]
    for o in bpy.data.objects:
        if o.type != 'MESH' or o.parent or o in caps or LIVE(o):
            continue
        p = o.matrix_world.translation
        for cap in caps:
            box = [cap.matrix_world @ bb.c.Vector(v) for v in cap.bound_box]
            lo = [min(v[i] for v in box) for i in range(3)]
            hi = [max(v[i] for v in box) for i in range(3)]
            if lo[0] < p.x < hi[0] and lo[1] < p.y < hi[1] and hi[2] - 0.02 < p.z < hi[2] + 0.02:
                mw = o.matrix_world.copy()
                o.parent = cap
                o.matrix_world = mw
                break


def lights_off():
    """No glow baked in: the app lights LEDs, rims and the screen itself. Returns a function that restores
    the glow on the live parts' own materials (the app reads their emissive colour)."""
    saved = []
    for m in bpy.data.materials:
        for n in (m.node_tree.nodes if m.use_nodes else []):
            if n.type == 'BSDF_PRINCIPLED':
                saved.append((m, n, n.inputs['Emission Strength'].default_value))
                n.inputs['Emission Strength'].default_value = 0.0
    bpy.data.objects['screen'].data.materials[0] = bb.c.ink('screen_blank', (0.01, 0.0, 0.0), 0.2)
    live = {s.material for o in bpy.data.objects if LIVE(o) for s in o.material_slots}

    def restore():
        for m, n, v in saved:
            if m in live:
                n.inputs['Emission Strength'].default_value = v
    return restore


def prepare(targets):
    bpy.ops.object.select_all(action='DESELECT')
    for o in targets:
        o.select_set(True)
    bpy.context.view_layer.objects.active = targets[0]
    bpy.ops.object.make_single_user(object=True, obdata=True)
    bpy.ops.object.convert(target='MESH')  # applies bevels
    for o in targets:
        bm = bmesh.new()
        bm.from_mesh(o.data)
        rot = o.matrix_world.to_3x3()
        # the underside is never seen from the app's top view: don't spend texels on it
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if (rot @ f.normal).normalized().z < -0.6], context='FACES')
        bm.to_mesh(o.data)
        bm.free()
        uv = o.data.uv_layers.new(name='bake')
        o.data.uv_layers.active = uv
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.0015, area_weight=0.0, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(margin=0.0015, rotate=True)
    bpy.ops.object.mode_set(mode='OBJECT')


def bake(targets, img, clear):
    for m in {s.material for o in targets for s in o.material_slots if s.material}:
        nt = m.node_tree
        node = nt.nodes.get('bake_target') or nt.nodes.new('ShaderNodeTexImage')
        node.name, node.image = 'bake_target', img
        nt.nodes.active = node
    bpy.ops.object.select_all(action='DESELECT')
    for o in targets:
        o.select_set(True)
    bpy.context.view_layer.objects.active = targets[0]
    bpy.ops.object.bake(type='COMBINED', margin=8, margin_type='EXTEND', use_clear=clear)


def main():
    out = bb.OUT
    os.makedirs(out, exist_ok=True)
    bb.build()
    s = bpy.context.scene
    s.cycles.samples = SPP
    s.cycles.use_denoising = False  # bake has no denoiser; enough samples instead
    fonts_to_meshes()
    parent_prints_to_caps()
    restore_glow = lights_off()
    for o in [o for o in bpy.data.objects if o.type == 'CAMERA']:
        bpy.data.objects.remove(o)

    targets = [o for o in bpy.data.objects if o.type == 'MESH' and not LIVE(o) and o.name not in DROP]
    hints = [o for o in targets if o.name.startswith('hint_')]
    prepare(targets)

    img = bpy.data.images.new('pulse16_bake', RES, RES, float_buffer=True)
    # hints can be switched off in the app, so nothing may shadow the caps under them
    for h in hints:
        h.hide_render = True
    bake([o for o in targets if o not in hints], img, True)
    for h in hints:
        h.hide_render = False
    bake(hints, img, False)

    # save through the render's view transform (AgX look + exposure) = the exact colours of the renders
    s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_depth = '8'
    png = os.path.join(out, 'pulse16_bake.png')
    img.save_render(png, scene=s)
    print('baked', png, flush=True)

    baked = bpy.data.materials.new('baked')
    baked.use_nodes = True
    nt = baked.node_tree
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(png)
    bsdf = nt.nodes['Principled BSDF']
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    for o in targets:
        o.data.materials.clear()
        o.data.materials.append(baked)
        for uv in [uv for uv in o.data.uv_layers if uv.name != 'bake']:
            o.data.uv_layers.remove(uv)

    restore_glow()
    for o in [o for o in bpy.data.objects if o.name in DROP or o.type == 'LIGHT']:
        bpy.data.objects.remove(o)
    path = os.environ['BAKE']
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_apply=True, export_cameras=False,
                              export_lights=False, export_yup=True, export_image_format='JPEG', export_jpeg_quality=92)
    print('exported', path, flush=True)


if __name__ == '__main__':
    main()
