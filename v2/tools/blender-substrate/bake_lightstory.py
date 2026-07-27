# The Substrate — offline light-story bakes (director addendum 2026-07-24):
#   1. LIGHTMAP: the full key/fill/rim rig (5600K key, cool #3552E8 fill,
#      ember #FF6B1A rim) baked as diffuse GI + soft shadows per bucket.
#      Realtime specular stays PMREM — this bake is diffuse only.
#   2. CURVATURE: Cycles Pointiness -> edge map (worn-edge polish shader).
#   3. "BENT NORMALS": Cycles has NO native bent-normal bake; this ships the
#      standard approximation pair instead — an object-space normal atlas
#      that the runtime combines with the AO map
#      (n_bent ~ slerp(N, up, k*(1-AO))). Flagged in the P1 report for the
#      director's ruling; drop-order permits dropping it entirely.
# All maps bake into the shared per-bucket `ao_uv` atlas (bake_ao.py must
# run first) and land in out/; run_all.sh copies runtime sidecars to
# public/assets/ (PNG this phase — no basisu/toktx binary available for
# standalone KTX2; encode slot documented in run_all.sh).
# Run: blender -b out/substrate.blend -P bake_lightstory.py
import os

import bpy


def setup_cycles_final(scene, samples):
    """Director bake-quality directive 2026-07-24: OptiX + adaptive
    sampling + tuned light paths; prints the device path used."""
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.008
    scene.cycles.max_bounces = 8
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 4
    scene.cycles.transmission_bounces = 4
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.sample_clamp_indirect = 10.0
    scene.cycles.device = "GPU"
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
    # probe-by-setting: build_options lacks the attr on 4.2.3, but the
    # official build ships OIDN and accepts the denoiser enum
    try:
        scene.cycles.denoiser = "OPENIMAGEDENOISE"
        oidn = True
    except Exception:
        oidn = False
    print("BAKEENV device=%s oidn=%s samples=%d adaptive=%.3f" % (
        device, oidn, samples, scene.cycles.adaptive_threshold))
    return oidn


def oidn_denoise_image(img, dest_path):
    """OIDN via a compositor pass (Cycles cannot denoise BAKES natively).
    Writes the denoised PNG to dest_path with a Raw view transform."""
    dsc = bpy.data.scenes.new("denoise_tmp")
    dsc.use_nodes = True
    nt = dsc.node_tree
    nt.nodes.clear()
    imn = nt.nodes.new("CompositorNodeImage")
    imn.image = img
    dn = nt.nodes.new("CompositorNodeDenoise")
    comp = nt.nodes.new("CompositorNodeComposite")
    nt.links.new(imn.outputs["Image"], dn.inputs["Image"])
    nt.links.new(dn.outputs["Image"], comp.inputs["Image"])
    cam_data = bpy.data.cameras.new("denoise_cam")
    cam = bpy.data.objects.new("denoise_cam", cam_data)
    dsc.collection.objects.link(cam)
    dsc.camera = cam
    dsc.render.resolution_x = img.size[0]
    dsc.render.resolution_y = img.size[1]
    dsc.render.resolution_percentage = 100
    dsc.render.image_settings.file_format = "PNG"
    dsc.view_settings.view_transform = "Raw"
    dsc.render.filepath = dest_path
    bpy.ops.render.render(write_still=True, scene=dsc.name)
    bpy.data.scenes.remove(dsc)
    print("denoised -> %s" % dest_path)

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "out")
SAMPLES = max(int(os.environ.get("SAMPLES", "1024")), 1024)  # HARD floor (director)
DATA_SAMPLES = max(int(os.environ.get("DATA_SAMPLES", "512")), 512)  # HARD floor
MAP_SIZE = int(os.environ.get("MAP_SIZE", "1024"))

GREEN = (0.643, 0.922, 0.325)
EMBER = (1.0, 0.42, 0.10)
COOL = (0.21, 0.32, 0.91)
KEY5600 = (1.0, 0.976, 0.945)

sc = bpy.context.scene
OIDN = setup_cycles_final(sc, SAMPLES)
sc.render.bake.margin = 8
sc.render.bake.use_selected_to_active = False
sc.render.bake.use_clear = False

# true-black world (the rig is the only light, matching the runtime scene)
w = bpy.data.worlds.new("black")
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.0
sc.world = w


def area(name, loc, color, energy, size, target):
    bpy.ops.object.light_add(type="AREA", location=loc)
    ob = bpy.context.object
    d = ob.data
    d.name = name
    d.color = color
    d.energy = energy
    d.shape = "DISK"
    d.size = size
    from mathutils import Vector
    ob.rotation_euler = (
        (Vector(target) - ob.location).to_track_quat("-Z", "Y").to_euler()
    )
    return ob


# THE RIG comes from rig_law.py (single source of truth shared with the
# QA scripts) — the baked GI must match what ships, by construction.
import sys as _sys
_sys.path.insert(0, ROOT)
import rig_law
os.environ.setdefault("CEILING_STR", "0.25")  # bake = board-wide framing (locked)
import lookdev_cinematic_rig as cine  # rig-only shim, locked values
rig_law.clear_rig()
rig_law.set_world(sc, whisper=float(os.environ.get("WHISPER", "0.003")))
cine.build_cinematic()      # DIRECTOR: the cinematic rig is the lighting law
cine.metal_fix()            # anisotropic brushed metals persist to export
rig_law.color_pass(ember_scale=1.3)  # wide framing: ember x1.3 (locked)


