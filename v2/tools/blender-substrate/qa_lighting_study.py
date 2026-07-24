# The Substrate — lighting study (director directive 2026-07-24: product
# lighting). Four setups, SAME camera as 01-hero-grazing, AgX, blacks true,
# 1024spp + OIDN (sample directive), OptiX. Outputs qa/lighting-study/:
#   A-single-soft-key.png   product softbox + reflection card, neutral env
#   B-dusk-dual-tone.png    rebalanced dual-tone (desat fill, edge ember)
#   C-top-softbox.png       museum-case overhead + warm rear kicker
#   D-practical-night.png   board lit by its own green spill + far warm key
#   A-macro-100mm.png       setup A at 100mm grazing macro (metal read)
#   contact-sheet.png       2x2 (A TL, B TR, C BL, D BR)
# Run: blender -b out/substrate.blend -P qa_lighting_study.py
import json
import os

import bpy
import numpy as np
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "out")
QA = os.path.join(ROOT, "qa", "lighting-study")
os.makedirs(QA, exist_ok=True)
SAMPLES = max(int(os.environ.get("SAMPLES", "1024")), 1024)  # HARD floor

GREEN = (0.643, 0.922, 0.325)
EMBER = (1.0, 0.42, 0.10)
COOL = (0.21, 0.32, 0.91)
KEY5600 = (1.0, 0.976, 0.945)

with open(os.path.join(OUT, "anchors.json")) as f:
    anchors = json.load(f)
sx, _, snegy = anchors["socketPos"]
sy = -snegy

sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = SAMPLES
sc.cycles.use_adaptive_sampling = True
sc.cycles.adaptive_threshold = 0.008
sc.cycles.max_bounces = 8
sc.cycles.diffuse_bounces = 4
sc.cycles.glossy_bounces = 4
sc.cycles.caustics_reflective = False
sc.cycles.caustics_refractive = False
sc.cycles.sample_clamp_indirect = 10.0
sc.cycles.device = "GPU"
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "OPTIX"
except Exception:
    prefs.compute_device_type = "CUDA"
prefs.get_devices()
for d in prefs.devices:
    d.use = True
sc.cycles.use_denoising = True
try:
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
except Exception:
    pass
sc.render.resolution_x = 1280
sc.render.resolution_y = 720
sc.render.image_settings.file_format = "PNG"
sc.view_settings.view_transform = "AgX"
sc.view_settings.exposure = 1.3
try:
    sc.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    pass

# strip every light from the blend — each setup owns its rig
for ob in [o for o in bpy.data.objects if o.type == "LIGHT"]:
    bpy.data.objects.remove(ob, do_unlink=True)

world = bpy.data.worlds.new("study")
world.use_nodes = True
BG = world.node_tree.nodes["Background"]
BG.inputs[0].default_value = (0, 0, 0, 1)
BG.inputs[1].default_value = 0.0
sc.world = world


def look_at(obj, pt):
    obj.rotation_euler = (
        (Vector(pt) - obj.location).to_track_quat("-Z", "Y").to_euler()
    )


def area(loc, color, energy, size, target, size_y=None):
    bpy.ops.object.light_add(type="AREA", location=loc)
    ob = bpy.context.object
    ob.data.color = color
    ob.data.energy = energy
    if size_y:
        ob.data.shape = "RECTANGLE"
        ob.data.size = size
        ob.data.size_y = size_y
    else:
        ob.data.shape = "DISK"
        ob.data.size = size
    look_at(ob, target)
    return ob


def refl_card(loc, size_x, size_y, strength, target):
    """Emissive plane: a real reflection card — metal is lit by what it
    reflects (visible to reflections, hidden from camera)."""
    bpy.ops.mesh.primitive_plane_add(location=loc)
    card = bpy.context.object
    card.scale = (size_x / 2, size_y / 2, 1)
    look_at(card, target)
    m = bpy.data.materials.new("refl_card")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    outn = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = strength
    em.inputs["Color"].default_value = (1, 1, 1, 1)
    nt.links.new(em.outputs[0], outn.inputs["Surface"])
    card.data.materials.append(m)
    card.visible_camera = False
    return card


