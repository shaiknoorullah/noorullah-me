# The Substrate — trace-pulse mask bake (SPEC §5.1, the instant-reject
# clause). Six bevel-curve lanes snapped onto the board surface; Cycles
# bakes two selected-to-active emission passes onto the PCB's UVs: pass 1 =
# 0->1 gradient along each corridor (curve UV.x), pass 2 = flat lane id
# ((i+1)/6). Combined into one PNG (r=gradient, g=lane id) and wired as the
# Emission Color texture of a per-mesh clone (mt_solder_traced) on the
# largest solder mesh only — the runtime keys the pulse shader on that
# per-mesh courier. Run: blender -b out/substrate.blend -P bake_trace_mask.py
#
# Delta vs master plan Task 5 (P1 report): the LANES table is re-authored
# from the measured district centroids (assemble.py anchors, probe
# 2026-07-24) — the master table converged on the placeholder socket UV
# (0.32, 0.62); the measured socket sits at (0.548, 0.707). The plan
# explicitly marks LANES as the adjust-on-evidence knob. Lane roles kept:
# 0 VRM->socket, 1 DIMM rail->socket, 2 I/O spur->socket, 3 south/m2
# feeder->socket, 4 chipset loop->socket, 5 edge-to-edge finale (Act 6).
# Also added: channel-stats postconditions on the composed mask (director
# GO item 6 — "trace-mask channels present" is gated in-pipeline because
# the GLB validator can't read KTX2 payloads).
import bpy, json, math, os, sys
import numpy as np
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "out")
MASK_SIZE = 2048
SAMPLES = max(int(os.environ.get("SAMPLES", "512")), 512)  # HARD floor (EMIT: clean by construction)

sc = bpy.context.scene
with open(os.path.join(OUT, "anchors.json")) as f:
    anchors = json.load(f)

def b2w(u, v):
    """slab-bbox UV (glTF space) -> Blender XY on the board."""
    bmin = anchors.get("slabMin", anchors["boardMin"])
    bmax = anchors.get("slabMax", anchors["boardMax"])
    x = bmin[0] + u * (bmax[0] - bmin[0])
    y = -(bmin[2] + v * (bmax[2] - bmin[2]))  # glTF z -> Blender y
    return (x, y)

# lanes in slab-bbox UV, authored per hero along corridors read from the
# top-down probe render (real trace routing topology: peripheral districts
# converge on the socket; lane 5/finale runs edge-to-edge, SPEC §4 Act 6).
LANES_BY_HERO = {
    # strix (2026-07-24 swap): socket (0.585, 0.698) · vrm (0.471, 0.94) ·
    # dimm (0.837, 0.70) · chipset (0.747, 0.293) · m2 (0.52, 0.48) ·
    # io/audio (0.03, 0.17->) · pcie (0.10, 0.373)
    "strix": [
        [(0.471, 0.955), (0.48, 0.86), (0.545, 0.78), (0.578, 0.715)],
        [(0.837, 0.929), (0.837, 0.724), (0.72, 0.71), (0.63, 0.698)],
        [(0.03, 0.17), (0.03, 0.45), (0.10, 0.55), (0.25, 0.62), (0.45, 0.67), (0.555, 0.693)],
        [(0.747, 0.16), (0.747, 0.293), (0.66, 0.45), (0.615, 0.60), (0.593, 0.675)],
        [(0.10, 0.373), (0.35, 0.373), (0.50, 0.42), (0.565, 0.55), (0.582, 0.665)],
        [(0.01, 0.698), (0.30, 0.698), (0.585, 0.698), (0.80, 0.70), (0.99, 0.70)],
    ],
    # cardona fallback: socket (0.548, 0.707) · vrm (0.434, 0.784) ·
    # dimm (0.821, 0.709) · chipset (0.791, 0.282) · m2 (0.634, 0.297) ·
    # io (0.128, 0.669)
    "cardona": [
        [(0.434, 0.92), (0.434, 0.784), (0.49, 0.73), (0.535, 0.715)],
        [(0.82, 0.30), (0.82, 0.62), (0.72, 0.68), (0.60, 0.70)],
        [(0.128, 0.669), (0.30, 0.669), (0.42, 0.66), (0.52, 0.695)],
        [(0.634, 0.10), (0.634, 0.297), (0.60, 0.45), (0.565, 0.60), (0.552, 0.68)],
        [(0.791, 0.16), (0.791, 0.282), (0.70, 0.40), (0.62, 0.55), (0.575, 0.66)],
        [(0.02, 0.707), (0.30, 0.707), (0.548, 0.707), (0.80, 0.707), (0.98, 0.707)],
    ],
}
LANES = LANES_BY_HERO.get(anchors.get("hero", "cardona"), LANES_BY_HERO["cardona"])

board_solder = [o for o in bpy.data.objects if o.name.startswith("board_solder_")]
assert board_solder, "no board_solder_ meshes — run assemble.py first"
# the mask is baked onto ONE target: the largest-face solder mesh (the PCB
# itself). Other solder meshes get no courier — see the material clone at
# the end, which the runtime keys on (per-mesh emissiveMap check).
bake_target = max(board_solder, key=lambda o: len(o.data.polygons))

