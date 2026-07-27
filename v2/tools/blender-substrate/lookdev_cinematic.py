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
CEILING_STR = 0.7
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
                           target=(0, 0, 2.0), gradient=True)
    # cardB carries the COOL band: metal on the fill side reflects a cool
    # streak vs the warm ember band — temperature variety in the metal
    m_cb = bpy.data.materials.get("mt_rig_cardB")
    if m_cb:
        em = next((n for n in m_cb.node_tree.nodes if n.type == "EMISSION"),
                  None)
        if em:
            em.inputs["Color"].default_value = (0.72, 0.78, 1.0, 1)
    # F — negative-fill map; flag camR sits between cardB and the board =
    # the dark band of the three-band metal read
    rig_law._black_plane("rig_flag_camR", (11, -3, 3.0), 10, 20, (0, 0, 2.0))
    rig_law._black_plane("rig_flag_under", (0, 14, -0.8), 26, 10, (0, 0, 1.0))
    rig_law._black_plane("rig_flag_camL", (2, -16, 4.0), 12, 8, (4, -4, 2.0))
    rig_law._black_plane("rig_flag_rim", (10.5, 8, 6.5), 6, 4,
                         (8.5, -10.5, 3.6))
    # R — bay-door leak, tight strip, 2x key on edge hits only (+1 stop)
    rect("rig_rim", (10, 15, 8), 2, 22, KEY_E * 2.0, COOLSTRIP, (2, 5, 2.4))
    # R2 — second tight strip behind-left, catches left heatsink fin tops
    rect("rig_rim2", (-12, 14, 7), 2, 18, KEY_E * 1.0, NEUT6500, (-2, 4, 2.6))
    # X — bench probe grazer, -1 stop
    rect("rig_grazer", (-9, -13, 1.3), 2, 6, KEY_E * 0.35, KEY5000, (2, 2, 0.8))
    # W — EMBER KICKER (CINEMATIC-LIGHTING §4 "one warm source in a cold
    # world"): tight strip behind the I/O cluster, edge hits only. Big-dim
    # discipline (rim2 lesson): radiance, not watts, sets the reflection.
    # ~-1.3 stops vs key over 4x16 units.
    EMBER = (1.0, 0.42, 0.10)
    rect("rig_ember", (-13, 12, 5.5), 4, 16, KEY_E * 0.4, EMBER,
         (-5.5, 6, 3.5))
    # CF — COOL FILL: the cold world the warm cuts through. Fill side
    # (camera-right), ~-2.7 stops vs key, #3552E8 desaturated 75% to white.
    CFILL = (0.72, 0.76, 0.97)
    rect("rig_cfill", (16, -4, 7), 10, 10, KEY_E * 0.25, CFILL, (0, 0, 1.6))
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


# ---------------------------------------------------------------- render cfg
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "GPU"
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "OPTIX"
except Exception:
    prefs.compute_device_type = "CUDA"
prefs.get_devices()
for d in prefs.devices:
    d.use = True
sc.cycles.use_adaptive_sampling = True
sc.cycles.max_bounces = 8
sc.cycles.diffuse_bounces = 4
sc.cycles.glossy_bounces = 4
sc.cycles.caustics_reflective = False
sc.cycles.caustics_refractive = False
sc.render.image_settings.file_format = "PNG"
sc.view_settings.view_transform = "AgX"
sc.view_settings.exposure = 1.3  # set once; tune lights, not exposure
try:
    sc.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    pass

if MODE == "final":
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.cycles.samples = 2048
    sc.cycles.use_denoising = True
    try:
        sc.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        pass
    rig_law.finals_settings(sc, iteration=False)
else:
    sc.render.resolution_x = 640
    sc.render.resolution_y = 360
    sc.cycles.samples = 96
    sc.cycles.use_denoising = False
    rig_law.finals_settings(sc, iteration=True)

rig_law.set_world(sc, whisper=0.003)
if not BEFORE:
    build_cinematic()
    metal_fix()
    haze = rig_law.add_haze(density=float(os.environ.get("HAZE_D", "0.0008")), anisotropy=float(os.environ.get("HAZE_A", "0.3")))
else:
    haze = None

CAM_LOC = (8.5, -10.5, 3.6)
CAM_TGT = (sx - 3.4, sy + 1.0, 0.9)
TAG = "before" if BEFORE else "after"


