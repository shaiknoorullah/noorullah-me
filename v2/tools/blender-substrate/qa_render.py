# The Substrate — QA frames (director P1 gate): three Cycles renders of the
# assembled scene for look review. Renders the pre-pack twin
# (out/substrate.blend — the KTX2-packed GLB is not Blender-importable;
# geometry and texture content are identical, courier emissive stays 0 so
# frames show the light story, not the mask encoding).
#   qa/01-hero-grazing.png — 90mm grazing dolly frame across the relief
#   qa/02-topdown.png      — dead top-down transit-map read
#   qa/03-die-macro.png    — act-5 die set macro with IHS overhead
# Run: blender -b out/substrate.blend -P qa_render.py   (SAMPLES env, 256)
import json
import os

import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "out")
QA = os.path.join(ROOT, "qa")
os.makedirs(QA, exist_ok=True)
SAMPLES = int(os.environ.get("SAMPLES", "256"))

with open(os.path.join(OUT, "anchors.json")) as f:
    anchors = json.load(f)
sx, sz, snegy = anchors["socketPos"]
sy = -snegy  # gltf -> blender y
dx, dz, dnegy = anchors["dieCenter"]
dy = -dnegy

sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = SAMPLES
sc.cycles.device = "GPU"
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "OPTIX"
except Exception:
    prefs.compute_device_type = "CUDA"
prefs.get_devices()
for d in prefs.devices:
    d.use = True
sc.cycles.use_denoising = False
sc.render.resolution_x = 1280
sc.render.resolution_y = 720
sc.render.image_settings.file_format = "PNG"
sc.view_settings.view_transform = "AgX"
# viewing exposure ~ the runtime grade lift (near-black discipline: the
# baked light story is intentionally low; the composer lifts, QA matches)
sc.view_settings.exposure = 1.3
try:
    sc.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    pass

w = bpy.data.worlds.new("qa_black")
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.0
sc.world = w


def look_at(obj, pt):
    obj.rotation_euler = (
        (Vector(pt) - obj.location).to_track_quat("-Z", "Y").to_euler()
    )


def shoot(name, loc, target, lens, fstop=None, focus=None):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    look_at(cam, target)
    cam.data.lens = lens
    if fstop is not None:
        cam.data.dof.use_dof = True
        cam.data.dof.aperture_fstop = fstop
        cam.data.dof.focus_distance = (
            focus if focus is not None else (Vector(target) - Vector(loc)).length
        )
    sc.camera = cam
    sc.render.filepath = os.path.join(QA, name)
    bpy.ops.render.render(write_still=True)
    print("QA rendered %s" % name)


# 1. grazing hero — long lens across the relief skyline toward the socket
shoot(
    "01-hero-grazing.png",
    (8.5, -10.5, 3.6),
    (sx - 3.4, sy + 1.0, 0.9),
    90,
    fstop=5.6,
)

# 2. dead top-down — the transit-map read. Act-4 grade is near-shadowless
# (STORY): flatten the rig (no lateral hot spots, no dead zones) under a
# broad neutral dome for this shot only.
_saved = {}
for lname, factor in (("key", 0.22), ("emberrim", 0.3), ("coolfill", 1.6)):
    ld = bpy.data.lights.get(lname)
    if ld:
        _saved[lname] = ld.energy
        ld.energy *= factor
bpy.ops.object.light_add(type="AREA", location=(0, 9, 21))
_dome = bpy.context.object
_dome.data.shape = "DISK"
_dome.data.size = 34
_dome.data.color = (1.0, 0.985, 0.96)
_dome.data.energy = 2600
look_at(_dome, (0, 9, 0.55))
shoot("02-topdown.png", (0, 0, 26.0), (0, 0, 0.55), 50)
bpy.data.objects.remove(_dome, do_unlink=True)
for lname, e in _saved.items():
    bpy.data.lights[lname].energy = e

# 3. die macro — act-5 set. QA-session-only staging (documented in the P1
# report): the shipped resting emissive stays 0.04; the runtime wake
# cascade drives it up, simulated here, plus the act-5 rig (ember rim on
# the IHS edge, dim cool top) so the set is reviewable.
mt_die = bpy.data.materials.get("mt_die")
if mt_die:
    pb = mt_die.node_tree.nodes.get("Principled BSDF")
    if pb and pb.inputs.get("Emission Strength"):
        pb.inputs["Emission Strength"].default_value = 1.5


def qa_light(kind, loc, color, energy, size, target):
    bpy.ops.object.light_add(type=kind, location=loc)
    ob = bpy.context.object
    ob.data.color = color
    ob.data.energy = energy
    if kind == "AREA":
        ob.data.shape = "DISK"
        ob.data.size = size
    look_at(ob, target)
    return ob


qa_light("AREA", (dx + 3.5, dy + 2.5, dz + 4.5), (1.0, 0.42, 0.10), 220, 3.0,
         (dx, dy, dz + 1.4))
qa_light("AREA", (dx - 2.0, dy - 2.0, dz + 6.0), (0.21, 0.32, 0.91), 40, 4.0,
         (dx, dy, dz))

shoot(
    "03-die-macro.png",
    (dx + 2.4, dy - 2.8, dz + 2.6),
    (dx, dy, dz + 0.1),
    85,
    fstop=2.8,
)

print("DONE qa_render")
