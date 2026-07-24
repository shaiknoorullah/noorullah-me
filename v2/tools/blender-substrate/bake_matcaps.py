# The Substrate — die matcap trio (director addendum item 5; CORN
# KernelMaterial pattern for the Act-5 macro): three 512^2 sphere renders in
# Cycles -> runtime die material = matcap stack at zero lighting cost.
#   matcap-die-base.png  — dark silicon base under the board rig
#   matcap-die-ao.png    — white clay under soft top dome (multiply slot)
#   matcap-die-spec.png  — black gloss with green-signal key (screen slot)
# Outputs land in public/assets/matcaps/. Deterministic, rerunnable.
# Run: blender -b --factory-startup -P bake_matcaps.py
import os

import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
DEST = os.path.join(REPO, "public", "assets", "matcaps")
os.makedirs(DEST, exist_ok=True)

SIZE = 512
SAMPLES = max(int(os.environ.get("SAMPLES", "2048")), 2048)  # HARD floor (director)
GREEN = (0.643, 0.922, 0.325)
EMBER = (1.0, 0.42, 0.10)
COOL = (0.21, 0.32, 0.91)
KEY5600 = (1.0, 0.976, 0.945)


def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = SAMPLES
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.008
    sc.cycles.max_bounces = 8
    sc.cycles.diffuse_bounces = 4
    sc.cycles.glossy_bounces = 4
    sc.cycles.transmission_bounces = 4
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.cycles.sample_clamp_indirect = 10.0
    sc.cycles.device = "GPU"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    device = "OPTIX"
    try:
        prefs.compute_device_type = "OPTIX"
        prefs.get_devices()
    except Exception:
        prefs.compute_device_type = "CUDA"
        prefs.get_devices()
        device = "CUDA"
    for d in prefs.devices:
        d.use = True
    sc.cycles.use_denoising = True  # renders denoise natively (OIDN)
    try:
        sc.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        pass
    print("BAKEENV device=%s samples=%d (matcap render, OIDN on)" % (device, SAMPLES))
    sc.render.resolution_x = SIZE
    sc.render.resolution_y = SIZE
    sc.render.film_transparent = False
    w = bpy.data.worlds.new("black")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.0
    sc.world = w
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, segments=96, ring_count=64)
    sphere = bpy.context.object
    bpy.ops.object.shade_smooth()
    bpy.ops.object.camera_add(location=(0, -3.2, 0))
    cam = bpy.context.object
    cam.rotation_euler = (1.5707963, 0, 0)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 2.02
    sc.camera = cam
    return sc, sphere


def area(name, loc, color, energy, size, target=(0, 0, 0)):
    bpy.ops.object.light_add(type="AREA", location=loc)
    ob = bpy.context.object
    d = ob.data
    d.name = name
    d.color = color
    d.energy = energy
    d.shape = "DISK"
    d.size = size
    ob.rotation_euler = (
        (Vector(target) - ob.location).to_track_quat("-Z", "Y").to_euler()
    )
    return ob


def principled(sphere, base, rough, metal=0.0):
    m = bpy.data.materials.new("mc")
    m.use_nodes = True
    pb = m.node_tree.nodes["Principled BSDF"]
    pb.inputs["Base Color"].default_value = (*base, 1)
    pb.inputs["Roughness"].default_value = rough
    pb.inputs["Metallic"].default_value = metal
    sphere.data.materials.append(m)
    return pb


def render(path):
    sc = bpy.context.scene
    sc.view_settings.view_transform = "AgX"
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("rendered %s" % path)


# base: dark silicon under the board rig (subtle blue-green sheen)
sc, sphere = fresh()
principled(sphere, (0.045, 0.05, 0.062), 0.32, metal=0.55)
area("key", (-2.4, -1.6, 1.6), KEY5600, 320, 2.2, (0, 0, 0.2))
area("rim", (1.8, 1.4, 0.9), EMBER, 120, 2.6, (0, 0, 0.2))
area("fill", (2.0, -2.0, 1.4), COOL, 28, 2.4)
render(os.path.join(DEST, "matcap-die-base.png"))

# multiply-AO: white clay under a soft top dome (occlusion feel)
sc, sphere = fresh()
principled(sphere, (0.9, 0.9, 0.9), 0.9)
area("dome", (0, -0.6, 2.6), (1, 1, 1), 260, 4.0, (0, 0, 0))
render(os.path.join(DEST, "matcap-die-ao.png"))

# screen-spec: black gloss, green-signal key + faint ember counter
sc, sphere = fresh()
principled(sphere, (0.01, 0.01, 0.01), 0.12, metal=0.9)
area("greenkey", (-2.0, -1.8, 1.8), GREEN, 240, 1.4, (0, 0, 0.1))
area("counter", (2.2, 1.0, -0.6), EMBER, 60, 1.8, (0, 0, 0))
render(os.path.join(DEST, "matcap-die-spec.png"))

print("DONE bake_matcaps")
