# Rig-only shim from lookdev_cinematic.py — HAND-MAINTAINED since the
# 2026-07-27 LOCKED VALUES (director): rim 10800W (18000 x0.6), rim2 5x28
# @1980W (x0.22 mirror-blowout fix), cardB cool-tinted (0.72,0.78,1.0),
# ceiling env-overridable (wide bake/shots use 0.25, macro base 0.7).
# The Substrate — LOOKDEV-RIG cinematic pass (contrast + accents + metal +
# atmosphere). Look-dev only: does NOT touch fable's pipeline scripts
# (assemble/bake/export/validate). Reuses rig_law helpers (clear_rig,
# set_world, finals_settings, add_haze) but builds its own rig so stops
# vs key are explicit here. Saves to out/substrate_cinematic.blend —
# out/substrate.blend is never overwritten.
#
# Modes (env):
#   MODE=probe  640x360 96spp, no denoise, fast iteration   (default)
#   MODE=final  1920x1080 2048spp + OIDN, finals block
#   BEFORE=1    skip the cinematic rebuild -> renders the current flat rig
#   SHOT=hero|macro|topdown|crop|all   (default all)
#   SAVE=1      save out/substrate_cinematic.blend after rebuild
#
# Run: blender -b out/substrate.blend -P lookdev_cinematic.py
import json
import os
import sys

import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
import rig_law

OUT = os.path.join(ROOT, "out")
QA = os.path.join(ROOT, "qa", "cinematic")
os.makedirs(QA, exist_ok=True)

MODE = os.environ.get("MODE", "probe")
BEFORE = os.environ.get("BEFORE") == "1"
SHOT = os.environ.get("SHOT", "all")
SAVE = os.environ.get("SAVE") == "1"

with open(os.path.join(OUT, "anchors.json")) as f:
    anchors = json.load(f)
sx, _, snegy = anchors["socketPos"]
sy = -snegy
SOCKET = (sx, sy, 1.08)

# ---------------------------------------------------------------- rig values
# Stops relative to KEY = 9000 W (0 stops). Rig list:
#   K  rig_key        9000 W   0.0   inspection-lamp key (camera-left 45 deg)
#   A  rig_ceiling    str 0.7  -1.5 vs old 2.0  giant ceiling card (ambient)
#   C  rig_cardA/B    str 8/3         gradient reflection cards (metal sees)
#   F  rig_flag_*               negative fill map (three-band dark stripe)
#   R  rig_rim        18000 W  +1.0  bay-door strip, edge hits only
#   R2 rig_rim2       9000 W   0.0   second tight strip, behind-left fin tops
#   X  rig_grazer     4500 W   -1.0  bench probe raking solder mask
#   G  rig_green_boost 260 W   ~-5   BR2049 practical booster (dim idle)
KEY_E = 9000.0
KEY5000 = (1.0, 0.94, 0.86)
COOLSTRIP = (0.88, 0.93, 1.0)
NEUT6500 = (0.94, 0.97, 1.0)
GREEN = (0.643, 0.922, 0.325)
CEILING_STR = float(os.environ.get("CEILING_STR", "0.7"))
GREEN_E = float(os.environ.get("GREEN_E", "1200"))


def look_at(obj, pt):
    obj.rotation_euler = (
        (Vector(pt) - obj.location).to_track_quat("-Z", "Y").to_euler()
    )


def rect(name, loc, sx, syy, energy, color, target):
    bpy.ops.object.light_add(type="AREA", location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.data.shape = "RECTANGLE"
    ob.data.size = sx
    ob.data.size_y = syy
    ob.data.energy = energy
    ob.data.color = color
    look_at(ob, target)
    return ob


def build_cinematic():
    rig_law.clear_rig()
    # K — motivated key: the off-screen inspection lamp. Dominant again.
    rect("rig_key", (-14, -18, 14), 14, 10, KEY_E, KEY5000, SOCKET)
    # A — giant ceiling card, dimmed ~1.5 stops (2.0 -> 0.7): graded floor
    rig_law._emissive_card("rig_ceiling", (0, 0, 35), 60, 60, CEILING_STR)
    # C — the streaks the metal reflects; cardA up 1/3 stop for the darker set
    rig_law._emissive_card("rig_cardA", (-16, 2, 5.5), 8, 30, 6.5,
                           target=(0, 2, 2.0), gradient=True)
    rig_law._emissive_card("rig_cardB", (15, 0, 5.0), 6, 24, 3.0,
                           target=(0, 0, 2.0), gradient=True,
                           color=(0.72, 0.78, 1.0))  # cool tint (locked)
    # F — negative-fill map; flag camR sits between cardB and the board =
    # the dark band of the three-band metal read
    rig_law._black_plane("rig_flag_camR", (11, -3, 3.0), 10, 20, (0, 0, 2.0))
    rig_law._black_plane("rig_flag_under", (0, 14, -0.8), 26, 10, (0, 0, 1.0))
    rig_law._black_plane("rig_flag_camL", (2, -16, 4.0), 12, 8, (4, -4, 2.0))
    rig_law._black_plane("rig_flag_rim", (10.5, 8, 6.5), 6, 4,
                         (8.5, -10.5, 3.6))
    # R — bay-door leak, tight strip, 2x key on edge hits only (+1 stop)
    rect("rig_rim", (10, 15, 8), 2, 22, 10800.0, COOLSTRIP, (2, 5, 2.4))  # 18000 x0.6 (locked)
    # R2 — second tight strip behind-left, catches left heatsink fin tops
    rect("rig_rim2", (-12, 14, 7), 5, 28, 1980.0, NEUT6500, (-2, 4, 2.6))  # x0.22 resized (locked)
    # X — bench probe grazer, -1 stop
    rect("rig_grazer", (-9, -13, 1.3), 2, 6, KEY_E * 0.35, KEY5000, (2, 2, 0.8))
    # G — BR2049 practical: small hidden green area, dim idle state
    gx, gy, gz = (float(v) for v in os.environ.get("GREEN_LOC", "3.5,-7.5,3.2").split(","))
    bpy.ops.object.light_add(type="AREA", location=(gx, gy, gz))
    g = bpy.context.object
    g.name = "rig_green_boost"
    g.data.shape = "DISK"
    g.data.size = float(os.environ.get("GREEN_SIZE", "0.7"))
    g.data.energy = GREEN_E
    g.data.color = GREEN
    look_at(g, (3.0, -6.0, 1.2))


def metal_fix():
    """Reflection-card discipline handles the bands (above); per-material:
    full metallic + anisotropy on the brushed parts so the streaks stretch
    along the fins instead of blobbing."""
    dm = bpy.data.materials.get("mt_darkmetal")
    if dm and dm.use_nodes:
        pb = next(n for n in dm.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        pb.inputs["Metallic"].default_value = 1.0
        an = pb.inputs.get("Anisotropic IOR Level") or pb.inputs.get(
            "Anisotropic")
        if an:
            an.default_value = 0.45
    ihs = bpy.data.materials.get("mt_ihs")
    if ihs and ihs.use_nodes:
        pb = next(n for n in ihs.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        an = pb.inputs.get("Anisotropic IOR Level") or pb.inputs.get(
            "Anisotropic")
        if an:
            an.default_value = 0.35