def shoot(name, loc=CAM_LOC, tgt=CAM_TGT, lens=90, fstop=5.6, dof=True):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    look_at(cam, tgt)
    cam.data.lens = lens
    if dof:
        cam.data.dof.use_dof = True
        cam.data.dof.aperture_fstop = fstop
        cam.data.dof.focus_distance = (Vector(tgt) - Vector(loc)).length
    sc.camera = cam
    sc.render.filepath = os.path.join(QA, name)
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    print("LOOKDEV rendered %s" % name)


# --- wide-shot-specific corrections (QA: hero was over-lit vs the macro) ---
# Per-shot overrides ONLY for the hero framing; macro/crop keep the rig as
# balanced. Levers: camera-specific exposure, per-shot ceiling-card strength
# (the broad card flooding the silver M.2 cover), per-shot haze density (the
# veil that grayed the void at wide framing).
HERO_EXP = float(os.environ.get("HERO_EXP", "0.25"))
HERO_CEIL = float(os.environ.get("HERO_CEIL", "0.25"))
HERO_HAZE = float(os.environ.get("HERO_HAZE", "0.0004"))
HERO_CUTTER = os.environ.get("HERO_CUTTER", "0") == "1"


def _hero_rimcut():
    """Horizontal flag at z=4.4, y -2..2: sits exactly on the rim->cover
    specular path (rims at y 14/15, z 7/8 reflect off the cover top into
    the grazing camera). Kills the cover hotspot; fin-top edge hits at
    y>2 stay lit. Hero shot only."""
    rig_law._black_plane("rig_flag_rimcut", (0, 0, 4.4), 16, 4, (0, 0, 10))
    return bpy.data.objects.get("rig_flag_rimcut")


def _hero_cutter():
    """Cutter between the key (-14,-18,14) and the foreground cover
    (~-1,-7,2): kills the key-side hotspot on the silver cover / left
    cluster without dimming the socket/mid-board. Hero shot only."""
    rig_law._black_plane("rig_flag_cutter", (-6.8, -11.4, 7.8), 4, 3,
                         (-14, -18, 14))
    return bpy.data.objects.get("rig_flag_cutter")


def _set_ceiling(strength):
    m = bpy.data.materials.get("mt_rig_ceiling")
    if not m:
        return None
    em = next((n for n in m.node_tree.nodes if n.type == "EMISSION"), None)
    if not em:
        return None
    old = em.inputs["Strength"].default_value
    em.inputs["Strength"].default_value = strength
    return old


def _set_haze_density(density):
    m = bpy.data.materials.get("mt_rig_haze")
    if not m:
        return None
    mult = next((n for n in m.node_tree.nodes
                 if n.type == "MATH" and n.operation == "MULTIPLY"), None)
    if not mult:
        return None
    old = mult.inputs[1].default_value
    mult.inputs[1].default_value = density
    return old


