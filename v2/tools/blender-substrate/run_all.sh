#!/usr/bin/env bash
# The Substrate — deterministic asset pipeline. Rerunnable end to end.
# Usage: ./run_all.sh   (HERO=cardona for fallback; SAMPLES can only RAISE floors)
set -euo pipefail
cd "$(dirname "$0")"

# Blender: the portable 4.2.3 is the default — the system 4.0.2's
# selected-to-active bake produces black images in this environment
# (repro: scratchpad bakerepro.py sweep, 2026-07-24). BLENDER env overrides.
BLENDER="${BLENDER:-$(pwd)/../blender-4.2.3-linux-x64/blender}"
if [ ! -x "$BLENDER" ]; then
  BLENDER=/usr/bin/blender
fi
echo "using blender: $BLENDER"

"$BLENDER" -b --factory-startup -P assemble.py
"$BLENDER" -b out/substrate.blend -P bake_trace_mask.py
"$BLENDER" -b out/substrate.blend -P bake_ao.py
"$BLENDER" -b out/substrate.blend -P bake_lightstory.py
"$BLENDER" -b out/substrate.blend -P bake_imperfections.py
"$BLENDER" -b --factory-startup -P bake_matcaps.py
"$BLENDER" -b out/substrate.blend -P export.py

ASSETS=../../../public/assets
# CPU-readable mask copy for the GPGPU transition (master Task 15 /
# self-review note 6 — KTX2 payloads are unreadable CPU-side)
cp out/tracemap.png "$ASSETS/tracemap-src.png"
# light-story sidecars (runtime custom maps; no glTF slot for them).
# PNG this phase — standalone KTX2 needs a basisu/toktx binary that is not
# available here; when one lands in v2/tools/, encode these in place.
mkdir -p "$ASSETS/lightstory"
for f in out/lightmap_*.png out/curvature_*.png out/bentnorm_*.png; do
  case "$f" in *_raw.png) ;; *) cp "$f" "$ASSETS/lightstory/" ;; esac
done

node validate.mjs "$ASSETS/substrate.glb"
echo "PIPELINE OK"
