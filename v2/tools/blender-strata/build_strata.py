# Strata — Blender 4.2 headless build for noorullah.me v2
# Outputs: site/public/assets/strata.glb + studio.hdr + preview stills
# Run: blender -b --factory-startup -P build_strata.py

import bpy
import math
import os
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(ROOT, "..", "..", "site"))
ASSETS = os.path.join(SITE, "public", "assets")
PREVIEWS = "/tmp/strata-preview"
os.makedirs(ASSETS, exist_ok=True)
os.makedirs(PREVIEWS, exist_ok=True)

GREEN = (0.643, 0.922, 0.325, 1.0)  # #A4EB53 cursor green

# ---------------------------------------------------------------- utilities

def clean_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.materials,
                  bpy.data.cameras, bpy.data.lights, bpy.data.images):
        pass  # keep datablocks; scene objects are gone

def mat_principled(name, base, metallic=0.0, rough=0.5, transmission=0.0,
                   ior=1.52, emission=None, emission_strength=0.0,
                   anisotropic=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    if transmission > 0:
        tw = bsdf.inputs.get("Transmission Weight") or bsdf.inputs.get("Transmission")
        if tw: tw.default_value = transmission
        io = bsdf.inputs.get("IOR")
        if io: io.default_value = ior
    if anisotropic > 0:
        an = bsdf.inputs.get("Anisotropic IOR Level") or bsdf.inputs.get("Anisotropic")
        if an: an.default_value = anisotropic
    if coat > 0:
        cw = bsdf.inputs.get("Coat Weight") or bsdf.inputs.get("Clearcoat")
        if cw: cw.default_value = coat
    if emission:
        ec = bsdf.inputs.get("Emission Color") or bsdf.inputs.get("Emission")
        es = bsdf.inputs.get("Emission Strength")
        if ec: ec.default_value = emission
        if es: es.default_value = emission_strength
    return m

def granite_mat():
    m = mat_principled("granite", (0.012, 0.013, 0.016), rough=0.32, coat=0.25)
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    noise = nt.nodes.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 38.0
    noise.inputs["Detail"].default_value = 4.5; noise.inputs["Roughness"].default_value = 0.72
    bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.16
    bump.inputs["Distance"].default_value = 0.04
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m

def box(name, loc, dims, mat=None, bevel=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.active_object
    o.name = name
    o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.rotation_euler = [math.radians(a) for a in rot]
    if bevel > 0:
        mod = o.modifiers.new("Bevel", 'BEVEL'); mod.width = bevel; mod.segments = 3
        mod.limit_method = 'ANGLE'
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier="Bevel")
    if mat: o.data.materials.append(mat)
    return o

def smooth_by_angle(o):
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    try:
        bpy.ops.object.shade_smooth_by_angle()
    except Exception:
        for p in o.data.polygons: p.use_smooth = True
    o.select_set(False)

# ---------------------------------------------------------------- materials

GLASS_CLEAR = mat_principled("glass_clear", (0.97, 0.98, 1.0), rough=0.045, transmission=1.0, ior=1.52, coat=0.3)
GLASS_FROST = mat_principled("glass_frosted", (0.9, 0.92, 0.95), rough=0.34, transmission=0.92, ior=1.5)
GLASS_SMOKE = mat_principled("glass_smoked", (0.16, 0.17, 0.2), rough=0.08, transmission=0.96, ior=1.52, coat=0.3)
GRANITE = granite_mat()
CHROME = mat_principled("chrome", (0.92, 0.93, 0.95), metallic=1.0, rough=0.045)
BRONZE = mat_principled("bronze_dark", (0.09, 0.07, 0.05), metallic=0.92, rough=0.38)
BRUSHED = mat_principled("brushed_metal", (0.55, 0.56, 0.58), metallic=1.0, rough=0.26, anisotropic=0.65)
EMISSIVE = mat_principled("cursor_light", (0.2, 0.5, 0.08), rough=0.4, emission=GREEN, emission_strength=9.0)
FLOOR_M = mat_principled("floor", (0.008, 0.009, 0.011), rough=0.34, coat=0.18)

clean_scene()

# ---------------------------------------------------------------- the set

# floor
box("floor", (0, 0, -0.05), (60, 60, 0.1), FLOOR_M, bevel=0.0)

# granite plinth  (x width 2.6, y depth 1.4, z 0.35)
plinth = box("plinth", (0, 0, 0.175), (2.6, 1.4, 0.35), GRANITE, bevel=0.02)

# sphere seat: boolean dish at plinth top, front-right
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.25, segments=48, ring_count=32, location=(0.85, -0.42, 0.54))
seat = bpy.context.active_object; seat.name = "seat_cutter"
bpy.context.view_layer.objects.active = plinth
bmod = plinth.modifiers.new("seat", 'BOOLEAN'); bmod.operation = 'DIFFERENCE'; bmod.solver = 'EXACT'
bmod.object = seat
bpy.ops.object.modifier_apply(modifier="seat")
bpy.data.objects.remove(seat)
smooth_by_angle(plinth)