def clear_rig(objs):
    for ob in objs:
        bpy.data.objects.remove(ob, do_unlink=True)


CAM_LOC = (8.5, -10.5, 3.6)
CAM_TGT = (sx - 3.4, sy + 1.0, 0.9)


def shoot(name, lens=90, fstop=5.6):
    bpy.ops.object.camera_add(location=CAM_LOC)
    cam = bpy.context.object
    look_at(cam, CAM_TGT)
    cam.data.lens = lens
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = fstop
    cam.data.dof.focus_distance = (Vector(CAM_TGT) - Vector(CAM_LOC)).length
    sc.camera = cam
    sc.render.filepath = os.path.join(QA, name)
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    print("STUDY rendered %s" % name)


# ---- A. single soft key + reflection card, dim neutral env ----
BG.inputs[0].default_value = (1, 1, 1, 1)
BG.inputs[1].default_value = 0.015  # dim neutral environment fill
rig = [
    area((-14, -6, 6.5), KEY5600, 3200, 18, (0, 2, 1.0)),  # grazing softbox ~35deg
    refl_card((13, 3, 4.5), 22, 7, 1.1, (0, 3, 1.0)),      # long white card, cam-right
]
shoot("A-single-soft-key.png")
shoot("A-macro-100mm.png", lens=100, fstop=2.8)
clear_rig(rig)
BG.inputs[1].default_value = 0.0

# ---- B. dusk dual-tone, rebalanced (desat fill 15%, ember = edge kicker) ----
fill_desat = tuple(0.85 + 0.15 * c for c in COOL)  # heavily desaturated cool
rig = [
    area((-11, -1, 3.4), KEY5600, 1500, 6, (0, 1, 0.7)),
    area((7, -2, 6.0), fill_desat, 40, 9, (1, 2, 0.6)),
    area((2.5, 11.0, 2.4), EMBER, 380, 1.5, (0.5, 6.5, 1.4)),  # tight edge
    area((0, 8, 9.0), (0.92, 0.95, 1.0), 160, 12, (0, 5, 1.0)),  # bounce
]
shoot("B-dusk-dual-tone.png")
clear_rig(rig)

# ---- C. top softbox + warm rear kicker ----
rig = [
    area((0, 4, 14), (1.0, 0.99, 0.97), 2400, 30, (0, 4, 0.6)),
    area((10, 13, 2.6), EMBER, 320, 2.0, (3, 7, 1.3)),
]
shoot("C-top-softbox.png")
clear_rig(rig)

# ---- D. practical night: green spill + dim warm key far back ----
rig = [
    area((0, 2, 3.2), GREEN, 130, 14, (0, 4, 0.6)),          # low wide spill
    area((sx, sy, 2.2), GREEN, 60, 2.0, (sx, sy, 0.8)),      # socket practical
    area((-6, 15, 3.5), (1.0, 0.76, 0.52), 260, 6, (0, 6, 1.0)),  # far warm key
]
shoot("D-practical-night.png")
clear_rig(rig)

# ---- contact sheet (A TL, B TR, C BL, D BR) ----
tiles = ["A-single-soft-key.png", "B-dusk-dual-tone.png",
         "C-top-softbox.png", "D-practical-night.png"]
w, h = 1280, 720
sheet = np.zeros((h * 2, w * 2, 4), dtype=np.float32)
for i, t in enumerate(tiles):
    img = bpy.data.images.load(os.path.join(QA, t))
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    tile = px.reshape(h, w, 4)
    r, c = (1 - i // 2), (i % 2)  # numpy rows bottom-up: A top-left
    sheet[r * h:(r + 1) * h, c * w:(c + 1) * w] = tile
    bpy.data.images.remove(img)
out_img = bpy.data.images.new("contact", width=w * 2, height=h * 2)
out_img.pixels.foreach_set(sheet.reshape(-1))
out_img.filepath_raw = os.path.join(QA, "contact-sheet.png")
out_img.file_format = "PNG"
out_img.save()
print("STUDY rendered contact-sheet.png")
print("DONE qa_lighting_study")
