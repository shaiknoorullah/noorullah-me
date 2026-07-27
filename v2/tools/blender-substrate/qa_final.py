# The Substrate — FINAL P1 QA under the LOCKED cinematic rig (director
# 2026-07-27). Four frames, each as 8-bit PNG (AgX preview) + 32-bit linear
# EXR master:
#   01-hero-grazing   WIDE:  EXP +0.25, ceiling 0.25, haze 0.0004, ember x1.3
#   02-topdown        WIDE:  same wide values
#   A-macro-100mm     MACRO: EXP +1.3, ceiling 0.7, haze 0.0008, ember x1.0
#   03-die-macro      MACRO staging: act-5 wake preview (emission 1.5,
#                     session-only) + ember/cool practicals; no haze at -40
# Plus hero-before-after.png vs qa/cinematic/hero-after.png (lookdev ref).
# Run: blender -b out/substrate.blend -P qa_final.py
import json
import os
import sys

import bpy
import numpy as np
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
os.environ.setdefault("CEILING_STR", "0.7")  # base; wide shots override live
import lookdev_cinematic_rig as cine
import rig_law

OUT = os.path.join(ROOT, "out")
QA = os.path.join(ROOT, "qa")
SAMPLES = max(int(os.environ.get("SAMPLES", "2048")), 2048)

with open(os.path.join(OUT, "anchors.json")) as f:
    anchors = json.load(f)
sx, _, snegy = anchors["socketPos"]
sy = -snegy
dx, dz, dnegy = anchors["dieCenter"]
dy = -dnegy

sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = SAMPLES
sc.cycles.use_adaptive_sampling = True
sc.cycles.max_bounces = 8
sc.cycles.diffuse_bounces = 4
sc.cycles.glossy_bounces = 4
sc.cycles.caustics_reflective = False
sc.cycles.caustics_refractive = False
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
rig_law.finals_settings(sc, iteration=False)
sc.render.resolution_x = 1280
sc.render.resolution_y = 720
sc.view_settings.view_transform = "AgX"
try:
    sc.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    pass

rig_law.set_world(sc, whisper=0.003)
cine.build_cinematic()
cine.metal_fix()
rig_law.color_pass(ember_scale=1.0)  # per-shot scale applied below


def set_shot(exposure, ceiling, ember_scale):
    sc.view_settings.exposure = exposure
    mt = bpy.data.materials.get("mt_rig_ceiling")
    if mt:
        for n in mt.node_tree.nodes:
            if n.type == "EMISSION":
                n.inputs["Strength"].default_value = ceiling
    ember = bpy.data.objects.get("rig_ember")
    if ember:
        ember.data.energy = 4680.0 * ember_scale


def look_at(obj, pt):
    obj.rotation_euler = (
        (Vector(pt) - obj.location).to_track_quat("-Z", "Y").to_euler()
    )


_haze = None


def set_haze(density):
    global _haze
    if _haze:
        bpy.data.objects.remove(_haze, do_unlink=True)
        _haze = None
    if density > 0:
        _haze = rig_law.add_haze(density=density, anisotropy=0.3)


def shoot(name, loc, tgt, lens, fstop=5.6):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    look_at(cam, tgt)
    cam.data.lens = lens
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = fstop
    cam.data.dof.focus_distance = (Vector(tgt) - Vector(loc)).length
    sc.camera = cam
    sc.render.image_settings.file_format = "OPEN_EXR"
    sc.render.image_settings.color_depth = "32"
    sc.render.filepath = os.path.join(QA, name + ".exr")
    bpy.ops.render.render(write_still=True)
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_depth = "8"
    sc.render.filepath = os.path.join(QA, name + ".png")
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    print("FINAL rendered %s (png+exr)" % name)


CAM_LOC = (8.5, -10.5, 3.6)
CAM_TGT = (sx - 3.4, sy + 1.0, 0.9)

# WIDE shots (locked: EXP +0.25, ceiling 0.25, haze 0.0004, ember x1.3)
set_shot(0.25, 0.25, 1.3)
set_haze(0.0004)
shoot("01-hero-grazing", CAM_LOC, CAM_TGT, 90)
# director ruling 2026-07-27: perpendicular view has no grazing Fresnel
# loss, so the same wide lock reads ~2 stops hotter — top-down QA frame
# takes EXP -0.6 (runtime: the Director owns per-act exposure, P3)
set_shot(-0.6, 0.25, 1.3)
shoot("02-topdown", (0, 0, 26.0), (0, 0, 0.55), 50)
set_shot(0.25, 0.25, 1.3)

# MACRO (base values: EXP +1.3, ceiling 0.7, haze 0.0008, ember x1.0)
set_shot(1.3, 0.7, 1.0)
set_haze(0.0008)
shoot("A-macro-100mm", CAM_LOC, CAM_TGT, 100, fstop=2.8)

# DIE macro — act-5 staging (session-only wake preview), no haze at -40
set_haze(0.0)
set_shot(1.3, 0.7, 1.0)
mt_die = bpy.data.materials.get("mt_die")
if mt_die:
    pb = mt_die.node_tree.nodes.get("Principled BSDF")
    if pb and pb.inputs.get("Emission Strength"):
        pb.inputs["Emission Strength"].default_value = 1.5


def stage_light(loc, color, e, size, tgt):
    bpy.ops.object.light_add(type="AREA", location=loc)
    ob = bpy.context.object
    ob.name = "rig_die_stage"
    ob.data.shape = "DISK"
    ob.data.size = size
    ob.data.color = color
    ob.data.energy = e
    look_at(ob, tgt)


stage_light((dx + 3.5, dy + 2.5, dz + 4.5), (1.0, 0.42, 0.10), 220, 3.0,
            (dx, dy, dz + 1.4))
stage_light((dx - 2.0, dy - 2.0, dz + 6.0), (0.21, 0.32, 0.91), 40, 4.0,
            (dx, dy, dz))
shoot("03-die-macro", (dx + 2.4, dy - 2.8, dz + 2.6), (dx, dy, dz + 0.1), 85,
      fstop=2.8)

# before/after vs the lookdev reference frame
ref = os.path.join(QA, "cinematic", "hero-after.png")
mine = os.path.join(QA, "01-hero-grazing.png")
if os.path.exists(ref):
    w0, h0 = 1280, 720
    grid = np.zeros((h0, w0 * 2, 4), dtype=np.float32)
    for i, n in enumerate([ref, mine]):
        img = bpy.data.images.load(n)
        if img.size[0] != w0:
            img.scale(w0, h0)
        p = np.empty(w0 * h0 * 4, dtype=np.float32)
        img.pixels.foreach_get(p)
        grid[:, i * w0:(i + 1) * w0] = p.reshape(h0, w0, 4)
        bpy.data.images.remove(img)
    out_img = bpy.data.images.new("ba", width=w0 * 2, height=h0)
    out_img.pixels.foreach_set(grid.reshape(-1))
    out_img.filepath_raw = os.path.join(QA, "hero-before-after.png")
    out_img.file_format = "PNG"
    out_img.save()
    print("FINAL rendered hero-before-after.png (left=lookdev ref, right=final)")
print("DONE qa_final")