# chrome sphere resting in the dish
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.25, segments=64, ring_count=48, location=(0.85, -0.42, 0.54))
sphere = bpy.context.active_object; sphere.name = "chrome_sphere"
sphere.data.materials.append(CHROME)
smooth_by_angle(sphere)

# the stack: 5 glass slabs, exploded monolith (center-back of plinth)
SLAB = (1.3, 1.0, 0.32)
GAPS = [0.12, 0.30, 0.12, 0.12]   # wide heart gap between slab1 and slab2
MATS = [GLASS_CLEAR, GLASS_FROST, GLASS_SMOKE, GLASS_CLEAR, GLASS_FROST]
YAW = [-3.5, -1.2, 0.4, 2.0, 3.8]
z = 0.35
slab_z = []
for i in range(5):
    s = box(f"strata_{i}", (-0.25, 0.12, z + SLAB[2] / 2), SLAB, MATS[i], bevel=0.012,
            rot=(0.4 * (1 if i % 2 else -1), 0, YAW[i]))
    smooth_by_angle(s)
    slab_z.append((z, z + SLAB[2]))
    z += SLAB[2] + (GAPS[i] if i < 4 else 0)

# emissive cube floating in the heart gap (between slab1 top and slab2 bottom)
heart = (slab_z[1][1] + slab_z[2][0]) / 2
cube = box("cursor_cube", (-0.25, 0.12, heart), (0.18, 0.18, 0.18), EMISSIVE, bevel=0.012,
           rot=(12, 8, 20))
smooth_by_angle(cube)

# brushed counterweight bar at plinth front-left
bar = box("counter_bar", (-0.78, -0.52, 0.41), (0.9, 0.12, 0.12), BRUSHED, bevel=0.008, rot=(0, 0, 2.5))
smooth_by_angle(bar)

# jali screen: real geometry lattice, behind-left, angled toward the stack
jali_parts = []
W, H, T, D = 1.6, 2.4, 0.025, 0.04
# outer frame
jali_parts.append(box("jf_t", (0, 0, H/2 - 0.03), (W, D, 0.06), BRONZE))
jali_parts.append(box("jf_b", (0, 0, -H/2 + 0.03), (W, D, 0.06), BRONZE))
jali_parts.append(box("jf_l", (-W/2 + 0.03, 0, 0), (0.06, D, H), BRONZE))
jali_parts.append(box("jf_r", (W/2 - 0.03, 0, 0), (0.06, D, H), BRONZE))
# inner grid 4x4: 3 vertical + 3 horizontal bars
for i in range(1, 4):
    x = -W/2 + i * (W / 4)
    jali_parts.append(box(f"jv_{i}", (x, 0, 0), (T, D, H - 0.12), BRONZE))
    zz = -H/2 + i * (H / 4)
    jali_parts.append(box(f"jh_{i}", (0, 0, zz), (W - 0.12, D, T), BRONZE))
# join
for p in jali_parts: p.select_set(True)
bpy.context.view_layer.objects.active = jali_parts[0]
bpy.ops.object.join()
jali = bpy.context.active_object; jali.name = "jali_screen"
jali.location = (-2.4, 1.9, 1.25)
jali.rotation_euler = (0, 0, math.radians(38))
smooth_by_angle(jali)

# keep only what ships in the GLB
shippables = {"floor", "plinth", "chrome_sphere", "counter_bar", "cursor_cube", "jali_screen"} | {f"strata_{i}" for i in range(5)}

# ---------------------------------------------------------------- studio env -> HDR

env_scene = bpy.data.scenes.new("studio_env")
bpy.context.window.scene = env_scene
for o in list(env_scene.objects): bpy.data.objects.remove(o)

def env_card(name, loc, size, color, strength, rot=(90, 0, 0), scale_y=1.0):
    m = mat_principled(name + "_m", (0, 0, 0), emission=(*color, 1.0), emission_strength=strength)
    c = box(name, loc, (size[0], 0.02, size[1] * scale_y), m)
    c.rotation_euler = [math.radians(a) for a in rot]
    # aim the card at origin
    direction = Vector((0, 0, 0.8)) - c.location
    c.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    return c

env_card("key_5600", (-4.5, -3.5, 6.0), (4.2, 4.2), (1.0, 0.975, 0.94), 7.0)
env_card("strip_cool", (5.0, 0.5, 3.2), (0.9, 4.5), (0.45, 0.6, 1.0), 3.2)
env_card("warm_low", (-2.0, 3.5, 0.7), (2.2, 1.0), (1.0, 0.55, 0.3), 2.2)
env_card("top_soft", (0.5, 0, 7.5), (3.0, 3.0), (1.0, 1.0, 1.0), 1.6)

