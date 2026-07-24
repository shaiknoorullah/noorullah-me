# The Substrate — imperfection system (director directive 2026-07-24:
# "materials don't look real because they're too real"). Physically
# motivated, every layer at 5-10% influence max — invisible at wide shots,
# present at macro (DESIGN §11.1 philosophy):
#   - micro-scratch normal (fine isotropic swirl, strength 0.12) on the
#     heatsink/shroud metals + IHS
#   - handling smudges: 3 soft masks -> roughness variation on the covers
#   - dust in recesses: AO-driven roughness lift + albedo darkening;
#     inverse curvature -> faint edge polish (handling wear)
#   - low-frequency roughness breakup (±0.05) on the solder mask
# Deterministic (seeded RNG). Bakeable parts land in per-bucket textures
# wired canonically for the glTF exporter; scratch/smudge masks also ship
# as runtime sidecars (public/assets/imperfect/, <=1K).
# Run: blender -b out/substrate.blend -P bake_imperfections.py
import os

import bpy
import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "out")
REPO = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
IMP = os.path.join(REPO, "public", "assets", "imperfect")
os.makedirs(IMP, exist_ok=True)

SIZE = 1024
rng = np.random.default_rng(7)


def box_blur(a, k, passes=2):
    for _ in range(passes):
        cs = np.cumsum(np.pad(a, ((0, 0), (k, k)), mode="wrap"), axis=1)
        a = (cs[:, 2 * k:] - cs[:, : -2 * k]) / (2 * k)
        cs = np.cumsum(np.pad(a, ((k, k), (0, 0)), mode="wrap"), axis=0)
        a = (cs[2 * k:, :] - cs[: -2 * k, :]) / (2 * k)
    return a


def value_noise(size, cells, seed_rng):
    grid = seed_rng.random((cells + 1, cells + 1))
    idx = np.linspace(0, cells, size, endpoint=False)
    x0 = idx.astype(int)
    fx = idx - x0
    fx = fx * fx * (3 - 2 * fx)
    row = grid[:, x0] * (1 - fx) + grid[:, np.minimum(x0 + 1, cells)] * fx
    col = row[x0, :] * (1 - fx[:, None]) + row[np.minimum(x0 + 1, cells), :] * fx[:, None]
    return col


def save_png(arr_rgb, path, non_color=True):
    h, w = arr_rgb.shape[:2]
    img = bpy.data.images.new(os.path.basename(path), width=w, height=h,
                              float_buffer=False)
    if non_color:
        img.colorspace_settings.name = "Non-Color"
    rgba = np.ones((h, w, 4), dtype=np.float32)
    rgba[..., :3] = arr_rgb
    img.pixels.foreach_set(rgba.reshape(-1))
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    return img


def load_gray(path):
    img = bpy.data.images.load(path)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    g = px.reshape(h, w, 4)[..., 0]
    bpy.data.images.remove(img)
    return g


# ---------------- 1. micro-scratch normal (isotropic swirl) ----------------
noise = rng.random((SIZE, SIZE))
height = np.zeros((SIZE, SIZE))
# directional micro-smears at varying angles -> isotropic swirl of fine lines
for ang in np.linspace(0, np.pi, 6, endpoint=False):
    dx, dy = np.cos(ang), np.sin(ang)
    sm = noise.copy()
    for step in range(1, 7):
        sm += np.roll(np.roll(noise, int(round(dy * step)), axis=0),
                      int(round(dx * step)), axis=1)
    height += (sm / 7.0 - 0.5) * (1.0 / 6)
height = height - box_blur(height.copy(), 3, 1)  # keep only fine detail
gy, gx = np.gradient(height * 6.0)
nz = 1.0 / np.sqrt(gx * gx + gy * gy + 1.0)
scratch = np.stack([(-gx * nz + 1) / 2, (-gy * nz + 1) / 2, (nz + 1) / 2], axis=-1)
scratch_img = save_png(scratch, os.path.join(IMP, "scratch_normal.png"))

# ---------------- 2. handling smudges (3 soft blobs) ----------------
yy, xx = np.mgrid[0:SIZE, 0:SIZE] / SIZE
smudge = np.zeros((SIZE, SIZE))
for _ in range(3):
    cx, cy = rng.random(2)
    sx_, sy_ = 0.10 + rng.random() * 0.12, 0.06 + rng.random() * 0.10
    smudge += np.exp(-(((xx - cx) / sx_) ** 2 + ((yy - cy) / sy_) ** 2))
smudge = np.clip(box_blur(smudge, 24, 1), 0, 1)
smudge_img = save_png(np.stack([smudge] * 3, axis=-1),
                      os.path.join(IMP, "smudge_mask.png"))

