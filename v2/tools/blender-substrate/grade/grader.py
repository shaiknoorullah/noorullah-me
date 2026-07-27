#!/usr/bin/env python3
"""
grader.py — The Substrate grade toolchain.

Applies the GRADE.md pipeline (steps 1-10) to any frame, parameterized per act
(0-5, DESIGN.md §4.3). Also exports:
  - acts.json                        single source of truth for the runtime
  - luts/substrate-act{N}.cube       Adobe .cube 33^3 3D LUT (steps 1-7 baked)
  - luts/substrate-act{N}-lut32.png  1024x32 three.js LUT strip (postprocessing LUT3DEffect)
  - luts/bluecurve-act{N}.png        256x1 blue-channel curve (aten7 uBlueCurve pattern)

Usage:
  python grader.py --act 0 --input in.png --output out.png [--pair before-after.png]
  python grader.py --export-luts
  python grader.py --dump-acts

Pipeline order is exactly GRADE.md §1. Halation/grain/vignette are excluded from
the baked LUTs (spatial/stochastic) — runtime keeps them as live effects.
"""

import argparse
import json
import os

import numpy as np
from PIL import Image, ImageFilter

# ---------------------------------------------------------------- acts (DESIGN §4.3)
# temp/sat follow the DESIGN table verbatim; exp/contrast/floor tuned to
# CINEMATIC-LIGHTING.md §6 grade targets.

ACTS = {
    0: {"name": "Hero",      "temp": 0.14, "sat": 1.00, "exp": -0.25,
        "contrast": 0.38, "pivot": 0.35, "floor": 0.060, "halation": 0.30, "grain": 0.016, "vignette": 0.00},
    1: {"name": "Statement", "temp": -0.10, "sat": 0.90, "exp": -0.20,
        "contrast": 0.34, "pivot": 0.38, "floor": 0.070, "halation": 0.25, "grain": 0.016, "vignette": 0.00},
    2: {"name": "Work",      "temp": 0.00, "sat": 1.00, "exp": -0.25,
        "contrast": 0.36, "pivot": 0.36, "floor": 0.060, "halation": 0.30, "grain": 0.016, "vignette": 0.00},
    3: {"name": "Evidence",  "temp": 0.08, "sat": 1.05, "exp": -0.25,
        "contrast": 0.40, "pivot": 0.42, "floor": 0.055, "halation": 0.28, "grain": 0.016, "vignette": 0.00},
    4: {"name": "About",     "temp": 0.00, "sat": 1.00, "exp": -0.30,
        "contrast": 0.42, "pivot": 0.36, "floor": 0.065, "halation": 0.30, "grain": 0.018, "vignette": 0.10},
    5: {"name": "Contact",   "temp": 0.20, "sat": 1.00, "exp": -0.20,
        "contrast": 0.36, "pivot": 0.38, "floor": 0.050, "halation": 0.40, "grain": 0.016, "vignette": 0.00},
}

# Blue-channel curve control points per act (GRADE.md §4).
BLUE_CURVES = {
    0: [(0.00, 0.015), (0.20, 0.210), (0.50, 0.485), (0.80, 0.815), (1.00, 0.990)],
    1: [(0.00, 0.030), (0.20, 0.230), (0.50, 0.500), (0.80, 0.820), (1.00, 1.000)],
    2: [(0.00, 0.012), (0.20, 0.205), (0.50, 0.490), (0.80, 0.810), (1.00, 0.995)],
    3: [(0.00, 0.010), (0.20, 0.200), (0.50, 0.480), (0.80, 0.800), (1.00, 0.980)],
    4: [(0.00, 0.020), (0.25, 0.250), (0.50, 0.490), (0.75, 0.770), (1.00, 0.990)],
    5: [(0.00, 0.020), (0.20, 0.200), (0.50, 0.470), (0.80, 0.780), (1.00, 0.960)],
}

# Split-tone tints (GRADE.md §5).
TINT_S = np.array([0.20784, 0.32157, 0.90980])   # #3552E8
TINT_H = np.array([1.0, 0.41961, 0.10196])       # #FF6B1A
LUMA_S = 0.33996
LUMA_H = 0.51997
SPLIT_S = 0.08
SPLIT_H = 0.05

REC709 = np.array([0.2126, 0.7152, 0.0722])

GRAIN_SEED = 1979  # fixed: reproducible proof frames


# ---------------------------------------------------------------- math (GRADE.md §1)

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def s_curve(x, c, p):
    """Pivot-shifted S-curve (GRADE.md §3): smoothstep warped so its pivot (max
    slope, slope = 1 + 0.5c there) sits at p instead of 0.5. Endpoints pinned:
    S_p(0)=0, S_p(1)=1. k = ln(0.5)/ln(p) maps p -> 0.5 through u^k."""
    k = np.log(0.5) / np.log(p)
    w = np.power(np.maximum(x, 1e-6), k)
    s = w * w * (3.0 - 2.0 * w)
    y = np.power(np.maximum(s, 1e-9), 1.0 / k)
    y = np.where(x <= 0.0, 0.0, np.where(x >= 1.0, 1.0, y))
    return x + c * (y - x)


