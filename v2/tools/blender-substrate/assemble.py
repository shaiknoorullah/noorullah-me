# The Substrate — assembly: import the CC-BY hero board + die, normalize
# orientation/scale/placement, de-brand, rebuild materials per SPEC §3/§6,
# author the plinth/floor/IHS dressing, rename meshes to the runtime
# contract, write out/anchors.json (glTF Y-up space) and out/substrate.blend.
# Run: blender -b --factory-startup -P assemble.py
#
# HERO=strix (default; director change 2026-07-24) | HERO=cardona (fallback).
#
# Strix hero: 'Asus Strix b-550-f Gaming Motherboard Realistic' by
# MUSHROOM_BUILDS, CC-BY 4.0, uid 3eba5f45bed74fbeb2647de38047000f.
# De-branding is a HARD GATE (director): brand meshes deleted, branded
# covers re-materialed dark, brand marks patched out of the board albedo,
# all RGB emissives killed. Probe evidence 2026-07-24: imports components-UP
# (no -90X; the Cardona board needs it, this one does not), slab = material
# 'Board' bbox (-9.677,-2.517,11.797)..(11.922,24.425,12.545), AM4 socket
# center measured from top-down render at (2.96, 16.28) -> SOCKET_UV
# (0.585, 0.698). 813k source tris decimated to a ~330-380k board budget
# (director: 300-400k max, keep relief silhouettes).
import json
import math
import os

import bpy
import numpy as np
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(ROOT, "..", "storyboards", "the-substrate", "assets")
OUT = os.path.join(ROOT, "out")
os.makedirs(OUT, exist_ok=True)

HERO = os.environ.get("HERO", "strix")
GREEN = (0.643, 0.922, 0.325)      # #A4EB53
BOARD_SIZE = 12.0                  # world units, max footprint
BOARD_Z = 0.55                     # backplate hover height (Blender z)
DIE_SIZE = 3.2
DIE_Z = -40.0                      # nested scale, below the socket

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene


def import_gltf(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]


def parent_root(name, objs):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    for o in objs:
        if o.parent is None and o != root:
            mw = o.matrix_world.copy()
            o.parent = root
            o.matrix_world = mw
    return root


def world_bbox(objs):
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        if o.type != "MESH":
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            mins = Vector(map(min, mins, w))
            maxs = Vector(map(max, maxs, w))
    return mins, maxs