shots = [SHOT] if SHOT != "all" else ["hero", "macro", "topdown", "crop"]
for s in shots:
    if s in ("hero", "edgecrop"):
        old_exp = sc.view_settings.exposure
        old_ceil = _set_ceiling(HERO_CEIL)
        old_haze = _set_haze_density(HERO_HAZE)
        sc.view_settings.exposure = HERO_EXP
        cutter = _hero_cutter() if HERO_CUTTER and not BEFORE else None
        rimcut = _hero_rimcut() if os.environ.get(
            "HERO_RIMCUT", "0") == "1" and not BEFORE else None
        rim_f = float(os.environ.get("HERO_RIM_F", "0.6"))
        key_f = float(os.environ.get("HERO_KEY_F", "1"))
        card_f = float(os.environ.get("HERO_CARD_F", "1"))
        graz_f = float(os.environ.get("HERO_GRAZER_F", "1"))
        card_old = {}
        for mn in ("mt_rig_cardA", "mt_rig_cardB"):
            m = bpy.data.materials.get(mn)
            if m and card_f != 1:
                mult = next((n for n in m.node_tree.nodes
                             if n.type == "MATH" and n.operation == "MULTIPLY"), None)
                if mult:
                    card_old[mn] = mult.inputs[1].default_value
                    mult.inputs[1].default_value = card_old[mn] * card_f
        r2 = bpy.data.objects.get("rig_rim2")
        r2_old = None
        r2sx = float(os.environ.get("HERO_RIM2_SX", "5"))
        r2sy = float(os.environ.get("HERO_RIM2_SY", "28"))
        if r2:
            r2_old = (r2.data.size, r2.data.size_y)
            if r2sx > 0:
                r2.data.size = r2sx
            r2.data.size_y = r2sy
        graz_ob = bpy.data.objects.get("rig_grazer")
        graz_old = None
        if graz_ob and graz_f != 1:
            graz_old = graz_ob.data.energy
            graz_ob.data.energy *= graz_f
        key_ob = bpy.data.objects.get("rig_key")
        key_old = None
        if key_ob and key_f != 1:
            key_old = key_ob.data.energy
            key_ob.data.energy *= key_f
        rim_old = {}
        for n in ("rig_rim", "rig_rim2", "rig_ember", "rig_cfill"):
            ob = bpy.data.objects.get(n)
            f = rim_f
            if n == "rig_rim2":
                f = float(os.environ.get("HERO_RIM2_F", "0.22"))
            elif n == "rig_ember":
                f = float(os.environ.get("HERO_EMBER_F", "1.3"))
            elif n == "rig_cfill":
                f = float(os.environ.get("HERO_CFILL_F", "1"))
            if ob and f != 1:
                rim_old[n] = ob.data.energy
                ob.data.energy *= f
        hidden = []
        for n in os.environ.get("HERO_HIDE", "").split(","):
            ob = bpy.data.objects.get(n.strip())
            if ob and not ob.hide_render:
                ob.hide_render = True
                hidden.append(ob)
        if s == "hero":
            shoot("hero-%s.png" % TAG)
        else:
            # native-res heatsink-edge crop for the warm/cool split QA,
            # rendered under the SAME hero overrides
            sc.render.use_border = True
            sc.render.use_crop_to_border = True
            sc.render.border_min_x = 0.52
            sc.render.border_max_x = 0.88
            sc.render.border_min_y = 0.55
            sc.render.border_max_y = 0.92
            shoot("edge-split-crop-%s.png" % TAG)
            sc.render.use_border = False
            sc.render.use_crop_to_border = False
        for ob in hidden:
            ob.hide_render = False
        for n, e in rim_old.items():
            bpy.data.objects[n].data.energy = e
        if key_old is not None:
            key_ob.data.energy = key_old
        for mn, v in card_old.items():
            m = bpy.data.materials.get(mn)
            mult = next((n for n in m.node_tree.nodes
                         if n.type == "MATH" and n.operation == "MULTIPLY"), None)
            mult.inputs[1].default_value = v
        if graz_old is not None:
            graz_ob.data.energy = graz_old
        if r2_old is not None:
            r2.data.size, r2.data.size_y = r2_old
        if cutter:
            bpy.data.objects.remove(cutter, do_unlink=True)
        if rimcut:
            bpy.data.objects.remove(rimcut, do_unlink=True)
        sc.view_settings.exposure = old_exp
        if old_ceil is not None:
            _set_ceiling(old_ceil)
        if old_haze is not None:
            _set_haze_density(old_haze)
    elif s == "macro":
        shoot("macro-100mm-%s.png" % TAG, lens=100, fstop=2.8)
    elif s == "topdown":
        # act-4 top-down is above the weather (STORY): no haze
        if haze:
            haze.hide_render = True
        shoot("topdown-%s.png" % TAG, loc=(0, 0, 26.0), tgt=(0, 0, 0.55),
              lens=50, dof=False)
        if haze:
            haze.hide_render = False
    elif s == "crop":
        # full-res metal-behavior crop: heatsink skyline region, rendered
        # at final res with a border so pixels are 1:1
        sc.render.use_border = True
        sc.render.use_crop_to_border = True
        sc.render.border_min_x = 0.30
        sc.render.border_max_x = 0.75
        sc.render.border_min_y = 0.45
        sc.render.border_max_y = 0.85
        shoot("metal-crop-%s.png" % TAG)
        sc.render.use_border = False
        sc.render.use_crop_to_border = False

if SAVE and not BEFORE:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,
                                                      "substrate_cinematic.blend"))
    print("LOOKDEV saved out/substrate_cinematic.blend")
print("DONE lookdev")