def hermite_curve(points, x):
    """Monotone-ish Hermite spline through control points (GRADE.md §4)."""
    pts = sorted(points)
    xs = np.array([p[0] for p in pts])
    ys = np.array([p[1] for p in pts])
    n = len(pts)
    # finite-difference tangents dy/dx
    m = np.empty(n)
    m[0] = (ys[1] - ys[0]) / (xs[1] - xs[0])
    m[-1] = (ys[-1] - ys[-2]) / (xs[-1] - xs[-2])
    for i in range(1, n - 1):
        m[i] = (ys[i + 1] - ys[i - 1]) / (xs[i + 1] - xs[i - 1])
    x = np.asarray(x, dtype=np.float64)
    out = np.empty_like(x)
    for i in range(n - 1):
        x1, x2 = xs[i], xs[i + 1]
        y1, y2 = ys[i], ys[i + 1]
        h = x2 - x1
        sel = (x >= x1) & (x <= x2) if i == n - 2 else (x >= x1) & (x < x2)
        t = (x[sel] - x1) / h
        t2, t3 = t * t, t * t * t
        out[sel] = ((2 * t3 - 3 * t2 + 1) * y1 + (t3 - 2 * t2 + t) * h * m[i]
                    + (-2 * t3 + 3 * t2) * y2 + (t3 - t2) * h * m[i + 1])
    return np.clip(out, 0.0, 1.0)


def blue_lut_256(act):
    """256-entry 1D LUT for the act's blue curve (aten7 uBlueCurve pattern)."""
    return hermite_curve(BLUE_CURVES[act], np.linspace(0.0, 1.0, 256))


def grade_pointwise(x, act, blue_lut=None):
    """Steps 1-7 — the point-wise grade. This is what the LUTs bake and what the
    runtime GradeEffect replicates in shader (GRADE.md §8). x: float RGB [0,1]."""
    p = ACTS[act]
    if blue_lut is None:
        blue_lut = blue_lut_256(act)

    # 1 exposure (stops)
    x = x * (2.0 ** p["exp"])

    # 2 temperature
    x = x.copy()
    x[..., 0] *= 1.0 + 0.08 * p["temp"]
    x[..., 2] *= 1.0 - 0.10 * p["temp"]
    x = np.clip(x, 0.0, 1.0)

    # 3 saturation (luma-anchored)
    L = x @ REC709
    x = np.clip(L[..., None] + (x - L[..., None]) * p["sat"], 0.0, 1.0)

    # 4 S-curve: pivot-shifted smoothstep, blended by contrast
    x = s_curve(x, p["contrast"], p["pivot"])

    # 5 split tone (luma-preserving)
    L = x @ REC709
    shM = smoothstep(0.45, 0.0, L)[..., None]
    hiM = smoothstep(0.55, 1.0, L)[..., None]
    Lc = np.maximum(L[..., None], 1e-5)
    x = x + (TINT_S * (Lc / LUMA_S) - x) * (SPLIT_S * shM)
    x = x + (TINT_H * (Lc / LUMA_H) - x) * (SPLIT_H * hiM)

    # 6 blue-channel curve LUT
    b = np.clip(x[..., 2], 0.0, 1.0)
    x[..., 2] = blue_lut[(b * 255.0 + 0.5).astype(np.int32).clip(0, 255)]

    # 7 black floor (never 0 — 5-8 IRE)
    x = p["floor"] + (1.0 - p["floor"]) * x
    return np.clip(x, 0.0, 1.0)


def gaussian_blur_np(img, radius):
    """Gaussian blur via PIL (img float [0,1] HxWx3)."""
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    im = im.filter(ImageFilter.GaussianBlur(radius=radius))
    return np.asarray(im).astype(np.float64) / 255.0


def grade_frame(img, act, halation=True, grain=True, seed=GRAIN_SEED):
    """Full GRADE.md pipeline steps 1-10 on an HxWx3 float image."""
    p = ACTS[act]
    x = grade_pointwise(img, act)
    L = x @ REC709

    # 8 halation — only the hottest pixels (green emissive, rim glints)
    if halation and p["halation"] > 0:
        hot = smoothstep(0.80, 0.95, L)[..., None]
        radius = 6.0 * (img.shape[1] / 1280.0)  # spec'd at 720p, scales with res
        bloom = gaussian_blur_np(x * hot, radius)
        x = np.clip(x + p["halation"] * bloom, 0.0, 1.0)

    # 9 grain — 35mm, shadow-weighted, per channel
    if grain and p["grain"] > 0:
        rng = np.random.default_rng(seed)
        n = rng.standard_normal(x.shape)
        Lg = (x @ REC709)[..., None]
        x = x + p["grain"] * n * (0.35 + 0.65 * (1.0 - Lg))

    # 10 vignette (per-act offset; base vignette stays in the runtime stack)
    if p["vignette"] > 0:
        h, w = x.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        r = np.sqrt(((xx / w) - 0.5) ** 2 + ((yy / h) - 0.5) ** 2) / 0.7071
        x = x * (1.0 - p["vignette"] * smoothstep(0.55, 1.35, r)[..., None])

    return np.clip(x, 0.0, 1.0)


