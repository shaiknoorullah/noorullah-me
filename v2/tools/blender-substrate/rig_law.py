# The Substrate — THE RIG (single source of truth).
# Synthesis, in precedence order: director A+C+D verdict -> LIGHTING-BIBLE
# §7 (build order, card discipline, ratios-in-stops) -> CINEMATIC-LIGHTING
# §8 recipe (motivated sources, 8:1-16:1 on-face ratio, negative-fill map,
# whisper-cold ambient). Shared by the QA scripts AND bake_lightstory.py so
# the baked GI and the QA frames are one light story by construction.
# Every rig object is prefixed "rig_" — export.py excludes the prefix.
#
# Motivations (every source has an in-world story):
#   K  rig_key      overhead inspection lamp   (0 stops, reference)
#   A  world+card   cold void "air" + ceiling  (-3.5 .. -4, whisper)
#   R  rig_rim      bay-door light leak        (+0.5..+1 on edges only)
#   X  rig_grazer   bench probe raking the solder mask (-1)
#   C  rig_cardA/B  what the metal reflects (bible §1 — instruments)
#   F  rig_flag*    negative fill map (the shadow side of the "face")
#   G  green        EVENT ONLY (pulses / acts 2,5,6) — never in base rig
# Camera moves reveal the lighting; the rig never re-lights per shot.
import bpy
from mathutils import Vector

KEY5000 = (1.0, 0.94, 0.86)      # inspection-lamp warm-neutral
COOLSTRIP = (0.88, 0.93, 1.0)    # bay-door neutral-cool
WORLD_COLD = (0.83, 0.90, 1.0)   # 7000K void air
SOCKET = (1.22, 3.91, 1.08)
BOARD_CENTER = (0.0, 0.0, 1.6)


def _look_at(obj, pt):
    obj.rotation_euler = (
        (Vector(pt) - obj.location).to_track_quat("-Z", "Y").to_euler()
    )


def clear_rig():
    legacy = ("ambient_card", "refl_card", "black_flag", "ceiling_card")
    for o in list(bpy.data.objects):
        if o.name.startswith("rig_") or o.name.startswith(legacy):
            bpy.data.objects.remove(o, do_unlink=True)
    for ob in [o for o in bpy.data.objects if o.type == "LIGHT"]:
        bpy.data.objects.remove(ob, do_unlink=True)


def set_world(scene, whisper=0.003):
    """Cold void 'air' — exists only so shadow-side silkscreen survives
    the 8:1-16:1 ratio. A lifted gray is failure; this is a whisper."""
    w = bpy.data.worlds.new("rig_world")
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (*WORLD_COLD, 1)
    bg.inputs[1].default_value = whisper
    scene.world = w


def _rect(name, loc, sx, sy, energy, color, target):
    bpy.ops.object.light_add(type="AREA", location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.data.shape = "RECTANGLE"
    ob.data.size = sx
    ob.data.size_y = sy
    ob.data.energy = energy
    ob.data.color = color
    _look_at(ob, target)
    return ob


def _emissive_card(name, loc, sx, sy, strength, target=None, gradient=False,
                   color=(1.0, 1.0, 1.0)):
    bpy.ops.mesh.primitive_plane_add(location=loc)
    p = bpy.context.object
    p.name = name
    p.scale = (sx / 2, sy / 2, 1)
    if target:
        _look_at(p, target)
    m = bpy.data.materials.new("mt_" + name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    outn = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*color, 1)
    if gradient:
        # bible §2.3: white -> 40% grey along the length; the rolled-off
        # streak the heatsinks reflect (never a uniform CG slab)
        tc = nt.nodes.new("ShaderNodeTexCoord")
        grad = nt.nodes.new("ShaderNodeTexGradient")
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = (1, 1, 1, 1)
        ramp.color_ramp.elements[1].color = (0.4, 0.4, 0.4, 1)
        mathn = nt.nodes.new("ShaderNodeMath")
        mathn.operation = "MULTIPLY"
        mathn.inputs[1].default_value = strength
        nt.links.new(tc.outputs["Object"], grad.inputs["Vector"])
        nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], mathn.inputs[0])
        nt.links.new(mathn.outputs["Value"], em.inputs["Strength"])
    else:
        em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs[0], outn.inputs["Surface"])
    p.data.materials.append(m)
    p.visible_camera = False
    return p


def _black_plane(name, loc, sx, sy, target):
    bpy.ops.mesh.primitive_plane_add(location=loc)
    p = bpy.context.object
    p.name = name
    p.scale = (sx / 2, sy / 2, 1)
    _look_at(p, target)
    m = bpy.data.materials.new("mt_" + name)
    m.use_nodes = True
    pb = m.node_tree.nodes["Principled BSDF"]
    pb.inputs["Base Color"].default_value = (0.015, 0.015, 0.015, 1)
    pb.inputs["Roughness"].default_value = 1.0
    p.data.materials.append(m)
    # flags shape light (absorb bounce, appear as dark bands IN METAL
    # reflections) but must never be a gray backdrop in frame
    p.visible_camera = False
    return p


