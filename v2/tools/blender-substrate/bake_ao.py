# The Substrate — AO bakes (SPEC §6: baked AO everywhere, no runtime SSAO).
# One Cycles AO image per material bucket, wired through the "glTF Material
# Output" group so the exporter emits occlusionTexture entries.
# Run: blender -b out/substrate.blend -P bake_ao.py
#
# Deltas vs master plan Task 5 (execution-forced, P1 report):
# a. Each bucket gets a dedicated `ao_uv` atlas layer (smart_project +
#    cross-object pack_islands): source UVs overlap across meshes in a
#    bucket, so the plan's shared-image bake over source UVs cannot store
#    per-mesh occlusion. An explicit UVMap node routes the AO texture
#    through the atlas layer at export (texCoord picked up by the exporter).
# b. Cycles bakes only the ACTIVE object — the bakes iterate every mesh in
#    the bucket with use_clear off, accumulating into the bucket image.
# c. mt_solder_traced added to the targets: bake_trace_mask.py moves the
#    PCB slab onto the traced courier clone, so the plan's mt_solder bucket
#    is empty by the time this script runs.
# d. GPU (OptiX) rendering — 26 accumulate bakes at 2048^2 are impractical
#    on CPU; the storyboard scripts prove OptiX works on this machine.
# e. AO images tagged Non-Color (they are data, not color).
import math
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
SAMPLES = int(os.environ.get("SAMPLES", "1024"))  # final floor (director override)
# 1024 default (budget: 4x 2048 ETC1S AO maps alone cost ~4MB of the 6MB
# GLB gate; AO is low-frequency)
AO_SIZE = int(os.environ.get("AO_SIZE", "1024"))

sc = bpy.context.scene
OIDN = setup_cycles_final(sc, SAMPLES)
sc.render.bake.margin = 16
sc.render.bake.use_selected_to_active = False
sc.render.bake.use_clear = False

TARGETS = {
    "mt_solder": "ao_solder.png",
    "mt_solder_traced": "ao_solder_traced.png",
    "mt_component": "ao_component.png",
    "mt_darkmetal": "ao_darkmetal.png",
    "mt_gold": "ao_gold.png",
    "mt_granite": "ao_granite.png",
    "mt_die": "ao_die.png",
}


def occlusion_group():
    """The glTF exporter reads occlusion from a group named exactly this."""
    if "glTF Material Output" in bpy.data.node_groups:
        return bpy.data.node_groups["glTF Material Output"]
    grp = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
    grp.interface.new_socket("Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    return grp


grp = occlusion_group()


def atlas_uv(meshes):
    """Give every mesh an `ao_uv` layer packed into one shared atlas."""
    for o in bpy.data.objects:
        o.select_set(False)
    for o in meshes:
        if "ao_uv" not in o.data.uv_layers:
            o.data.uv_layers.new(name="ao_uv")
        o.data.uv_layers.active = o.data.uv_layers["ao_uv"]
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.002)
    bpy.ops.uv.pack_islands(margin=0.002)
    bpy.ops.object.mode_set(mode="OBJECT")
    for o in bpy.data.objects:
        o.select_set(False)


for mat_name, filename in TARGETS.items():
    mat = bpy.data.materials.get(mat_name)
    if mat is None:
        continue
    meshes = [
        o for o in bpy.data.objects
        if o.type == "MESH"
        and any(sl.material is mat for sl in o.material_slots)
    ]
    if not meshes:
        continue
    atlas_uv(meshes)

    img_name = os.path.splitext(filename)[0]
    img = bpy.data.images.get(img_name)
    if img is None:
        img = bpy.data.images.new(img_name, width=AO_SIZE, height=AO_SIZE)
    img.colorspace_settings.name = "Non-Color"

    nt = mat.node_tree
    for n in list(nt.nodes):
        if n.type == "TEX_IMAGE" and n.image and n.image.name.startswith("ao_"):
            nt.nodes.remove(n)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    uvn = nt.nodes.new("ShaderNodeUVMap")
    uvn.uv_map = "ao_uv"
    nt.links.new(uvn.outputs["UV"], tex.inputs["Vector"])
    nt.nodes.active = tex

    # accumulate: Cycles bakes the active object only, so iterate the bucket
    for o in meshes:
        for other in bpy.data.objects:
            other.select_set(False)
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        o.data.uv_layers.active = o.data.uv_layers["ao_uv"]
        bpy.ops.object.bake(type="AO")
        o.select_set(False)

    img.filepath_raw = os.path.join(OUT, filename)
    img.file_format = "PNG"
    img.save()
    if OIDN:
        oidn_denoise_image(img, os.path.join(OUT, filename))
        img.source = "FILE"
        img.filepath = os.path.join(OUT, filename)
        img.reload()
    # wire into the occlusion group for export
    grp_node = nt.nodes.new("ShaderNodeGroup")
    grp_node.node_tree = grp
    nt.links.new(tex.outputs["Color"], grp_node.inputs["Occlusion"])
    print("baked AO: %s -> %s (%d meshes)" % (mat_name, filename, len(meshes)))

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "substrate.blend"))
print("DONE bake_ao")