# lanes hug the FLAT slab top (copper lives under the components — the
# master's terrain-snap rode lanes onto DIMM towers, leaving them outside
# the slab bake's ray reach and cutting corridor gaps; execution-caught).
# Non-selected components don't occlude selected-to-active rays, so the
# baked corridors stay continuous under parts, and runtime pulses duck
# under and re-emerge — the physically-correct read.
from mathutils import Vector as _V
_slab_top = max(
    (bake_target.matrix_world @ _V(c)).z for c in bake_target.bound_box
)
# fully above the surface: center + bevel radius clears the top face (an
# embedded tube wastes half its gradient inside the slab)
LANE_Z = _slab_top + 0.033

# --- lane curves, gradient emission material (curve UV.x = along-length) ---
def gradient_mat():
    m = bpy.data.materials.new("mt_trace_gradient")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 3.0
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["UV"], sep.inputs[0])
    nt.links.new(sep.outputs["X"], em.inputs["Color"])
    nt.links.new(em.outputs[0], out.inputs["Surface"])
    return m

def lane_id_mat(value):
    m = bpy.data.materials.new("mt_trace_id")
    m.use_nodes = True
    pb = m.node_tree.nodes["Principled BSDF"]
    pb.inputs["Base Color"].default_value = (0, 0, 0, 1)
    pb.inputs["Emission Color"].default_value = (value, value, value, 1)
    pb.inputs["Emission Strength"].default_value = 3.0
    return m

gm = gradient_mat()
lane_objs = []
lane_paths = []
for i, lane in enumerate(LANES):
    cu = bpy.data.curves.new("tracelane_%d" % i, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.028
    cu.bevel_resolution = 0
    # u = 0->1 along the spline: bevel-curve UVs are always generated in
    # Blender 4.x (the plan's use_uv_as_generated flag was removed in 3.x)
    if hasattr(cu, "use_uv_as_generated"):
        cu.use_uv_as_generated = False
    sp = cu.splines.new("POLY")
    sp.points.add(len(lane) - 1)
    path = []
    for p, (u, v) in zip(sp.points, lane):
        x, y = b2w(u, v)
        p.co = (x, y, LANE_Z, 1)
        path.append([round(x, 4), round(LANE_Z, 4), round(-y, 4)])  # glTF space
    ob = bpy.data.objects.new("tracelane_%d" % i, cu)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(gm)
    lane_objs.append(ob)
    lane_paths.append(path)

# curves -> meshes: the Cycles baker only treats MESH objects as
# selected-to-active sources; conversion preserves the along-length UV
for o in bpy.data.objects:
    o.select_set(False)
for ob in lane_objs:
    ob.select_set(True)
bpy.context.view_layer.objects.active = lane_objs[0]
bpy.ops.object.convert(target="MESH")
for o in bpy.data.objects:
    o.select_set(False)

# the slab arrives with -90X baked in; make its normals outside-consistent
# so bake rays leave the TOP face upward toward the hovering lanes
bake_target.select_set(True)
bpy.context.view_layer.objects.active = bake_target
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode="OBJECT")
bake_target.select_set(False)

# --- bake setup ---
sc.render.engine = "CYCLES"
sc.cycles.samples = SAMPLES
sc.render.bake.use_selected_to_active = True
sc.render.bake.margin = 8
# proven envelope (debug sweep 2026-07-24): a generous cage with unlimited
# ray distance is the only configuration that reliably captures the
# hovering lanes on both hero assets; tighter cages (0.1/0.5) miss on the
# strix slab shell even with corrected normals
sc.render.bake.max_ray_distance = 0.0  # 0 = unlimited
sc.render.bake.cage_extrusion = 2.0
sc.render.bake.use_clear = True

# float buffers: 8-bit bake targets clamp radiance (gradient x strength 3)
# at 1.0 BEFORE the /3 normalize below, flattening the ramp to 0.333 and
# merging lane ids — execution-caught on 4.2.3
img_r = bpy.data.images.new(
    "tracemap_r", width=MASK_SIZE, height=MASK_SIZE, float_buffer=True
)
img_g = bpy.data.images.new(
    "tracemap_g", width=MASK_SIZE, height=MASK_SIZE, float_buffer=True
)

def bake_pass(image, mat_for_lane):
    # bake into UV layer 0 explicitly — the strix slab carries several UV
    # layers and the exporter emits emissiveTexture with texCoord 0
    bake_target.data.uv_layers.active = bake_target.data.uv_layers[0]
    # active image node on the TARGET's material only (shared materials
    # would duplicate nodes per mesh)
    target_mat = bake_target.material_slots[0].material
    nt = target_mat.node_tree
    # remove only OUR bake nodes — the strix slab material legitimately
    # carries albedo/normal/MR image nodes that must survive to export
    for n in list(nt.nodes):
        if n.type == "TEX_IMAGE" and n.name.startswith("BAKE_TARGET"):
            nt.nodes.remove(n)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.name = "BAKE_TARGET"
    tex.image = image
    nt.nodes.active = tex
    for i, ob in enumerate(lane_objs):
        ob.data.materials.clear()
        ob.data.materials.append(mat_for_lane(i))
        ob.select_set(True)
    bake_target.select_set(True)
    bpy.context.view_layer.objects.active = bake_target
    bpy.ops.object.bake(type="EMIT")
    for o in bpy.data.objects:
        o.select_set(False)

