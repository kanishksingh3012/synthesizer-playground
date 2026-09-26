"""Shared Blender helpers for the synth concept renders.

Units: 1 unit = 10 cm (device is ~8.6 units wide), X = width, Y = depth (front = -Y), Z = up.
"""
import math
import os
import sys

import bpy  # must precede bmesh: bpy registers the bmesh module
import bmesh  # noqa: E402
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.environ.get('SYNTH_ASSETS', os.path.join(HERE, 'assets'))
FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_COND = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'

NOTE_SHARP = {1, 3, 6, 8, 10}

# ---------------------------------------------------------------- scene


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = int(os.environ.get('SPP', 128))
    s.cycles.use_adaptive_sampling = True
    s.cycles.adaptive_threshold = 0.02
    s.cycles.use_denoising = True
    try:
        s.cycles.denoiser = 'OPENIMAGEDENOISE'
    except TypeError:
        pass
    s.cycles.max_bounces = 8
    s.render.film_transparent = False
    s.view_settings.view_transform = 'AgX'
    for look in ('AgX - Medium High Contrast', 'Medium High Contrast'):
        try:
            s.view_settings.look = look
            break
        except TypeError:
            continue
    s.render.image_settings.file_format = 'PNG'
    return s


def world(hdri='studio.exr', strength=0.7, backdrop=(0.8, 0.8, 0.8), rot=0.0):
    w = bpy.data.worlds.new('World')
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld')
    env = nt.nodes.new('ShaderNodeTexEnvironment')
    env.image = bpy.data.images.load(os.path.join(ASSETS, hdri))
    mapping = nt.nodes.new('ShaderNodeMapping')
    mapping.inputs['Rotation'].default_value[2] = rot
    coord = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(coord.outputs['Generated'], mapping.inputs['Vector'])
    nt.links.new(mapping.outputs['Vector'], env.inputs['Vector'])
    bg_env = nt.nodes.new('ShaderNodeBackground')
    bg_env.inputs['Strength'].default_value = strength
    nt.links.new(env.outputs['Color'], bg_env.inputs['Color'])
    bg_flat = nt.nodes.new('ShaderNodeBackground')
    bg_flat.inputs['Color'].default_value = (*backdrop, 1)
    lp = nt.nodes.new('ShaderNodeLightPath')
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lp.outputs['Is Camera Ray'], mix.inputs['Fac'])
    nt.links.new(bg_env.outputs['Background'], mix.inputs[1])
    nt.links.new(bg_flat.outputs['Background'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])


def area_light(name, loc, target, size, energy, color=(1, 1, 1), shape='RECTANGLE'):
    d = bpy.data.lights.new(name, 'AREA')
    d.shape = shape
    d.size = size[0]
    d.size_y = size[1]
    d.energy = energy
    d.color = color
    o = bpy.data.objects.new(name, d)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    look_at(o, target)
    return o


def studio(key=5000, fill=900, rim=2200, exposure=-0.4):
    """Front-high softbox (its mirror reflection falls behind the device, away from the top camera),
    side fill + back rim strip: classic product flat-lay lighting."""
    bpy.context.scene.view_settings.exposure = exposure
    area_light('softbox', (-3, -13, 12), (0, 0, 0), (14, 9), key)
    area_light('fill', (-14, -4, 6), (0, 0, 0.5), (4, 8), fill, (1.0, 0.97, 0.93))
    area_light('rim', (4, 12, 7), (0, 0, 0.5), (14, 2), rim, (0.93, 0.96, 1.0))


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()


def camera(name, loc, target, lens=85, fstop=None, focus=None):
    c = bpy.data.cameras.new(name)
    c.lens = lens
    c.sensor_width = 36
    c.clip_end = 500
    o = bpy.data.objects.new(name, c)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    look_at(o, target)
    if fstop:
        c.dof.use_dof = True
        c.dof.aperture_fstop = fstop
        c.dof.focus_distance = (Vector(focus or target) - Vector(loc)).length
    return o


def top_camera(width, tilt_deg=12, center=(0, 0, 0), aspect=1.6):
    lens = 85
    half_fov = math.atan(18 / lens)
    dist = (width / 2 * 1.08) / math.tan(half_fov)
    t = math.radians(tilt_deg)
    loc = (center[0], center[1] - dist * math.sin(t), center[2] + dist * math.cos(t))
    return camera('cam_top', loc, center, lens=lens, fstop=11)