def new_principled(name, color, rough, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    pb = m.node_tree.nodes["Principled BSDF"]
    pb.inputs["Base Color"].default_value = (*color, 1)
    pb.inputs["Roughness"].default_value = rough
    pb.inputs["Metallic"].default_value = metal
    return m


def mat_name_of(o):
    for slot in o.material_slots:
        if slot.material:
            return slot.material.name
    return ""


def delete_objs(objs):
    for o in objs:
        bpy.data.objects.remove(o, do_unlink=True)


def join_group(group, joined_name):
    if len(group) < 2:
        if group:
            group[0].name = joined_name
        return group[0] if group else None
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in group:
        o.select_set(True)
    bpy.context.view_layer.objects.active = group[0]
    bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = joined_name
    joined.data.name = joined_name
    joined.select_set(False)
    return joined


# ======================= STRIX HERO PATH =======================
# material -> action tables (probe + top-down render, 2026-07-24)
STRIX_DELETE = {
    # brand / RGB decoration (hard gate)
    "ROG_GLow", "StrixText", "IO_Sticker", "RedImage", "GLow",
    "FoggyGlassgreen", "FoggyGlassOrange", "pink1", "yell1", "blue1", "gren1",
}
STRIX_GOLD = {"GoldWifi", "USB_Contacts"}
# branded / silver covers -> dark brushed metal (near-black discipline;
# their source textures carry ROG art and silver tones)
STRIX_DARK_METAL = {
    "VRM_Heatsinktop", "VRM_Side", "IO_Heatsink_botton", "io_gloss",
    "RouohghPlast", "Chiipset", "chipset_shiney", "chipset_glow", "ROG_Cmos",
    "IO_Metal.001", "shiney_metal", "Screw", "Scratchefdmeta",
}
# decimation ratios per material (target ~330-380k board tris; silhouettes
# with real relief kept near 1.0)
STRIX_DECIMATE = {
    # tuned 2026-07-24 against the 6MB GLB gate (12.8MB first pack):
    # vertex buffer was 5.8MB — ratios pushed until ~260k total tris
    "Sauder": 0.20,
    "RouohghPlast": 0.28,
    "Ethernet_PLastic.001": 0.10,
    "RoughGreyPlastic": 0.4,
    "Chiipset": 0.4,
    "Material.010": 0.4,
    "material_0": 0.40,
    "VRM_Side": 0.5,
    "IO_Metal.001": 0.5,
    "Material.004": 0.5,
}
DIE_DECIMATE = 0.45  # 98k -> ~49k; act-5 macro survives at this density
STRIX_SOCKET_UV = (0.585, 0.698)
# districts authored from the top-down render (Blender coords, pre-normalize)
STRIX_DISTRICTS = {
    "socket": ((2.96, 16.28), (2.5, 2.5)),
    "vrm": ((0.5, 22.8), (5.5, 2.2)),
    "dimm": ((8.4, 16.4), (1.6, 6.8)),
    "chipset": ((6.45, 5.39), (3.9, 3.8)),
    "m2": ((1.5, 10.5), (4.5, 1.6)),
    "io": ((-9.6, 18.0), (1.4, 6.5)),
    "pcie": ((-1.5, 5.0), (6.5, 4.0)),
}


def strix_debrand_albedo(img):
    """Downscale the 8K board albedo to 2K, then patch brand marks, then
    pack. ORDER MATTERS (execution-caught twice): Image.scale() reloads
    file-backed images from their SOURCE, discarding pixel edits — so
    scale first, edit the 2K buffer, pack the result; and without pack()
    the exporter ships the untouched source file.

    1. Hue kill: saturated red/pink/magenta (ROG eye, STRIX prints, RGB
       stripes) -> luminance-matched dark gray.
    2. Rect fills (2K px, top-origin, ground-truthed on
       out/debrand_preview.png): shroud eye block, mirrored 'STRIX B550-F
       GAMING' silkscreen, 'REPUBLIC OF GAMERS' print -> dark PCB tone.
    """
    img.scale(2048, 1024)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    rgba = px.reshape(h, w, 4)
    r, g, b = rgba[..., 0], rgba[..., 1], rgba[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = np.where(mx > 1e-5, (mx - mn) / np.maximum(mx, 1e-5), 0)
    reddish = (r > g * 1.35) & (r > b * 1.1) & (sat > 0.3) & (mx > 0.08)
    magenta = (r > g * 1.2) & (b > g * 1.2) & (sat > 0.3) & (mx > 0.08)
    kill = reddish | magenta
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    dark = np.clip(lum * 0.22, 0.008, 0.05)
    for ch in range(3):
        rgba[..., ch] = np.where(kill, dark, rgba[..., ch])

    # soft texture-matched patches (director gate 2026-07-24: no flat boxes
    # that read as redactions at grazing angles). Per region: clamp bright
    # print pixels to the regional P40 tone, box-blur to smear glyph edges,
    # feather the border back into the original.
    def soft_patch(x0, x1, y0_top, y1_top, strength=1.0):
        y0, y1 = h - y1_top, h - y0_top
        reg = rgba[y0:y1, x0:x1, :3].copy()
        rl = 0.3 * reg[..., 0] + 0.59 * reg[..., 1] + 0.11 * reg[..., 2]
        p40 = float(np.percentile(rl, 40))
        bright = rl > max(p40 * 1.25, p40 + 0.02)
        scale = np.where(bright, np.minimum(1.0, p40 / np.maximum(rl, 1e-5)), 1.0)
        reg *= scale[..., None]
        k = 10
        for _ in range(2):
            cs = np.cumsum(np.pad(reg, ((0, 0), (k, k), (0, 0)), mode="edge"), axis=1)
            reg = (cs[:, 2 * k:, :] - cs[:, : -2 * k, :]) / (2 * k)
            cs = np.cumsum(np.pad(reg, ((k, k), (0, 0), (0, 0)), mode="edge"), axis=0)
            reg = (cs[2 * k:, :, :] - cs[: -2 * k, :, :]) / (2 * k)
        out = rgba[y0:y1, x0:x1, :3] * (1 - strength) + reg * strength
        f = 8
        hgt, wid = y1 - y0, x1 - x0
        yy = np.minimum(np.arange(hgt), np.arange(hgt)[::-1])[:, None]
        xx = np.minimum(np.arange(wid), np.arange(wid)[::-1])[None, :]
        w_edge = np.clip(np.minimum(yy, xx) / f, 0, 1)[..., None]
        rgba[y0:y1, x0:x1, :3] = (
            rgba[y0:y1, x0:x1, :3] * (1 - w_edge) + out * w_edge
        )

    soft_patch(380, 650, 470, 1010)    # shroud eye + ROGCOMWAY + THE block
    soft_patch(680, 970, 205, 245)     # 'STRIX B550-F GAMING' silkscreen (re-measured 2026-07-24: text at y 215-235)
    soft_patch(605, 730, 328, 352)     # 'REPUBLIC OF GAMERS' print (upper)
    soft_patch(770, 1040, 470, 605)    # REPUBLIC/GAME ON print block
    soft_patch(990, 1052, 212, 268)    # pictured ROG-eye CMOS battery sticker
    soft_patch(620, 760, 790, 895)     # pictured M.2-cover STRIX fragment
    # director gate: pictured M.2/chipset heatsink block — ROG eye, ghost
    # lettering, Q-RELEASE print (given region (1250,150)-(1650,450) is
    # inside this), plus the lower pictured cover with the hero-frame
    # STRIX edge print
    soft_patch(1080, 1660, 90, 460)
    soft_patch(1020, 1450, 640, 1015)
    print("DEBRAND albedo: %.2f%% pixels hue-killed" % (100 * kill.mean()))
    img.pixels.foreach_set(rgba.reshape(-1))
    img.pack()
    img.name = "board_albedo_debranded"
    # ground-truth preview for the de-brand review loop (fresh image — a
    # copy() of a file-backed image can revert to its source on save)
    prev = bpy.data.images.new("debrand_preview", width=w, height=h)
    prev.pixels.foreach_set(rgba.reshape(-1))
    prev.filepath_raw = os.path.join(OUT, "debrand_preview.png")
    prev.file_format = "PNG"
    prev.save()


def build_strix_board():
    objs = import_gltf(os.path.join(ASSETS, "strix-b550f", "scene.gltf"))
    root = parent_root("boardroot", objs)
    # imports components-UP already (probe): no rotation
    bpy.context.view_layer.update()

    meshes = [o for o in objs if o.type == "MESH"]

    # slab first (normalization + junk-cull reference)
    slab = [o for o in meshes if mat_name_of(o) == "Board"]
    assert len(slab) == 1, "expected exactly one Board slab mesh"
    smin, smax = world_bbox(slab)

    # junk-kill: brand meshes + strays far outside the slab footprint
    kill = [o for o in meshes if mat_name_of(o) in STRIX_DELETE]
    margin = 2.0
    for o in meshes:
        if o in kill or o in slab:
            continue
        omin, omax = world_bbox([o])
        cx, cy = (omin.x + omax.x) / 2, (omin.y + omax.y) / 2
        if (
            cx < smin.x - margin or cx > smax.x + margin
            or cy < smin.y - margin or cy > smax.y + margin
        ):
            kill.append(o)
    killed_names = sorted({mat_name_of(o) for o in kill})
    delete_objs(kill)
    meshes = [o for o in meshes if o not in kill]
    print("DEBRAND meshes removed: %d (%s)" % (len(kill), ", ".join(killed_names)))

    # blanking plate: deleting the ROG glow plate exposes an eye-shaped
    # pocket modeled into the shroud top — cover it with a flat dark cap
    # (reads as a deliberate blank panel). Pre-normalize coords from the
    # ROG_GLow probe (ctr -7.39, 19.43, top z ~16.75).
    bpy.ops.mesh.primitive_cube_add(location=(-7.39, 19.43, 16.73))
    plate = bpy.context.object
    plate.name = "board_blankplate"
    plate.scale = (1.9, 1.82, 0.03)
    bpy.ops.object.transform_apply(scale=True)
    plate.parent = root
    plate.select_set(False)
    meshes.append(plate)

    # decimate BEFORE joining (per-material ratios)
    for o in meshes:
        ratio = STRIX_DECIMATE.get(mat_name_of(o))
        if ratio:
            mod = o.modifiers.new("decimate", "DECIMATE")
            mod.ratio = ratio
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in meshes:
        if o.modifiers:
            o.select_set(True)
    if bpy.context.selected_objects:
        bpy.context.view_layer.objects.active = bpy.context.selected_objects[0]
        bpy.ops.object.convert(target="MESH")  # applies modifiers in bulk
    for o in bpy.data.objects:
        o.select_set(False)

    # normalize: slab long edge -> BOARD_SIZE, centered, backplate at BOARD_Z
    s = BOARD_SIZE / max(smax.x - smin.x, smax.y - smin.y)
    c = Vector(((smin.x + smax.x) / 2, (smin.y + smax.y) / 2, smin.z))
    root.scale = (s, s, s)
    root.location = (-s * c.x, -s * c.y, BOARD_Z - s * c.z)
    bpy.context.view_layer.update()

    # districts (authored constants -> normalized space, glTF axes)
    districts = []
    for name, ((dx, dy), (ex, ey)) in STRIX_DISTRICTS.items():
        wx, wy = s * dx + root.location.x, s * dy + root.location.y
        districts.append(
            {
                "id": name,
                "center": [round(wx, 4), round(BOARD_Z + 1.0, 4), round(-wy, 4)],
                "extent": [round(s * ex, 4), round(s * ey, 4)],
            }
        )

    # de-brand the board albedo (hard gate) + downscale big maps to <=2K
    strix_debrand_albedo(bpy.data.images["Board_baseColor.png"])
    for img_name, tw, th in [
        ("Board_metallicRoughness.png", 1024, 512),
        ("Board_normal.png", 1024, 512),
    ]:
        im = bpy.data.images.get(img_name)
        if im and im.size[0] > tw:
            im.scale(tw, th)
            im.pack()  # see debrand note: unpacked images export their source file

    # material consolidation (rename Board -> mt_solder AFTER the bucket
    # loop below — the loop keys on the source name "Board")
    mt_comp = new_principled("mt_component", (0.05, 0.05, 0.055), 0.55, metal=0.2)
    mt_metal = new_principled("mt_darkmetal", (0.06, 0.06, 0.068), 0.5, metal=0.85)
    mt_gold = new_principled("mt_gold", (0.55, 0.42, 0.16), 0.3, metal=1.0)

    comp_group, metal_group, gold_group = [], [], []
    for o in meshes:
        src = mat_name_of(o)
        if src == "Board":
            o.name = "board_solder_pcb"
            continue
        if src in STRIX_GOLD or "gold" in src.lower() or "contact" in src.lower():
            bucket, group = mt_gold, gold_group
        elif src in STRIX_DARK_METAL:
            bucket, group = mt_metal, metal_group
        else:
            bucket, group = mt_comp, comp_group
        o.data.materials.clear()
        o.data.materials.append(bucket)
        group.append(o)
    join_group(comp_group, "board_comp_joined")
    join_group(metal_group, "board_metal_joined")
    join_group(gold_group, "board_gold_joined")
    mt_solder = bpy.data.materials["Board"]
    mt_solder.name = "mt_solder"
    pb = mt_solder.node_tree.nodes.get("Principled BSDF")
    if pb:
        pb.inputs["Roughness"].default_value = 0.5
        if pb.inputs.get("Emission Strength"):
            pb.inputs["Emission Strength"].default_value = 0.0
    bpy.context.view_layer.update()

    board_meshes = [
        o
        for o in bpy.data.objects
        if o.type == "MESH" and o.name.startswith(("board_", "board"))
        and o.name != "boardroot"
    ]
    return board_meshes, STRIX_SOCKET_UV


# ======================= CARDONA FALLBACK PATH =======================
def strip_emission_and_crush(objs):
    mats = set()
    for o in objs:
        if o.type != "MESH":
            continue
        for slot in o.material_slots:
            if slot.material:
                mats.add(slot.material)
    for m in mats:
        if not m.use_nodes:
            continue
        for n in m.node_tree.nodes:
            if n.type == "BSDF_PRINCIPLED":
                if n.inputs.get("Emission Strength"):
                    n.inputs["Emission Strength"].default_value = 0.0
                hs = m.node_tree.nodes.new("ShaderNodeHueSaturation")
                hs.inputs["Saturation"].default_value = 0.15
                hs.inputs["Value"].default_value = 0.8
                bc = n.inputs["Base Color"]
                if bc.is_linked:
                    src = bc.links[0].from_socket
                    m.node_tree.links.remove(bc.links[0])
                    m.node_tree.links.new(src, hs.inputs["Color"])
                    m.node_tree.links.new(hs.outputs["Color"], bc)
                else:
                    col = bc.default_value
                    lum = 0.3 * col[0] + 0.59 * col[1] + 0.11 * col[2]
                    bc.default_value = (lum * 0.9, lum * 0.9, lum * 0.95, 1)
    return mats


CARDONA_DISTRICT_MATS = {
    "socket": ["CPU_BaseM", "CPULidM", "CPULatch", "CPUBracketM", "CPULatchMountM"],
    "vrm": ["Cubes1M", "BoardPlate1m", "BoardPlate2m"],
    "dimm": ["Ram2M", "Ram3M", "Ram4M"],
    "chipset": ["BoardChipsetM", "BoardM2Cover1M"],
    "m2": ["M2_BaseM", "M2_Chip1m", "M2_Chip2m", "M2_StickerM", "BoardM2CoverM"],
    "io": [
        "I_O_Cover", "USBMetalM", "USB1M", "USB2M", "USB3M", "VideoPortBlackM",
        "Audio1m", "Audio2m", "Audio3m", "Audio4m", "Audio5m", "AntennaM",
    ],
}


def build_cardona_board():
    objs = import_gltf(os.path.join(ASSETS, "motherboard-components", "scene.gltf"))
    root = parent_root("boardroot", objs)
    root.rotation_euler = (math.radians(-90), 0, 0)  # components UP
    bpy.context.view_layer.update()

    mins, maxs = world_bbox(objs)
    size = maxs - mins
    s = BOARD_SIZE / max(size.x, size.y)
    c = Vector(((mins.x + maxs.x) / 2, (mins.y + maxs.y) / 2, mins.z))
    root.scale = (s, s, s)
    root.location = (-s * c.x, -s * c.y, BOARD_Z - s * c.z)
    bpy.context.view_layer.update()

    meshes = [o for o in objs if o.type == "MESH"]
    strip_emission_and_crush(meshes)

    by_mat = {}
    for o in meshes:
        by_mat.setdefault(mat_name_of(o), []).append(o)
    districts = []
    for dist_name, mat_names in CARDONA_DISTRICT_MATS.items():
        group = [o for mn in mat_names for o in by_mat.get(mn, [])]
        if not group:
            continue
        dmn, dmx = world_bbox(group)
        districts.append(
            {
                "id": dist_name,
                "center": [
                    round((dmn.x + dmx.x) / 2, 4),
                    round(dmx.z, 4),
                    round(-(dmn.y + dmx.y) / 2, 4),
                ],
                "extent": [round(dmx.x - dmn.x, 4), round(dmx.y - dmn.y, 4)],
            }
        )
    globals()["_districts"] = districts

    faces_per_mat = {}
    for o in meshes:
        for slot in o.material_slots:
            if slot.material:
                faces_per_mat.setdefault(slot.material, 0)
                faces_per_mat[slot.material] += len(o.data.polygons)
    solder_src = next(
        (m for m in faces_per_mat if m.name == "BaseBoardM"),
        max(faces_per_mat, key=faces_per_mat.get),
    )
    mt_solder = new_principled("mt_solder", (0.03, 0.03, 0.035), 0.5)
    mt_comp = new_principled("mt_component", (0.05, 0.05, 0.055), 0.4, metal=0.6)
    mt_gold = new_principled("mt_gold", (0.55, 0.42, 0.16), 0.3, metal=1.0)
    comp_group, gold_group = [], []
    for o in meshes:
        src = o.material_slots[0].material if o.material_slots else None
        name = (src.name if src else "").lower()
        if "gold" in name or "pin" in name or "contact" in name:
            bucket, prefix = mt_gold, "board_gold_"
            gold_group.append(o)
        elif src is solder_src:
            bucket, prefix = mt_solder, "board_solder_"
        else:
            bucket, prefix = mt_comp, "board_comp_"
            comp_group.append(o)
        o.data.materials.clear()
        o.data.materials.append(bucket)
        o.name = prefix + o.name.split(".")[0].replace(" ", "_")[:48]
    join_group(comp_group, "board_comp_joined")
    join_group(gold_group, "board_gold_joined")
    bpy.context.view_layer.update()
    board_meshes = [
        o for o in bpy.data.objects
        if o.type == "MESH" and o.name.startswith("board_")
    ]
    return board_meshes, (0.548, 0.707)


# ======================= build =======================
_districts = []
if HERO == "strix":
    board_meshes, socket_uv = build_strix_board()
else:
    board_meshes, socket_uv = build_cardona_board()
districts = _districts

if HERO == "strix":
    districts = []
    smin_n, smax_n = world_bbox(
        [o for o in board_meshes if o.name == "board_solder_pcb"]
    )
    s_n = (smax_n.x - smin_n.x) / (11.922 - (-9.677))
    for name, ((dx, dy), (ex, ey)) in STRIX_DISTRICTS.items():
        # authored coords are pre-normalize; map through the same transform
        u = ((dx - (-9.677)) / (11.922 - (-9.677)))
        v = ((dy - (-2.517)) / (24.425 - (-2.517)))
        wx = smin_n.x + u * (smax_n.x - smin_n.x)
        wy = smin_n.y + v * (smax_n.y - smin_n.y)
        districts.append(
            {
                "id": name,
                "center": [round(wx, 4), round(smax_n.z + 0.3, 4), round(-wy, 4)],
                "extent": [round(s_n * ex, 4), round(s_n * ey, 4)],
            }
        )

bpy.context.view_layer.update()
mins, maxs = world_bbox(board_meshes)

# socket anchor (Blender space), snapped to the component surface
sx = mins.x + socket_uv[0] * (maxs.x - mins.x)
sy = mins.y + socket_uv[1] * (maxs.y - mins.y)
dg = bpy.context.evaluated_depsgraph_get()
hit, loc, *_ = sc.ray_cast(dg, Vector((sx, sy, 8.0)), Vector((0, 0, -1)))
socket_z = loc.z if hit else maxs.z
anchor = bpy.data.objects.new("socket_anchor", None)
bpy.context.collection.objects.link(anchor)
anchor.location = (sx, sy, socket_z)

# ---------------- die (Act 5 nested scale) ----------------
die_objs = import_gltf(os.path.join(ASSETS, "microchip-prototype", "scene.gltf"))
junk = [o for o in die_objs if o.type == "MESH" and "ground" in o.name.lower()]
die_objs = [o for o in die_objs if o not in junk]
delete_objs(junk)
die_root = parent_root("dieroot", die_objs)
# probe: the die asset imports component-up already — no rotation
bpy.context.view_layer.update()
dmins, dmaxs = world_bbox(die_objs)
dsize = dmaxs - dmins
ds = DIE_SIZE / max(dsize.x, dsize.y)
dc = Vector(((dmins.x + dmaxs.x) / 2, (dmins.y + dmaxs.y) / 2, dmins.z))
die_root.scale = (ds, ds, ds)
die_root.location = (sx - ds * dc.x, sy - ds * dc.y, DIE_Z - ds * dc.z)
bpy.context.view_layer.update()

die_meshes = [o for o in die_objs if o.type == "MESH"]
for o in die_meshes:
    mod = o.modifiers.new("decimate", "DECIMATE")
    mod.ratio = DIE_DECIMATE
for o in bpy.context.selected_objects:
    o.select_set(False)
for o in die_meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = die_meshes[0]
bpy.ops.object.convert(target="MESH")
for o in bpy.data.objects:
    o.select_set(False)


def prep_die_image(name, transform, size=1024):
    """Downscale + numpy-transform a die source map, packed for export."""
    img = bpy.data.images.get(name)
    if img is None:
        return None
    if img.size[0] > size:
        img.scale(size, max(1, int(size * img.size[1] / img.size[0])))
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    rgba = px.reshape(-1, 4)
    transform(rgba)
    img.pixels.foreach_set(rgba.reshape(-1))
    img.pack()
    return img


DIE_BRAND_RECTS_1024 = [
    # top-origin px in the 1024 die albedo: the gray lid panels whose
    # prints ("10" box, VOTO/THROTTLE/400cc) ghost through under rim light
    (390, 592, 0, 100),
    (500, 566, 14, 80),
]


def darken(rgba):
    """SPEC §3 albedo darken + director gate 2026-07-24: neutralize the
    bright package-lid panels and their prints (VOTO/THROTTLE/10/RTANT
    read as a branded heatspreader under rim light) — bare silicon only.
    Bright pixels clamp to silicon-dark preserving hue, which drops every
    print below legibility contrast."""
    rgba[:, :3] *= 0.5
    lum = 0.3 * rgba[:, 0] + 0.59 * rgba[:, 1] + 0.11 * rgba[:, 2]
    cap = 0.13
    scale = np.where(lum > cap, cap / np.maximum(lum, 1e-5), 1.0)
    rgba[:, :3] *= scale[:, None]
    # flatten the print panels entirely — residual dark-on-dark contrast
    # still ghosted the "10" logo under rim light (director 2026-07-27)
    side = int(np.sqrt(rgba.shape[0]))
    if side * side == rgba.shape[0]:
        img2 = rgba[:, :3].reshape(side, side, 3)
        for x0, x1, y0t, y1t in DIE_BRAND_RECTS_1024:
            sx0, sx1 = int(x0 * side / 1024), int(x1 * side / 1024)
            sy0, sy1 = side - int(y1t * side / 1024), side - int(y0t * side / 1024)
            reg = img2[sy0:sy1, sx0:sx1]
            reg[:] = np.clip(np.median(reg, axis=(0, 1)), 0.01, 0.08)


def greenify(rgba):
    # emissive map -> luminance x #A4EB53 (SPEC §3: forced green)
    lum = 0.3 * rgba[:, 0] + 0.59 * rgba[:, 1] + 0.11 * rgba[:, 2]
    rgba[:, 0] = lum * GREEN[0]
    rgba[:, 1] = lum * GREEN[1]
    rgba[:, 2] = lum * GREEN[2]


# QA-caught (03-die-macro): the master plan's flat mt_die renders the die
# as a structureless slab — act 5 needs the logic-block city. Rebuild from
# the source maps: darkened albedo + green-forced emissive at <=0.04.
die_base = prep_die_image("material_baseColor.jpeg", darken)
die_emit = prep_die_image("material_emissive.jpeg", greenify)
mt_die = new_principled("mt_die", (0.04, 0.04, 0.06), 0.35, metal=0.3)
pb_die = mt_die.node_tree.nodes["Principled BSDF"]
nt_die = mt_die.node_tree
if die_base:
    tb = nt_die.nodes.new("ShaderNodeTexImage")
    tb.image = die_base
    nt_die.links.new(tb.outputs["Color"], pb_die.inputs["Base Color"])
if die_emit:
    te = nt_die.nodes.new("ShaderNodeTexImage")
    te.image = die_emit
    nt_die.links.new(te.outputs["Color"], pb_die.inputs["Emission Color"])
else:
    pb_die.inputs["Emission Color"].default_value = (*GREEN, 1)
pb_die.inputs["Emission Strength"].default_value = 0.04
for i, o in enumerate(die_meshes):
    o.data.materials.clear()
    o.data.materials.append(mt_die)
    o.name = "dieblock_%02d" % i

anchor_die = bpy.data.objects.new("socket_anchor_die", None)
bpy.context.collection.objects.link(anchor_die)
anchor_die.location = (sx, sy, DIE_Z + dsize.z * ds)

# ---------------- IHS (the lid that lifts) ----------------
ihs_mat = new_principled("mt_ihs", (0.35, 0.36, 0.4), 0.24, metal=1.0)
bpy.ops.mesh.primitive_cube_add(location=(sx, sy, DIE_Z + dsize.z * ds + 1.6))
ihs = bpy.context.object
ihs.name = "ihs"
ihs.scale = (1.3, 1.3, 0.12)
bpy.ops.object.transform_apply(scale=True)
bev = ihs.modifiers.new("edge_bevel", "BEVEL")
bev.width = 0.06
bev.segments = 2
bpy.ops.object.modifier_apply(modifier=bev.name)
ihs.data.materials.append(ihs_mat)

# ---------------- plinth + floor ----------------
mt_granite = new_principled("mt_granite", (0.047, 0.047, 0.055), 0.32)
mt_granite.node_tree.nodes["Principled BSDF"].inputs["Coat Weight"].default_value = 0.25
bpy.ops.mesh.primitive_cube_add(location=(0, 0, BOARD_Z - 0.75))
plinth = bpy.context.object
plinth.name = "plinth"
plinth.scale = (8.0, 6.0, 0.4)
bpy.ops.object.transform_apply(scale=True)
pbev = plinth.modifiers.new("edge_bevel", "BEVEL")
pbev.width = 0.08
pbev.segments = 2
bpy.ops.object.modifier_apply(modifier=pbev.name)
plinth.data.materials.append(mt_granite)

mt_floor = new_principled("mt_floor", (0.008, 0.008, 0.01), 0.6)  # void-dark: the floor must never gray the black (fog owns it at runtime)
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, BOARD_Z - 1.16))
floor = bpy.context.object
floor.name = "floor"
floor.data.materials.append(mt_floor)