bake_pass(img_r, lambda i: gm)
bake_pass(img_g, lambda i: lane_id_mat((i + 1) / 6.0))

# --- combine r/g into one mask image ---
r = np.empty(MASK_SIZE * MASK_SIZE * 4, dtype=np.float32)
g = np.empty(MASK_SIZE * MASK_SIZE * 4, dtype=np.float32)
img_r.pixels.foreach_get(r)
img_g.pixels.foreach_get(g)
mask = np.zeros(MASK_SIZE * MASK_SIZE * 4, dtype=np.float32)
mask[0::4] = np.clip(r[0::4] / 3.0, 0, 1)   # undo emission strength
mask[1::4] = np.clip(g[0::4] / 3.0, 0, 1)
# b = emissive spill base (director addendum item 4): blurred lane
# presence at low intensity — the pulse practical's resting glow, so
# corridors read lit between pulses; runtime pulses ADD on top, never below
lane_presence = (mask[0::4] > 0.02).astype(np.float32).reshape(MASK_SIZE, MASK_SIZE)
spill = lane_presence.copy()
for _ in range(3):  # 3x box blur ~ gaussian; radius grows each pass
    k = 17
    csum = np.cumsum(np.pad(spill, ((0, 0), (k, k)), mode="edge"), axis=1)
    spill = (csum[:, 2 * k:] - csum[:, : -2 * k]) / (2 * k)
    csum = np.cumsum(np.pad(spill, ((k, k), (0, 0)), mode="edge"), axis=0)
    spill = (csum[2 * k:, :] - csum[: -2 * k, :]) / (2 * k)
mask[2::4] = np.clip(spill * 0.35, 0, 1).reshape(-1)
mask[3::4] = 1.0
img = bpy.data.images.new("tracemap", width=MASK_SIZE, height=MASK_SIZE)
img.pixels.foreach_set(mask)
img.filepath_raw = os.path.join(OUT, "tracemap.png")
img.file_format = "PNG"
img.save()

# --- channel-stats postconditions (director GO item 6; in-pipeline because
# the GLB validator cannot read the KTX2-packed payload) ---
rch = mask[0::4]
gch = mask[1::4]
lane_px = int((rch > 0.02).sum())
coverage = lane_px / (MASK_SIZE * MASK_SIZE)
gvals = np.unique(np.round(gch[gch > 0.05] * 6.0))
gvals = gvals[gvals >= 1]  # drop the anti-aliased edge halo that rounds to 0
fails = []
if not 0.001 <= coverage <= 0.25:
    fails.append("lane coverage %.4f outside [0.001, 0.25]" % coverage)
if float(rch.max()) < 0.9:
    fails.append("r gradient max %.3f < 0.9 (no full 0->1 ramp)" % rch.max())
if not 3 <= len(gvals) <= 6:
    fails.append("g lane ids: %d distinct (need 3..6): %s" % (len(gvals), gvals))
bch = mask[2::4]
spill_cov = float((bch > 0.01).mean())
if spill_cov <= coverage:
    fails.append(
        "spill (b) coverage %.4f not wider than lanes %.4f" % (spill_cov, coverage)
    )
for msg in fails:
    print("POSTCONDITION FAIL: %s" % msg)
if fails:
    sys.exit(1)
print("POSTCONDITION OK: coverage %.4f, r max %.3f, %d lane ids, spill %.4f" % (
    coverage, rch.max(), len(gvals), spill_cov))

# --- courier: clone the solder material for the bake target ONLY and wire
# the mask as its emission texture, so the runtime can key the pulse shader
# on a per-mesh emissiveMap check (other solder meshes get no courier) ---
mt_traced = bpy.data.materials["mt_solder"].copy()
mt_traced.name = "mt_solder_traced"
nt = mt_traced.node_tree
pb = nt.nodes["Principled BSDF"]
# strip only bake plumbing — the slab's real texture nodes stay
for n in list(nt.nodes):
    if n.type == "TEX_IMAGE" and n.name.startswith("BAKE_TARGET"):
        nt.nodes.remove(n)
tex = nt.nodes.new("ShaderNodeTexImage")
tex.image = img
pb.inputs["Emission Strength"].default_value = 0.0  # courier only, no glow
nt.links.new(tex.outputs["Color"], pb.inputs["Emission Color"])
bake_target.data.materials.clear()
bake_target.data.materials.append(mt_traced)

anchors["lanes"] = lane_paths
with open(os.path.join(OUT, "anchors.json"), "w") as f:
    json.dump(anchors, f, indent=1)

# lanes are bake geometry, not export geometry — hide from export
for ob in lane_objs:
    ob.hide_set(True)
    ob.hide_render = True

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "substrate.blend"))
print("DONE bake_trace_mask: %d lanes, tracemap.png %dx%d" % (
    len(LANES), MASK_SIZE, MASK_SIZE))