# ---------------------------------------------------------------- LUT export

def export_cube(act, path, size=33):
    """Adobe .cube, steps 1-7 baked, sRGB in -> sRGB out. R fastest, then G, then B."""
    blue = blue_lut_256(act)
    lin = np.linspace(0.0, 1.0, size)
    with open(path, "w") as f:
        f.write(f'TITLE "Substrate Act {act} — {ACTS[act]["name"]}"\n')
        f.write(f"# GRADE.md steps 1-7 (point-wise). Halation/grain/vignette excluded.\n")
        f.write(f"LUT_3D_SIZE {size}\n")
        f.write("DOMAIN_MIN 0.0 0.0 0.0\nDOMAIN_MAX 1.0 1.0 1.0\n")
        for bi in range(size):
            for gi in range(size):
                for ri in range(size):
                    c = np.array([lin[ri], lin[gi], lin[bi]])
                    out = grade_pointwise(c, act, blue)
                    f.write(f"{out[0]:.6f} {out[1]:.6f} {out[2]:.6f}\n")


def export_threejs_strip(act, path, size=32):
    """1024x32 three.js LUT strip (postprocessing LUT3DEffect / LookupTexture):
    tile s = b slice at x-offset s*size; x = r, y = g within tile."""
    blue = blue_lut_256(act)
    strip = np.zeros((size, size * size, 3))
    lin = np.linspace(0.0, 1.0, size)
    for s in range(size):            # blue slice
        for y in range(size):        # green
            for xr in range(size):   # red
                c = np.array([lin[xr], lin[y], lin[s]])
                strip[y, s * size + xr] = grade_pointwise(c, act, blue)
    Image.fromarray((np.clip(strip, 0, 1) * 255).astype(np.uint8)).save(path)


def export_bluecurve_png(act, path):
    """256x1 blue curve LUT (aten7 uBlueCurve pattern: texture2D(lut, vec2(b, .5)))."""
    lut = blue_lut_256(act)
    row = np.zeros((1, 256, 3))
    row[0, :, 0] = row[0, :, 1] = row[0, :, 2] = lut
    Image.fromarray((row * 255).astype(np.uint8)).save(path)


def dump_acts(path):
    data = {
        str(a): {**ACTS[a],
                 "blueCurve": BLUE_CURVES[a],
                 "splitShadow": {"tint": "#3552E8", "amount": SPLIT_S},
                 "splitHighlight": {"tint": "#FF6B1A", "amount": SPLIT_H}}
        for a in sorted(ACTS)
    }
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


# ---------------------------------------------------------------- CLI

def load(path):
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float64) / 255.0


def save(x, path):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8)).save(path)


def main():
    ap = argparse.ArgumentParser(description="The Substrate grader")
    ap.add_argument("--act", type=int, choices=sorted(ACTS), default=0)
    ap.add_argument("--input")
    ap.add_argument("--output")
    ap.add_argument("--pair", help="write a side-by-side before/after image here")
    ap.add_argument("--no-halation", action="store_true")
    ap.add_argument("--no-grain", action="store_true")
    ap.add_argument("--export-luts", action="store_true")
    ap.add_argument("--dump-acts", action="store_true")
    ap.add_argument("--luts-dir", default=os.path.join(os.path.dirname(__file__), "luts"))
    args = ap.parse_args()

    here = os.path.dirname(os.path.abspath(__file__))

    if args.dump_acts:
        out = os.path.join(here, "acts.json")
        dump_acts(out)
        print("wrote", out)

    if args.export_luts:
        os.makedirs(args.luts_dir, exist_ok=True)
        for act in sorted(ACTS):
            cube = os.path.join(args.luts_dir, f"substrate-act{act}.cube")
            strip = os.path.join(args.luts_dir, f"substrate-act{act}-lut32.png")
            blue = os.path.join(args.luts_dir, f"bluecurve-act{act}.png")
            export_cube(act, cube)
            export_threejs_strip(act, strip)
            export_bluecurve_png(act, blue)
            print("wrote", cube)
            print("wrote", strip)
            print("wrote", blue)

    if args.input and args.output:
        img = load(args.input)
        graded = grade_frame(img, args.act,
                             halation=not args.no_halation,
                             grain=not args.no_grain)
        save(graded, args.output)
        print("wrote", args.output)
        if args.pair:
            before = (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)
            after = (graded * 255 + 0.5).astype(np.uint8)
            gap = np.full((before.shape[0], 4, 3), 32, np.uint8)
            pair = np.concatenate([before, gap, after], axis=1)
            save(pair.astype(np.float64) / 255.0, args.pair)
            print("wrote", args.pair)


if __name__ == "__main__":
    main()