def build_rig(base_energy=900.0, ceiling_strength=2.0, stage=6):
    """Bible §7 build order, recipe-refined:
    1 K only -> 2 +ambient (ceiling card; pair with set_world) ->
    3 +refl cards -> 4 +negative-fill map -> 5 +rim & grazer -> 6 full."""
    clear_rig()
    # K — overhead inspection lamp, camera-left ~45°, frontal-biased for
    # the grazing camera (bible §5)
    _rect("rig_key", (-14, -18, 14), 14, 10, base_energy, KEY5000, SOCKET)
    if stage >= 2:
        # A(part) — user's giant ceiling card: soft graded shadow floor
        _emissive_card("rig_ceiling", (0, 0, 35), 60, 60, ceiling_strength)
    if stage >= 3:
        # C — the streaks the metal reflects; long (2-3x board) for grazing
        _emissive_card("rig_cardA", (-16, 2, 5.5), 8, 30, 6.0,
                       target=(0, 2, 2.0), gradient=True)
        _emissive_card("rig_cardB", (15, 0, 5.0), 6, 24, 3.0,
                       target=(0, 0, 2.0), gradient=True)
    if stage >= 4:
        # F — negative fill map (recipe §8): the flat->shaped step
        _black_plane("rig_flag_camR", (11, -3, 3.0), 10, 20, (0, 0, 2.0))
        _black_plane("rig_flag_under", (0, 14, -0.8), 26, 10, (0, 0, 1.0))
        _black_plane("rig_flag_camL", (2, -16, 4.0), 12, 8, (4, -4, 2.0))
        _black_plane("rig_flag_rim", (10.5, 8, 6.5), 6, 4, (8.5, -10.5, 3.6))
    if stage >= 5:
        # R — bay-door leak: ONE tight strip, behind, high, camera-right;
        # edges only (+0.6 stop)
        _rect("rig_rim", (10, 15, 8), 2, 22, base_energy * 1.5, COOLSTRIP,
              (2, 5, 2.4))
        # X — bench probe: low hard grazer raking the solder mask (-1 stop);
        # static — the camera's movement creates the specular sweep
        _rect("rig_grazer", (-9, -13, 1.3), 2, 6, base_energy * 0.5, KEY5000,
              (2, 2, 0.8))
    if stage >= 6:
        color_pass()  # ported color pass (locked 2026-07-27)
    # full rig; no disk fill — the whisper world + ceiling card ARE the
    # fill (8:1-16:1 on-face, shadow detail via A, never gray lift)


def color_pass(ember_scale=1.0):
    """LOCKED COLOR PASS (director 2026-07-27, ported from the lookdev
    verdict): ember edge on the I/O cluster + desat cool fill. Part of THE
    RIG everywhere (bake + QA); ember scales x1.3 on wide framings."""
    _rect("rig_ember", (-13, 12, 5.5), 4, 16, 4680.0 * ember_scale,
          (1.0, 0.42, 0.10), (-5.5, 6, 3.5))
    _rect("rig_cfill", (16, -4, 7), 10, 10, 2250.0,
          (0.72, 0.76, 0.97), BOARD_CENTER)


def add_haze(density=0.002, anisotropy=0.45):
    """QA-only atmosphere (runtime uses the spec's fog cards; bakes never
    see haze). Noise-modulated so no uniform fog wall; visible only inside
    the K/X shafts. Self-check: hide the board — haze must read as 'a
    place', not 'an effect'."""
    bpy.ops.mesh.primitive_cube_add(location=(0, 2, 3.0))
    cube = bpy.context.object
    cube.name = "rig_haze"
    cube.scale = (16, 14, 3.2)
    m = bpy.data.materials.new("mt_rig_haze")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    outn = nt.nodes.new("ShaderNodeOutputMaterial")
    vol = nt.nodes.new("ShaderNodeVolumeScatter")
    vol.inputs["Anisotropy"].default_value = anisotropy
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 0.35
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value = 0.35
    ramp.inputs["From Max"].default_value = 0.75
    ramp.inputs["To Min"].default_value = 0.2
    ramp.inputs["To Max"].default_value = 1.0
    mult = nt.nodes.new("ShaderNodeMath")
    mult.operation = "MULTIPLY"
    mult.inputs[1].default_value = density
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Value"])
    nt.links.new(ramp.outputs["Result"], mult.inputs[0])
    nt.links.new(mult.outputs["Value"], vol.inputs["Density"])
    nt.links.new(vol.outputs["Volume"], outn.inputs["Volume"])
    cube.data.materials.append(m)
    cube.visible_camera = True
    return cube


def green_booster(loc, energy):
    """BR2049 pattern: the emissive practical as a legitimate key — a small
    hidden Area just off the emissive sells the spill without emissive-only
    noise. EVENT tool (acts 2/5/6); not part of the base rig."""
    bpy.ops.object.light_add(type="AREA", location=loc)
    ob = bpy.context.object
    ob.name = "rig_green_boost"
    ob.data.shape = "DISK"
    ob.data.size = 1.2
    ob.data.energy = energy
    ob.data.color = (0.643, 0.922, 0.325)
    return ob


def finals_settings(scene, iteration=False):
    """Bible §7 finals block."""
    scene.cycles.adaptive_threshold = 0.008 if iteration else 0.005
    scene.cycles.blur_glossy = 0.5
    scene.cycles.sample_clamp_indirect = 6.0
    try:
        scene.cycles.denoising_quality = "HIGH"
        scene.cycles.denoising_prefilter = "ACCURATE"
        scene.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    except Exception:
        pass