# ---------------- 3. per-bucket composed maps ----------------
def compose_bucket_maps(tag, base_rough, base_albedo):
    """dust (AO) + edge polish (curvature) + smudges -> rough/albedo maps
    in the bucket's ao_uv atlas space. All influences <=10%."""
    ao_p = os.path.join(OUT, "ao_%s.png" % tag)
    cv_p = os.path.join(OUT, "curvature_%s.png" % tag)
    ao = load_gray(ao_p) if os.path.exists(ao_p) else np.ones((SIZE, SIZE))
    cv = load_gray(cv_p) if os.path.exists(cv_p) else np.full((SIZE, SIZE), 0.5)
    if ao.shape[0] != SIZE:
        ao = ao[:: ao.shape[0] // SIZE, :: ao.shape[1] // SIZE][:SIZE, :SIZE]
    if cv.shape[0] != SIZE:
        cv = cv[:: cv.shape[0] // SIZE, :: cv.shape[1] // SIZE][:SIZE, :SIZE]
    dust = np.clip(1.0 - ao, 0, 1)          # recesses
    edge = np.clip(cv - 0.5, 0, 1) * 2.0    # exposed edges
    rough = np.full((SIZE, SIZE), base_rough)
    rough += dust * 0.08                    # dust roughens crevices
    rough -= edge * 0.06                    # handling polishes edges
    rough += (smudge - 0.5) * 0.06          # finger smudges
    rough = np.clip(rough, 0.05, 0.95)
    albedo = np.full((SIZE, SIZE), base_albedo)
    albedo *= 1.0 - dust * 0.10             # dust darkens recesses
    albedo += edge * base_albedo * 0.10     # worn edges catch light
    return (
        save_png(np.stack([rough] * 3, -1), os.path.join(OUT, "rough_%s.png" % tag)),
        save_png(np.stack([np.clip(albedo, 0, 1)] * 3, -1),
                 os.path.join(OUT, "albedo_%s.png" % tag)),
    )


rough_dm, albedo_dm = compose_bucket_maps("darkmetal", 0.5, 0.06)

# solder: low-frequency roughness breakup only (uv0 space, matches albedo)
solder_rough = 0.5 + (value_noise(SIZE, 6, rng) - 0.5) * 0.10
rough_solder = save_png(np.stack([solder_rough] * 3, -1),
                        os.path.join(OUT, "rough_solder.png"))


# ---------------- 4. wire into materials (canonical exporter graphs) ------
def wire(mat_name, rough_img=None, albedo_img=None, normal_img=None,
         normal_uv="ao_uv", tex_uv="ao_uv", normal_strength=0.12):
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        return
    nt = mat.node_tree
    pb = nt.nodes.get("Principled BSDF")
    for n in list(nt.nodes):
        if n.name.startswith("IMP_"):
            nt.nodes.remove(n)

    def uvnode(layer):
        u = nt.nodes.new("ShaderNodeUVMap")
        u.name = "IMP_uv_" + layer + str(len(nt.nodes))
        u.uv_map = layer
        return u

    if rough_img is not None:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.name = "IMP_rough"
        t.image = rough_img
        t.image.colorspace_settings.name = "Non-Color"
        nt.links.new(uvnode(tex_uv).outputs["UV"], t.inputs["Vector"])
        nt.links.new(t.outputs["Color"], pb.inputs["Roughness"])
    if albedo_img is not None:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.name = "IMP_albedo"
        t.image = albedo_img
        t.image.colorspace_settings.name = "sRGB"
        nt.links.new(uvnode(tex_uv).outputs["UV"], t.inputs["Vector"])
        nt.links.new(t.outputs["Color"], pb.inputs["Base Color"])
    if normal_img is not None:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.name = "IMP_scrnorm"
        t.image = normal_img
        t.image.colorspace_settings.name = "Non-Color"
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.name = "IMP_nm"
        nm.inputs["Strength"].default_value = normal_strength
        nm.uv_map = normal_uv
        nt.links.new(uvnode(normal_uv).outputs["UV"], t.inputs["Vector"])
        nt.links.new(t.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], pb.inputs["Normal"])


wire("mt_darkmetal", rough_img=rough_dm, albedo_img=albedo_dm,
     normal_img=scratch_img)
wire("mt_ihs", normal_img=scratch_img, normal_uv="UVMap", tex_uv="UVMap")
# solder: uv0 everywhere (its albedo/tracemap space)
solder = bpy.data.materials.get("mt_solder_traced") or bpy.data.materials.get("mt_solder")
if solder:
    slab = next(
        (o for o in bpy.data.objects if o.type == "MESH"
         and any(sl.material is solder for sl in o.material_slots)), None)
    uv0 = slab.data.uv_layers[0].name if slab else "UVMap"
    wire(solder.name, rough_img=rough_solder, tex_uv=uv0)

print("IMPERFECTIONS wired: scratch normal 0.12, smudges/dust/edges <=10%")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "substrate.blend"))
print("DONE bake_imperfections")