def hero_camera(center=(0, 0, 0)):
    return camera('cam_hero', (7.2, -10.5, 6.6), (center[0] + 0.3, center[1] + 0.2, 0.4), lens=58, fstop=4.5, focus=(0.6, -0.8, 0.8))


def render(cam, path, res=(1600, 1000)):
    s = bpy.context.scene
    s.camera = cam
    s.render.resolution_x, s.render.resolution_y = res
    s.render.resolution_percentage = int(os.environ.get('RES_PCT', 100))
    s.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print('rendered', path, flush=True)


# ---------------------------------------------------------------- materials


def _mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    return m, nt, bsdf


def _bump(nt, bsdf, height_socket, strength=0.2, distance=0.01):
    b = nt.nodes.new('ShaderNodeBump')
    b.inputs['Strength'].default_value = strength
    b.inputs['Distance'].default_value = distance
    nt.links.new(height_socket, b.inputs['Height'])
    nt.links.new(b.outputs['Normal'], bsdf.inputs['Normal'])
    return b


def _noise(nt, scale, detail=4.0, stretch=(1, 1, 1), coord='Object'):
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = stretch
    nt.links.new(tc.outputs[coord], mp.inputs['Vector'])
    n = nt.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = scale
    n.inputs['Detail'].default_value = detail
    nt.links.new(mp.outputs['Vector'], n.inputs['Vector'])
    return n


def brushed_metal(name, color, rough=0.28, aniso=0.7, radial=False, direction='X'):
    """Brushed / machined aluminium. radial=True gives concentric lathe marks for knob caps."""
    m, nt, b = _mat(name)
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Metallic'].default_value = 1.0
    b.inputs['Roughness'].default_value = rough
    b.inputs['Anisotropic'].default_value = aniso
    tan = nt.nodes.new('ShaderNodeTangent')
    if radial:
        tan.direction_type = 'RADIAL'
        tan.axis = 'Z'
    else:
        tan.direction_type = 'RADIAL'
        tan.axis = 'Y' if direction == 'X' else 'X'
    nt.links.new(tan.outputs['Tangent'], b.inputs['Tangent'])
    stretch = (1, 1, 1) if radial else ((0.02, 1, 1) if direction == 'X' else (1, 0.02, 1))
    n = _noise(nt, 900 if not radial else 400, 2, stretch)
    _bump(nt, b, n.outputs['Fac'], 0.06, 0.002)
    return m


def paint(name, color, rough=0.45, bump=0.04, coat=0.0):
    """Painted steel / powder coat: fine orange-peel texture + roughness variation."""
    m, nt, b = _mat(name)
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = coat
    n = _noise(nt, 350, 6)
    _bump(nt, b, n.outputs['Fac'], bump, 0.003)
    rr = nt.nodes.new('ShaderNodeMapRange')
    rr.inputs['To Min'].default_value = rough * 0.85
    rr.inputs['To Max'].default_value = rough * 1.15
    n2 = _noise(nt, 6, 3)
    nt.links.new(n2.outputs['Fac'], rr.inputs['Value'])
    nt.links.new(rr.outputs['Result'], b.inputs['Roughness'])
    return m


def plastic(name, color, rough=0.25, coat=0.2, sss=0.0):
    m, nt, b = _mat(name)
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = 0.08
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (0.05, 0.04, 0.03)
    n = _noise(nt, 120, 3)
    _bump(nt, b, n.outputs['Fac'], 0.015, 0.002)
    return m


def rubber(name, color, rough=0.75, glow=None, glow_strength=0.0):
    m, nt, b = _mat(name)
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Sheen Weight'].default_value = 0.3
    if glow:
        b.inputs['Emission Color'].default_value = (*glow, 1)
        b.inputs['Emission Strength'].default_value = glow_strength
    n = _noise(nt, 500, 5)
    _bump(nt, b, n.outputs['Fac'], 0.08, 0.003)
    return m