BUCKETS = {
    "mt_solder_traced": "solder",
    "mt_component": "component",
    "mt_darkmetal": "darkmetal",
    "mt_gold": "gold",
    "mt_granite": "granite",
}


def bucket_meshes(mat):
    return [
        o for o in bpy.data.objects
        if o.type == "MESH"
        and any(sl.material is mat for sl in o.material_slots)
        and "ao_uv" in o.data.uv_layers
    ]


def make_target_image(name):
    img = bpy.data.images.get(name)
    if img is None:
        img = bpy.data.images.new(name, width=MAP_SIZE, height=MAP_SIZE)
    img.colorspace_settings.name = "Non-Color"
    return img


def bake_into(mat, img, bake_type, meshes, **bake_kwargs):
    nt = mat.node_tree
    for n in list(nt.nodes):
        if n.type == "TEX_IMAGE" and n.name.startswith("LS_BAKE"):
            nt.nodes.remove(n)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.name = "LS_BAKE"
    tex.image = img
    uvn = nt.nodes.new("ShaderNodeUVMap")
    uvn.name = "LS_BAKE_UV"
    uvn.uv_map = "ao_uv"
    nt.links.new(uvn.outputs["UV"], tex.inputs["Vector"])
    nt.nodes.active = tex
    for o in meshes:
        for other in bpy.data.objects:
            other.select_set(False)
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        o.data.uv_layers.active = o.data.uv_layers["ao_uv"]
        bpy.ops.object.bake(type=bake_type, **bake_kwargs)
        o.select_set(False)
    for n in list(nt.nodes):
        if n.name.startswith("LS_BAKE"):
            nt.nodes.remove(n)


def save(img, filename):
    img.filepath_raw = os.path.join(OUT, filename)
    img.file_format = "PNG"
    img.save()
    print("baked %s" % filename)


# ---------------- 1. lightmap (diffuse direct+indirect, color off) --------
for mat_name, tag in BUCKETS.items():
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        continue
    meshes = bucket_meshes(mat)
    if not meshes:
        continue
    sc.cycles.samples = SAMPLES
    img = make_target_image("lightmap_%s" % tag)
    bake_into(
        mat, img, "DIFFUSE", meshes,
        pass_filter={"DIRECT", "INDIRECT"},
    )
    save(img, "lightmap_%s_raw.png" % tag)  # raw kept for artifact review
    if OIDN:
        oidn_denoise_image(img, os.path.join(OUT, "lightmap_%s.png" % tag))
    else:
        save(img, "lightmap_%s.png" % tag)

# ---------------- 2. curvature (pointiness via emission override) ---------
CURV_BUCKETS = ["mt_component", "mt_darkmetal", "mt_gold"]
curv_mat = bpy.data.materials.new("curv_bake")
curv_mat.use_nodes = True
nt = curv_mat.node_tree
nt.nodes.clear()
outn = nt.nodes.new("ShaderNodeOutputMaterial")
em = nt.nodes.new("ShaderNodeEmission")
geo = nt.nodes.new("ShaderNodeNewGeometry")
ramp = nt.nodes.new("ShaderNodeMapRange")
ramp.inputs["From Min"].default_value = 0.42
ramp.inputs["From Max"].default_value = 0.62
nt.links.new(geo.outputs["Pointiness"], ramp.inputs["Value"])
nt.links.new(ramp.outputs["Result"], em.inputs["Color"])
nt.links.new(em.outputs[0], outn.inputs["Surface"])

for mat_name in CURV_BUCKETS:
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        continue
    meshes = bucket_meshes(mat)
    if not meshes:
        continue
    tag = BUCKETS[mat_name]
    sc.cycles.samples = DATA_SAMPLES
    img = make_target_image("curvature_%s" % tag)
    # temporary material swap (EMIT bakes the override, then restore)
    originals = {}
    for o in meshes:
        originals[o.name] = [sl.material for sl in o.material_slots]
        for sl in o.material_slots:
            sl.material = curv_mat
    # bake plumbing lives on the override material for the swap window
    bake_into(curv_mat, img, "EMIT", meshes)
    for o in meshes:
        for sl, m in zip(o.material_slots, originals[o.name]):
            sl.material = m
    save(img, "curvature_%s.png" % tag)

# ---------------- 3. normal atlas (bent-normal approximation pair) --------
NORM_BUCKETS = ["mt_solder_traced", "mt_component"]
for mat_name in NORM_BUCKETS:
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        continue
    meshes = bucket_meshes(mat)
    if not meshes:
        continue
    tag = BUCKETS[mat_name]
    sc.cycles.samples = DATA_SAMPLES
    img = make_target_image("bentnorm_%s" % tag)
    bake_into(
        mat, img, "NORMAL", meshes,
        normal_space="OBJECT",
    )
    save(img, "bentnorm_%s.png" % tag)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "substrate.blend"))
print("DONE bake_lightstory")