# prune extra UV layers (the strix meshes carry up to 4 source layers;
# every layer costs vertex bytes across ~450k verts in the packed GLB —
# layer 0 is the texture layer, ao_uv is added later by bake_ao.py)
for o in bpy.data.objects:
    if o.type != "MESH" or not o.data.uv_layers:
        continue
    while len(o.data.uv_layers) > 1:
        o.data.uv_layers.remove(o.data.uv_layers[len(o.data.uv_layers) - 1])

# remove orphan data from imports/deletions (mesh data of deleted objects
# keeps material users alive — purge meshes first, then materials, images)
for me in list(bpy.data.meshes):
    if me.users == 0:
        bpy.data.meshes.remove(me)
for m in list(bpy.data.materials):
    if m.users == 0:
        bpy.data.materials.remove(m)
for img in list(bpy.data.images):
    if img.users == 0:
        bpy.data.images.remove(img)

# ---------------- postconditions ----------------
total_tris = 0
for o in bpy.data.objects:
    if o.type == "MESH":
        total_tris += sum(max(0, len(p.vertices) - 2) for p in o.data.polygons)
print("POSTCONDITION tris_total %d" % total_tris)
if HERO == "strix" and not 250_000 <= total_tris <= 520_000:
    print("POSTCONDITION FAIL: tri budget (need 250k..520k)")
    raise SystemExit(1)