bpy.ops.object.camera_add(location=(0, 0, 0.9))
ecam = bpy.context.active_object
ecam.data.type = 'PANO'
ecam.data.panorama_type = 'EQUIRECTANGULAR'
env_scene.camera = ecam

# cycles settings (GPU if available)
cprefs = bpy.context.preferences.addons['cycles'].preferences
try:
    cprefs.compute_device_type = 'CUDA'
    cprefs.get_devices()
    for d in cprefs.devices:
        d.use = (d.type == 'CUDA')
    gpu_ok = any(d.use for d in cprefs.devices)
except Exception:
    gpu_ok = False

for sc, samples, engine in [(env_scene, 128, 'GPU')]:
    sc.render.engine = 'BLENDER_EEVEE_NEXT' if False else 'CYCLES'
    sc.cycles.device = 'GPU' if gpu_ok else 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True

env_scene.render.resolution_x = 2048
env_scene.render.resolution_y = 1024
env_scene.render.image_settings.file_format = 'HDR'
env_scene.render.filepath = os.path.join(ASSETS, "studio.hdr")
env_scene.view_settings.view_transform = 'Standard'
env_scene.world = bpy.data.worlds.new("env_world")
env_scene.world.use_nodes = True
env_scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.004, 0.004, 0.005, 1.0)
env_scene.world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
bpy.ops.render.render(write_still=True, scene=env_scene.name)
print("HDR written:", env_scene.render.filepath)

# ---------------------------------------------------------------- previews

main_scene = bpy.context.window.scene = bpy.data.scenes["Scene"]
# world from the fresh HDR
img = bpy.data.images.load(env_scene.render.filepath)
w = bpy.data.worlds.new("main_world"); w.use_nodes = True
nt = w.node_tree
bg = nt.nodes["Background"]
tex = nt.nodes.new("ShaderNodeTexEnvironment"); tex.image = img
nt.links.new(tex.outputs["Color"], bg.inputs["Color"])
bg.inputs[1].default_value = 1.0
main_scene.world = w

# key spot through the jali for the preview (validates the geometry-cast lattice shadow)
bpy.ops.object.light_add(type='SPOT', location=(-3.4, 2.6, 4.2))
key = bpy.context.active_object
key.data.energy = 900
key.data.color = (1.0, 0.97, 0.93)
key.data.spot_size = math.radians(40)
key.data.spot_blend = 0.45
key.data.shadow_soft_size = 0.12
aim = Vector((-0.25, 0.1, 1.2)) - key.location
key.rotation_euler = aim.to_track_quat('-Z', 'Y').to_euler()

# fill point
bpy.ops.object.light_add(type='POINT', location=(3.2, -1.5, 2.2))
fill = bpy.context.active_object
fill.data.energy = 120
fill.data.color = (0.55, 0.68, 1.0)
fill.data.shadow_soft_size = 0.6

main_scene.render.engine = 'CYCLES'
main_scene.cycles.device = 'GPU' if gpu_ok else 'CPU'
main_scene.cycles.samples = 256
main_scene.cycles.use_denoising = True
main_scene.view_settings.view_transform = 'AgX'
main_scene.render.resolution_x = 960
main_scene.render.resolution_y = 540

bpy.ops.object.camera_add(location=(4.6, -5.2, 2.4))
cam = bpy.context.active_object
target = Vector((-0.2, 0.1, 1.25))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.lens = 52
main_scene.camera = cam

main_scene.render.filepath = os.path.join(PREVIEWS, "strata_front34.png")
bpy.ops.render.render(write_still=True, scene=main_scene.name)

cam.location = (0.4, -6.4, 1.5)
cam.rotation_euler = (Vector((-0.2, 0.1, 1.15)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
main_scene.render.filepath = os.path.join(PREVIEWS, "strata_front.png")
bpy.ops.render.render(write_still=True, scene=main_scene.name)

cam.location = (1.2, -1.2, 5.6)
cam.rotation_euler = (Vector((-0.25, 0.1, 1.1)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
main_scene.render.filepath = os.path.join(PREVIEWS, "strata_high.png")
bpy.ops.render.render(write_still=True, scene=main_scene.name)
print("previews done, gpu:", gpu_ok)

# ---------------------------------------------------------------- GLB export

for o in bpy.data.objects:
    o.select_set(o.name in shippables and o.name in main_scene.objects.keys())
bpy.ops.export_scene.gltf(
    filepath=os.path.join(ASSETS, "strata.glb"),
    export_format='GLB',
    export_apply=True,
    export_animations=False,
    export_cameras=False,
    export_lights=False,
    use_selection=True,
)
print("GLB written:", os.path.join(ASSETS, "strata.glb"))
