# Strata textures — Substance-style procedural texturing pipeline (Blender 4.2 headless)
# Bakes AO + curvature with Cycles, synthesizes final maps with numpy,
# re-exports the GLB with UVs + Draco compression.
# Run: blender -b --factory-startup -P build_textures.py

import bpy
import math
import os
import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(ROOT, "..", "..", "site"))
ASSETS = os.path.join(SITE, "public", "assets")
TEX = os.path.join(ASSETS, "textures")
GLB = os.path.join(ASSETS, "strata.glb")
os.makedirs(TEX, exist_ok=True)
rng = np.random.default_rng(42)

# ---------------------------------------------------------------- numpy helpers

def fbm(shape, octaves=5, base=4, persistence=0.5, seed=None):
    r = np.random.default_rng(seed) if seed is not None else rng
    out = np.zeros(shape, dtype=np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        g = base * (2 ** o)
        grid = r.random((g + 1, g + 1)).astype(np.float32)
        ys = np.linspace(0, g, shape[0]); xs = np.linspace(0, g, shape[1])
        x0 = xs.astype(int); y0 = ys.astype(int)
        x1 = np.minimum(x0 + 1, g); y1 = np.minimum(y0 + 1, g)
        fx = (xs - x0)[None, :]; fy = (ys - y0)[:, None]
        sx = fx * fx * (3 - 2 * fx); sy = fy * fy * (3 - 2 * fy)
        v = (grid[np.ix_(y0, x0)] * (1 - sx) * (1 - sy) + grid[np.ix_(y0, x1)] * sx * (1 - sy)
             + grid[np.ix_(y1, x0)] * (1 - sx) * sy + grid[np.ix_(y1, x1)] * sx * sy)
        out += amp * v
        tot += amp
        amp *= persistence
    return out / tot

def ridged(shape, octaves=5, base=4, seed=None):
    n = fbm(shape, octaves, base, 0.55, seed)
    return 1.0 - np.abs(2.0 * n - 1.0)

def blobs(shape, count, rmin, rmax, seed=None):
    r = np.random.default_rng(seed) if seed is not None else rng
    out = np.zeros(shape, dtype=np.float32)
    ys = np.arange(shape[0])[:, None]; xs = np.arange(shape[1])[None, :]
    for _ in range(count):
        cy, cx = r.integers(0, shape[0]), r.integers(0, shape[1])
        rad = r.uniform(rmin, rmax)
        d2 = (ys - cy) ** 2 + (xs - cx) ** 2
        out += np.exp(-d2 / (2 * (rad / 2.2) ** 2))
    return np.clip(out, 0, 1)

def streaks(shape, count, vertical=False, seed=None):
    """Long directional line streaks (brushed metal / micro scratches)."""
    r = np.random.default_rng(seed) if seed is not None else rng
    out = np.zeros(shape, dtype=np.float32)
    for _ in range(count):
        p = r.integers(0, shape[0 if vertical else 1])
        w = max(1, int(r.uniform(1, 3)))
        amp = r.uniform(0.3, 1.0)
        if vertical:
            out[:, max(0, p - w):p + w] += amp
        else:
            out[max(0, p - w):p + w, :] += amp
    blur = fbm(shape, 2, shape[0] // 2, 0.5, seed)
    return np.clip(out * (0.5 + 0.5 * blur), 0, 1)

def height_to_normal(height, strength=1.0):
    dy, dx = np.gradient(height)
    nz = np.ones_like(height) / max(strength, 1e-4)
    n = np.stack([-dx, -dy, nz], axis=-1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return (n * 0.5 + 0.5)

def normalize01(a):
    lo, hi = a.min(), a.max()
    return (a - lo) / max(hi - lo, 1e-6)

# ---------------------------------------------------------------- bpy image IO

def save_array(arr, path, fmt='WEBP', quality=90):
    """arr: HxWx3 or HxW float 0..1 -> file."""
    if arr.ndim == 2:
        arr = np.stack([arr] * 3, axis=-1)
    h, w = arr.shape[:2]
    rgba = np.concatenate([arr, np.ones((h, w, 1))], axis=-1).astype(np.float32)
    img = bpy.data.images.new(os.path.basename(path), width=w, height=h, alpha=False)
    img.pixels.foreach_set(rgba.ravel())
    sc = bpy.context.scene
    sc.render.image_settings.file_format = fmt
    sc.render.image_settings.color_mode = 'RGB'
    if fmt == 'WEBP':
        sc.render.image_settings.quality = quality
        sc.render.image_settings.color_depth = '8'
    else:
        sc.render.image_settings.color_depth = '8'
    img.save_render(path, scene=sc)
    bpy.data.images.remove(img)
    print("  wrote", os.path.relpath(path, TEX), flush=True)

def load_bake(path, shape):
    img = bpy.data.images.load(path)
    w, h = img.size
    arr = np.zeros(h * w * 4, dtype=np.float32)
    img.pixels.foreach_get(arr)
    arr = arr.reshape(h, w, 4)[..., :3]
    if (h, w) != shape:
        ys = (np.linspace(0, h - 1, shape[0])).astype(int)
        xs = (np.linspace(0, w - 1, shape[1])).astype(int)
        arr = arr[np.ix_(ys, xs)]
    bpy.data.images.remove(img)
    return arr.mean(axis=-1)

# ---------------------------------------------------------------- bake setup

def active_bake_image(obj, name, size):
    img = bpy.data.images.get(name) or bpy.data.images.new(name, width=size, height=size, alpha=False)
    mat = bpy.data.materials.new(name + "_bakemat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    nt.nodes.active = tex
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    return mat, nt, out

def bake(obj, kind, name, size, emit_nodes=None):
    path = os.path.join(TEX, "bake", name + ".png")
    if os.path.exists(path):
        print("bake cached, skipping:", name, flush=True)
        return path
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='OBJECT')
    mat, nt, out = active_bake_image(obj, name, size)
    if emit_nodes:
        emit_nodes(nt, out)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 64
    sc.view_settings.view_transform = 'Standard'
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.bake(type=kind, margin=16, use_clear=True)
    img = bpy.data.images[name]
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    print("baked", kind, "->", name, flush=True)
    return path

def curvature_nodes(nt, out):
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.45
    ramp.color_ramp.elements[1].position = 0.55
    em = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(geo.outputs["Pointiness"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])

def unwrap(obj, method='SMART'):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.03)
    bpy.ops.object.mode_set(mode='OBJECT')
    print("unwrapped", obj.name, flush=True)

# ---------------------------------------------------------------- import the set

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=GLB)

objects = {o.name: o for o in bpy.data.objects if o.type == 'MESH'}
print("imported:", list(objects))

# Cycles GPU
cprefs = bpy.context.preferences.addons['cycles'].preferences
try:
    cprefs.compute_device_type = 'CUDA'
    cprefs.get_devices()
    for d in cprefs.devices:
        d.use = (d.type == 'CUDA')
    bpy.context.scene.cycles.device = 'GPU'
except Exception:
    pass

# ---------------------------------------------------------------- unwrap all

for name in ["floor", "plinth", "chrome_sphere", "counter_bar", "jali_screen", "strata_0"]:
    unwrap(objects[name])

# ---------------------------------------------------------------- bakes

BAKES = {}
for name, size in [("floor", 2048), ("plinth", 2048), ("chrome_sphere", 1024),
                   ("counter_bar", 1024), ("jali_screen", 1024), ("strata_0", 1024)]:
    BAKES[name] = {}
    BAKES[name]['ao'] = bake(objects[name], 'AO', f"ao_{name}", size)
for name in ["plinth", "counter_bar", "jali_screen", "strata_0"]:
    BAKES[name]['curv'] = bake(objects[name], 'EMIT', f"curv_{name}", 1024, emit_nodes=curvature_nodes)

# ---------------------------------------------------------------- map synthesis

def write_set(folder, size, albedo, rough, normal_h, ao_path=None, extra=None, strength=1.0):
    d = os.path.join(TEX, folder)
    os.makedirs(d, exist_ok=True)
    save_array(np.clip(albedo, 0, 1), os.path.join(d, "albedo.webp"))
    save_array(np.clip(rough, 0, 1), os.path.join(d, "roughness.webp"))
    save_array(height_to_normal(normal_h, strength), os.path.join(d, "normal.png"), fmt='PNG')
    if ao_path:
        ao = load_bake(ao_path, size)
        save_array(ao, os.path.join(d, "ao.webp"))
    if extra:
        for k, v in extra.items():
            save_array(np.clip(v, 0, 1), os.path.join(d, f"{k}.webp"))

# --- granite plinth (2048)
S = (2048, 2048)
curv = load_bake(BAKES["plinth"]['curv'], S)
edge = normalize01(curv)                       # sharp edges read bright
veins = np.clip(ridged(S, 6, 3, 7) - 0.82, 0, 1) * 4.0
base = 0.018 + 0.020 * fbm(S, 6, 3, 11) + veins * 0.05 + edge[..., None] * 0.03
albedo = np.stack([base, base * 1.02, base * 1.06], axis=-1)
rough = (0.30 + 0.06 * fbm(S, 5, 24, 13) + veins * 0.08 - edge * 0.06)
height = fbm(S, 7, 96, 17) * 0.8 + fbm(S, 4, 8, 19) * 0.2
write_set("granite", S, albedo, rough, height, BAKES["plinth"]['ao'], strength=1.4)

# --- polished concrete floor (2048)
curvf = fbm(S, 5, 2, 23)
albedo = np.stack([0.010 + 0.016 * curvf, 0.010 + 0.016 * curvf, 0.012 + 0.017 * curvf], axis=-1)
rough = 0.32 + 0.12 * fbm(S, 4, 6, 29) + 0.05 * streaks(S, 24, False, 31)
height = fbm(S, 7, 128, 37) * 0.9 + fbm(S, 3, 4, 41) * 0.1
write_set("floor", S, albedo, rough, height, BAKES["floor"]['ao'], strength=0.8)

# --- chrome sphere (1024)
S1 = (1024, 1024)
smudge = blobs(S1, 7, 60, 200, 43)
swirl = streaks(S1, 60, False, 47) * 0.5 + streaks(S1, 60, True, 53) * 0.5
rough = 0.04 + smudge * 0.10 + swirl * 0.03
height = swirl * 0.6 + fbm(S1, 6, 64, 59) * 0.4
albedo = np.full(S1 + (3,), 0.93) - smudge[..., None] * 0.05
write_set("chrome", S1, albedo, rough, height, BAKES["chrome_sphere"]['ao'], strength=0.6)

# --- glass: clear variant (1024)
smudge_g = blobs(S1, 5, 90, 220, 61)
scratch = streaks(S1, 90, False, 67) * 0.6 + streaks(S1, 90, True, 71) * 0.4
rough = 0.03 + smudge_g * 0.18 + scratch * 0.05
height = scratch * 0.75 + fbm(S1, 5, 96, 73) * 0.25
albedo = np.full(S1 + (3,), 0.985)
curv_s = load_bake(BAKES["strata_0"]['curv'], S1)
write_set("glass_clear", S1, albedo, rough, height, BAKES["strata_0"]['ao'],
          extra={"smudge": smudge_g}, strength=0.7)

# --- glass: frosted variant (1024)
frost = fbm(S1, 6, 90, 79)
rough = 0.30 + 0.06 * frost
height = frost
albedo = np.full(S1 + (3,), 0.94)
write_set("glass_frosted", S1, albedo, rough, height, None, strength=2.2)

# --- brushed metal bar (1024)
curv_b = load_bake(BAKES["counter_bar"]['curv'], S1)
edge_b = normalize01(curv_b)
brush = streaks(S1, 220, True, 83)              # U-direction brush lines
albedo = np.stack([0.42 + 0.08 * brush + edge_b * 0.12] * 3, axis=-1)
rough = 0.24 + 0.12 * brush + 0.04 * fbm(S1, 4, 32, 89) - edge_b * 0.08
height = brush * 0.85 + fbm(S1, 5, 64, 97) * 0.15
write_set("brushed", S1, albedo, rough, height, BAKES["counter_bar"]['ao'], strength=1.0)

# --- aged bronze jali (1024)
curv_j = load_bake(BAKES["jali_screen"]['curv'], S1)
cavity = 1.0 - normalize01(curv_j)             # recesses dark -> patina zones
pitting = blobs(S1, 260, 2, 9, 101)
patina_m = np.clip(cavity * 0.8 + pitting * 0.5 + fbm(S1, 4, 6, 103) * 0.25 - 0.35, 0, 1)
bronze = np.array([0.10, 0.075, 0.05])
patina = np.array([0.06, 0.14, 0.12])
albedo = bronze[None, None, :] * (1 - patina_m[..., None]) + patina[None, None, :] * patina_m[..., None]
albedo += normalize01(curv_j)[..., None] * 0.10   # polished worn edges
rough = 0.38 + patina_m * 0.18 - normalize01(curv_j) * 0.14 + 0.05 * fbm(S1, 5, 48, 107)
height = pitting * 0.7 + fbm(S1, 5, 64, 109) * 0.3
write_set("bronze", S1, albedo, rough, height, BAKES["jali_screen"]['ao'], strength=1.2)

# --- lens dirt (1024, post FX overlay)
dirt = blobs(S1, 90, 1.5, 5, 113) * 0.9 + blobs(S1, 12, 30, 120, 127) * 0.12
yy, xx = np.mgrid[0:S1[0], 0:S1[1]]
rad = np.sqrt((yy / S1[0] - 0.5) ** 2 + (xx / S1[1] - 0.5) ** 2) * 2
dirt *= np.clip(rad - 0.35, 0, 1) ** 2          # edges only
save_array(np.clip(dirt, 0, 1) * 0.6, os.path.join(TEX, "lens-dirt.webp"))

# ---------------------------------------------------------------- re-export GLB (UVs + Draco)

shippables = {"floor", "plinth", "chrome_sphere", "counter_bar", "cursor_cube", "jali_screen"} | {f"strata_{i}" for i in range(5)}
# strata_1..4 share strata_0's UVs? No — they are separate meshes; give them the same unwrap
for i in range(1, 5):
    unwrap(objects[f"strata_{i}"])

bpy.ops.object.select_all(action='DESELECT')
for o in objects.values():
    if o.name in shippables:
        o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=GLB,
    export_format='GLB',
    export_apply=True,
    export_animations=False,
    export_cameras=False,
    export_lights=False,
    use_selection=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)
print("GLB re-exported with UVs + Draco:", GLB)