emissive_fails = []
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    for n in m.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED":
            es = n.inputs.get("Emission Strength")
            if es and es.default_value > 0.04 + 1e-6:
                emissive_fails.append("%s=%.2f" % (m.name, es.default_value))
if emissive_fails:
    print("POSTCONDITION FAIL: emissives above 0.04: %s" % emissive_fails)
    raise SystemExit(1)
print("POSTCONDITION OK: no emissive above 0.04 (RGB glow dead)")

# ---------------- anchors (glTF Y-up space) ----------------
def g(v):
    return [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]

slab_objs = [o for o in board_meshes if "solder" in o.name]
slab_min, slab_max = world_bbox(slab_objs) if slab_objs else (mins, maxs)

anchors = {
    "hero": HERO,
    "boardMin": g(mins),
    "boardMax": g(maxs),
    "slabMin": g(slab_min),
    "slabMax": g(slab_max),
    "surfaceY": round(socket_z, 4),
    "socketPos": g(Vector((sx, sy, socket_z))),
    "socketPosDie": g(Vector((sx, sy, DIE_Z + dsize.z * ds))),
    "dieCenter": g(Vector((sx, sy, DIE_Z + dsize.z * ds * 0.5))),
    "dieY": DIE_Z,
    "lanes": [],
    "districts": districts,
}
with open(os.path.join(OUT, "anchors.json"), "w") as f:
    json.dump(anchors, f, indent=1)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "substrate.blend"))
print("DONE assemble[%s]: socket at %s, %d districts" % (
    HERO, anchors["socketPos"], len(districts)))