def wood(name, dark=(0.07, 0.035, 0.018), light=(0.2, 0.1, 0.05), scale=1.4):
    """Walnut: distorted wave bands + fine pore noise, satin lacquer."""
    m, nt, b = _mat(name)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (0.25, 0.25, 4.0)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    wave = nt.nodes.new('ShaderNodeTexWave')
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'Z'
    wave.inputs['Scale'].default_value = scale
    wave.inputs['Distortion'].default_value = 9
    wave.inputs['Detail'].default_value = 6
    wave.inputs['Detail Scale'].default_value = 1.5
    nt.links.new(mp.outputs['Vector'], wave.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*dark, 1)
    ramp.color_ramp.elements[1].color = (*light, 1)
    nt.links.new(wave.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.38
    b.inputs['Coat Weight'].default_value = 0.35
    b.inputs['Coat Roughness'].default_value = 0.15
    pores = _noise(nt, 260, 2, (1, 1, 12))
    _bump(nt, b, pores.outputs['Fac'], 0.12, 0.004)
    return m


def glass(name, tint=(1, 1, 1), rough=0.02):
    m, nt, b = _mat(name)
    b.inputs['Base Color'].default_value = (*tint, 1)
    b.inputs['Transmission Weight'].default_value = 1.0
    b.inputs['Roughness'].default_value = rough
    b.inputs['IOR'].default_value = 1.5
    return m


def emissive(name, color, strength, base=(0.02, 0.02, 0.02)):
    m, nt, b = _mat(name)
    b.inputs['Base Color'].default_value = (*base, 1)
    b.inputs['Emission Color'].default_value = (*color, 1)
    b.inputs['Emission Strength'].default_value = strength
    b.inputs['Roughness'].default_value = 0.3
    return m


def led_lens(name, color, strength):
    """Clear-ish coloured lens that glows when lit."""
    m, nt, b = _mat(name)
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = 0.08
    b.inputs['Transmission Weight'].default_value = 0.6
    b.inputs['Emission Color'].default_value = (*color, 1)
    b.inputs['Emission Strength'].default_value = strength
    return m


def screen_mat(name, image_path, strength=2.5):
    m, nt, b = _mat(name)
    img = nt.nodes.new('ShaderNodeTexImage')
    img.image = bpy.data.images.load(image_path)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(tc.outputs['UV'], img.inputs['Vector'])
    b.inputs['Base Color'].default_value = (0.005, 0.005, 0.005, 1)
    nt.links.new(img.outputs['Color'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = strength
    b.inputs['Roughness'].default_value = 0.15
    return m


def ink(name, color, rough=0.5):
    m, nt, b = _mat(name)
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    return m


# ---------------------------------------------------------------- geometry


def _obj(name, bm, mat=None, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    if mat:
        me.materials.append(mat)
    return o


def bevel(o, width, segments=3, angle=35):
    mod = o.modifiers.new('bevel', 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(angle)
    mod.harden_normals = True
    return o


def box(name, size, loc, mat, bev=0.02, seg=3, taper=None, rot=(0, 0, 0)):
    """Axis-aligned box of `size` (x, y, z) whose *bottom* sits at loc.z. taper scales the top face."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z = (v.co.z + 0.5) * size[2]
        if taper and v.co.z > size[2] * 0.5:
            v.co.x *= taper[0]
            v.co.y *= taper[1]
    o = _obj(name, bm, mat)
    o.location = loc
    o.rotation_euler = rot
    if bev:
        bevel(o, bev, seg)
    return o


def cylinder(name, r, h, loc, mat, seg=48, r_top=None, bev=0.0, knurl=0, knurl_depth=0.035):
    """Cylinder with bottom at loc.z. knurl=N adds N vertical grip ridges."""
    bm = bmesh.new()
    n = knurl * 2 if knurl else seg
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=n, radius1=r, radius2=r_top if r_top is not None else r, depth=h)
    for v in bm.verts:
        v.co.z += h / 2
    if knurl:
        for v in bm.verts:
            a = math.atan2(v.co.y, v.co.x)
            idx = round(a / (2 * math.pi / n))
            if idx % 2:
                v.co.x *= 1 - knurl_depth
                v.co.y *= 1 - knurl_depth
    o = _obj(name, bm, mat)
    o.location = loc
    if bev:
        bevel(o, bev, 3, 40)
    return o


def dome(name, r, h, loc, mat):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.001], context='VERTS')
    for v in bm.verts:
        v.co.x *= r
        v.co.y *= r
        v.co.z *= h
    o = _obj(name, bm, mat)
    o.location = loc
    return o


def text(body, loc, size, mat, align='CENTER', font=FONT_BOLD, rot_z=0.0, spacing=1.15, valign='CENTER'):
    cu = bpy.data.curves.new(f'txt_{body[:12]}', 'FONT')
    cu.body = body
    cu.font = bpy.data.fonts.load(font, check_existing=True)
    cu.size = size
    cu.align_x = align
    cu.align_y = valign
    cu.space_character = spacing
    o = bpy.data.objects.new(f'txt_{body[:12]}', cu)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (0, 0, rot_z)
    cu.materials.append(mat)
    return o


def outline(name, x0, y0, x1, y1, z, w, mat):
    """Thin printed rectangle outline (section box on a panel)."""
    parts = []
    for (cx, cy, sx, sy) in [((x0 + x1) / 2, y1, x1 - x0, w), ((x0 + x1) / 2, y0, x1 - x0, w), (x0, (y0 + y1) / 2, w, y1 - y0), (x1, (y0 + y1) / 2, w, y1 - y0)]:
        parts.append(box(f'{name}_{len(parts)}', (sx, sy, 0.002), (cx, cy, z), mat, bev=0))
    return parts


def floor(mat, size=120):
    return box('floor', (size, size, 0.1), (0, 0, -0.1), mat, bev=0)


def keybed(prefix, x0, y_front, white_w, white_len, black_len, z, mats, gap=0.018, white_h=0.22, black_h=0.13, black_w_ratio=0.58, pressed=(), count=25):
    """`count` keys starting at C (25 = two octaves, 13 = one). Returns the natural-key span (x_left, x_right)."""
    white_i = -1
    for i in range(count):
        sharp = i % 12 in NOTE_SHARP
        if not sharp:
            white_i += 1
        down = i in pressed
        if sharp:
            x = x0 + (white_i + 1) * white_w
            w = white_w * black_w_ratio
            # black keys rise from between the naturals: bottom sunk into the white keys, top `black_h` proud
            box(f'{prefix}_{i}', (w, black_len, black_h + white_h * 0.55), (x, y_front + white_len - black_len / 2, z + white_h * 0.45 - (0.03 if down else 0)), mats['black'], bev=0.018, taper=(0.86, 0.95))
        else:
            x = x0 + white_i * white_w + white_w / 2
            box(f'{prefix}_{i}', (white_w - gap, white_len, white_h), (x, y_front + white_len / 2, z - (0.04 if down else 0)), mats['white'], bev=0.02)
    return x0, x0 + (white_i + 1) * white_w


if __name__ == '__main__':
    print('common helpers loaded', sys.version)


def plane(name, w, d, loc, mat):
    """Flat quad with UVs (for image-textured screens), facing +Z."""
    bm = bmesh.new()
    bm.loops.layers.uv.new('UVMap')  # calc_uvs only fills an existing layer
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5, calc_uvs=True)
    for v in bm.verts:
        v.co.x *= w
        v.co.y *= d
    o = _obj(name, bm, mat, smooth=False)
    o.location = loc
    return o


def empty(name, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
    """Transform node: named pivot for animated parts (knob_*, key_*, ...) and panel groups."""
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    e.location = loc
    e.rotation_euler = rot
    e.parent = parent
    return e


def adopt(parent, *objs):
    for o in objs:
        o.parent = parent
    return objs


def cable(name, p0, p1, sag_z, bow, mat, radius=0.035):
    """Patch cable: bezier from p0 to p1 drooping to sag_z, bowed sideways by `bow`."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = 4
    cu.resolution_u = 24
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(2)
    a, b = Vector(p0), Vector(p1)
    d = b - a
    side = Vector((-d.y, d.x, 0)).normalized() * bow
    mid = (a + b) / 2 + side
    mid.z = sag_z
    for bp, co in zip(sp.bezier_points, (a, mid, b)):
        bp.co = co
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    o = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(o)
    cu.materials.append(mat)
    return o
