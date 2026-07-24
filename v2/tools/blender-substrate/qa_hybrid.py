# The Substrate — hero/topdown/macro QA under THE RIG (LIGHTING-BIBLE §7
# via rig_law.py; A+C+D verdict is the ratio target). PROBE=1 renders
# 256spp + floor stats at build-order STAGE (1 key .. 6 full, bible §7);
# finals render 2048spp with the §7 finals block.
# Run: blender -b out/substrate.blend -P qa_hybrid.py
import json
import os
import sys

import bpy
import numpy as np
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
import rig_law

OUT = os.path.join(ROOT, "out")
QA = os.path.join(ROOT, "qa")
STUDY = os.path.join(QA, "lighting-study")
PROBE = os.environ.get("PROBE") == "1"
STAGE = int(os.environ.get("STAGE", "6"))
BASE_E = float(os.environ.get("BASE_E", "900"))
CEIL = float(os.environ.get("CEIL", "3.0"))
SAMPLES = 256 if PROBE else max(int(os.environ.get("SAMPLES", "2048")), 2048)

with open(os.path.join(OUT, "anchors.json")) as f:
    anchors = json.load(f)
sx, _, snegy = anchors["socketPos"]
sy = -snegy

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
sc.cycles.use_denoising = not PROBE
try:
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
except Exception:
    pass
rig_law.finals_settings(sc, iteration=PROBE)
sc.render.resolution_x = 1280
sc.render.resolution_y = 720
sc.render.image_settings.file_format = "PNG"
sc.view_settings.view_transform = "AgX"
# exposure set once (bible: tune lights, not exposure)
sc.view_settings.exposure = 1.3
try:
    sc.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    pass

rig_law.set_world(sc, whisper=float(os.environ.get("WHISPER", "0.003")))
rig_law.build_rig(base_energy=BASE_E, ceiling_strength=CEIL, stage=STAGE)
if os.environ.get("HAZE", "1") == "1" and not PROBE:
    pass  # haze added per-shot below (hero only — act 4 is above the weather)

CAM_LOC = (8.5, -10.5, 3.6)
CAM_TGT = (sx - 3.4, sy + 1.0, 0.9)


def look_at(obj, pt):
    obj.rotation_euler = (
        (Vector(pt) - obj.location).to_track_quat("-Z", "Y").to_euler()
    )


def shoot(name, loc=CAM_LOC, tgt=CAM_TGT, lens=90, fstop=5.6):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    look_at(cam, tgt)
    cam.data.lens = lens
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = fstop
    cam.data.dof.focus_distance = (Vector(tgt) - Vector(loc)).length
    sc.camera = cam
    sc.render.filepath = os.path.join(QA, name)
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    print("RIG rendered %s" % name)


if PROBE:
    shoot("hybrid-probe.png")
    img = bpy.data.images.load(os.path.join(QA, "hybrid-probe.png"))
    px = np.empty(1280 * 720 * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    lum = px.reshape(-1, 4)[:, :3].mean(axis=1)
    lit = lum[lum > 0.004]
    print("PROBE stage=%d floors: p5=%.4f p10=%.4f p25=%.4f med=%.4f p99=%.4f"
          % ((STAGE,) + tuple(np.percentile(lit, q) for q in (5, 10, 25, 50, 99))))
else:
    haze = rig_law.add_haze() if os.environ.get("HAZE", "1") == "1" else None
    shoot("01-hero-grazing.png")
    shoot("A-macro-100mm-hybrid.png", lens=100, fstop=2.8)
    if haze:  # act-4 top-down is above the weather (STORY)
        bpy.data.objects.remove(haze, do_unlink=True)
    shoot("02-topdown.png", loc=(0, 0, 26.0), tgt=(0, 0, 0.55), lens=50)
    names = [os.path.join(STUDY, "A-single-soft-key.png"),
             os.path.join(STUDY, "C-top-softbox.png"),
             os.path.join(QA, "01-hero-grazing.png")]
    w0, h0 = 1280, 720
    grid = np.zeros((h0, w0 * 3, 4), dtype=np.float32)
    for i, n in enumerate(names):
        img = bpy.data.images.load(n)
        p = np.empty(w0 * h0 * 4, dtype=np.float32)
        img.pixels.foreach_get(p)
        grid[:, i * w0:(i + 1) * w0] = p.reshape(h0, w0, 4)
        bpy.data.images.remove(img)
    out_img = bpy.data.images.new("cmp", width=w0 * 3, height=h0)
    out_img.pixels.foreach_set(grid.reshape(-1))
    out_img.filepath_raw = os.path.join(QA, "hero-vs-study.png")
    out_img.file_format = "PNG"
    out_img.save()
    print("RIG rendered hero-vs-study.png (A | C | rig-law)")
print("DONE qa_hybrid")
